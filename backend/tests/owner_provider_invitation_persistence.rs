use grover_landscaping_api::owner_acquisition::{
    CreateOwnerPropertyRequest, CreateOwnerProviderInvitationRequest,
    CreateOwnerProviderOrganizationClaimRequest, OwnerAcquisitionRepository, OwnerMutationResult,
    OwnerProviderInvitationAbuseReportResult, OwnerProviderInvitationCreateResult,
    OwnerProviderInvitationDeliveryResult, OwnerProviderInvitationExpiryResult,
    OwnerProviderInvitationMutationResult, OwnerProviderInvitationPreviewResult,
    OwnerProviderInvitationRecipientCheckResult, OwnerProviderInvitationRetryResult,
    OwnerProviderOrganizationClaimResult, OwnerProviderOrganizationOptionsResult, OwnerReadResult,
    RecordOwnerProviderInvitationDeliveryRequest, ReportOwnerProviderInvitationAbuseRequest,
    RetryOwnerProviderInvitationRequest, SaveOwnerWorkspaceRequest, SaveOwnerYardBriefRequest,
};
use sha2::{Digest, Sha256};
use sqlx::{postgres::PgPoolOptions, Row};
use std::time::Duration;

mod common;

fn property_request(address: &str) -> CreateOwnerPropertyRequest {
    CreateOwnerPropertyRequest {
        display_name: "Home".to_string(),
        address_line_1: address.to_string(),
        address_line_2: None,
        city: "Phoenix".to_string(),
        region: "AZ".to_string(),
        postal_code: "85004".to_string(),
        country_code: Some("US".to_string()),
        coarse_area: Some("Central Phoenix".to_string()),
        address_status: "owner_confirmed".to_string(),
        authority_attested: true,
    }
}

fn ready_brief_request() -> SaveOwnerYardBriefRequest {
    SaveOwnerYardBriefRequest {
        status: "ready".to_string(),
        yard_areas: vec!["Front yard".to_string(), "Back yard".to_string()],
        care_goals: vec!["Routine upkeep".to_string()],
        cadence_preference: "every_two_weeks".to_string(),
        considerations: "Use the east gate; the code is 0199.".to_string(),
    }
}

fn invitation_request(email: &str, idempotency_key: &str) -> CreateOwnerProviderInvitationRequest {
    CreateOwnerProviderInvitationRequest {
        provider_name: "Sonoran Yard Care".to_string(),
        recipient_business_email: email.to_string(),
        expires_in_days: 7,
        idempotency_key: idempotency_key.to_string(),
    }
}

