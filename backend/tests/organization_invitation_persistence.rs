use grover_landscaping_api::organizations::{
    CreateOrganizationInvitationRequest, MembershipRoleUpdateResult, MembershipStatusUpdateResult,
    OrganizationCollectionResult, OrganizationRepository, OrganizationResourceResult,
    ReissueOrganizationInvitationRequest, UpdateOrganizationMembershipRoleRequest,
    UpdateOrganizationMembershipStatusRequest,
};
use sqlx::postgres::PgPoolOptions;
use std::time::Duration;

mod common;

fn loaded<T>(result: OrganizationCollectionResult<T>, context: &str) -> Vec<T> {
    match result {
        OrganizationCollectionResult::Loaded(items) => items,
        OrganizationCollectionResult::Unavailable => panic!("{context}: unavailable"),
    }
}

#[tokio::test]
async fn repository_distinguishes_unavailable_organization_collections_from_empty_results() {
    let pool = PgPoolOptions::new()
        .acquire_timeout(Duration::from_millis(100))
        .connect_lazy("postgres://grover:grover@127.0.0.1:1/grover_landscaping")
        .expect("unavailable test pool URL should be valid");
    let repository = OrganizationRepository::from_pool(pool);

    assert!(matches!(
        repository.list_invitations("org_demo_landscaping").await,
        OrganizationCollectionResult::Unavailable
    ));
    assert!(matches!(
        repository
            .list_organization_memberships("org_demo_landscaping")
            .await,
        OrganizationCollectionResult::Unavailable
    ));
    assert!(matches!(
        repository
            .list_team_administration_activity("org_demo_landscaping")
            .await,
        OrganizationCollectionResult::Unavailable
    ));
    assert!(matches!(
        repository
            .list_operational_activity(&["org_demo_landscaping".to_string()])
            .await,
        OrganizationCollectionResult::Unavailable
    ));
    assert!(matches!(
        repository
            .organization_profile("org_demo_landscaping")
            .await,
        OrganizationResourceResult::Unavailable
    ));
    assert!(matches!(
        repository
            .first_owner_setup_progress("org_demo_landscaping")
            .await,
        OrganizationResourceResult::Unavailable
    ));
}

