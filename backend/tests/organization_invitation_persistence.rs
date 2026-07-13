use grover_landscaping_api::organizations::{
    CreateOrganizationInvitationRequest, OrganizationRepository,
    UpdateOrganizationMembershipRoleRequest,
};
use sqlx::postgres::PgPoolOptions;

mod common;

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

    let pending_status = sqlx::query_scalar::<_, String>(
        "SELECT status FROM organization_memberships WHERE id = $1",
    )
    .bind(&invitation.membership_id)
    .fetch_one(&pool)
    .await
    .expect("pending membership should exist");
    assert_eq!(pending_status, "invited");

    let accepted = repository
        .accept_invitation(&invitation.token, accepted_user_id)
        .await
        .expect("invitation should be accepted");

    assert_eq!(accepted.invitation.status, "accepted");
    assert_eq!(accepted.membership.user_id, accepted_user_id);
    assert_eq!(accepted.membership.status, "active");

    let updated = repository
        .update_membership_role(
            organization_id,
            &invitation.membership_id,
            actor_user_id,
            UpdateOrganizationMembershipRoleRequest {
                role: "crew_lead".to_string(),
            },
        )
        .await
        .expect("membership role should update");

    assert_eq!(updated.id, invitation.membership_id);

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
}