#[tokio::test]
async fn repository_distinguishes_unavailable_invitation_storage() {
    let pool = PgPoolOptions::new()
        .acquire_timeout(Duration::from_millis(100))
        .connect_lazy("postgres://grover:grover@127.0.0.1:1/grover_landscaping")
        .expect("unavailable test pool URL should be valid");
    let repository = OwnerAcquisitionRepository::from_pool(pool);

    assert!(matches!(
        repository
            .list_provider_invitations("owner-unavailable", "property-unavailable")
            .await,
        OwnerReadResult::Unavailable
    ));
    assert!(matches!(
        repository
            .get_provider_invitation(
                "owner-unavailable",
                "property-unavailable",
                "invitation-unavailable",
            )
            .await,
        OwnerReadResult::Unavailable
    ));
    assert!(matches!(
        repository
            .create_provider_invitation(
                "owner-unavailable",
                "property-unavailable",
                invitation_request("provider@example.com", "outage-request-001"),
            )
            .await,
        OwnerProviderInvitationCreateResult::Unavailable
    ));
    assert!(matches!(
        repository
            .revoke_provider_invitation(
                "owner-unavailable",
                "property-unavailable",
                "invitation-unavailable",
            )
            .await,
        OwnerProviderInvitationMutationResult::Unavailable
    ));
    assert!(matches!(
        repository
            .report_provider_invitation_abuse(
                "reporter-unavailable",
                "provider@example.com",
                ReportOwnerProviderInvitationAbuseRequest {
                    token: "owner_provider_0000000000000000000000000000000000000000000000000000000000000000".to_string(),
                    category: "spam".to_string(),
                    customer_safe_description: None,
                    block_future_invitations: true,
                    idempotency_key: "report-outage-001".to_string(),
                },
            )
            .await,
        OwnerProviderInvitationAbuseReportResult::Unavailable
    ));
    assert!(matches!(
        repository
            .preview_provider_invitation(
                "owner_provider_0000000000000000000000000000000000000000000000000000000000000000",
            )
            .await,
        OwnerProviderInvitationPreviewResult::Unavailable
    ));
    assert!(matches!(
        repository
            .verify_provider_invitation_recipient(
                "recipient-unavailable",
                "provider@example.com",
                "owner_provider_0000000000000000000000000000000000000000000000000000000000000000",
            )
            .await,
        OwnerProviderInvitationRecipientCheckResult::Unavailable
    ));
    assert!(matches!(
        repository
            .list_provider_organization_options(
                "recipient-unavailable",
                "provider@example.com",
                "owner_provider_0000000000000000000000000000000000000000000000000000000000000000",
            )
            .await,
        OwnerProviderOrganizationOptionsResult::Unavailable
    ));
    assert!(matches!(
        repository
            .create_provider_organization_claim(
                "recipient-unavailable",
                "provider@example.com",
                CreateOwnerProviderOrganizationClaimRequest {
                    token: "owner_provider_0000000000000000000000000000000000000000000000000000000000000000".to_string(),
                    claim_kind: "new_organization".to_string(),
                    organization_id: None,
                    provider_display_name: Some("Unavailable Yard Care".to_string()),
                    authority_attested: true,
                    idempotency_key: "claim-outage-001".to_string(),
                },
            )
            .await,
        OwnerProviderOrganizationClaimResult::Unavailable
    ));
    assert!(matches!(
        repository
            .retry_provider_invitation(
                "owner-unavailable",
                "property-unavailable",
                "invitation-unavailable",
                RetryOwnerProviderInvitationRequest {
                    expires_in_days: 7,
                    idempotency_key: "retry-outage-001".to_string(),
                },
            )
            .await,
        OwnerProviderInvitationRetryResult::Unavailable
    ));
    assert!(matches!(
        repository
            .record_provider_invitation_delivery(
                "invitation-unavailable",
                1,
                RecordOwnerProviderInvitationDeliveryRequest {
                    outcome: "failed".to_string(),
                    provider_message_id: None,
                    failure_code: Some("provider_unavailable".to_string()),
                },
            )
            .await,
        OwnerProviderInvitationDeliveryResult::Unavailable
    ));
    assert_eq!(
        repository.expire_provider_invitations(25).await,
        OwnerProviderInvitationExpiryResult::Unavailable
    );
    assert!(matches!(
        repository
            .opt_out_provider_invitation(
                "provider@example.com",
                "owner_provider_0000000000000000000000000000000000000000000000000000000000000000",
            )
            .await,
        OwnerProviderInvitationMutationResult::Unavailable
    ));
}