#[tokio::test]
async fn repository_invites_accepts_and_audits_membership_role_changes() {
    let Some(config) = common::database_config() else {
        return;
    };

    let pool = PgPoolOptions::new()
        .max_connections(1)
        .connect(&config.database_url)
        .await
        .expect("test pool should connect");

    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("migrations should run");

    let organization_id = "org_demo_landscaping";
    let invitee_email = "invite-persistence@example.com";
    let accepted_user_id = "user_invite_persistence";
    let actor_user_id = "local-development-user";

    sqlx::query(
        r#"
        DELETE FROM access_audit_events
        WHERE actor_user_id = $1
           OR target_id IN (
                SELECT membership_id
                FROM organization_invitations
                WHERE invitee_email = $2
           )
        "#,
    )
    .bind(accepted_user_id)
    .bind(invitee_email)
    .execute(&pool)
    .await
    .expect("test audit rows should reset");
    sqlx::query(
        "DELETE FROM notification_outbox WHERE entity_type = 'organization_invitation' AND recipient = $1",
    )
    .bind(invitee_email)
    .execute(&pool)
    .await
    .expect("test invitation notifications should reset");
    sqlx::query("DELETE FROM organization_invitations WHERE invitee_email = $1")
        .bind(invitee_email)
        .execute(&pool)
        .await
        .expect("test invitations should reset");
    sqlx::query("DELETE FROM organization_memberships WHERE user_id = $1 OR user_id = $2")
        .bind(invitee_email)
        .bind(accepted_user_id)
        .execute(&pool)
        .await
        .expect("test memberships should reset");

    let repository = OrganizationRepository::from_pool(pool.clone());
    let invitation = repository
        .create_invitation(
            organization_id,
            actor_user_id,
            CreateOrganizationInvitationRequest {
                invitee_email: invitee_email.to_string(),
                role: "crew_member".to_string(),
                scope_type: Some("organization".to_string()),
                scope_id: Some(organization_id.to_string()),
                expires_at: None,
            },
        )
        .await
        .expect("invitation should be created");

    assert!(invitation.persisted);
    assert_eq!(invitation.status, "pending");

    let pending_invitations = loaded(
        repository.list_invitations(organization_id).await,
        "pending invitations should load",
    );
    let pending_summary = pending_invitations
        .iter()
        .find(|item| item.id == invitation.id)
        .expect("created invitation should be listed");
    assert_eq!(pending_summary.invitee_email, invitee_email);
    assert_eq!(pending_summary.status, "pending");
    assert!(pending_summary.delivery_notification_id.is_some());
    assert_eq!(pending_summary.delivery_status.as_deref(), Some("queued"));
    assert_eq!(pending_summary.delivery_attempt_count, 0);

    let duplicate = repository
        .create_invitation(
            organization_id,
            actor_user_id,
            CreateOrganizationInvitationRequest {
                invitee_email: invitee_email.to_ascii_uppercase(),
                role: "manager".to_string(),
                scope_type: Some("organization".to_string()),
                scope_id: Some(organization_id.to_string()),
                expires_at: Some("2099-07-25T12:00:00.000Z".to_string()),
            },
        )
        .await;
    assert!(
        duplicate.is_none(),
        "recipient should have only one live pending invitation"
    );
    let pending_recipient_count = sqlx::query_scalar::<_, i64>(
        r#"
        SELECT COUNT(*)
        FROM organization_invitations
        WHERE organization_id = $1
          AND LOWER(invitee_email) = LOWER($2)
          AND status = 'pending'
        "#,
    )
    .bind(organization_id)
    .bind(invitee_email)
    .fetch_one(&pool)
    .await
    .expect("pending recipient count should be available");
    assert_eq!(pending_recipient_count, 1);

    let notification = sqlx::query_as::<_, (String, serde_json::Value)>(
        r#"
        SELECT template_key, payload
        FROM notification_outbox
        WHERE entity_type = 'organization_invitation'
          AND entity_id = $1
          AND recipient = $2
          AND organization_id = $3
        "#,
    )
    .bind(&invitation.id)
    .bind(invitee_email)
    .bind(organization_id)
    .fetch_one(&pool)
    .await
    .expect("invitation notification should be queued");
    assert_eq!(notification.0, "organization_invitation");
    assert_eq!(
        notification.1["acceptance_path"],
        format!("/organization-invitations/{}", invitation.token)
    );

    let pending_status = sqlx::query_scalar::<_, String>(
        "SELECT status FROM organization_memberships WHERE id = $1",
    )
    .bind(&invitation.membership_id)
    .fetch_one(&pool)
    .await
    .expect("pending membership should exist");
    assert_eq!(pending_status, "invited");

    assert!(
        repository
            .accept_invitation(
                &invitation.token,
                "user_wrong_invitation_recipient",
                Some("someone.else@example.com"),
            )
            .await
            .is_none(),
        "a different verified email should not activate access"
    );
    let accepted = repository
        .accept_invitation(&invitation.token, accepted_user_id, Some(invitee_email))
        .await
        .expect("invitation should be accepted");

    assert_eq!(accepted.invitation.status, "accepted");
    assert_eq!(accepted.membership.user_id, accepted_user_id);
    assert_eq!(accepted.membership.status, "active");

    let accepted_invitations = loaded(
        repository.list_invitations(organization_id).await,
        "accepted invitations should load",
    );
    assert_eq!(
        accepted_invitations
            .iter()
            .find(|item| item.id == invitation.id)
            .map(|item| item.status.as_str()),
        Some("accepted")
    );

    let updated = repository
        .update_membership_role(
            organization_id,
            &invitation.membership_id,
            actor_user_id,
            UpdateOrganizationMembershipRoleRequest {
                role: "crew_lead".to_string(),
            },
        )
        .await;

    assert!(matches!(
        updated,
        MembershipRoleUpdateResult::Updated(ref membership)
            if membership.id == invitation.membership_id
    ));
    assert_eq!(
        repository
            .update_membership_role(
                organization_id,
                "membership_local_owner_demo",
                actor_user_id,
                UpdateOrganizationMembershipRoleRequest {
                    role: "manager".to_string(),
                },
            )
            .await,
        MembershipRoleUpdateResult::LastActiveOwner
    );

    let audit_count = sqlx::query_scalar::<_, i64>(
        r#"
        SELECT COUNT(*)
        FROM access_audit_events
        WHERE organization_id = $1
          AND target_id = $2
          AND event_kind IN ('invite_accepted', 'role_changed')
        "#,
    )
    .bind(organization_id)
    .bind(&invitation.membership_id)
    .fetch_one(&pool)
    .await
    .expect("audit count should be available");
    assert_eq!(audit_count, 2);

    let suspended = repository
        .update_membership_status(
            organization_id,
            &invitation.membership_id,
            actor_user_id,
            UpdateOrganizationMembershipStatusRequest {
                status: "suspended".to_string(),
            },
        )
        .await;
    assert!(matches!(
        suspended,
        MembershipStatusUpdateResult::Updated(ref membership)
            if membership.status == "suspended"
    ));
    let reactivated = repository
        .update_membership_status(
            organization_id,
            &invitation.membership_id,
            actor_user_id,
            UpdateOrganizationMembershipStatusRequest {
                status: "active".to_string(),
            },
        )
        .await;
    assert!(matches!(
        reactivated,
        MembershipStatusUpdateResult::Updated(ref membership)
            if membership.status == "active"
    ));
    let lifecycle_audit_count = sqlx::query_scalar::<_, i64>(
        r#"
        SELECT COUNT(*)
        FROM access_audit_events
        WHERE organization_id = $1
          AND target_id = $2
          AND event_kind IN ('membership_suspended', 'membership_reactivated')
        "#,
    )
    .bind(organization_id)
    .bind(&invitation.membership_id)
    .fetch_one(&pool)
    .await
    .expect("membership lifecycle audits should be available");
    assert_eq!(lifecycle_audit_count, 2);
    let team_activity = loaded(
        repository
            .list_team_administration_activity(organization_id)
            .await,
        "team activity should load",
    );
    assert!(team_activity.iter().any(|item| {
        item.target_id == invitation.membership_id && item.event_kind == "role_changed"
    }));
    assert!(team_activity.iter().any(|item| {
        item.target_id == invitation.membership_id && item.event_kind == "membership_suspended"
    }));
    assert!(team_activity.iter().any(|item| {
        item.target_id == invitation.membership_id && item.event_kind == "membership_reactivated"
    }));

    let revocable_email = "invite-revocation@example.com";
    sqlx::query("DELETE FROM organization_invitations WHERE invitee_email = $1")
        .bind(revocable_email)
        .execute(&pool)
        .await
        .expect("revocation invitation should reset");
    sqlx::query("DELETE FROM organization_memberships WHERE user_id = $1")
        .bind(revocable_email)
        .execute(&pool)
        .await
        .expect("revocation membership should reset");
    let revocable = repository
        .create_invitation(
            organization_id,
            actor_user_id,
            CreateOrganizationInvitationRequest {
                invitee_email: revocable_email.to_string(),
                role: "manager".to_string(),
                scope_type: Some("organization".to_string()),
                scope_id: Some(organization_id.to_string()),
                expires_at: None,
            },
        )
        .await
        .expect("revocable invitation should be created");
    assert!(
        repository
            .reissue_invitation(
                organization_id,
                &revocable.id,
                actor_user_id,
                ReissueOrganizationInvitationRequest {
                    expires_at: "2099-08-01T12:00:00.000Z".to_string(),
                },
            )
            .await
            .is_none(),
        "pending invitation should not be reissued"
    );
    let revoked = repository
        .revoke_invitation(organization_id, &revocable.id, actor_user_id)
        .await
        .expect("pending invitation should be revoked");
    assert_eq!(revoked.status, "revoked");
    assert!(
        repository
            .revoke_invitation(organization_id, &revocable.id, actor_user_id)
            .await
            .is_none(),
        "revocation should be idempotently guarded by pending status"
    );
    let revoked_membership_status = sqlx::query_scalar::<_, String>(
        "SELECT status FROM organization_memberships WHERE id = $1",
    )
    .bind(&revocable.membership_id)
    .fetch_one(&pool)
    .await
    .expect("revoked membership status should be available");
    assert_eq!(revoked_membership_status, "archived");
    let revocation_audit_count = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM access_audit_events WHERE event_kind = 'invitation_revoked' AND target_id = $1",
    )
    .bind(&revocable.id)
    .fetch_one(&pool)
    .await
    .expect("revocation audit should be available");
    assert_eq!(revocation_audit_count, 1);

    let expiring_email = "invite-expiration@example.com";
    let reissued_user_id = "user_reissued_invitation";
    sqlx::query("DELETE FROM organization_invitations WHERE invitee_email = $1")
        .bind(expiring_email)
        .execute(&pool)
        .await
        .expect("expiration invitation should reset");
    sqlx::query("DELETE FROM organization_memberships WHERE user_id = $1 OR user_id = $2")
        .bind(expiring_email)
        .bind(reissued_user_id)
        .execute(&pool)
        .await
        .expect("expiration membership should reset");
    let expiring = repository
        .create_invitation(
            organization_id,
            actor_user_id,
            CreateOrganizationInvitationRequest {
                invitee_email: expiring_email.to_string(),
                role: "crew_member".to_string(),
                scope_type: Some("organization".to_string()),
                scope_id: Some(organization_id.to_string()),
                expires_at: Some("2099-07-25T12:00:00.000Z".to_string()),
            },
        )
        .await
        .expect("expiring invitation should be created");
    sqlx::query(
        "UPDATE organization_invitations SET expires_at = NOW() - INTERVAL '1 minute' WHERE id = $1",
    )
    .bind(&expiring.id)
    .execute(&pool)
    .await
    .expect("invitation expiration should be simulated");

    let invitations = loaded(
        repository.list_invitations(organization_id).await,
        "invitation history should load",
    );
    assert_eq!(
        invitations
            .iter()
            .find(|item| item.id == expiring.id)
            .map(|item| item.status.as_str()),
        Some("expired")
    );
    assert!(
        repository
            .accept_invitation(
                &expiring.token,
                "user_expired_invitation",
                Some(expiring_email),
            )
            .await
            .is_none(),
        "expired invitation should not activate access"
    );
    assert!(
        repository
            .revoke_invitation(organization_id, &expiring.id, actor_user_id)
            .await
            .is_none(),
        "expired invitation should not be revocable"
    );
    let expired_membership_status = sqlx::query_scalar::<_, String>(
        "SELECT status FROM organization_memberships WHERE id = $1",
    )
    .bind(&expiring.membership_id)
    .fetch_one(&pool)
    .await
    .expect("expired membership status should be available");
    assert_eq!(expired_membership_status, "invited");

    let reissued = repository
        .reissue_invitation(
            organization_id,
            &expiring.id,
            actor_user_id,
            ReissueOrganizationInvitationRequest {
                expires_at: "2099-08-01T12:00:00.000Z".to_string(),
            },
        )
        .await
        .expect("expired invitation should be reissued");
    assert_eq!(reissued.status, "pending");
    assert_ne!(reissued.token, expiring.token);
    assert!(
        repository
            .accept_invitation(
                &expiring.token,
                "user_old_expired_token",
                Some(expiring_email),
            )
            .await
            .is_none(),
        "reissue should invalidate the previous token"
    );
    let accepted_reissue = repository
        .accept_invitation(&reissued.token, reissued_user_id, Some(expiring_email))
        .await
        .expect("new reissue token should activate access");
    assert_eq!(accepted_reissue.membership.status, "active");
    let reissue_audit_count = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM access_audit_events WHERE event_kind = 'invitation_reissued' AND target_id = $1",
    )
    .bind(&expiring.id)
    .fetch_one(&pool)
    .await
    .expect("reissue audit should be available");
    assert_eq!(reissue_audit_count, 1);
}
