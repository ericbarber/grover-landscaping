use grover_landscaping_api::owner_acquisition::{
    AppealOwnerProviderOrganizationClaimRequest, BootstrapOwnerProviderOrganizationClaimRequest,
    CreateOwnerPropertyRequest, CreateOwnerProviderInvitationRequest,
    CreateOwnerProviderOpportunityResponseRequest, CreateOwnerProviderOrganizationClaimRequest,
    DecideOwnerProviderClaimReviewRequest, IssueOwnerProviderResponseCapabilityRequest,
    OpenOwnerProviderInboxRequest, OwnerAcquisitionRepository, OwnerMutationResult,
    OwnerProviderClaimAppealResult, OwnerProviderClaimReviewDecisionResult,
    OwnerProviderClaimReviewFilter, OwnerProviderClaimReviewListResult,
    OwnerProviderClaimReviewMetricsResult, OwnerProviderInboxResult,
    OwnerProviderInvitationAbuseReportResult, OwnerProviderInvitationCreateResult,
    OwnerProviderInvitationCreation, OwnerProviderInvitationDeliveryResult,
    OwnerProviderInvitationExpiryResult, OwnerProviderInvitationMutationResult,
    OwnerProviderInvitationPreviewResult, OwnerProviderInvitationRecipientCheckResult,
    OwnerProviderInvitationRetryResult, OwnerProviderOpportunityResponseResult,
    OwnerProviderOrganizationBootstrapResult, OwnerProviderOrganizationClaimResult,
    OwnerProviderOrganizationOptionsResult, OwnerProviderProgressResult,
    OwnerProviderResponseCapabilityRecord, OwnerProviderResponseCapabilityResult, OwnerReadResult,
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

async fn ready_checked_invitation(
    repository: &OwnerAcquisitionRepository,
    owner_user_id: &str,
    property_id: &str,
    recipient_email: &str,
    recipient_user_id: &str,
    idempotency_key: &str,
) -> OwnerProviderInvitationCreation {
    let OwnerProviderInvitationCreateResult::Created(invitation) = repository
        .create_provider_invitation(
            owner_user_id,
            property_id,
            invitation_request(recipient_email, idempotency_key),
        )
        .await
    else {
        panic!("provider bootstrap test invitation should be created");
    };
    assert!(matches!(
        repository
            .record_provider_invitation_delivery(
                &invitation.invitation.invitation_id,
                1,
                RecordOwnerProviderInvitationDeliveryRequest {
                    outcome: "delivered".to_string(),
                    provider_message_id: Some(format!("message-{idempotency_key}")),
                    failure_code: None,
                },
            )
            .await,
        OwnerProviderInvitationDeliveryResult::Saved(_)
    ));
    assert!(matches!(
        repository
            .preview_provider_invitation(invitation.delivery_token())
            .await,
        OwnerProviderInvitationPreviewResult::Opened(_)
    ));
    assert!(matches!(
        repository
            .verify_provider_invitation_recipient(
                recipient_user_id,
                recipient_email,
                invitation.delivery_token(),
            )
            .await,
        OwnerProviderInvitationRecipientCheckResult::Checked(_)
    ));
    invitation
}

async fn authorized_response_capability(
    repository: &OwnerAcquisitionRepository,
    owner_user_id: &str,
    property_id: &str,
    recipient_email: &str,
    recipient_user_id: &str,
    key_suffix: &str,
) -> (
    OwnerProviderInvitationCreation,
    OwnerProviderResponseCapabilityRecord,
) {
    let invitation = ready_checked_invitation(
        repository,
        owner_user_id,
        property_id,
        recipient_email,
        recipient_user_id,
        &format!("provider-response-invite-{key_suffix}"),
    )
    .await;
    let OwnerProviderOrganizationClaimResult::Created(claim) = repository
        .create_provider_organization_claim(
            recipient_user_id,
            recipient_email,
            CreateOwnerProviderOrganizationClaimRequest {
                token: invitation.delivery_token().to_string(),
                claim_kind: "existing_relationship".to_string(),
                organization_id: Some("org_provider_claim_owned".to_string()),
                provider_display_name: None,
                authority_attested: true,
                idempotency_key: format!("provider-response-claim-{key_suffix}"),
            },
        )
        .await
    else {
        panic!("terminal response provider relationship should be checked");
    };
    let OwnerProviderResponseCapabilityResult::Issued(capability) = repository
        .issue_provider_response_capability(
            recipient_user_id,
            recipient_email,
            &claim.claim_id,
            IssueOwnerProviderResponseCapabilityRequest {
                token: invitation.delivery_token().to_string(),
                withheld_categories_acknowledged: true,
                idempotency_key: format!("provider-response-capability-{key_suffix}"),
            },
        )
        .await
    else {
        panic!("terminal response capability should be issued");
    };
    (invitation, capability)
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
            .list_provider_connection_progress("owner-unavailable", "property-unavailable")
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
            .bootstrap_provider_organization_claim(
                "recipient-unavailable",
                "provider@example.com",
                "claim-unavailable",
                BootstrapOwnerProviderOrganizationClaimRequest {
                    token: "owner_provider_0000000000000000000000000000000000000000000000000000000000000000".to_string(),
                    expected_version: 1,
                    idempotency_key: "bootstrap-outage-001".to_string(),
                },
            )
            .await,
        OwnerProviderOrganizationBootstrapResult::Unavailable
    ));
    assert!(matches!(
        repository
            .list_provider_organization_claim_reviews(OwnerProviderClaimReviewFilter {
                status: None,
            })
            .await,
        OwnerProviderClaimReviewListResult::Unavailable
    ));
    assert!(matches!(
        repository
            .provider_organization_claim_review_metrics()
            .await,
        OwnerProviderClaimReviewMetricsResult::Unavailable
    ));
    assert!(matches!(
        repository
            .decide_provider_organization_claim_review(
                "support-unavailable",
                "claim-unavailable",
                DecideOwnerProviderClaimReviewRequest {
                    action: "review_started".to_string(),
                    expected_version: 1,
                    reason_code: None,
                    evidence_reference: None,
                    idempotency_key: "review-outage-001".to_string(),
                },
            )
            .await,
        OwnerProviderClaimReviewDecisionResult::Unavailable
    ));
    assert!(matches!(
        repository
            .appeal_provider_organization_claim(
                "recipient-unavailable",
                "provider@example.com",
                "claim-unavailable",
                AppealOwnerProviderOrganizationClaimRequest {
                    token: "owner_provider_0000000000000000000000000000000000000000000000000000000000000000".to_string(),
                    expected_version: 1,
                    category: "decision_correction".to_string(),
                    evidence_reference: "restricted://provider-claims/outage".to_string(),
                    idempotency_key: "appeal-outage-001".to_string(),
                },
            )
            .await,
        OwnerProviderClaimAppealResult::Unavailable
    ));
    assert!(matches!(
        repository
            .issue_provider_response_capability(
                "recipient-unavailable",
                "provider@example.com",
                "claim-unavailable",
                IssueOwnerProviderResponseCapabilityRequest {
                    token: "owner_provider_0000000000000000000000000000000000000000000000000000000000000000".to_string(),
                    withheld_categories_acknowledged: true,
                    idempotency_key: "capability-outage-001".to_string(),
                },
            )
            .await,
        OwnerProviderResponseCapabilityResult::Unavailable
    ));
    assert!(matches!(
        repository
            .open_provider_inbox(
                "recipient-unavailable",
                "provider@example.com",
                OpenOwnerProviderInboxRequest {
                    token: "owner_provider_0000000000000000000000000000000000000000000000000000000000000000".to_string(),
                },
            )
            .await,
        OwnerProviderInboxResult::Unavailable
    ));
    assert!(matches!(
        repository
            .provider_invitation_progress(
                "recipient-unavailable",
                "provider@example.com",
                OpenOwnerProviderInboxRequest {
                    token: "owner_provider_0000000000000000000000000000000000000000000000000000000000000000".to_string(),
                },
            )
            .await,
        OwnerProviderProgressResult::Unavailable
    ));
    assert!(matches!(
        repository
            .create_provider_opportunity_response(
                "recipient-unavailable",
                "provider@example.com",
                CreateOwnerProviderOpportunityResponseRequest {
                    token: "owner_provider_0000000000000000000000000000000000000000000000000000000000000000".to_string(),
                    capability_id: "owner_provider_capability_unavailable".to_string(),
                    expected_capability_version: 1,
                    action: "express_interest".to_string(),
                    response_code: "ready_for_owner_disclosure".to_string(),
                    block_future_invitations: false,
                    idempotency_key: "response-outage-001".to_string(),
                },
            )
            .await,
        OwnerProviderOpportunityResponseResult::Unavailable
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
        .max_connections(5)
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
         WHERE id = ANY($1)
            OR display_name IN ('Cactus Bloom Groundskeeping', 'Concurrent Mesa Care')",
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
    let recipient_fingerprint = format!("{:x}", Sha256::digest(recipient.as_bytes()));
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
        recipient_fingerprint.clone(),
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
    let capability_request = IssueOwnerProviderResponseCapabilityRequest {
        token: retry.delivery_token().to_string(),
        withheld_categories_acknowledged: true,
        idempotency_key: "provider-response-capability-001".to_string(),
    };
    assert!(matches!(
        repository
            .issue_provider_response_capability(
                "recipient-user-1",
                "wrong@sonoranyard.example",
                &existing_claim.claim_id,
                capability_request.clone(),
            )
            .await,
        OwnerProviderResponseCapabilityResult::NotFound
    ));
    let OwnerProviderResponseCapabilityResult::Issued(capability) = repository
        .issue_provider_response_capability(
            "recipient-user-1",
            recipient,
            &existing_claim.claim_id,
            capability_request.clone(),
        )
        .await
    else {
        panic!("checked active provider relationship should receive bounded response authority");
    };
    assert!(capability.persisted);
    assert_eq!(capability.status, "active");
    assert!(capability.opportunity_response_capability);
    assert_eq!(
        capability.allowed_actions,
        [
            "preliminary_question",
            "express_interest",
            "decline",
            "report"
        ]
    );
    assert_eq!(capability.withheld_categories.len(), 5);
    assert!(capability
        .withheld_categories
        .contains(&"pricing_and_work_authority".to_string()));
    let capability_json = serde_json::to_string(&capability).expect("capability should serialize");
    assert!(!capability_json.contains(owner_a));
    assert!(!capability_json.contains(recipient));
    assert!(!capability_json.contains("421 Private Canyon Road"));
    assert!(!capability_json.contains("0199"));
    assert!(matches!(
        repository
            .issue_provider_response_capability(
                "recipient-user-1",
                recipient,
                &existing_claim.claim_id,
                capability_request,
            )
            .await,
        OwnerProviderResponseCapabilityResult::Replayed(replayed)
            if replayed.capability_id == capability.capability_id
    ));
    assert!(matches!(
        repository
            .issue_provider_response_capability(
                "recipient-user-1",
                recipient,
                &existing_claim.claim_id,
                IssueOwnerProviderResponseCapabilityRequest {
                    token: retry.delivery_token().to_string(),
                    withheld_categories_acknowledged: true,
                    idempotency_key: "provider-response-capability-002".to_string(),
                },
            )
            .await,
        OwnerProviderResponseCapabilityResult::Conflict
    ));
    let persisted_capability = sqlx::query(
        "SELECT capability.status, capability.allowed_actions,
                capability.withheld_categories,
                capability.expires_at = invitation.expires_at AS expiry_scoped
         FROM owner_provider_invitation_response_capabilities capability
         JOIN owner_provider_invitations invitation ON invitation.id = capability.invitation_id
         WHERE capability.id = $1",
    )
    .bind(&capability.capability_id)
    .fetch_one(&pool)
    .await
    .expect("persisted response capability should load");
    assert_eq!(persisted_capability.get::<String, _>("status"), "active");
    assert!(persisted_capability.get::<bool, _>("expiry_scoped"));
    let capability_audit = sqlx::query_scalar::<_, serde_json::Value>(
        "SELECT event_data FROM owner_acquisition_events
         WHERE event_kind = 'provider_invitation_response_capability_issued'
           AND event_data->>'capability_id' = $1",
    )
    .bind(&capability.capability_id)
    .fetch_one(&pool)
    .await
    .expect("capability audit should load")
    .to_string();
    assert!(!capability_audit.contains(recipient));
    assert!(!capability_audit.contains("421 Private Canyon Road"));
    assert!(!capability_audit.contains("0199"));
    assert!(matches!(
        repository
            .open_provider_inbox(
                "recipient-user-1",
                "wrong@sonoranyard.example",
                OpenOwnerProviderInboxRequest {
                    token: retry.delivery_token().to_string(),
                },
            )
            .await,
        OwnerProviderInboxResult::NotFound
    ));
    let OwnerProviderInboxResult::Loaded(inbox_entry) = repository
        .open_provider_inbox(
            "recipient-user-1",
            recipient,
            OpenOwnerProviderInboxRequest {
                token: retry.delivery_token().to_string(),
            },
        )
        .await
    else {
        panic!("effectively authorized provider inbox should load");
    };
    assert_eq!(inbox_entry.status, "active");
    assert!(inbox_entry.can_review_limited_request);
    assert!(inbox_entry.opportunity_response_capability);
    assert_eq!(inbox_entry.owner_name.as_deref(), Some("Morgan Reyes"));
    assert_eq!(inbox_entry.coarse_area.as_deref(), Some("Central Phoenix"));
    assert_eq!(inbox_entry.care_goals, ["Routine upkeep"]);
    assert_eq!(
        inbox_entry.organization_name.as_deref(),
        Some("Recipient Owned Yard Care")
    );
    assert!(inbox_entry.recovery_action.is_none());
    let inbox_json = serde_json::to_string(&inbox_entry).expect("inbox should serialize");
    assert!(!inbox_json.contains(recipient));
    assert!(!inbox_json.contains("421 Private Canyon Road"));
    assert!(!inbox_json.contains("0199"));
    let question_request = CreateOwnerProviderOpportunityResponseRequest {
        token: retry.delivery_token().to_string(),
        capability_id: capability.capability_id.clone(),
        expected_capability_version: capability.version,
        action: "preliminary_question".to_string(),
        response_code: "assessment_method".to_string(),
        block_future_invitations: false,
        idempotency_key: "provider-opportunity-question-001".to_string(),
    };
    assert!(matches!(
        repository
            .create_provider_opportunity_response(
                "recipient-user-1",
                "wrong@sonoranyard.example",
                question_request.clone(),
            )
            .await,
        OwnerProviderOpportunityResponseResult::NotFound
    ));
    let OwnerProviderOpportunityResponseResult::Recorded(question) = repository
        .create_provider_opportunity_response(
            "recipient-user-1",
            recipient,
            question_request.clone(),
        )
        .await
    else {
        panic!("authorized provider question should be recorded");
    };
    assert_eq!(question.action, "preliminary_question");
    assert_eq!(question.response_code, "assessment_method");
    assert_eq!(question.status, "recorded");
    assert!(question.assigned_function.is_none());
    assert_eq!(question.capability_status, "active");
    assert_eq!(question.capability_version, capability.version);
    assert!(question.opportunity_response_capability);
    assert!(matches!(
        repository
            .create_provider_opportunity_response(
                "recipient-user-1",
                recipient,
                question_request.clone(),
            )
            .await,
        OwnerProviderOpportunityResponseResult::Replayed(replayed)
            if replayed.response_id == question.response_id
    ));
    assert!(matches!(
        repository
            .create_provider_opportunity_response(
                "recipient-user-1",
                recipient,
                CreateOwnerProviderOpportunityResponseRequest {
                    response_code: "service_fit".to_string(),
                    ..question_request
                },
            )
            .await,
        OwnerProviderOpportunityResponseResult::Conflict
    ));
    let interest_request = CreateOwnerProviderOpportunityResponseRequest {
        token: retry.delivery_token().to_string(),
        capability_id: capability.capability_id.clone(),
        expected_capability_version: capability.version,
        action: "express_interest".to_string(),
        response_code: "ready_for_owner_disclosure".to_string(),
        block_future_invitations: false,
        idempotency_key: "provider-opportunity-interest-001".to_string(),
    };
    let OwnerProviderOpportunityResponseResult::Recorded(interest) = repository
        .create_provider_opportunity_response("recipient-user-1", recipient, interest_request)
        .await
    else {
        panic!("authorized provider interest should be recorded");
    };
    assert_eq!(interest.action, "express_interest");
    assert!(interest.opportunity_response_capability);
    assert_eq!(interest.capability_version, capability.version);
    let OwnerProviderProgressResult::Loaded(provider_progress) = repository
        .provider_invitation_progress(
            "recipient-user-1",
            recipient,
            OpenOwnerProviderInboxRequest {
                token: retry.delivery_token().to_string(),
            },
        )
        .await
    else {
        panic!("checked provider progress should load");
    };
    assert_eq!(provider_progress.progress_stage, "response_recorded");
    assert_eq!(provider_progress.next_action, "wait_for_owner");
    assert_eq!(
        provider_progress.response_action.as_deref(),
        Some("express_interest")
    );
    assert!(provider_progress.recipient_email_checked);
    assert!(provider_progress.organization_relationship_checked);
    assert!(provider_progress.opportunity_response_capability);
    assert!(!provider_progress.closed);
    let provider_progress_json =
        serde_json::to_string(&provider_progress).expect("provider progress should serialize");
    assert!(!provider_progress_json.contains("Morgan Reyes"));
    assert!(!provider_progress_json.contains("421 Private Canyon Road"));
    assert!(!provider_progress_json.contains("0199"));
    assert!(!provider_progress_json.contains(&capability.capability_id));
    assert!(matches!(
        repository
            .create_provider_opportunity_response(
                "recipient-user-1",
                recipient,
                CreateOwnerProviderOpportunityResponseRequest {
                    token: retry.delivery_token().to_string(),
                    capability_id: capability.capability_id.clone(),
                    expected_capability_version: capability.version,
                    action: "express_interest".to_string(),
                    response_code: "ready_for_owner_disclosure".to_string(),
                    block_future_invitations: false,
                    idempotency_key: "provider-opportunity-interest-002".to_string(),
                },
            )
            .await,
        OwnerProviderOpportunityResponseResult::Conflict
    ));
    let response_audit = sqlx::query_scalar::<_, serde_json::Value>(
        "SELECT event_data FROM owner_acquisition_events
         WHERE event_kind = 'provider_invitation_opportunity_response_recorded'
           AND event_data->>'response_id' = $1",
    )
    .bind(&question.response_id)
    .fetch_one(&pool)
    .await
    .expect("provider response audit should load")
    .to_string();
    assert!(!response_audit.contains(recipient));
    assert!(!response_audit.contains("421 Private Canyon Road"));
    assert!(!response_audit.contains("0199"));
    assert!(matches!(
        repository
            .list_provider_connection_progress(owner_b, &property.property_id)
            .await,
        OwnerReadResult::NotFound
    ));
    let OwnerReadResult::Loaded(connection_progress) = repository
        .list_provider_connection_progress(owner_a, &property.property_id)
        .await
    else {
        panic!("owner connection progress should load");
    };
    let active_progress = connection_progress
        .iter()
        .find(|entry| entry.invitation_id == retry.invitation.invitation_id)
        .expect("active invitation progress should be present");
    assert_eq!(active_progress.progress_stage, "disclosure_decision");
    assert_eq!(
        active_progress.status_label,
        "Provider is interested in the next owner-approved review"
    );
    assert!(active_progress.owner_action_required);
    assert_eq!(active_progress.next_action, "review_disclosure");
    assert_eq!(
        active_progress.latest_response_action.as_deref(),
        Some("express_interest")
    );
    assert!(active_progress.responded_at_epoch_seconds.is_some());
    let progress_json =
        serde_json::to_string(&connection_progress).expect("connection progress should serialize");
    assert!(!progress_json.contains(recipient));
    assert!(!progress_json.contains(&capability.capability_id));
    assert!(!progress_json.contains("capacity_unavailable"));
    assert!(!progress_json.contains("unsafe_contact"));
    assert!(!progress_json.contains("421 Private Canyon Road"));
    assert!(!progress_json.contains("0199"));

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
    let OwnerProviderClaimReviewListResult::Loaded(review_queue) = repository
        .list_provider_organization_claim_reviews(OwnerProviderClaimReviewFilter {
            status: Some("duplicate_review".to_string()),
        })
        .await
    else {
        panic!("provider operations duplicate queue should load");
    };
    let queued_duplicate = review_queue
        .iter()
        .find(|review| review.claim_id == duplicate_claim.claim_id)
        .expect("duplicate claim should be present in minimized queue");
    assert_eq!(queued_duplicate.status, "duplicate_review");
    let review_queue_json = serde_json::to_string(&review_queue).expect("queue should serialize");
    assert!(!review_queue_json.contains(duplicate_recipient));
    assert!(!review_queue_json.contains("org_provider_claim_private_duplicate"));
    assert!(!review_queue_json.contains("421 Private Canyon Road"));
    let start_review_request = DecideOwnerProviderClaimReviewRequest {
        action: "review_started".to_string(),
        expected_version: duplicate_claim.version,
        reason_code: None,
        evidence_reference: None,
        idempotency_key: "provider-claim-review-start-001".to_string(),
    };
    let OwnerProviderClaimReviewDecisionResult::Updated(started_review) = repository
        .decide_provider_organization_claim_review(
            "support-provider-operations-1",
            &duplicate_claim.claim_id,
            start_review_request.clone(),
        )
        .await
    else {
        panic!("provider operations should start duplicate review");
    };
    assert_eq!(started_review.status, "under_review");
    assert_eq!(started_review.version, duplicate_claim.version + 1);
    assert!(matches!(
        repository
            .decide_provider_organization_claim_review(
                "support-provider-operations-1",
                &duplicate_claim.claim_id,
                start_review_request,
            )
            .await,
        OwnerProviderClaimReviewDecisionResult::Replayed(review)
            if review.status == "under_review"
    ));
    let OwnerProviderClaimReviewDecisionResult::Updated(cleared_review) = repository
        .decide_provider_organization_claim_review(
            "support-provider-operations-1",
            &duplicate_claim.claim_id,
            DecideOwnerProviderClaimReviewRequest {
                action: "cleared_for_bootstrap".to_string(),
                expected_version: started_review.version,
                reason_code: Some("distinct_organization".to_string()),
                evidence_reference: Some("restricted://provider-claims/evidence-001".to_string()),
                idempotency_key: "provider-claim-review-clear-001".to_string(),
            },
        )
        .await
    else {
        panic!("reviewed distinct organization should return to bootstrap-ready");
    };
    assert_eq!(cleared_review.status, "bootstrap_ready");
    assert_eq!(cleared_review.version, started_review.version + 1);
    assert!(cleared_review.assigned_function.is_none());
    let review_history = sqlx::query(
        "SELECT action, evidence_reference FROM owner_provider_organization_claim_review_events
         WHERE claim_id = $1 ORDER BY occurred_at, id",
    )
    .bind(&duplicate_claim.claim_id)
    .fetch_all(&pool)
    .await
    .expect("append-only claim review history should load");
    assert_eq!(review_history.len(), 2);
    assert_eq!(
        review_history[0].get::<String, _>("action"),
        "review_started"
    );
    assert_eq!(
        review_history[1]
            .get::<Option<String>, _>("evidence_reference")
            .as_deref(),
        Some("restricted://provider-claims/evidence-001")
    );
    let general_review_audit = sqlx::query_scalar::<_, serde_json::Value>(
        "SELECT event_data FROM owner_acquisition_events
         WHERE event_kind = 'provider_invitation_organization_review_dispositioned'
           AND event_data->>'claim_id' = $1",
    )
    .bind(&duplicate_claim.claim_id)
    .fetch_one(&pool)
    .await
    .expect("general review audit should load")
    .to_string();
    assert!(!general_review_audit.contains("evidence-001"));
    assert!(!general_review_audit.contains("org_provider_claim_private_duplicate"));

    let appeal_recipient = "appeal@sonoranyard.example";
    let appeal_invitation = ready_checked_invitation(
        &repository,
        owner_a,
        &property.property_id,
        appeal_recipient,
        "recipient-user-appeal",
        "provider-invite-appeal-001",
    )
    .await;
    let OwnerProviderOrganizationClaimResult::Created(appeal_claim) = repository
        .create_provider_organization_claim(
            "recipient-user-appeal",
            appeal_recipient,
            CreateOwnerProviderOrganizationClaimRequest {
                token: appeal_invitation.delivery_token().to_string(),
                claim_kind: "new_organization".to_string(),
                organization_id: None,
                provider_display_name: Some("Desert Duplicate Care".to_string()),
                authority_attested: true,
                idempotency_key: "provider-org-claim-appeal-001".to_string(),
            },
        )
        .await
    else {
        panic!("appeal test claim should enter duplicate review");
    };
    let OwnerProviderClaimReviewDecisionResult::Updated(rejected_claim) = repository
        .decide_provider_organization_claim_review(
            "support-provider-operations-rejector",
            &appeal_claim.claim_id,
            DecideOwnerProviderClaimReviewRequest {
                action: "rejected".to_string(),
                expected_version: appeal_claim.version,
                reason_code: Some("identity_evidence_incomplete".to_string()),
                evidence_reference: Some("restricted://provider-claims/rejection-001".to_string()),
                idempotency_key: "provider-claim-review-reject-001".to_string(),
            },
        )
        .await
    else {
        panic!("provider operations should reject the incomplete claim");
    };
    assert_eq!(rejected_claim.status, "rejected");
    let appeal_request = AppealOwnerProviderOrganizationClaimRequest {
        token: appeal_invitation.delivery_token().to_string(),
        expected_version: rejected_claim.version,
        category: "new_identity_evidence".to_string(),
        evidence_reference: "restricted://provider-claims/appeal-001".to_string(),
        idempotency_key: "provider-claim-appeal-submit-001".to_string(),
    };
    assert!(matches!(
        repository
            .appeal_provider_organization_claim(
                "recipient-user-appeal",
                "wrong@sonoranyard.example",
                &appeal_claim.claim_id,
                appeal_request.clone(),
            )
            .await,
        OwnerProviderClaimAppealResult::NotFound
    ));
    let OwnerProviderClaimAppealResult::Submitted(appealed_claim) = repository
        .appeal_provider_organization_claim(
            "recipient-user-appeal",
            appeal_recipient,
            &appeal_claim.claim_id,
            appeal_request.clone(),
        )
        .await
    else {
        panic!("checked recipient should submit a controlled appeal");
    };
    assert_eq!(appealed_claim.status, "under_review");
    assert_eq!(appealed_claim.version, rejected_claim.version + 1);
    assert!(!appealed_claim.opportunity_response_capability);
    assert!(matches!(
        repository
            .appeal_provider_organization_claim(
                "recipient-user-appeal",
                appeal_recipient,
                &appeal_claim.claim_id,
                appeal_request,
            )
            .await,
        OwnerProviderClaimAppealResult::Replayed(review)
            if review.status == "under_review"
    ));
    let appeal_event = sqlx::query(
        "SELECT actor_function, action, appeal_of_review_event_id, evidence_reference
         FROM owner_provider_organization_claim_review_events
         WHERE claim_id = $1 AND action = 'appeal_submitted'",
    )
    .bind(&appeal_claim.claim_id)
    .fetch_one(&pool)
    .await
    .expect("appeal history should load");
    assert_eq!(
        appeal_event.get::<String, _>("actor_function"),
        "checked_recipient"
    );
    assert!(appeal_event
        .get::<Option<String>, _>("appeal_of_review_event_id")
        .is_some());
    assert_eq!(
        appeal_event
            .get::<Option<String>, _>("evidence_reference")
            .as_deref(),
        Some("restricted://provider-claims/appeal-001")
    );
    let general_appeal_audit = sqlx::query_scalar::<_, serde_json::Value>(
        "SELECT event_data FROM owner_acquisition_events
         WHERE event_kind = 'provider_invitation_organization_appealed'
           AND event_data->>'claim_id' = $1",
    )
    .bind(&appeal_claim.claim_id)
    .fetch_one(&pool)
    .await
    .expect("general appeal audit should load")
    .to_string();
    assert!(!general_appeal_audit.contains("appeal-001"));
    assert!(!general_appeal_audit.contains(appeal_recipient));
    let appeal_decision_request = DecideOwnerProviderClaimReviewRequest {
        action: "appeal_approved".to_string(),
        expected_version: appealed_claim.version,
        reason_code: Some("distinct_organization".to_string()),
        evidence_reference: Some("restricted://provider-claims/appeal-decision-001".to_string()),
        idempotency_key: "provider-claim-appeal-decision-001".to_string(),
    };
    assert!(matches!(
        repository
            .decide_provider_organization_claim_review(
                "support-provider-operations-rejector",
                &appeal_claim.claim_id,
                appeal_decision_request.clone(),
            )
            .await,
        OwnerProviderClaimReviewDecisionResult::Conflict
    ));
    assert!(matches!(
        repository
            .decide_provider_organization_claim_review(
                "support-provider-operations-independent",
                &appeal_claim.claim_id,
                DecideOwnerProviderClaimReviewRequest {
                    action: "rejected".to_string(),
                    expected_version: appealed_claim.version,
                    reason_code: Some("identity_evidence_incomplete".to_string()),
                    evidence_reference: Some("restricted://provider-claims/bypass".to_string()),
                    idempotency_key: "provider-claim-appeal-bypass-001".to_string(),
                },
            )
            .await,
        OwnerProviderClaimReviewDecisionResult::InvalidState
    ));
    let OwnerProviderClaimReviewDecisionResult::Updated(appeal_approved) = repository
        .decide_provider_organization_claim_review(
            "support-provider-operations-independent",
            &appeal_claim.claim_id,
            appeal_decision_request.clone(),
        )
        .await
    else {
        panic!("an independent reviewer should decide the appeal");
    };
    assert_eq!(appeal_approved.status, "bootstrap_ready");
    assert!(!appeal_approved.opportunity_response_capability);
    assert!(matches!(
        repository
            .decide_provider_organization_claim_review(
                "support-provider-operations-independent",
                &appeal_claim.claim_id,
                appeal_decision_request,
            )
            .await,
        OwnerProviderClaimReviewDecisionResult::Replayed(review)
            if review.status == "bootstrap_ready"
    ));
    let appeal_decision_event = sqlx::query(
        "SELECT action, actor_user_id, appeal_of_review_event_id
         FROM owner_provider_organization_claim_review_events
         WHERE claim_id = $1 AND action = 'appeal_decided'",
    )
    .bind(&appeal_claim.claim_id)
    .fetch_one(&pool)
    .await
    .expect("appeal decision history should load");
    assert_eq!(
        appeal_decision_event.get::<String, _>("actor_user_id"),
        "support-provider-operations-independent"
    );
    assert!(appeal_decision_event
        .get::<Option<String>, _>("appeal_of_review_event_id")
        .is_some());

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
    let unique_bootstrap_request = BootstrapOwnerProviderOrganizationClaimRequest {
        token: unique_invitation.delivery_token().to_string(),
        expected_version: unique_claim.version,
        idempotency_key: "provider-org-bootstrap-unique-001".to_string(),
    };
    let mut stale_bootstrap_request = unique_bootstrap_request.clone();
    stale_bootstrap_request.expected_version += 1;
    assert!(matches!(
        repository
            .bootstrap_provider_organization_claim(
                "recipient-user-unique",
                unique_recipient,
                &unique_claim.claim_id,
                stale_bootstrap_request,
            )
            .await,
        OwnerProviderOrganizationBootstrapResult::Conflict
    ));
    let OwnerProviderOrganizationBootstrapResult::Bootstrapped(bootstrapped_claim) = repository
        .bootstrap_provider_organization_claim(
            "recipient-user-unique",
            unique_recipient,
            &unique_claim.claim_id,
            unique_bootstrap_request.clone(),
        )
        .await
    else {
        panic!("duplicate-clear provider organization should bootstrap atomically");
    };
    assert_eq!(bootstrapped_claim.status, "claimed");
    assert_eq!(bootstrapped_claim.version, unique_claim.version + 1);
    assert!(bootstrapped_claim.organization_id.is_some());
    assert!(!bootstrapped_claim.opportunity_response_capability);
    assert!(matches!(
        repository
            .bootstrap_provider_organization_claim(
                "recipient-user-unique",
                unique_recipient,
                &unique_claim.claim_id,
                unique_bootstrap_request,
            )
            .await,
        OwnerProviderOrganizationBootstrapResult::Replayed(claim)
            if claim.claim_id == bootstrapped_claim.claim_id
    ));
    let bootstrapped_organization_id = bootstrapped_claim
        .organization_id
        .as_deref()
        .expect("bootstrapped organization id should be present");
    let bootstrap_state = sqlx::query(
        "SELECT organization.display_name, membership.role, membership.status,
                claim.bootstrap_membership_id,
                EXISTS(
                    SELECT 1 FROM access_audit_events audit
                    WHERE audit.organization_id = organization.id
                      AND audit.actor_user_id = $2
                      AND audit.event_kind = 'organization_bootstrapped'
                ) AS audited
         FROM organizations organization
         JOIN organization_memberships membership
           ON membership.organization_id = organization.id AND membership.user_id = $2
         JOIN owner_provider_invitation_organization_claims claim
           ON claim.organization_id = organization.id
         WHERE organization.id = $1",
    )
    .bind(bootstrapped_organization_id)
    .bind("recipient-user-unique")
    .fetch_one(&pool)
    .await
    .expect("atomic bootstrap state should load");
    assert_eq!(
        bootstrap_state.get::<String, _>("display_name"),
        "Cactus Bloom Groundskeeping"
    );
    assert_eq!(
        bootstrap_state.get::<String, _>("role"),
        "organization_owner"
    );
    assert_eq!(bootstrap_state.get::<String, _>("status"), "active");
    assert!(bootstrap_state
        .get::<Option<String>, _>("bootstrap_membership_id")
        .is_some());
    assert!(bootstrap_state.get::<bool, _>("audited"));

    let concurrent_a = ready_checked_invitation(
        &repository,
        owner_a,
        &property.property_id,
        "concurrent-a@sonoranyard.example",
        "recipient-user-concurrent-a",
        "provider-invite-concurrent-a-001",
    )
    .await;
    let concurrent_b = ready_checked_invitation(
        &repository,
        owner_a,
        &property.property_id,
        "concurrent-b@sonoranyard.example",
        "recipient-user-concurrent-b",
        "provider-invite-concurrent-b-001",
    )
    .await;
    let OwnerProviderOrganizationClaimResult::Created(concurrent_claim_a) = repository
        .create_provider_organization_claim(
            "recipient-user-concurrent-a",
            "concurrent-a@sonoranyard.example",
            CreateOwnerProviderOrganizationClaimRequest {
                token: concurrent_a.delivery_token().to_string(),
                claim_kind: "new_organization".to_string(),
                organization_id: None,
                provider_display_name: Some("Concurrent Mesa Care".to_string()),
                authority_attested: true,
                idempotency_key: "provider-org-claim-concurrent-a-001".to_string(),
            },
        )
        .await
    else {
        panic!("first concurrent claim should be bootstrap-ready");
    };
    let OwnerProviderOrganizationClaimResult::Created(concurrent_claim_b) = repository
        .create_provider_organization_claim(
            "recipient-user-concurrent-b",
            "concurrent-b@sonoranyard.example",
            CreateOwnerProviderOrganizationClaimRequest {
                token: concurrent_b.delivery_token().to_string(),
                claim_kind: "new_organization".to_string(),
                organization_id: None,
                provider_display_name: Some("  CONCURRENT   mesa care ".to_string()),
                authority_attested: true,
                idempotency_key: "provider-org-claim-concurrent-b-001".to_string(),
            },
        )
        .await
    else {
        panic!("second concurrent claim should be bootstrap-ready before final rescan");
    };
    let (concurrent_result_a, concurrent_result_b) = tokio::join!(
        repository.bootstrap_provider_organization_claim(
            "recipient-user-concurrent-a",
            "concurrent-a@sonoranyard.example",
            &concurrent_claim_a.claim_id,
            BootstrapOwnerProviderOrganizationClaimRequest {
                token: concurrent_a.delivery_token().to_string(),
                expected_version: concurrent_claim_a.version,
                idempotency_key: "provider-org-bootstrap-concurrent-a-001".to_string(),
            },
        ),
        repository.bootstrap_provider_organization_claim(
            "recipient-user-concurrent-b",
            "concurrent-b@sonoranyard.example",
            &concurrent_claim_b.claim_id,
            BootstrapOwnerProviderOrganizationClaimRequest {
                token: concurrent_b.delivery_token().to_string(),
                expected_version: concurrent_claim_b.version,
                idempotency_key: "provider-org-bootstrap-concurrent-b-001".to_string(),
            },
        )
    );
    let concurrent_outcomes = [&concurrent_result_a, &concurrent_result_b];
    assert_eq!(
        concurrent_outcomes
            .iter()
            .filter(|result| matches!(
                result,
                OwnerProviderOrganizationBootstrapResult::Bootstrapped(_)
            ))
            .count(),
        1
    );
    assert_eq!(
        concurrent_outcomes
            .iter()
            .filter(|result| matches!(result, OwnerProviderOrganizationBootstrapResult::DuplicateReview(claim) if claim.organization_id.is_none()))
            .count(),
        1
    );
    assert_eq!(
        sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM organizations
             WHERE organization_type = 'yard_care_company'
               AND LOWER(REGEXP_REPLACE(TRIM(display_name), '\\s+', ' ', 'g')) = 'concurrent mesa care'",
        )
        .fetch_one(&pool)
        .await
        .expect("concurrent organization count should load"),
        1
    );
    let overdue_claim_id = concurrent_outcomes
        .iter()
        .find_map(|result| match result {
            OwnerProviderOrganizationBootstrapResult::DuplicateReview(claim) => {
                Some(claim.claim_id.as_str())
            }
            _ => None,
        })
        .expect("one concurrent claim should require duplicate review");
    sqlx::query(
        "UPDATE owner_provider_invitation_organization_claims
         SET updated_at = NOW() - INTERVAL '3 days' WHERE id = $1",
    )
    .bind(overdue_claim_id)
    .execute(&pool)
    .await
    .expect("test review should become overdue");
    let OwnerProviderClaimReviewMetricsResult::Loaded(review_metrics) = repository
        .provider_organization_claim_review_metrics()
        .await
    else {
        panic!("aggregate provider review metrics should load");
    };
    assert!(review_metrics.duplicate_review_count >= 1);
    assert!(review_metrics.overdue_count >= 1);
    assert!(review_metrics
        .oldest_age_seconds
        .is_some_and(|age| age >= 259_000));
    assert_eq!(review_metrics.priority_count, review_metrics.disputed_count);
    let metrics_json = serde_json::to_string(&review_metrics).expect("metrics should serialize");
    assert!(!metrics_json.contains(overdue_claim_id));
    assert!(!metrics_json.contains("Concurrent Mesa Care"));
    assert!(!metrics_json.contains("sonoranyard.example"));

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
    assert_eq!(
        sqlx::query_scalar::<_, String>(
            "SELECT status FROM owner_provider_invitation_response_capabilities WHERE id = $1",
        )
        .bind(&capability.capability_id)
        .fetch_one(&pool)
        .await
        .expect("revoked capability status should load"),
        "revoked"
    );
    let OwnerProviderInboxResult::Closed(closed_inbox) = repository
        .open_provider_inbox(
            "recipient-user-1",
            recipient,
            OpenOwnerProviderInboxRequest {
                token: retry.delivery_token().to_string(),
            },
        )
        .await
    else {
        panic!("revoked invitation should return status-only inbox recovery");
    };
    assert_eq!(closed_inbox.status, "revoked");
    assert!(!closed_inbox.can_review_limited_request);
    assert!(!closed_inbox.opportunity_response_capability);
    assert!(closed_inbox.owner_name.is_none());
    assert!(closed_inbox.organization_id.is_none());
    assert!(closed_inbox.allowed_actions.is_empty());
    assert_eq!(
        closed_inbox.recovery_action.as_deref(),
        Some("review_invitation_status")
    );
    let OwnerProviderProgressResult::Loaded(closed_provider_progress) = repository
        .provider_invitation_progress(
            "recipient-user-1",
            recipient,
            OpenOwnerProviderInboxRequest {
                token: retry.delivery_token().to_string(),
            },
        )
        .await
    else {
        panic!("revoked provider progress should return status-only closure");
    };
    assert!(closed_provider_progress.closed);
    assert_eq!(closed_provider_progress.progress_stage, "closed");
    assert_eq!(
        closed_provider_progress.status_label,
        "Owner withdrew this invitation"
    );
    assert!(closed_provider_progress.response_action.is_none());
    assert!(closed_provider_progress.response_label.is_none());
    assert!(!closed_provider_progress.organization_relationship_checked);
    assert!(!closed_provider_progress.opportunity_response_capability);
    assert_eq!(
        sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM owner_acquisition_events
             WHERE event_kind = 'provider_invitation_response_capability_reconciled'
               AND event_data->>'invitation_id' = $1",
        )
        .bind(&created.invitation.invitation_id)
        .fetch_one(&pool)
        .await
        .expect("capability reconciliation audit should load"),
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

    let (decline_invitation, decline_capability) = authorized_response_capability(
        &repository,
        owner_a,
        &property.property_id,
        recipient,
        "recipient-user-1",
        "decline-001",
    )
    .await;
    let OwnerProviderOpportunityResponseResult::Recorded(decline) = repository
        .create_provider_opportunity_response(
            "recipient-user-1",
            recipient,
            CreateOwnerProviderOpportunityResponseRequest {
                token: decline_invitation.delivery_token().to_string(),
                capability_id: decline_capability.capability_id.clone(),
                expected_capability_version: decline_capability.version,
                action: "decline".to_string(),
                response_code: "capacity_unavailable".to_string(),
                block_future_invitations: false,
                idempotency_key: "provider-opportunity-decline-001".to_string(),
            },
        )
        .await
    else {
        panic!("authorized decline should be recorded");
    };
    assert_eq!(decline.capability_status, "declined");
    assert_eq!(decline.capability_version, decline_capability.version + 1);
    assert!(!decline.opportunity_response_capability);
    assert_eq!(
        sqlx::query_scalar::<_, String>(
            "SELECT status FROM owner_provider_invitations WHERE id = $1",
        )
        .bind(&decline_invitation.invitation.invitation_id)
        .fetch_one(&pool)
        .await
        .expect("declined invitation status should load"),
        "declined"
    );
    assert_eq!(
        sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM owner_provider_recipient_suppressions
             WHERE recipient_email_fingerprint = $1",
        )
        .bind(&recipient_fingerprint)
        .fetch_one(&pool)
        .await
        .expect("decline suppression count should load"),
        0
    );

    let (report_invitation, report_capability) = authorized_response_capability(
        &repository,
        owner_a,
        &property.property_id,
        recipient,
        "recipient-user-1",
        "report-001",
    )
    .await;
    let OwnerProviderOpportunityResponseResult::Recorded(report) = repository
        .create_provider_opportunity_response(
            "recipient-user-1",
            recipient,
            CreateOwnerProviderOpportunityResponseRequest {
                token: report_invitation.delivery_token().to_string(),
                capability_id: report_capability.capability_id.clone(),
                expected_capability_version: report_capability.version,
                action: "report".to_string(),
                response_code: "unsafe_contact".to_string(),
                block_future_invitations: true,
                idempotency_key: "provider-opportunity-report-001".to_string(),
            },
        )
        .await
    else {
        panic!("authorized safety report should be routed");
    };
    assert_eq!(report.status, "routed");
    assert_eq!(
        report.assigned_function.as_deref(),
        Some("trust_and_safety")
    );
    assert_eq!(report.capability_status, "revoked");
    assert!(!report.opportunity_response_capability);
    let report_state = sqlx::query(
        "SELECT invitation.status, suppression.reason, abuse.category,
                abuse.customer_safe_description, abuse.assigned_function
         FROM owner_provider_invitations invitation
         JOIN owner_provider_recipient_suppressions suppression
           ON suppression.source_invitation_id = invitation.id
         JOIN owner_provider_invitation_abuse_reports abuse
           ON abuse.invitation_id = invitation.id
         WHERE invitation.id = $1",
    )
    .bind(&report_invitation.invitation.invitation_id)
    .fetch_one(&pool)
    .await
    .expect("routed safety response state should load");
    assert_eq!(report_state.get::<String, _>("status"), "opted_out");
    assert_eq!(report_state.get::<String, _>("reason"), "abuse_block");
    assert_eq!(report_state.get::<String, _>("category"), "unsafe_contact");
    assert_eq!(
        report_state.get::<String, _>("customer_safe_description"),
        ""
    );
    assert_eq!(
        report_state.get::<String, _>("assigned_function"),
        "trust_and_safety"
    );
    let OwnerReadResult::Loaded(terminal_progress) = repository
        .list_provider_connection_progress(owner_a, &property.property_id)
        .await
    else {
        panic!("terminal owner connection progress should load");
    };
    let declined_progress = terminal_progress
        .iter()
        .find(|entry| entry.invitation_id == decline_invitation.invitation.invitation_id)
        .expect("declined progress should be present");
    assert_eq!(declined_progress.progress_stage, "declined");
    assert_eq!(
        declined_progress.latest_response_action.as_deref(),
        Some("decline")
    );
    assert_eq!(
        declined_progress.response_label.as_deref(),
        Some("Not available for this request")
    );
    let closed_progress = terminal_progress
        .iter()
        .find(|entry| entry.invitation_id == report_invitation.invitation.invitation_id)
        .expect("closed contact progress should be present");
    assert_eq!(closed_progress.progress_stage, "contact_closed");
    assert_eq!(closed_progress.status_label, "Recipient contact closed");
    assert!(closed_progress.latest_response_action.is_none());
    assert!(closed_progress.response_label.is_none());
    assert!(closed_progress.responded_at_epoch_seconds.is_none());
    let terminal_progress_json =
        serde_json::to_string(&terminal_progress).expect("terminal progress should serialize");
    assert!(!terminal_progress_json.contains("capacity_unavailable"));
    assert!(!terminal_progress_json.contains("unsafe_contact"));
    assert!(!terminal_progress_json.contains("trust_and_safety"));

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
         WHERE id = ANY($1)
            OR display_name IN ('Cactus Bloom Groundskeeping', 'Concurrent Mesa Care')",
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
        recipient_fingerprint,
    ])
    .execute(&pool)
    .await
    .expect("test suppression should clean up");
}