#[tokio::test]
async fn repository_persists_limited_idempotent_owner_provider_invitations() {
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

    let owner_a = "owner_provider_invitation_a";
    let owner_b = "owner_provider_invitation_b";
    let recipient = "dispatch@sonoranyard.example";
    let suppressed_recipient = "optout@sonoranyard.example";
    let opt_out_recipient = "preferences@sonoranyard.example";
    let abuse_recipient = "safety@sonoranyard.example";
    let abuse_reporter = "provider_abuse_reporter";
    sqlx::query("DELETE FROM owner_workspaces WHERE owner_user_id = ANY($1)")
        .bind(vec![owner_a, owner_b])
        .execute(&pool)
        .await
        .expect("test owners should reset");
    sqlx::query(
        "DELETE FROM organizations
         WHERE id = ANY($1)",
    )
    .bind(vec![
        "org_provider_claim_owned",
        "org_provider_claim_private_duplicate",
    ])
    .execute(&pool)
    .await
    .expect("test provider organizations should reset");
    let suppressed_fingerprint = format!("{:x}", Sha256::digest(suppressed_recipient.as_bytes()));
    let opt_out_fingerprint = format!("{:x}", Sha256::digest(opt_out_recipient.as_bytes()));
    let abuse_fingerprint = format!("{:x}", Sha256::digest(abuse_recipient.as_bytes()));
    sqlx::query("DELETE FROM owner_provider_invitation_abuse_reports WHERE reporter_user_id = $1")
        .bind(abuse_reporter)
        .execute(&pool)
        .await
        .expect("test abuse reports should reset");
    sqlx::query(
        "DELETE FROM owner_provider_recipient_suppressions
         WHERE recipient_email_fingerprint = ANY($1)",
    )
    .bind(vec![
        suppressed_fingerprint.clone(),
        opt_out_fingerprint.clone(),
        abuse_fingerprint.clone(),
    ])
    .execute(&pool)
    .await
    .expect("test suppression should reset");

    let repository = OwnerAcquisitionRepository::from_pool(pool.clone());
    for (owner, email, name) in [
        (owner_a, "owner-a@example.com", "Morgan Reyes"),
        (owner_b, "owner-b@example.com", "Jamie Chen"),
    ] {
        assert!(matches!(
            repository
                .save_workspace(
                    owner,
                    email,
                    SaveOwnerWorkspaceRequest {
                        display_name: name.to_string(),
                    },
                )
                .await,
            OwnerMutationResult::Saved(_)
        ));
    }
    let OwnerMutationResult::Saved(property) = repository
        .create_property(owner_a, property_request("421 Private Canyon Road"))
        .await
    else {
        panic!("owner property should save");
    };
    assert!(matches!(
        repository
            .save_yard_brief(owner_a, &property.property_id, ready_brief_request())
            .await,
        OwnerMutationResult::Saved(_)
    ));

    let OwnerProviderInvitationCreateResult::Created(created) = repository
        .create_provider_invitation(
            owner_a,
            &property.property_id,
            invitation_request(recipient, "provider-invite-001"),
        )
        .await
    else {
        panic!("provider invitation should be created");
    };
    assert!(created.invitation.persisted);
    assert_eq!(created.invitation.status, "pending_delivery");
    assert_eq!(created.invitation.delivery_status, "pending");
    assert_eq!(created.invitation.delivery_attempt_count, 1);
    assert_eq!(created.invitation.owner_name_snapshot, "Morgan Reyes");
    assert_eq!(created.invitation.coarse_area_snapshot, "Central Phoenix");
    assert_eq!(created.invitation.care_goals_snapshot, ["Routine upkeep"]);
    assert!(!created.delivery_token().contains(recipient));
    assert!(matches!(
        repository
            .preview_provider_invitation(created.delivery_token())
            .await,
        OwnerProviderInvitationPreviewResult::NotReady
    ));

    let stored_token_hash = sqlx::query_scalar::<_, String>(
        "SELECT token_hash FROM owner_provider_invitations WHERE id = $1",
    )
    .bind(&created.invitation.invitation_id)
    .fetch_one(&pool)
    .await
    .expect("stored token hash should load");
    assert_ne!(stored_token_hash, created.delivery_token());
    assert_eq!(
        stored_token_hash,
        format!("{:x}", Sha256::digest(created.delivery_token().as_bytes()))
    );

    assert!(matches!(
        repository
            .create_provider_invitation(
                owner_a,
                &property.property_id,
                invitation_request(recipient, "provider-invite-001"),
            )
            .await,
        OwnerProviderInvitationCreateResult::Replayed(invitation)
            if invitation.invitation_id == created.invitation.invitation_id
    ));
    assert!(matches!(
        repository
            .create_provider_invitation(
                owner_a,
                &property.property_id,
                invitation_request(&recipient.to_ascii_uppercase(), "provider-invite-002"),
            )
            .await,
        OwnerProviderInvitationCreateResult::Conflict
    ));
    assert_eq!(
        sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM owner_provider_invitations WHERE owner_user_id = $1",
        )
        .bind(owner_a)
        .fetch_one(&pool)
        .await
        .expect("invitation count should load"),
        1
    );
    assert_eq!(
        repository
            .list_provider_invitations(owner_b, &property.property_id)
            .await,
        OwnerReadResult::NotFound
    );
    assert!(matches!(
        repository
            .list_provider_invitations(owner_a, &property.property_id)
            .await,
        OwnerReadResult::Loaded(invitations)
            if invitations.len() == 1
                && invitations[0].invitation_id == created.invitation.invitation_id
    ));

    let persisted = sqlx::query(
        "SELECT invitation.*, property.status AS property_status,
                (SELECT COUNT(*) FROM owner_provider_invitation_delivery_attempts attempt
                 WHERE attempt.invitation_id = invitation.id) AS attempt_count
         FROM owner_provider_invitations invitation
         JOIN owner_properties property ON property.id = invitation.property_id
         WHERE invitation.id = $1",
    )
    .bind(&created.invitation.invitation_id)
    .fetch_one(&pool)
    .await
    .expect("persisted invitation should load");
    assert_eq!(
        persisted.get::<String, _>("property_status"),
        "connection_in_progress"
    );
    assert_eq!(persisted.get::<i64, _>("attempt_count"), 1);
    assert_eq!(
        persisted.get::<String, _>("coarse_area_snapshot"),
        "Central Phoenix"
    );
    assert!(!persisted
        .get::<Vec<String>, _>("care_goals_snapshot")
        .join(" ")
        .contains("0199"));

    let invitation_events = sqlx::query(
        "SELECT event_kind, event_data
         FROM owner_acquisition_events
         WHERE owner_user_id = $1 AND event_kind LIKE 'provider_invitation_%'",
    )
    .bind(owner_a)
    .fetch_all(&pool)
    .await
    .expect("invitation events should load");
    assert_eq!(invitation_events.len(), 2);
    assert!(invitation_events.iter().all(|event| {
        let data = event.get::<serde_json::Value, _>("event_data").to_string();
        !data.contains(recipient)
            && !data.contains(created.delivery_token())
            && !data.contains("0199")
    }));

    assert!(matches!(
        repository
            .record_provider_invitation_delivery(
                &created.invitation.invitation_id,
                1,
                RecordOwnerProviderInvitationDeliveryRequest {
                    outcome: "failed".to_string(),
                    provider_message_id: None,
                    failure_code: Some("mailbox_unavailable".to_string()),
                },
            )
            .await,
        OwnerProviderInvitationDeliveryResult::Saved(invitation)
            if invitation.status == "failed" && invitation.delivery_status == "failed"
    ));
    let retry_request = RetryOwnerProviderInvitationRequest {
        expires_in_days: 14,
        idempotency_key: "provider-invite-retry-001".to_string(),
    };
    let OwnerProviderInvitationRetryResult::Created(retry) = repository
        .retry_provider_invitation(
            owner_a,
            &property.property_id,
            &created.invitation.invitation_id,
            retry_request.clone(),
        )
        .await
    else {
        panic!("failed invitation should prepare a retry");
    };
    assert_ne!(retry.delivery_token(), created.delivery_token());
    assert_eq!(retry.invitation.delivery_attempt_count, 2);
    assert_eq!(retry.invitation.status, "pending_delivery");
    assert!(matches!(
        repository
            .retry_provider_invitation(
                owner_a,
                &property.property_id,
                &created.invitation.invitation_id,
                retry_request,
            )
            .await,
        OwnerProviderInvitationRetryResult::Replayed(invitation)
            if invitation.delivery_attempt_count == 2
    ));
    assert!(matches!(
        repository
            .record_provider_invitation_delivery(
                &created.invitation.invitation_id,
                2,
                RecordOwnerProviderInvitationDeliveryRequest {
                    outcome: "delivered".to_string(),
                    provider_message_id: Some("message-2002".to_string()),
                    failure_code: None,
                },
            )
            .await,
        OwnerProviderInvitationDeliveryResult::Saved(invitation)
            if invitation.status == "delivered" && invitation.delivery_status == "delivered"
    ));
    let OwnerProviderInvitationPreviewResult::Opened(recipient_entry) = repository
        .preview_provider_invitation(retry.delivery_token())
        .await
    else {
        panic!("delivered invitation should open the limited recipient entry");
    };
    assert_eq!(recipient_entry.status, "opened");
    assert!(recipient_entry.can_review_limited_request);
    assert_eq!(recipient_entry.owner_name.as_deref(), Some("Morgan Reyes"));
    assert_eq!(
        recipient_entry.coarse_area.as_deref(),
        Some("Central Phoenix")
    );
    assert_eq!(recipient_entry.care_goals, ["Routine upkeep"]);
    assert!(recipient_entry.recipient_email_hint.is_some());
    assert!(!recipient_entry.recipient_email_checked);
    assert!(!recipient_entry.organization_relationship_checked);
    assert!(!recipient_entry.opportunity_response_capability);
    assert_eq!(recipient_entry.still_private_categories.len(), 4);
    assert!(matches!(
        repository
            .preview_provider_invitation(retry.delivery_token())
            .await,
        OwnerProviderInvitationPreviewResult::Opened(invitation)
            if invitation.status == "opened"
    ));
    assert!(matches!(
        repository
            .verify_provider_invitation_recipient(
                "recipient-user-1",
                "wrong@sonoranyard.example",
                retry.delivery_token(),
            )
            .await,
        OwnerProviderInvitationRecipientCheckResult::NotFound
    ));
    let OwnerProviderInvitationRecipientCheckResult::Checked(checked_entry) = repository
        .verify_provider_invitation_recipient("recipient-user-1", recipient, retry.delivery_token())
        .await
    else {
        panic!("verified invited mailbox should bind the recipient account");
    };
    assert!(checked_entry.recipient_email_checked);
    assert!(!checked_entry.organization_relationship_checked);
    assert!(!checked_entry.opportunity_response_capability);
    assert!(matches!(
        repository
            .verify_provider_invitation_recipient(
                "recipient-user-1",
                recipient,
                retry.delivery_token(),
            )
            .await,
        OwnerProviderInvitationRecipientCheckResult::Replayed(invitation)
            if invitation.recipient_email_checked
    ));
    assert!(matches!(
        repository
            .verify_provider_invitation_recipient(
                "recipient-user-2",
                recipient,
                retry.delivery_token(),
            )
            .await,
        OwnerProviderInvitationRecipientCheckResult::Conflict
    ));
    assert_eq!(
        sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM owner_acquisition_events
             WHERE owner_user_id = $1 AND event_kind = 'provider_invitation_opened'",
        )
        .bind(owner_a)
        .fetch_one(&pool)
        .await
        .expect("opened event count should load"),
        1
    );
    let recipient_check_events = sqlx::query_scalar::<_, serde_json::Value>(
        "SELECT event_data FROM owner_acquisition_events
         WHERE owner_user_id = $1 AND event_kind = 'provider_invitation_recipient_checked'",
    )
    .bind(owner_a)
    .fetch_all(&pool)
    .await
    .expect("recipient check events should load");
    assert_eq!(recipient_check_events.len(), 1);
    assert!(!recipient_check_events[0].to_string().contains(recipient));
    assert!(!recipient_check_events[0]
        .to_string()
        .contains("recipient-user-1"));

    sqlx::query(
        "INSERT INTO organizations (id, display_name, organization_type, status)
         VALUES
           ('org_provider_claim_owned', 'Recipient Owned Yard Care', 'yard_care_company', 'active'),
           ('org_provider_claim_private_duplicate', 'Desert Duplicate Care', 'yard_care_company', 'active')",
    )
    .execute(&pool)
    .await
    .expect("test provider organizations should save");
    sqlx::query(
        "INSERT INTO organization_memberships (
             id, organization_id, user_id, role, status, scope_type, scope_id
         ) VALUES (
             'membership_provider_claim_owned', 'org_provider_claim_owned',
             'recipient-user-1', 'manager', 'active', 'organization',
             'org_provider_claim_owned'
         )",
    )
    .execute(&pool)
    .await
    .expect("eligible provider membership should save");
    assert!(matches!(
        repository
            .list_provider_organization_options(
                "recipient-user-1",
                "wrong@sonoranyard.example",
                retry.delivery_token(),
            )
            .await,
        OwnerProviderOrganizationOptionsResult::NotFound
    ));
    let OwnerProviderOrganizationOptionsResult::Loaded(options) = repository
        .list_provider_organization_options("recipient-user-1", recipient, retry.delivery_token())
        .await
    else {
        panic!("verified recipient organization options should load");
    };
    assert_eq!(options.len(), 1);
    assert_eq!(options[0].organization_id, "org_provider_claim_owned");
    assert_eq!(options[0].membership_role, "manager");
    assert!(options[0].relationship_checked);
    assert!(!serde_json::to_string(&options)
        .expect("options should serialize")
        .contains("org_provider_claim_private_duplicate"));
    let existing_claim_request = CreateOwnerProviderOrganizationClaimRequest {
        token: retry.delivery_token().to_string(),
        claim_kind: "existing_relationship".to_string(),
        organization_id: Some("org_provider_claim_owned".to_string()),
        provider_display_name: None,
        authority_attested: false,
        idempotency_key: "provider-org-claim-existing-001".to_string(),
    };
    let OwnerProviderOrganizationClaimResult::Created(existing_claim) = repository
        .create_provider_organization_claim(
            "recipient-user-1",
            recipient,
            existing_claim_request.clone(),
        )
        .await
    else {
        panic!("eligible existing organization relationship should be recorded");
    };
    assert_eq!(existing_claim.status, "relationship_checked");
    assert_eq!(
        existing_claim.organization_id.as_deref(),
        Some("org_provider_claim_owned")
    );
    assert!(existing_claim.organization_relationship_checked);
    assert!(!existing_claim.opportunity_response_capability);
    assert!(matches!(
        repository
            .create_provider_organization_claim(
                "recipient-user-1",
                recipient,
                existing_claim_request,
            )
            .await,
        OwnerProviderOrganizationClaimResult::Replayed(claim)
            if claim.claim_id == existing_claim.claim_id
    ));

    let duplicate_recipient = "duplicate@sonoranyard.example";
    let OwnerProviderInvitationCreateResult::Created(duplicate_invitation) = repository
        .create_provider_invitation(
            owner_a,
            &property.property_id,
            invitation_request(duplicate_recipient, "provider-invite-duplicate-claim-001"),
        )
        .await
    else {
        panic!("duplicate-review invitation should be created");
    };
    assert!(matches!(
        repository
            .record_provider_invitation_delivery(
                &duplicate_invitation.invitation.invitation_id,
                1,
                RecordOwnerProviderInvitationDeliveryRequest {
                    outcome: "delivered".to_string(),
                    provider_message_id: Some("message-duplicate-claim".to_string()),
                    failure_code: None,
                },
            )
            .await,
        OwnerProviderInvitationDeliveryResult::Saved(_)
    ));
    assert!(matches!(
        repository
            .preview_provider_invitation(duplicate_invitation.delivery_token())
            .await,
        OwnerProviderInvitationPreviewResult::Opened(_)
    ));
    assert!(matches!(
        repository
            .verify_provider_invitation_recipient(
                "recipient-user-duplicate",
                duplicate_recipient,
                duplicate_invitation.delivery_token(),
            )
            .await,
        OwnerProviderInvitationRecipientCheckResult::Checked(_)
    ));
    let OwnerProviderOrganizationClaimResult::Created(duplicate_claim) = repository
        .create_provider_organization_claim(
            "recipient-user-duplicate",
            duplicate_recipient,
            CreateOwnerProviderOrganizationClaimRequest {
                token: duplicate_invitation.delivery_token().to_string(),
                claim_kind: "new_organization".to_string(),
                organization_id: None,
                provider_display_name: Some("  DESERT   duplicate care  ".to_string()),
                authority_attested: true,
                idempotency_key: "provider-org-claim-duplicate-001".to_string(),
            },
        )
        .await
    else {
        panic!("possible duplicate should enter private operations review");
    };
    assert_eq!(duplicate_claim.status, "duplicate_review");
    assert_eq!(
        duplicate_claim.assigned_function.as_deref(),
        Some("provider_operations")
    );
    assert!(duplicate_claim.organization_id.is_none());
    assert!(!duplicate_claim.organization_relationship_checked);
    assert!(!duplicate_claim.opportunity_response_capability);
    let duplicate_event_data = sqlx::query_scalar::<_, serde_json::Value>(
        "SELECT event_data FROM owner_acquisition_events
         WHERE event_kind = 'provider_invitation_organization_duplicate_review'
           AND event_data->>'claim_id' = $1",
    )
    .bind(&duplicate_claim.claim_id)
    .fetch_one(&pool)
    .await
    .expect("duplicate review audit should load")
    .to_string();
    assert!(!duplicate_event_data.contains("org_provider_claim_private_duplicate"));
    assert!(!duplicate_event_data.contains(duplicate_recipient));

    let unique_recipient = "unique@sonoranyard.example";
    let OwnerProviderInvitationCreateResult::Created(unique_invitation) = repository
        .create_provider_invitation(
            owner_a,
            &property.property_id,
            invitation_request(unique_recipient, "provider-invite-unique-claim-001"),
        )
        .await
    else {
        panic!("unique provider invitation should be created");
    };
    assert!(matches!(
        repository
            .record_provider_invitation_delivery(
                &unique_invitation.invitation.invitation_id,
                1,
                RecordOwnerProviderInvitationDeliveryRequest {
                    outcome: "delivered".to_string(),
                    provider_message_id: Some("message-unique-claim".to_string()),
                    failure_code: None,
                },
            )
            .await,
        OwnerProviderInvitationDeliveryResult::Saved(_)
    ));
    assert!(matches!(
        repository
            .preview_provider_invitation(unique_invitation.delivery_token())
            .await,
        OwnerProviderInvitationPreviewResult::Opened(_)
    ));
    assert!(matches!(
        repository
            .verify_provider_invitation_recipient(
                "recipient-user-unique",
                unique_recipient,
                unique_invitation.delivery_token(),
            )
            .await,
        OwnerProviderInvitationRecipientCheckResult::Checked(_)
    ));
    let OwnerProviderOrganizationClaimResult::Created(unique_claim) = repository
        .create_provider_organization_claim(
            "recipient-user-unique",
            unique_recipient,
            CreateOwnerProviderOrganizationClaimRequest {
                token: unique_invitation.delivery_token().to_string(),
                claim_kind: "new_organization".to_string(),
                organization_id: None,
                provider_display_name: Some("Cactus Bloom Groundskeeping".to_string()),
                authority_attested: true,
                idempotency_key: "provider-org-claim-unique-001".to_string(),
            },
        )
        .await
    else {
        panic!("unique organization name should be ready for guarded bootstrap");
    };
    assert_eq!(unique_claim.status, "bootstrap_ready");
    assert!(unique_claim.organization_id.is_none());
    assert!(!unique_claim.opportunity_response_capability);

    assert!(matches!(
        repository
            .record_provider_invitation_delivery(
                &created.invitation.invitation_id,
                1,
                RecordOwnerProviderInvitationDeliveryRequest {
                    outcome: "delivered".to_string(),
                    provider_message_id: Some("stale-message".to_string()),
                    failure_code: None,
                },
            )
            .await,
        OwnerProviderInvitationDeliveryResult::InvalidState(_)
    ));

    assert!(matches!(
        repository
            .revoke_provider_invitation(
                owner_b,
                &property.property_id,
                &created.invitation.invitation_id,
            )
            .await,
        OwnerProviderInvitationMutationResult::NotFound
    ));
    assert!(matches!(
        repository
            .revoke_provider_invitation(
                owner_a,
                &property.property_id,
                &created.invitation.invitation_id,
            )
            .await,
        OwnerProviderInvitationMutationResult::Saved(invitation)
            if invitation.status == "revoked" && invitation.delivery_status == "delivered"
    ));
    assert!(matches!(
        repository
            .revoke_provider_invitation(
                owner_a,
                &property.property_id,
                &created.invitation.invitation_id,
            )
            .await,
        OwnerProviderInvitationMutationResult::Saved(invitation)
            if invitation.status == "revoked"
    ));
    assert!(matches!(
        repository
            .preview_provider_invitation(retry.delivery_token())
            .await,
        OwnerProviderInvitationPreviewResult::Closed(invitation)
            if invitation.status == "revoked"
                && !invitation.can_review_limited_request
                && invitation.owner_name.is_none()
                && invitation.coarse_area.is_none()
                && invitation.care_goals.is_empty()
    ));
    assert_eq!(
        sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM owner_acquisition_events
             WHERE owner_user_id = $1 AND event_kind = 'provider_invitation_revoked'",
        )
        .bind(owner_a)
        .fetch_one(&pool)
        .await
        .expect("revoke event count should load"),
        1
    );
    assert!(matches!(
        repository
            .create_provider_invitation(
                owner_a,
                &property.property_id,
                invitation_request(recipient, "provider-invite-after-revoke"),
            )
            .await,
        OwnerProviderInvitationCreateResult::Created(_)
    ));

    let OwnerProviderInvitationCreateResult::Created(expiring) = repository
        .create_provider_invitation(
            owner_a,
            &property.property_id,
            invitation_request("seasonal@sonoranyard.example", "provider-invite-expiry-001"),
        )
        .await
    else {
        panic!("expiring invitation should be created");
    };
    sqlx::query(
        "UPDATE owner_provider_invitations SET expires_at = NOW() - INTERVAL '1 minute'
         WHERE id = $1",
    )
    .bind(&expiring.invitation.invitation_id)
    .execute(&pool)
    .await
    .expect("test invitation should be made expired");
    assert_eq!(
        repository.expire_provider_invitations(25).await,
        OwnerProviderInvitationExpiryResult::Completed(1)
    );
    assert!(matches!(
        repository
            .get_provider_invitation(
                owner_a,
                &property.property_id,
                &expiring.invitation.invitation_id,
            )
            .await,
        OwnerReadResult::Loaded(invitation)
            if invitation.status == "expired" && invitation.delivery_status == "suppressed"
    ));
    assert_eq!(
        repository.expire_provider_invitations(25).await,
        OwnerProviderInvitationExpiryResult::Completed(0)
    );

    let OwnerProviderInvitationCreateResult::Created(opt_out_invitation) = repository
        .create_provider_invitation(
            owner_a,
            &property.property_id,
            invitation_request(opt_out_recipient, "provider-invite-opt-out-001"),
        )
        .await
    else {
        panic!("opt-out invitation should be created");
    };
    assert!(matches!(
        repository
            .opt_out_provider_invitation(
                "wrong@sonoranyard.example",
                opt_out_invitation.delivery_token()
            )
            .await,
        OwnerProviderInvitationMutationResult::NotFound
    ));
    assert!(matches!(
        repository
            .opt_out_provider_invitation(opt_out_recipient, opt_out_invitation.delivery_token())
            .await,
        OwnerProviderInvitationMutationResult::Saved(invitation)
            if invitation.status == "opted_out" && invitation.delivery_status == "suppressed"
    ));
    assert!(matches!(
        repository
            .opt_out_provider_invitation(opt_out_recipient, opt_out_invitation.delivery_token())
            .await,
        OwnerProviderInvitationMutationResult::Saved(invitation)
            if invitation.status == "opted_out"
    ));
    assert!(matches!(
        repository
            .create_provider_invitation(
                owner_a,
                &property.property_id,
                invitation_request(opt_out_recipient, "provider-invite-opt-out-002"),
            )
            .await,
        OwnerProviderInvitationCreateResult::Suppressed
    ));

    let OwnerProviderInvitationCreateResult::Created(abuse_invitation) = repository
        .create_provider_invitation(
            owner_a,
            &property.property_id,
            invitation_request(abuse_recipient, "provider-invite-abuse-001"),
        )
        .await
    else {
        panic!("abuse-report invitation should be created");
    };
    let abuse_request = ReportOwnerProviderInvitationAbuseRequest {
        token: abuse_invitation.delivery_token().to_string(),
        category: "impersonation".to_string(),
        customer_safe_description: Some(
            "The sender claimed to represent a company I do not recognize.".to_string(),
        ),
        block_future_invitations: true,
        idempotency_key: "provider-abuse-report-001".to_string(),
    };
    assert!(matches!(
        repository
            .report_provider_invitation_abuse(
                abuse_reporter,
                "wrong@sonoranyard.example",
                abuse_request.clone(),
            )
            .await,
        OwnerProviderInvitationAbuseReportResult::NotFound
    ));
    let OwnerProviderInvitationAbuseReportResult::Created(abuse_report) = repository
        .report_provider_invitation_abuse(abuse_reporter, abuse_recipient, abuse_request.clone())
        .await
    else {
        panic!("verified recipient abuse report should save");
    };
    assert!(abuse_report.persisted);
    assert_eq!(abuse_report.severity, "S1");
    assert_eq!(abuse_report.assigned_function, "trust_and_safety");
    assert_eq!(abuse_report.status, "submitted");
    assert!(abuse_report.block_future_invitations);
    assert!(matches!(
        repository
            .report_provider_invitation_abuse(
                abuse_reporter,
                abuse_recipient,
                abuse_request.clone(),
            )
            .await,
        OwnerProviderInvitationAbuseReportResult::Replayed(report)
            if report.report_id == abuse_report.report_id
    ));
    let mut duplicate_report = abuse_request;
    duplicate_report.idempotency_key = "provider-abuse-report-002".to_string();
    assert!(matches!(
        repository
            .report_provider_invitation_abuse(abuse_reporter, abuse_recipient, duplicate_report,)
            .await,
        OwnerProviderInvitationAbuseReportResult::Conflict
    ));
    let abuse_state = sqlx::query(
        "SELECT invitation.status, suppression.reason, report.customer_safe_description
         FROM owner_provider_invitations invitation
         JOIN owner_provider_recipient_suppressions suppression
           ON suppression.source_invitation_id = invitation.id
         JOIN owner_provider_invitation_abuse_reports report
           ON report.invitation_id = invitation.id
         WHERE invitation.id = $1",
    )
    .bind(&abuse_invitation.invitation.invitation_id)
    .fetch_one(&pool)
    .await
    .expect("abuse block state should load");
    assert_eq!(abuse_state.get::<String, _>("status"), "opted_out");
    assert_eq!(abuse_state.get::<String, _>("reason"), "abuse_block");
    assert_eq!(
        abuse_state.get::<String, _>("customer_safe_description"),
        "The sender claimed to represent a company I do not recognize."
    );
    let abuse_event_data = sqlx::query_scalar::<_, serde_json::Value>(
        "SELECT event_data FROM owner_acquisition_events
         WHERE owner_user_id = $1 AND event_kind = 'provider_invitation_abuse_reported'
         ORDER BY occurred_at DESC LIMIT 1",
    )
    .bind(owner_a)
    .fetch_one(&pool)
    .await
    .expect("abuse audit event should load")
    .to_string();
    assert!(!abuse_event_data.contains(abuse_recipient));
    assert!(!abuse_event_data.contains("company I do not recognize"));
    assert!(matches!(
        repository
            .create_provider_invitation(
                owner_a,
                &property.property_id,
                invitation_request(abuse_recipient, "provider-invite-abuse-002"),
            )
            .await,
        OwnerProviderInvitationCreateResult::Suppressed
    ));

    sqlx::query(
        "INSERT INTO owner_provider_recipient_suppressions (
             recipient_email_fingerprint, recipient_email, reason
         ) VALUES ($1, $2, 'recipient_opt_out')",
    )
    .bind(&suppressed_fingerprint)
    .bind(suppressed_recipient)
    .execute(&pool)
    .await
    .expect("test suppression should save");
    assert!(matches!(
        repository
            .create_provider_invitation(
                owner_a,
                &property.property_id,
                invitation_request(suppressed_recipient, "provider-invite-003"),
            )
            .await,
        OwnerProviderInvitationCreateResult::Suppressed
    ));

    sqlx::query("DELETE FROM owner_workspaces WHERE owner_user_id = ANY($1)")
        .bind(vec![owner_a, owner_b])
        .execute(&pool)
        .await
        .expect("test owners should clean up");
    sqlx::query(
        "DELETE FROM organizations
         WHERE id = ANY($1)",
    )
    .bind(vec![
        "org_provider_claim_owned",
        "org_provider_claim_private_duplicate",
    ])
    .execute(&pool)
    .await
    .expect("test provider organizations should clean up");
    sqlx::query("DELETE FROM owner_provider_invitation_abuse_reports WHERE reporter_user_id = $1")
        .bind(abuse_reporter)
        .execute(&pool)
        .await
        .expect("test abuse reports should clean up");
    sqlx::query(
        "DELETE FROM owner_provider_recipient_suppressions
         WHERE recipient_email_fingerprint = ANY($1)",
    )
    .bind(vec![
        suppressed_fingerprint,
        opt_out_fingerprint,
        abuse_fingerprint,
    ])
    .execute(&pool)
    .await
    .expect("test suppression should clean up");
}
