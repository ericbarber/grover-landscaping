use grover_landscaping_api::customer_portal_access::{
    CustomerPortalAccessRepository, CustomerPortalPropertyAccessResult,
    CustomerPortalVisitReadResult,
};
use grover_landscaping_api::customer_visit_communication::{
    CreateCustomerVisitQuestionRequest, CreateProviderVisitResponseRequest,
    CustomerVisitCommunicationRepository, CustomerVisitMessageWriteResult,
    CustomerVisitProofReadResult, CustomerVisitThreadReadResult, ProviderVisitThreadListResult,
};
use grover_landscaping_api::customer_visit_recommendations::{
    CustomerRecommendationDecisionResult, CustomerRecommendationDetailResult,
    CustomerRecommendationListResult, CustomerVisitRecommendationRepository,
    DecideCustomerRecommendationRequest,
};
use grover_landscaping_api::owner_acquisition::{
    ActivateOwnerProviderRelationshipRequest, AppealOwnerProviderOrganizationClaimRequest,
    BootstrapOwnerProviderOrganizationClaimRequest, CreateOwnerAssessmentMessageRequest,
    CreateOwnerInitialServiceProposalMessageRequest, CreateOwnerIntakeMediaRequest,
    CreateOwnerPropertyRequest, CreateOwnerProviderAssessmentRequest,
    CreateOwnerProviderDisclosureGrantRequest, CreateOwnerProviderInvitationRequest,
    CreateOwnerProviderOpportunityResponseRequest, CreateOwnerProviderOrganizationClaimRequest,
    CreateProviderAssessmentMessageRequest, CreateProviderAssessmentPrivateNoteRequest,
    CreateProviderInitialServiceProposalResponseRequest,
    DecideOwnerProviderAssessmentWindowRequest, DecideOwnerProviderClaimReviewRequest,
    DecideOwnerProviderFirstVisitRequest, DecideOwnerProviderInitialServiceProposalRequest,
    IssueOwnerProviderResponseCapabilityRequest, OpenOwnerProviderDisclosureRequest,
    OpenOwnerProviderInboxRequest, OwnerAcquisitionRepository, OwnerMutationResult,
    OwnerProviderAssessmentCommunicationWriteResult, OwnerProviderAssessmentCreateResult,
    OwnerProviderAssessmentTransitionResult, OwnerProviderAssessmentWindowDecisionResult,
    OwnerProviderClaimAppealResult, OwnerProviderClaimReviewDecisionResult,
    OwnerProviderClaimReviewFilter, OwnerProviderClaimReviewListResult,
    OwnerProviderClaimReviewMetricsResult, OwnerProviderDisclosureAccessResult,
    OwnerProviderDisclosureGrantCreateResult, OwnerProviderDisclosureGrantRevokeResult,
    OwnerProviderDisclosureReviewResult, OwnerProviderFirstVisitReadResult,
    OwnerProviderFirstVisitWriteResult, OwnerProviderInboxResult,
    OwnerProviderInitialServiceProposalDecisionResult,
    OwnerProviderInitialServiceProposalMessageWriteResult,
    OwnerProviderInitialServiceProposalWriteResult, OwnerProviderInvitationAbuseReportResult,
    OwnerProviderInvitationCreateResult, OwnerProviderInvitationCreation,
    OwnerProviderInvitationDeliveryResult, OwnerProviderInvitationExpiryResult,
    OwnerProviderInvitationMutationResult, OwnerProviderInvitationPreviewResult,
    OwnerProviderInvitationRecipientCheckResult, OwnerProviderInvitationRetryResult,
    OwnerProviderOpportunityResponseResult, OwnerProviderOrganizationBootstrapResult,
    OwnerProviderOrganizationClaimResult, OwnerProviderOrganizationOptionsResult,
    OwnerProviderProgressResult, OwnerProviderRelationshipActivationResult,
    OwnerProviderResponseCapabilityRecord, OwnerProviderResponseCapabilityResult, OwnerReadResult,
    ProposeProviderAssessmentWindowRequest, ProposeProviderFirstVisitRequest,
    ProviderAssessmentWindowProposalResult, PublishOwnerProviderInitialServiceProposalRequest,
    RecordOwnerProviderInvitationDeliveryRequest, ReportOwnerProviderInvitationAbuseRequest,
    RetryOwnerProviderInvitationRequest, RevokeOwnerProviderDisclosureGrantRequest,
    SaveOwnerWorkspaceRequest, SaveOwnerYardBriefRequest, TransitionOwnerProviderAssessmentRequest,
};
use grover_landscaping_api::project_bids::{
    CreateProjectBidLineItemRequest, ProjectBidMutationResult, ProjectBidRepository,
    ProjectBidRevisionResult, ProjectBidSendResult, ReviseProjectBidRequest, SendProjectBidRequest,
};
use grover_landscaping_api::service_mobilization::{
    CustomerServiceDayEventWriteResult, PublishCustomerServiceDayEventRequest,
    ReleaseInitialServiceRequest, ServiceMobilizationReadResult, ServiceMobilizationRepository,
    ServiceWorkReleaseWriteResult,
};
use grover_landscaping_api::PhotoUploadMetadata;
use sha2::{Digest, Sha256};
use sqlx::{postgres::PgPoolOptions, PgPool, Row};
use std::time::{Duration, SystemTime, UNIX_EPOCH};

mod common;

async fn reset_provider_invitation_test_owners(pool: &PgPool, owner_user_ids: &[&str]) {
    let activation_rows = sqlx::query(
        "SELECT customer_account_id, customer_property_id, owner_membership_id
         FROM owner_provider_relationship_activations
         WHERE owner_user_id = ANY($1)",
    )
    .bind(owner_user_ids)
    .fetch_all(pool)
    .await
    .expect("test activation projection identifiers should load");
    let released_job_ids = sqlx::query_scalar::<_, String>(
        "SELECT release.service_job_id
         FROM owner_provider_service_releases release
         JOIN owner_provider_relationship_activations activation
           ON activation.id = release.activation_id
         WHERE activation.owner_user_id = ANY($1)",
    )
    .bind(owner_user_ids)
    .fetch_all(pool)
    .await
    .expect("test service-release job identifiers should load");
    for table in [
        "customer_visit_recommendation_events",
        "customer_visit_recommendation_messages",
        "customer_visit_recommendation_decisions",
        "customer_visit_recommendation_publications",
    ] {
        let delete_query = format!(
            "DELETE FROM {table}
             WHERE customer_recommendation_reference IN (
                 SELECT recommendation.customer_recommendation_reference
                 FROM customer_visit_recommendation_series recommendation
                 JOIN owner_provider_service_releases release
                   ON release.id = recommendation.release_id
                 JOIN owner_provider_relationship_activations activation
                   ON activation.id = release.activation_id
                 WHERE activation.owner_user_id = ANY($1)
             )"
        );
        sqlx::query(&delete_query)
            .bind(owner_user_ids)
            .execute(pool)
            .await
            .expect("test customer recommendation records should reset");
    }
    sqlx::query(
        "DELETE FROM customer_visit_recommendation_series
         WHERE release_id IN (
             SELECT release.id
             FROM owner_provider_service_releases release
             JOIN owner_provider_relationship_activations activation
               ON activation.id = release.activation_id
             WHERE activation.owner_user_id = ANY($1)
         )",
    )
    .bind(owner_user_ids)
    .execute(pool)
    .await
    .expect("test customer recommendation series should reset");
    sqlx::query(
        "DELETE FROM notification_outbox
         WHERE entity_type = 'project_bid'
           AND entity_id = 'bid_customer_recommendation_fixture'",
    )
    .execute(pool)
    .await
    .expect("test recommendation delivery rows should reset");
    sqlx::query(
        "DELETE FROM day_plans
         WHERE id IN (
             SELECT stop.day_plan_id
             FROM day_plan_stops stop
             JOIN owner_provider_service_releases release
               ON release.service_job_id = stop.job_id
             JOIN owner_provider_relationship_activations activation
               ON activation.id = release.activation_id
             WHERE activation.owner_user_id = ANY($1)
         )",
    )
    .bind(owner_user_ids)
    .execute(pool)
    .await
    .expect("test recommendation day plans should reset");
    sqlx::query("DELETE FROM crews WHERE id = 'crew_customer_recommendation_fixture'")
        .execute(pool)
        .await
        .expect("test recommendation crew should reset");
    sqlx::query(
        "DELETE FROM customer_service_visit_messages
         WHERE customer_visit_reference IN (
             SELECT thread.customer_visit_reference
             FROM customer_service_visit_threads thread
             JOIN owner_provider_service_releases release
               ON release.id = thread.release_id
             JOIN owner_provider_relationship_activations activation
               ON activation.id = release.activation_id
             WHERE activation.owner_user_id = ANY($1)
         )",
    )
    .bind(owner_user_ids)
    .execute(pool)
    .await
    .expect("test customer visit messages should reset");
    sqlx::query(
        "DELETE FROM customer_service_visit_threads
         WHERE release_id IN (
             SELECT release.id
             FROM owner_provider_service_releases release
             JOIN owner_provider_relationship_activations activation
               ON activation.id = release.activation_id
             WHERE activation.owner_user_id = ANY($1)
         )",
    )
    .bind(owner_user_ids)
    .execute(pool)
    .await
    .expect("test customer visit threads should reset");
    sqlx::query(
        "DELETE FROM customer_service_day_events
         WHERE release_id IN (
             SELECT release.id
             FROM owner_provider_service_releases release
             JOIN owner_provider_relationship_activations activation
               ON activation.id = release.activation_id
             WHERE activation.owner_user_id = ANY($1)
         )",
    )
    .bind(owner_user_ids)
    .execute(pool)
    .await
    .expect("test customer service-day events should reset");
    sqlx::query(
        "DELETE FROM owner_provider_service_releases
         WHERE activation_id IN (
             SELECT id FROM owner_provider_relationship_activations
             WHERE owner_user_id = ANY($1)
         )",
    )
    .bind(owner_user_ids)
    .execute(pool)
    .await
    .expect("test service releases should reset");
    if !released_job_ids.is_empty() {
        sqlx::query("DELETE FROM service_jobs WHERE id = ANY($1)")
            .bind(&released_job_ids)
            .execute(pool)
            .await
            .expect("test released service jobs should reset");
    }
    sqlx::query(
        "DELETE FROM owner_provider_first_visit_events
         WHERE activation_id IN (
             SELECT id FROM owner_provider_relationship_activations
             WHERE owner_user_id = ANY($1)
         )",
    )
    .bind(owner_user_ids)
    .execute(pool)
    .await
    .expect("test first-visit events should reset");
    sqlx::query(
        "DELETE FROM owner_provider_first_visit_decisions
         WHERE activation_id IN (
             SELECT id FROM owner_provider_relationship_activations
             WHERE owner_user_id = ANY($1)
         )",
    )
    .bind(owner_user_ids)
    .execute(pool)
    .await
    .expect("test first-visit decisions should reset");
    sqlx::query(
        "DELETE FROM owner_provider_first_visit_proposals
         WHERE activation_id IN (
             SELECT id FROM owner_provider_relationship_activations
             WHERE owner_user_id = ANY($1)
         )",
    )
    .bind(owner_user_ids)
    .execute(pool)
    .await
    .expect("test first-visit proposals should reset");
    sqlx::query(
        "DELETE FROM owner_provider_first_visit_series
         WHERE activation_id IN (
             SELECT id FROM owner_provider_relationship_activations
             WHERE owner_user_id = ANY($1)
         )",
    )
    .bind(owner_user_ids)
    .execute(pool)
    .await
    .expect("test first-visit series should reset");
    sqlx::query(
        "DELETE FROM owner_provider_relationship_activation_events
         WHERE activation_id IN (
             SELECT id FROM owner_provider_relationship_activations
             WHERE owner_user_id = ANY($1)
         )",
    )
    .bind(owner_user_ids)
    .execute(pool)
    .await
    .expect("test activation events should reset");
    sqlx::query(
        "DELETE FROM owner_provider_active_relationships
         WHERE activation_id IN (
             SELECT id FROM owner_provider_relationship_activations
             WHERE owner_user_id = ANY($1)
         )",
    )
    .bind(owner_user_ids)
    .execute(pool)
    .await
    .expect("test active relationships should reset");
    sqlx::query(
        "DELETE FROM customer_portal_access_grants
         WHERE activation_id IN (
             SELECT id FROM owner_provider_relationship_activations
             WHERE owner_user_id = ANY($1)
         )",
    )
    .bind(owner_user_ids)
    .execute(pool)
    .await
    .expect("test portal access should reset");
    sqlx::query(
        "DELETE FROM owner_provider_relationship_activations
         WHERE owner_user_id = ANY($1)",
    )
    .bind(owner_user_ids)
    .execute(pool)
    .await
    .expect("test activations should reset");
    for row in activation_rows {
        let customer_property_id: String = row.get("customer_property_id");
        let customer_account_id: String = row.get("customer_account_id");
        let owner_membership_id: String = row.get("owner_membership_id");
        sqlx::query("DELETE FROM organization_memberships WHERE id = $1")
            .bind(owner_membership_id)
            .execute(pool)
            .await
            .expect("test activation membership should reset");
        sqlx::query("DELETE FROM customer_properties WHERE id = $1")
            .bind(customer_property_id)
            .execute(pool)
            .await
            .expect("test activation property should reset");
        sqlx::query("DELETE FROM organization_customer_accounts WHERE account_id = $1")
            .bind(&customer_account_id)
            .execute(pool)
            .await
            .expect("test activation account relation should reset");
        sqlx::query("DELETE FROM customer_accounts WHERE id = $1")
            .bind(customer_account_id)
            .execute(pool)
            .await
            .expect("test activation account should reset");
    }
    sqlx::query(
        "DELETE FROM owner_provider_initial_service_proposal_messages
         WHERE owner_user_id = ANY($1)",
    )
    .bind(owner_user_ids)
    .execute(pool)
    .await
    .expect("test proposal messages should reset");
    sqlx::query(
        "DELETE FROM owner_provider_initial_service_proposal_events
         WHERE proposal_id IN (
             SELECT id FROM owner_provider_initial_service_proposals
             WHERE owner_user_id = ANY($1)
         )",
    )
    .bind(owner_user_ids)
    .execute(pool)
    .await
    .expect("test proposal events should reset");
    sqlx::query(
        "DELETE FROM owner_provider_initial_service_proposal_acceptance_snapshots
         WHERE owner_user_id = ANY($1)",
    )
    .bind(owner_user_ids)
    .execute(pool)
    .await
    .expect("test proposal snapshots should reset");
    sqlx::query(
        "DELETE FROM owner_provider_initial_service_proposal_decisions
         WHERE owner_user_id = ANY($1)",
    )
    .bind(owner_user_ids)
    .execute(pool)
    .await
    .expect("test proposal decisions should reset");
    sqlx::query(
        "DELETE FROM owner_provider_initial_service_proposals
         WHERE owner_user_id = ANY($1)",
    )
    .bind(owner_user_ids)
    .execute(pool)
    .await
    .expect("test proposals should reset");
    sqlx::query(
        "DELETE FROM owner_provider_assessment_private_notes
         WHERE assessment_id IN (
             SELECT id FROM owner_provider_assessments
             WHERE owner_user_id = ANY($1)
         )",
    )
    .bind(owner_user_ids)
    .execute(pool)
    .await
    .expect("test assessment private notes should reset");
    sqlx::query(
        "DELETE FROM owner_provider_assessment_messages
         WHERE assessment_id IN (
             SELECT id FROM owner_provider_assessments
             WHERE owner_user_id = ANY($1)
         )",
    )
    .bind(owner_user_ids)
    .execute(pool)
    .await
    .expect("test assessment messages should reset");
    sqlx::query(
        "DELETE FROM owner_provider_assessment_events
         WHERE assessment_id IN (
             SELECT id FROM owner_provider_assessments
             WHERE owner_user_id = ANY($1)
         )",
    )
    .bind(owner_user_ids)
    .execute(pool)
    .await
    .expect("test assessment events should reset");
    sqlx::query("DELETE FROM owner_provider_assessments WHERE owner_user_id = ANY($1)")
        .bind(owner_user_ids)
        .execute(pool)
        .await
        .expect("test assessments should reset");
    sqlx::query(
        "DELETE FROM owner_provider_disclosure_grant_events
         WHERE receipt_id IN (
             SELECT id FROM owner_provider_disclosure_receipts
             WHERE owner_user_id = ANY($1)
         )",
    )
    .bind(owner_user_ids)
    .execute(pool)
    .await
    .expect("test disclosure events should reset");
    sqlx::query("DELETE FROM owner_provider_disclosure_grants WHERE owner_user_id = ANY($1)")
        .bind(owner_user_ids)
        .execute(pool)
        .await
        .expect("test disclosure grants should reset");
    sqlx::query("DELETE FROM owner_provider_disclosure_receipts WHERE owner_user_id = ANY($1)")
        .bind(owner_user_ids)
        .execute(pool)
        .await
        .expect("test disclosure receipts should reset");
    sqlx::query("DELETE FROM owner_provider_invitations WHERE owner_user_id = ANY($1)")
        .bind(owner_user_ids)
        .execute(pool)
        .await
        .expect("test provider invitations should reset");
    sqlx::query("DELETE FROM owner_workspaces WHERE owner_user_id = ANY($1)")
        .bind(owner_user_ids)
        .execute(pool)
        .await
        .expect("test owners should reset");
}

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
    let invitation_result = repository
        .create_provider_invitation(
            owner_user_id,
            property_id,
            invitation_request(recipient_email, idempotency_key),
        )
        .await;
    let OwnerProviderInvitationCreateResult::Created(invitation) = invitation_result else {
        panic!(
            "provider bootstrap test invitation for {recipient_email} should be created, got {invitation_result:?}"
        );
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
            .get_provider_disclosure_review(
                "owner-unavailable",
                "property-unavailable",
                "invitation-unavailable",
            )
            .await,
        OwnerProviderDisclosureReviewResult::Unavailable
    ));
    assert!(matches!(
        repository
            .create_provider_disclosure_grant(
                "owner-unavailable",
                "property-unavailable",
                "invitation-unavailable",
                CreateOwnerProviderDisclosureGrantRequest {
                    expected_review_version: format!("disclosure_review_v1_{}", "0".repeat(64)),
                    purpose: "yard_assessment".to_string(),
                    approved_categories: vec!["yard_brief".to_string()],
                    selected_media_ids: vec![],
                    consent_text_version: "owner-provider-assessment-consent-v1".to_string(),
                    retention_notice_version: "owner-provider-assessment-retention-v1".to_string(),
                    owner_affirmed: true,
                    idempotency_key: "disclosure-outage-001".to_string(),
                },
            )
            .await,
        OwnerProviderDisclosureGrantCreateResult::Unavailable
    ));
    assert!(matches!(
        repository
            .open_provider_disclosure(
                "recipient-unavailable",
                "provider@example.com",
                OpenOwnerProviderDisclosureRequest {
                    token: "owner_provider_0000000000000000000000000000000000000000000000000000000000000000".to_string(),
                },
            )
            .await,
        OwnerProviderDisclosureAccessResult::Unavailable
    ));
    assert!(matches!(
        repository
            .list_provider_disclosure_receipts("owner-unavailable", "property-unavailable")
            .await,
        OwnerReadResult::Unavailable
    ));
    assert!(matches!(
        repository
            .revoke_provider_disclosure_grant(
                "owner-unavailable",
                "property-unavailable",
                "grant-unavailable",
                RevokeOwnerProviderDisclosureGrantRequest {
                    expected_version: 1,
                    reason_code: "owner_choice".to_string(),
                    owner_confirmed: true,
                    idempotency_key: "revoke-disclosure-outage-001".to_string(),
                },
            )
            .await,
        OwnerProviderDisclosureGrantRevokeResult::Unavailable
    ));
    assert!(matches!(
        repository
            .create_provider_assessment(
                "recipient-unavailable",
                "provider@example.com",
                CreateOwnerProviderAssessmentRequest {
                    token: "owner_provider_0000000000000000000000000000000000000000000000000000000000000000".to_string(),
                    disclosure_grant_id: "owner_disclosure_grant_unavailable".to_string(),
                    assessment_method: "remote".to_string(),
                    proposed_window_start_epoch_seconds: None,
                    proposed_window_end_epoch_seconds: None,
                    time_zone: None,
                    idempotency_key: "assessment-outage-001".to_string(),
                },
            )
            .await,
        OwnerProviderAssessmentCreateResult::Unavailable
    ));
    assert!(matches!(
        repository
            .list_owner_provider_assessments("owner-unavailable", "property-unavailable")
            .await,
        OwnerReadResult::Unavailable
    ));
    assert!(matches!(
        repository
            .decide_provider_assessment_window(
                "owner-unavailable",
                "property-unavailable",
                "assessment-unavailable",
                DecideOwnerProviderAssessmentWindowRequest {
                    action: "confirm".to_string(),
                    expected_version: 1,
                    idempotency_key: "assessment-window-outage-001".to_string(),
                },
            )
            .await,
        OwnerProviderAssessmentWindowDecisionResult::Unavailable
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
            .list_owner_initial_service_proposals("owner-unavailable", "property-unavailable")
            .await,
        OwnerReadResult::Unavailable
    ));
    assert!(matches!(
        repository
            .decide_initial_service_proposal(
                "owner-unavailable",
                "property-unavailable",
                "proposal-unavailable",
                DecideOwnerProviderInitialServiceProposalRequest {
                    action: "accept".to_string(),
                    expected_proposal_version: 1,
                    reason_code: None,
                    customer_safe_note: None,
                    affirmation_text_version: Some(
                        "initial_service_proposal_acceptance_v1".to_string(),
                    ),
                    idempotency_key: "proposal-outage-decision-001".to_string(),
                },
            )
            .await,
        OwnerProviderInitialServiceProposalDecisionResult::Unavailable
    ));
    assert!(matches!(
        repository
            .activate_owner_provider_relationship(
                "owner-unavailable",
                "property-unavailable",
                "proposal-unavailable",
                ActivateOwnerProviderRelationshipRequest {
                    expected_proposal_version: 1,
                    activation_affirmation_text_version:
                        "owner_provider_relationship_activation_v1".to_string(),
                    owner_confirmed: true,
                    idempotency_key: "activation-outage-001".to_string(),
                },
            )
            .await,
        OwnerProviderRelationshipActivationResult::Unavailable
    ));
    assert!(matches!(
        repository
            .get_owner_provider_relationship_activation(
                "owner-unavailable",
                "property-unavailable",
                "proposal-unavailable",
            )
            .await,
        OwnerReadResult::Unavailable
    ));
    assert!(matches!(
        repository
            .get_owner_provider_first_visit(
                "owner-unavailable",
                "property-unavailable",
                "activation-unavailable",
            )
            .await,
        OwnerProviderFirstVisitReadResult::Unavailable
    ));
    assert!(matches!(
        repository
            .propose_provider_first_visit(
                "provider-unavailable",
                "provider@example.com",
                "activation-unavailable",
                ProposeProviderFirstVisitRequest {
                    token: "owner_provider_0000000000000000000000000000000000000000000000000000000000000000".to_string(),
                    expected_series_version: 0,
                    window_start_epoch_seconds: 1_800_000_000,
                    window_end_epoch_seconds: 1_800_007_200,
                    time_zone: "America/Phoenix".to_string(),
                    customer_safe_arrival_note: None,
                    idempotency_key: "first-visit-outage-001".to_string(),
                },
            )
            .await,
        OwnerProviderFirstVisitWriteResult::Unavailable
    ));
    assert!(matches!(
        repository
            .decide_owner_provider_first_visit(
                "owner-unavailable",
                "property-unavailable",
                "activation-unavailable",
                DecideOwnerProviderFirstVisitRequest {
                    expected_window_version: 1,
                    action: "confirm".to_string(),
                    customer_safe_note: None,
                    confirmation_affirmation_text_version: Some(
                        "owner_provider_first_visit_confirmation_v1".to_string(),
                    ),
                    idempotency_key: "first-visit-decision-outage-001".to_string(),
                },
            )
            .await,
        OwnerProviderFirstVisitWriteResult::Unavailable
    ));
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
    reset_provider_invitation_test_owners(&pool, &[owner_a, owner_b]).await;
    sqlx::query(
        "DELETE FROM organizations
         WHERE id = ANY($1)
            OR LOWER(BTRIM(display_name)) IN (
                'cactus bloom groundskeeping', 'concurrent mesa care'
            )",
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
    sqlx::query(
        "DELETE FROM owner_provider_invitation_abuse_reports
         WHERE reporter_user_id = ANY($1)",
    )
    .bind(vec![abuse_reporter, "recipient-user-1"])
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
    let OwnerMutationResult::Saved(disclosure_photo_upload) = repository
        .create_intake_media_upload(
            owner_a,
            &property.property_id,
            CreateOwnerIntakeMediaRequest {
                file_name: "front-yard.jpg".to_string(),
                content_type: "image/jpeg".to_string(),
                shot_type: "front_yard".to_string(),
                replaces_media_id: None,
            },
        )
        .await
    else {
        panic!("disclosure test photo upload should be created");
    };
    let disclosure_media_id = disclosure_photo_upload.media.media_id.clone();
    assert!(matches!(
        repository
            .complete_intake_media_upload(
                owner_a,
                &property.property_id,
                &disclosure_media_id,
                PhotoUploadMetadata {
                    file_size_bytes: Some(2048),
                    image_width_px: Some(1200),
                    image_height_px: Some(800),
                    metadata_source: Some("client_reported".to_string()),
                },
            )
            .await,
        OwnerMutationResult::Saved(media) if media.status == "ready"
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
    assert!(!capability_json.contains("\"owner_user_id\""));
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

    assert!(matches!(
        repository
            .get_provider_disclosure_review(
                owner_b,
                &property.property_id,
                &retry.invitation.invitation_id,
            )
            .await,
        OwnerProviderDisclosureReviewResult::NotFound
    ));
    let OwnerProviderDisclosureReviewResult::Loaded(disclosure_review) = repository
        .get_provider_disclosure_review(
            owner_a,
            &property.property_id,
            &retry.invitation.invitation_id,
        )
        .await
    else {
        panic!("interested provider should have an owner disclosure review");
    };
    assert!(disclosure_review.can_approve);
    assert_eq!(
        disclosure_review.provider_organization_name,
        "Recipient Owned Yard Care"
    );
    assert_eq!(
        disclosure_review.exact_address,
        "421 Private Canyon Road, Phoenix, AZ 85004"
    );
    assert_eq!(
        disclosure_review.access_considerations,
        "Use the east gate; the code is 0199."
    );
    assert_eq!(disclosure_review.media_options.len(), 1);
    assert_eq!(
        disclosure_review.media_options[0].media_id,
        disclosure_media_id
    );
    assert_eq!(disclosure_review.available_categories.len(), 5);
    assert!(disclosure_review
        .authority_boundary
        .contains("does not accept pricing"));
    let grant_request = CreateOwnerProviderDisclosureGrantRequest {
        expected_review_version: disclosure_review.review_version.clone(),
        purpose: "yard_assessment".to_string(),
        approved_categories: vec![
            "yard_brief".to_string(),
            "selected_yard_photos".to_string(),
            "exact_address".to_string(),
        ],
        selected_media_ids: vec![disclosure_media_id.clone()],
        consent_text_version: disclosure_review.consent_text_version.clone(),
        retention_notice_version: disclosure_review.retention_notice_version.clone(),
        owner_affirmed: true,
        idempotency_key: "provider-disclosure-grant-001".to_string(),
    };
    let stale_review_result = repository
        .create_provider_disclosure_grant(
            owner_a,
            &property.property_id,
            &retry.invitation.invitation_id,
            CreateOwnerProviderDisclosureGrantRequest {
                expected_review_version: format!("disclosure_review_v1_{}", "0".repeat(64)),
                idempotency_key: "provider-disclosure-stale-review-001".to_string(),
                ..grant_request.clone()
            },
        )
        .await;
    assert!(
        matches!(
            stale_review_result,
            OwnerProviderDisclosureGrantCreateResult::Conflict
        ),
        "stale disclosure review should conflict, got {stale_review_result:?}"
    );
    let pre_grant_receipt_count = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM owner_provider_disclosure_receipts WHERE invitation_id = $1",
    )
    .bind(&retry.invitation.invitation_id)
    .fetch_one(&pool)
    .await
    .expect("stale disclosure receipt count should load");
    assert_eq!(pre_grant_receipt_count, 0);

    let (first_grant_result, second_grant_result) = tokio::join!(
        repository.create_provider_disclosure_grant(
            owner_a,
            &property.property_id,
            &retry.invitation.invitation_id,
            grant_request.clone(),
        ),
        repository.create_provider_disclosure_grant(
            owner_a,
            &property.property_id,
            &retry.invitation.invitation_id,
            grant_request.clone(),
        ),
    );
    let disclosure_grant = match (first_grant_result, second_grant_result) {
        (
            OwnerProviderDisclosureGrantCreateResult::Created(created),
            OwnerProviderDisclosureGrantCreateResult::Replayed(replayed),
        )
        | (
            OwnerProviderDisclosureGrantCreateResult::Replayed(replayed),
            OwnerProviderDisclosureGrantCreateResult::Created(created),
        ) => {
            assert_eq!(replayed.grant_id, created.grant_id);
            created
        }
        (first, second) => panic!(
            "concurrent exact disclosure approvals should create once and replay once, got {first:?} and {second:?}"
        ),
    };
    assert_eq!(disclosure_grant.status, "active");
    assert_eq!(
        disclosure_grant.approved_categories,
        ["exact_address", "selected_yard_photos", "yard_brief"]
    );
    assert_eq!(
        disclosure_grant.withheld_categories,
        ["owner_contact", "access_considerations"]
    );
    assert_eq!(
        disclosure_grant.selected_media_ids,
        [disclosure_media_id.clone()]
    );
    assert!(matches!(
        repository
            .create_provider_disclosure_grant(
                owner_a,
                &property.property_id,
                &retry.invitation.invitation_id,
                grant_request.clone(),
            )
            .await,
        OwnerProviderDisclosureGrantCreateResult::Replayed(replayed)
            if replayed.grant_id == disclosure_grant.grant_id
    ));
    assert!(matches!(
        repository
            .create_provider_disclosure_grant(
                owner_a,
                &property.property_id,
                &retry.invitation.invitation_id,
                CreateOwnerProviderDisclosureGrantRequest {
                    approved_categories: vec!["owner_contact".to_string()],
                    selected_media_ids: Vec::new(),
                    ..grant_request.clone()
                },
            )
            .await,
        OwnerProviderDisclosureGrantCreateResult::Conflict
    ));
    assert!(matches!(
        repository
            .get_provider_disclosure_review(
                owner_a,
                &property.property_id,
                &retry.invitation.invitation_id,
            )
            .await,
        OwnerProviderDisclosureReviewResult::InvalidState
    ));
    let receipt_count = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM owner_provider_disclosure_receipts WHERE invitation_id = $1",
    )
    .bind(&retry.invitation.invitation_id)
    .fetch_one(&pool)
    .await
    .expect("disclosure receipt count should load");
    assert_eq!(receipt_count, 1);
    let disclosure_audit = sqlx::query_scalar::<_, serde_json::Value>(
        "SELECT event_data FROM owner_acquisition_events
         WHERE event_kind = 'provider_disclosure_grant_created'
           AND event_data->>'grant_id' = $1",
    )
    .bind(&disclosure_grant.grant_id)
    .fetch_one(&pool)
    .await
    .expect("minimized disclosure audit should load")
    .to_string();
    assert!(!disclosure_audit.contains("421 Private Canyon Road"));
    assert!(!disclosure_audit.contains("0199"));
    assert!(!disclosure_audit.contains(recipient));
    assert!(matches!(
        repository
            .open_provider_disclosure(
                "another-provider-user",
                recipient,
                OpenOwnerProviderDisclosureRequest {
                    token: retry.delivery_token().to_string(),
                },
            )
            .await,
        OwnerProviderDisclosureAccessResult::NotFound
    ));
    assert!(matches!(
        repository
            .open_provider_disclosure(
                "recipient-user-1",
                "another@sonoranyard.example",
                OpenOwnerProviderDisclosureRequest {
                    token: retry.delivery_token().to_string(),
                },
            )
            .await,
        OwnerProviderDisclosureAccessResult::NotFound
    ));
    let OwnerProviderDisclosureAccessResult::Loaded(provider_disclosure) = repository
        .open_provider_disclosure(
            "recipient-user-1",
            recipient,
            OpenOwnerProviderDisclosureRequest {
                token: retry.delivery_token().to_string(),
            },
        )
        .await
    else {
        panic!("authorized provider should load only owner-approved assessment details");
    };
    assert!(provider_disclosure.can_access);
    assert_eq!(provider_disclosure.status, "active");
    assert_eq!(
        provider_disclosure.exact_address.as_deref(),
        Some("421 Private Canyon Road, Phoenix, AZ 85004")
    );
    assert!(provider_disclosure.yard_brief.is_some());
    assert!(provider_disclosure.owner_contact.is_none());
    assert!(provider_disclosure.access_considerations.is_none());
    let provider_photos = provider_disclosure
        .selected_yard_photos
        .as_ref()
        .expect("selected photos should be included");
    assert_eq!(provider_photos.len(), 1);
    assert_eq!(provider_photos[0].media_id, disclosure_media_id);
    assert_eq!(provider_photos[0].file_label, "front-yard.jpg");
    assert!(
        provider_photos[0].authorization_expires_at_epoch_seconds
            <= provider_disclosure
                .expires_at_epoch_seconds
                .expect("grant expiry")
    );
    let provider_disclosure_json =
        serde_json::to_string(&provider_disclosure).expect("provider disclosure should serialize");
    assert!(!provider_disclosure_json.contains("owner-a@example.com"));
    assert!(!provider_disclosure_json.contains("0199"));
    assert!(!provider_disclosure_json.contains("selected_yard_photos\":null"));
    assert!(!provider_disclosure_json.contains("owner_contact\":null"));
    let OwnerProviderProgressResult::Loaded(access_progress) = repository
        .provider_invitation_progress(
            "recipient-user-1",
            recipient,
            OpenOwnerProviderInboxRequest {
                token: retry.delivery_token().to_string(),
            },
        )
        .await
    else {
        panic!("provider progress should expose owner-approved access readiness");
    };
    assert_eq!(access_progress.progress_stage, "assessment_access_ready");
    assert_eq!(access_progress.next_action, "review_owner_approved_details");
    let OwnerReadResult::Loaded(owner_access_progress) = repository
        .list_provider_connection_progress(owner_a, &property.property_id)
        .await
    else {
        panic!("owner progress should show approved assessment access");
    };
    let approved_progress = owner_access_progress
        .iter()
        .find(|entry| entry.invitation_id == retry.invitation.invitation_id)
        .expect("approved invitation should remain in owner progress");
    assert_eq!(
        approved_progress.progress_stage,
        "assessment_access_approved"
    );
    assert!(!approved_progress.owner_action_required);
    assert_eq!(approved_progress.next_action, "wait_for_assessment");

    let assessment_request = CreateOwnerProviderAssessmentRequest {
        token: retry.delivery_token().to_string(),
        disclosure_grant_id: disclosure_grant.grant_id.clone(),
        assessment_method: "on_site".to_string(),
        proposed_window_start_epoch_seconds: Some(1_800_000_000),
        proposed_window_end_epoch_seconds: Some(1_800_003_600),
        time_zone: Some("America/Phoenix".to_string()),
        idempotency_key: "provider-assessment-001".to_string(),
    };
    assert!(matches!(
        repository
            .create_provider_assessment(
                "another-provider-user",
                recipient,
                assessment_request.clone(),
            )
            .await,
        OwnerProviderAssessmentCreateResult::NotFound
    ));
    assert!(matches!(
        repository
            .create_provider_assessment(
                "recipient-user-1",
                recipient,
                CreateOwnerProviderAssessmentRequest {
                    disclosure_grant_id: "owner_disclosure_grant_wrong".to_string(),
                    idempotency_key: "provider-assessment-wrong-grant".to_string(),
                    ..assessment_request.clone()
                },
            )
            .await,
        OwnerProviderAssessmentCreateResult::InvalidState
    ));
    let (first_assessment_result, second_assessment_result) = tokio::join!(
        repository.create_provider_assessment(
            "recipient-user-1",
            recipient,
            assessment_request.clone(),
        ),
        repository.create_provider_assessment(
            "recipient-user-1",
            recipient,
            assessment_request.clone(),
        ),
    );
    let assessment = match (first_assessment_result, second_assessment_result) {
        (
            OwnerProviderAssessmentCreateResult::Created(created),
            OwnerProviderAssessmentCreateResult::Replayed(replayed),
        )
        | (
            OwnerProviderAssessmentCreateResult::Replayed(replayed),
            OwnerProviderAssessmentCreateResult::Created(created),
        ) => {
            assert_eq!(created.assessment_id, replayed.assessment_id);
            created
        }
        (first, second) => panic!(
            "concurrent exact assessment starts should create once and replay once, got {first:?} and {second:?}"
        ),
    };
    assert_eq!(assessment.status, "window_proposed");
    assert_eq!(assessment.assessment_method, "on_site");
    assert_eq!(assessment.time_zone.as_deref(), Some("America/Phoenix"));
    assert!(matches!(
        repository
            .create_provider_assessment(
                "recipient-user-1",
                recipient,
                assessment_request.clone(),
            )
            .await,
        OwnerProviderAssessmentCreateResult::Replayed(replayed)
            if replayed.assessment_id == assessment.assessment_id
    ));
    assert!(matches!(
        repository
            .create_provider_assessment(
                "recipient-user-1",
                recipient,
                CreateOwnerProviderAssessmentRequest {
                    token: "owner_provider_0000000000000000000000000000000000000000000000000000000000000000".to_string(),
                    ..assessment_request.clone()
                },
            )
            .await,
        OwnerProviderAssessmentCreateResult::NotFound
    ));
    assert!(matches!(
        repository
            .create_provider_assessment(
                "recipient-user-1",
                recipient,
                CreateOwnerProviderAssessmentRequest {
                    assessment_method: "remote".to_string(),
                    proposed_window_start_epoch_seconds: None,
                    proposed_window_end_epoch_seconds: None,
                    time_zone: None,
                    ..assessment_request.clone()
                },
            )
            .await,
        OwnerProviderAssessmentCreateResult::Conflict
    ));
    assert!(matches!(
        repository
            .create_provider_assessment(
                "recipient-user-1",
                recipient,
                CreateOwnerProviderAssessmentRequest {
                    idempotency_key: "provider-assessment-second".to_string(),
                    ..assessment_request.clone()
                },
            )
            .await,
        OwnerProviderAssessmentCreateResult::Conflict
    ));
    assert!(matches!(
        repository
            .list_owner_provider_assessments(owner_b, &property.property_id)
            .await,
        OwnerReadResult::NotFound
    ));
    let OwnerReadResult::Loaded(owner_assessments) = repository
        .list_owner_provider_assessments(owner_a, &property.property_id)
        .await
    else {
        panic!("owner assessment history should load");
    };
    assert_eq!(
        owner_assessments.as_slice(),
        std::slice::from_ref(&assessment)
    );
    let assessment_audit = sqlx::query_scalar::<_, serde_json::Value>(
        "SELECT event_data FROM owner_acquisition_events
         WHERE event_kind = 'provider_assessment_started'
           AND event_data->>'assessment_id' = $1",
    )
    .bind(&assessment.assessment_id)
    .fetch_one(&pool)
    .await
    .expect("minimized assessment audit should load")
    .to_string();
    assert!(assessment_audit.contains("on_site"));
    assert!(!assessment_audit.contains(recipient));
    assert!(!assessment_audit.contains("421 Private Canyon Road"));
    assert!(!assessment_audit.contains("America/Phoenix"));

    let owner_message_request = CreateOwnerAssessmentMessageRequest {
        message_kind: "owner_question".to_string(),
        customer_safe_body: "Can the assessment include the irrigation controller?".to_string(),
        expected_assessment_version: assessment.version,
        idempotency_key: "assessment-message-owner-001".to_string(),
    };
    assert!(matches!(
        repository
            .create_owner_assessment_message(
                owner_b,
                &property.property_id,
                &assessment.assessment_id,
                owner_message_request.clone(),
            )
            .await,
        OwnerProviderAssessmentCommunicationWriteResult::NotFound
    ));
    let OwnerProviderAssessmentCommunicationWriteResult::Created(owner_message) = repository
        .create_owner_assessment_message(
            owner_a,
            &property.property_id,
            &assessment.assessment_id,
            owner_message_request.clone(),
        )
        .await
    else {
        panic!("owner customer-safe assessment message should save");
    };
    assert!(matches!(
        repository
            .create_owner_assessment_message(
                owner_a,
                &property.property_id,
                &assessment.assessment_id,
                owner_message_request.clone(),
            )
            .await,
        OwnerProviderAssessmentCommunicationWriteResult::Replayed(replayed)
            if replayed == owner_message
    ));
    assert!(matches!(
        repository
            .create_owner_assessment_message(
                owner_a,
                &property.property_id,
                &assessment.assessment_id,
                CreateOwnerAssessmentMessageRequest {
                    customer_safe_body: "Changed body must conflict.".to_string(),
                    ..owner_message_request
                },
            )
            .await,
        OwnerProviderAssessmentCommunicationWriteResult::Conflict
    ));
    let provider_message_request = CreateProviderAssessmentMessageRequest {
        token: retry.delivery_token().to_string(),
        message_kind: "provider_answer".to_string(),
        customer_safe_body: "Yes, the irrigation controller is included in the assessment."
            .to_string(),
        expected_assessment_version: assessment.version,
        idempotency_key: "assessment-message-provider-001".to_string(),
    };
    assert!(matches!(
        repository
            .create_provider_assessment_message(
                "another-provider-user",
                recipient,
                &assessment.assessment_id,
                provider_message_request.clone(),
            )
            .await,
        OwnerProviderAssessmentCommunicationWriteResult::NotFound
    ));
    let OwnerProviderAssessmentCommunicationWriteResult::Created(provider_message) = repository
        .create_provider_assessment_message(
            "recipient-user-1",
            recipient,
            &assessment.assessment_id,
            provider_message_request.clone(),
        )
        .await
    else {
        panic!("provider customer-safe assessment message should save");
    };
    assert_eq!(provider_message.author_role, "provider");
    let private_note_request = CreateProviderAssessmentPrivateNoteRequest {
        token: retry.delivery_token().to_string(),
        note_kind: "production_assumption".to_string(),
        private_body: "crew_hours=6; disposal_loads=2; route_margin=private".to_string(),
        expected_assessment_version: assessment.version,
        idempotency_key: "assessment-private-note-provider-001".to_string(),
    };
    let OwnerProviderAssessmentCommunicationWriteResult::Created(private_note) = repository
        .create_provider_assessment_private_note(
            "recipient-user-1",
            recipient,
            &assessment.assessment_id,
            private_note_request.clone(),
        )
        .await
    else {
        panic!("provider-private assessment note should save separately");
    };
    assert!(matches!(
        repository
            .create_provider_assessment_private_note(
                "recipient-user-1",
                recipient,
                &assessment.assessment_id,
                private_note_request,
            )
            .await,
        OwnerProviderAssessmentCommunicationWriteResult::Replayed(replayed)
            if replayed == private_note
    ));
    assert!(
        sqlx::query(
            "INSERT INTO owner_provider_assessment_messages (
                 id, assessment_id, author_user_id, author_role, message_kind,
                 customer_safe_body, assessment_version_snapshot, idempotency_key
             ) VALUES ($1, $2, $3, 'provider', 'owner_question', $4, $5, $6)",
        )
        .bind("owner_assessment_message_invalid_role")
        .bind(&assessment.assessment_id)
        .bind("recipient-user-1")
        .bind("This invalid authorship must be rejected.")
        .bind(assessment.version)
        .bind("assessment-message-invalid-role-001")
        .execute(&pool)
        .await
        .is_err(),
        "provider-authored owner questions must fail the shared-message constraint"
    );
    assert!(
        sqlx::query(
            "INSERT INTO owner_provider_assessment_private_notes (
                 id, assessment_id, organization_id, author_user_id, note_kind,
                 private_body, visibility, assessment_version_snapshot, idempotency_key
             ) VALUES ($1, $2, $3, $4, 'route_fit', $5, 'owner_provider', $6, $7)",
        )
        .bind("owner_assessment_private_note_invalid_visibility")
        .bind(&assessment.assessment_id)
        .bind(&assessment.organization_id)
        .bind("recipient-user-1")
        .bind("This private note must not enter shared visibility.")
        .bind(assessment.version)
        .bind("assessment-private-note-invalid-visibility-001")
        .execute(&pool)
        .await
        .is_err(),
        "provider-private notes must reject owner-visible storage"
    );
    let owner_message_projection = sqlx::query_scalar::<_, serde_json::Value>(
        "SELECT COALESCE(JSONB_AGG(TO_JSONB(message)), '[]'::JSONB)
         FROM owner_provider_assessment_owner_messages message
         WHERE assessment_id = $1",
    )
    .bind(&assessment.assessment_id)
    .fetch_one(&pool)
    .await
    .expect("owner assessment message projection should load")
    .to_string();
    assert!(owner_message_projection.contains("irrigation controller"));
    assert!(!owner_message_projection.contains("crew_hours"));
    assert!(!owner_message_projection.contains("route_margin"));
    assert!(matches!(
        repository
            .list_owner_assessment_messages(
                owner_b,
                &property.property_id,
                &assessment.assessment_id,
            )
            .await,
        OwnerReadResult::NotFound
    ));
    let OwnerReadResult::Loaded(owner_messages) = repository
        .list_owner_assessment_messages(owner_a, &property.property_id, &assessment.assessment_id)
        .await
    else {
        panic!("owner-safe assessment messages should load");
    };
    assert_eq!(
        owner_messages,
        vec![owner_message.clone(), provider_message.clone()],
    );
    let owner_messages_json =
        serde_json::to_string(&owner_messages).expect("owner messages should serialize");
    assert!(!owner_messages_json.contains("crew_hours"));
    assert!(!owner_messages_json.contains("route_margin"));
    assert_eq!(
        sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM owner_provider_assessment_private_notes
             WHERE assessment_id = $1 AND visibility = 'provider_private'",
        )
        .bind(&assessment.assessment_id)
        .fetch_one(&pool)
        .await
        .expect("private assessment note count should load"),
        1
    );
    let communication_audit = sqlx::query_scalar::<_, serde_json::Value>(
        "SELECT JSONB_AGG(event_data ORDER BY created_at, id)
         FROM owner_provider_assessment_events
         WHERE assessment_id = $1
           AND event_kind IN ('customer_message_added', 'private_note_added')",
    )
    .bind(&assessment.assessment_id)
    .fetch_one(&pool)
    .await
    .expect("minimized assessment communication audit should load")
    .to_string();
    assert!(!communication_audit.contains("irrigation controller"));
    assert!(!communication_audit.contains("crew_hours"));

    let OwnerProviderDisclosureAccessResult::Loaded(provider_workspace) = repository
        .open_provider_disclosure(
            "recipient-user-1",
            recipient,
            OpenOwnerProviderDisclosureRequest {
                token: retry.delivery_token().to_string(),
            },
        )
        .await
    else {
        panic!("active provider disclosure should reload the assessment workspace");
    };
    assert_eq!(
        provider_workspace.grant_id.as_deref(),
        Some(disclosure_grant.grant_id.as_str()),
    );
    assert_eq!(provider_workspace.assessment.as_ref(), Some(&assessment));
    assert_eq!(
        provider_workspace.customer_safe_messages.as_deref(),
        Some([owner_message.clone(), provider_message.clone()].as_slice()),
    );
    assert_eq!(
        provider_workspace.private_notes.as_deref(),
        Some([private_note.clone()].as_slice()),
    );
    let provider_workspace_json = serde_json::to_string(&provider_workspace)
        .expect("provider assessment workspace should serialize");
    assert!(provider_workspace_json.contains("crew_hours"));
    assert!(provider_workspace_json.contains("irrigation controller"));

    let OwnerProviderAssessmentWindowDecisionResult::Updated(change_requested_assessment) =
        repository
            .decide_provider_assessment_window(
                owner_a,
                &property.property_id,
                &assessment.assessment_id,
                DecideOwnerProviderAssessmentWindowRequest {
                    action: "request_change".to_string(),
                    expected_version: assessment.version,
                    idempotency_key: "assessment-window-change-001".to_string(),
                },
            )
            .await
    else {
        panic!("owner should be able to request another assessment window");
    };
    let replacement_request = ProposeProviderAssessmentWindowRequest {
        token: retry.delivery_token().to_string(),
        proposed_window_start_epoch_seconds: 1_800_086_400,
        proposed_window_end_epoch_seconds: 1_800_090_000,
        time_zone: "America/Phoenix".to_string(),
        expected_version: change_requested_assessment.version,
        idempotency_key: "assessment-window-replacement-001".to_string(),
    };
    assert!(matches!(
        repository
            .propose_provider_assessment_window(
                "another-provider-user",
                recipient,
                &assessment.assessment_id,
                replacement_request.clone(),
            )
            .await,
        ProviderAssessmentWindowProposalResult::NotFound
    ));
    let (first_replacement, second_replacement) = tokio::join!(
        repository.propose_provider_assessment_window(
            "recipient-user-1",
            recipient,
            &assessment.assessment_id,
            replacement_request.clone(),
        ),
        repository.propose_provider_assessment_window(
            "recipient-user-1",
            recipient,
            &assessment.assessment_id,
            replacement_request.clone(),
        ),
    );
    let replacement_assessment = match (first_replacement, second_replacement) {
        (
            ProviderAssessmentWindowProposalResult::Updated(updated),
            ProviderAssessmentWindowProposalResult::Replayed(replayed),
        )
        | (
            ProviderAssessmentWindowProposalResult::Replayed(replayed),
            ProviderAssessmentWindowProposalResult::Updated(updated),
        ) => {
            assert_eq!(updated, replayed);
            updated
        }
        (first, second) => panic!(
            "concurrent exact replacement windows should update once and replay once, got {first:?} and {second:?}"
        ),
    };
    assert_eq!(replacement_assessment.status, "window_proposed");
    assert_eq!(
        replacement_assessment.proposed_window_start_epoch_seconds,
        Some(1_800_086_400),
    );
    assert!(matches!(
        repository
            .propose_provider_assessment_window(
                "recipient-user-1",
                recipient,
                &assessment.assessment_id,
                ProposeProviderAssessmentWindowRequest {
                    proposed_window_end_epoch_seconds: 1_800_093_600,
                    ..replacement_request.clone()
                },
            )
            .await,
        ProviderAssessmentWindowProposalResult::Conflict
    ));

    let window_decision = DecideOwnerProviderAssessmentWindowRequest {
        action: "confirm".to_string(),
        expected_version: replacement_assessment.version,
        idempotency_key: "assessment-window-confirm-001".to_string(),
    };
    assert!(matches!(
        repository
            .decide_provider_assessment_window(
                owner_b,
                &property.property_id,
                &assessment.assessment_id,
                window_decision.clone(),
            )
            .await,
        OwnerProviderAssessmentWindowDecisionResult::NotFound
    ));
    let (first_window_result, second_window_result) = tokio::join!(
        repository.decide_provider_assessment_window(
            owner_a,
            &property.property_id,
            &assessment.assessment_id,
            window_decision.clone(),
        ),
        repository.decide_provider_assessment_window(
            owner_a,
            &property.property_id,
            &assessment.assessment_id,
            window_decision.clone(),
        ),
    );
    let confirmed_assessment = match (first_window_result, second_window_result) {
        (
            OwnerProviderAssessmentWindowDecisionResult::Updated(updated),
            OwnerProviderAssessmentWindowDecisionResult::Replayed(replayed),
        )
        | (
            OwnerProviderAssessmentWindowDecisionResult::Replayed(replayed),
            OwnerProviderAssessmentWindowDecisionResult::Updated(updated),
        ) => {
            assert_eq!(updated, replayed);
            updated
        }
        (first, second) => panic!(
            "concurrent exact owner window decisions should update once and replay once, got {first:?} and {second:?}"
        ),
    };
    assert_eq!(confirmed_assessment.status, "owner_confirmed");
    assert_eq!(
        confirmed_assessment.version,
        replacement_assessment.version + 1
    );
    assert!(matches!(
        repository
            .decide_provider_assessment_window(
                owner_a,
                &property.property_id,
                &assessment.assessment_id,
                window_decision.clone(),
            )
            .await,
        OwnerProviderAssessmentWindowDecisionResult::Replayed(replayed)
            if replayed == confirmed_assessment
    ));
    assert!(matches!(
        repository
            .decide_provider_assessment_window(
                owner_a,
                &property.property_id,
                &assessment.assessment_id,
                DecideOwnerProviderAssessmentWindowRequest {
                    action: "request_change".to_string(),
                    ..window_decision.clone()
                },
            )
            .await,
        OwnerProviderAssessmentWindowDecisionResult::Conflict
    ));
    assert!(matches!(
        repository
            .decide_provider_assessment_window(
                owner_a,
                &property.property_id,
                &assessment.assessment_id,
                DecideOwnerProviderAssessmentWindowRequest {
                    idempotency_key: "assessment-window-stale-001".to_string(),
                    ..window_decision
                },
            )
            .await,
        OwnerProviderAssessmentWindowDecisionResult::InvalidState(current)
            if current == confirmed_assessment
    ));

    let begin_request = TransitionOwnerProviderAssessmentRequest {
        token: retry.delivery_token().to_string(),
        action: "begin".to_string(),
        expected_version: confirmed_assessment.version,
        reason_code: None,
        owner_visible_summary: None,
        idempotency_key: "assessment-begin-provider-001".to_string(),
    };
    assert!(matches!(
        repository
            .transition_provider_assessment(
                "another-provider-user",
                recipient,
                &assessment.assessment_id,
                begin_request.clone(),
            )
            .await,
        OwnerProviderAssessmentTransitionResult::NotFound
    ));
    let (first_begin_result, second_begin_result) = tokio::join!(
        repository.transition_provider_assessment(
            "recipient-user-1",
            recipient,
            &assessment.assessment_id,
            begin_request.clone(),
        ),
        repository.transition_provider_assessment(
            "recipient-user-1",
            recipient,
            &assessment.assessment_id,
            begin_request.clone(),
        ),
    );
    let in_progress_assessment = match (first_begin_result, second_begin_result) {
        (
            OwnerProviderAssessmentTransitionResult::Updated(updated),
            OwnerProviderAssessmentTransitionResult::Replayed(replayed),
        )
        | (
            OwnerProviderAssessmentTransitionResult::Replayed(replayed),
            OwnerProviderAssessmentTransitionResult::Updated(updated),
        ) => {
            assert_eq!(updated, replayed);
            updated
        }
        (first, second) => panic!(
            "concurrent exact provider assessment begins should update once and replay once, got {first:?} and {second:?}"
        ),
    };
    assert_eq!(in_progress_assessment.status, "in_progress");
    assert_eq!(
        in_progress_assessment.version,
        confirmed_assessment.version + 1
    );
    assert!(matches!(
        repository
            .transition_provider_assessment(
                "recipient-user-1",
                recipient,
                &assessment.assessment_id,
                TransitionOwnerProviderAssessmentRequest {
                    action: "cancel".to_string(),
                    reason_code: Some("provider_unavailable".to_string()),
                    owner_visible_summary: Some(
                        "The provider is no longer available for this assessment.".to_string(),
                    ),
                    ..begin_request.clone()
                },
            )
            .await,
        OwnerProviderAssessmentTransitionResult::Conflict
    ));
    let completion_request = TransitionOwnerProviderAssessmentRequest {
        token: retry.delivery_token().to_string(),
        action: "complete".to_string(),
        expected_version: in_progress_assessment.version,
        reason_code: None,
        owner_visible_summary: Some(
            "The on-site yard assessment is complete and ready for proposal review.".to_string(),
        ),
        idempotency_key: "assessment-complete-provider-001".to_string(),
    };
    let OwnerProviderAssessmentTransitionResult::Updated(completed_assessment) = repository
        .transition_provider_assessment(
            "recipient-user-1",
            recipient,
            &assessment.assessment_id,
            completion_request.clone(),
        )
        .await
    else {
        panic!("provider should complete an in-progress assessment");
    };
    assert_eq!(completed_assessment.status, "completed");
    assert_eq!(
        completed_assessment.owner_visible_summary,
        completion_request.owner_visible_summary
    );
    assert!(completed_assessment.outcome_reason_code.is_none());
    assert!(matches!(
        repository
            .transition_provider_assessment(
                "recipient-user-1",
                recipient,
                &assessment.assessment_id,
                completion_request.clone(),
            )
            .await,
        OwnerProviderAssessmentTransitionResult::Replayed(replayed)
            if replayed == completed_assessment
    ));
    let OwnerProviderAssessmentTransitionResult::InvalidState(ended_status) = repository
        .transition_provider_assessment(
            "recipient-user-1",
            recipient,
            &assessment.assessment_id,
            TransitionOwnerProviderAssessmentRequest {
                action: "cancel".to_string(),
                expected_version: completed_assessment.version,
                reason_code: Some("assessment_no_longer_needed".to_string()),
                owner_visible_summary: Some(
                    "This completed assessment cannot be cancelled.".to_string(),
                ),
                idempotency_key: "assessment-cancel-after-complete-001".to_string(),
                ..completion_request
            },
        )
        .await
    else {
        panic!("a terminal assessment should return status-only recovery");
    };
    assert_eq!(
        ended_status.assessment_id,
        completed_assessment.assessment_id
    );
    assert_eq!(ended_status.status, completed_assessment.status);
    assert_eq!(ended_status.version, completed_assessment.version);
    let ended_status_json =
        serde_json::to_value(ended_status).expect("ended assessment status should serialize");
    assert_eq!(
        ended_status_json.as_object().map(|value| value.len()),
        Some(4)
    );
    assert!(ended_status_json.get("organization_id").is_none());
    assert!(ended_status_json
        .get("proposed_window_start_epoch_seconds")
        .is_none());
    let completed_event_audit = sqlx::query_scalar::<_, serde_json::Value>(
        "SELECT event_data FROM owner_provider_assessment_events
         WHERE assessment_id = $1 AND event_kind = 'completed'",
    )
    .bind(&assessment.assessment_id)
    .fetch_one(&pool)
    .await
    .expect("completed assessment audit should load")
    .to_string();
    assert!(completed_event_audit.contains("has_owner_visible_summary"));
    assert!(!completed_event_audit.contains("ready for proposal review"));
    let OwnerReadResult::Loaded(owner_completed_assessments) = repository
        .list_owner_provider_assessments(owner_a, &property.property_id)
        .await
    else {
        panic!("owner should load the provider's customer-safe assessment outcome");
    };
    assert_eq!(owner_completed_assessments, vec![completed_assessment]);

    let expires_at_epoch_seconds = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("proposal expiration clock should be available")
        .as_secs() as i64
        + 7 * 24 * 60 * 60;
    let proposal_request = PublishOwnerProviderInitialServiceProposalRequest {
        token: retry.delivery_token().to_string(),
        expected_proposal_version: 0,
        title: "Every-two-week yard care".to_string(),
        customer_summary: "Routine front and back yard care based on the completed assessment."
            .to_string(),
        included_scope: vec![
            "Mow and edge turf areas".to_string(),
            "Blow hardscape clean".to_string(),
        ],
        exclusions: vec!["Tree work above eight feet".to_string()],
        cadence_code: "every_two_weeks".to_string(),
        cadence_detail: "One visit every two weeks".to_string(),
        arrival_policy: "The company will confirm the service day before the first visit."
            .to_string(),
        weather_policy: "Unsafe weather may move the visit after owner notice.".to_string(),
        cancellation_policy: "Cancel at least 24 hours before a confirmed visit.".to_string(),
        proof_expectation: "A completion note and customer-safe photos follow each visit."
            .to_string(),
        price_amount_minor: 12_000,
        price_basis: "per_visit".to_string(),
        currency_code: "USD".to_string(),
        revision_note: None,
        expires_at_epoch_seconds,
        idempotency_key: "proposal-publish-provider-001".to_string(),
    };
    assert!(matches!(
        repository
            .publish_initial_service_proposal(
                "different-provider-user",
                recipient,
                &assessment.assessment_id,
                proposal_request.clone(),
            )
            .await,
        OwnerProviderInitialServiceProposalWriteResult::NotFound
    ));
    let (first_proposal, second_proposal) = tokio::join!(
        repository.publish_initial_service_proposal(
            "recipient-user-1",
            recipient,
            &assessment.assessment_id,
            proposal_request.clone(),
        ),
        repository.publish_initial_service_proposal(
            "recipient-user-1",
            recipient,
            &assessment.assessment_id,
            proposal_request.clone(),
        ),
    );
    let proposal_v1 = match (first_proposal, second_proposal) {
        (
            OwnerProviderInitialServiceProposalWriteResult::Published(published),
            OwnerProviderInitialServiceProposalWriteResult::Replayed(replayed),
        )
        | (
            OwnerProviderInitialServiceProposalWriteResult::Replayed(replayed),
            OwnerProviderInitialServiceProposalWriteResult::Published(published),
        ) => {
            assert_eq!(published, replayed);
            published
        }
        (first, second) => panic!(
            "concurrent exact proposal publication should publish once and replay once, got {first:?} and {second:?}"
        ),
    };
    assert_eq!(proposal_v1.proposal_version, 1);
    assert_eq!(proposal_v1.status, "sent");
    assert_eq!(proposal_v1.annualized_monthly_minor, Some(26_000));
    assert!(matches!(
        repository
            .publish_initial_service_proposal(
                "recipient-user-1",
                recipient,
                &assessment.assessment_id,
                PublishOwnerProviderInitialServiceProposalRequest {
                    title: "Changed content under a reused key".to_string(),
                    ..proposal_request.clone()
                },
            )
            .await,
        OwnerProviderInitialServiceProposalWriteResult::Conflict
    ));

    let owner_change_request = CreateOwnerInitialServiceProposalMessageRequest {
        message_kind: "owner_change_request".to_string(),
        customer_safe_body: "Please revise the visit price after confirming the turf area."
            .to_string(),
        expected_proposal_version: proposal_v1.proposal_version,
        idempotency_key: "proposal-owner-change-request-001".to_string(),
    };
    assert!(matches!(
        repository
            .create_owner_initial_service_proposal_message(
                owner_b,
                &property.property_id,
                &proposal_v1.proposal_id,
                owner_change_request.clone(),
            )
            .await,
        OwnerProviderInitialServiceProposalMessageWriteResult::NotFound
    ));
    let (first_owner_message, second_owner_message) = tokio::join!(
        repository.create_owner_initial_service_proposal_message(
            owner_a,
            &property.property_id,
            &proposal_v1.proposal_id,
            owner_change_request.clone(),
        ),
        repository.create_owner_initial_service_proposal_message(
            owner_a,
            &property.property_id,
            &proposal_v1.proposal_id,
            owner_change_request.clone(),
        ),
    );
    let owner_change_message = match (first_owner_message, second_owner_message) {
        (
            OwnerProviderInitialServiceProposalMessageWriteResult::Created(created),
            OwnerProviderInitialServiceProposalMessageWriteResult::Replayed(replayed),
        )
        | (
            OwnerProviderInitialServiceProposalMessageWriteResult::Replayed(replayed),
            OwnerProviderInitialServiceProposalMessageWriteResult::Created(created),
        ) => {
            assert_eq!(created, replayed);
            created
        }
        (first, second) => panic!(
            "concurrent exact owner proposal messages should create once and replay once, got {first:?} and {second:?}"
        ),
    };
    assert_eq!(owner_change_message.proposal_id, proposal_v1.proposal_id);
    assert_eq!(owner_change_message.proposal_version_snapshot, 1);
    assert_eq!(owner_change_message.series_version_snapshot, 1);
    assert!(matches!(
        repository
            .create_owner_initial_service_proposal_message(
                owner_a,
                &property.property_id,
                &proposal_v1.proposal_id,
                CreateOwnerInitialServiceProposalMessageRequest {
                    customer_safe_body: "Changed content under a reused key".to_string(),
                    ..owner_change_request.clone()
                },
            )
            .await,
        OwnerProviderInitialServiceProposalMessageWriteResult::Conflict
    ));

    let revised_request = PublishOwnerProviderInitialServiceProposalRequest {
        expected_proposal_version: proposal_v1.proposal_version,
        price_amount_minor: 11_000,
        revision_note: Some("Updated the visit price after confirming the turf area.".to_string()),
        idempotency_key: "proposal-revise-provider-001".to_string(),
        ..proposal_request.clone()
    };
    let OwnerProviderInitialServiceProposalWriteResult::Published(proposal_v2) = repository
        .publish_initial_service_proposal(
            "recipient-user-1",
            recipient,
            &assessment.assessment_id,
            revised_request.clone(),
        )
        .await
    else {
        panic!("the current proposal should be revised into a new immutable version");
    };
    assert_eq!(proposal_v2.proposal_version, 2);
    assert_eq!(proposal_v2.status, "sent");
    assert_eq!(proposal_v2.annualized_monthly_minor, Some(23_833));
    let OwnerProviderDisclosureAccessResult::Loaded(provider_proposal_workspace) = repository
        .open_provider_disclosure(
            "recipient-user-1",
            recipient,
            OpenOwnerProviderDisclosureRequest {
                token: retry.delivery_token().to_string(),
            },
        )
        .await
    else {
        panic!("the provider should reload the latest proposal with the assessment workspace");
    };
    assert_eq!(
        provider_proposal_workspace.initial_service_proposal,
        Some(proposal_v2.clone()),
    );
    assert_eq!(
        provider_proposal_workspace.initial_service_proposal_messages,
        Some(vec![owner_change_message.clone()]),
    );
    let provider_response_request = CreateProviderInitialServiceProposalResponseRequest {
        token: retry.delivery_token().to_string(),
        in_reply_to_message_id: owner_change_message.message_id.clone(),
        customer_safe_body:
            "The revised proposal reflects the confirmed turf area and lower visit price."
                .to_string(),
        expected_proposal_version: proposal_v2.proposal_version,
        related_proposal_id: Some(proposal_v2.proposal_id.clone()),
        idempotency_key: "proposal-provider-response-001".to_string(),
    };
    assert!(matches!(
        repository
            .create_provider_initial_service_proposal_response(
                "different-provider-user",
                recipient,
                &assessment.assessment_id,
                provider_response_request.clone(),
            )
            .await,
        OwnerProviderInitialServiceProposalMessageWriteResult::NotFound
    ));
    let (first_provider_response, second_provider_response) = tokio::join!(
        repository.create_provider_initial_service_proposal_response(
            "recipient-user-1",
            recipient,
            &assessment.assessment_id,
            provider_response_request.clone(),
        ),
        repository.create_provider_initial_service_proposal_response(
            "recipient-user-1",
            recipient,
            &assessment.assessment_id,
            provider_response_request.clone(),
        ),
    );
    let provider_response = match (first_provider_response, second_provider_response) {
        (
            OwnerProviderInitialServiceProposalMessageWriteResult::Created(created),
            OwnerProviderInitialServiceProposalMessageWriteResult::Replayed(replayed),
        )
        | (
            OwnerProviderInitialServiceProposalMessageWriteResult::Replayed(replayed),
            OwnerProviderInitialServiceProposalMessageWriteResult::Created(created),
        ) => {
            assert_eq!(created, replayed);
            created
        }
        (first, second) => panic!(
            "concurrent exact provider proposal responses should create once and replay once, got {first:?} and {second:?}"
        ),
    };
    assert_eq!(provider_response.proposal_id, proposal_v1.proposal_id);
    assert_eq!(provider_response.proposal_version_snapshot, 1);
    assert_eq!(provider_response.series_version_snapshot, 2);
    assert_eq!(
        provider_response.related_proposal_id.as_deref(),
        Some(proposal_v2.proposal_id.as_str())
    );
    let OwnerProviderDisclosureAccessResult::Loaded(provider_reloaded_conversation) = repository
        .open_provider_disclosure(
            "recipient-user-1",
            recipient,
            OpenOwnerProviderDisclosureRequest {
                token: retry.delivery_token().to_string(),
            },
        )
        .await
    else {
        panic!("the provider should reload the proposal conversation");
    };
    assert_eq!(
        provider_reloaded_conversation.initial_service_proposal_messages,
        Some(vec![
            owner_change_message.clone(),
            provider_response.clone()
        ]),
    );
    assert!(matches!(
        repository
            .list_owner_initial_service_proposal_messages(
                owner_b,
                &property.property_id,
                &proposal_v2.proposal_id,
            )
            .await,
        OwnerReadResult::NotFound
    ));
    let OwnerReadResult::Loaded(proposal_messages) = repository
        .list_owner_initial_service_proposal_messages(
            owner_a,
            &property.property_id,
            &proposal_v2.proposal_id,
        )
        .await
    else {
        panic!("the owner should load the proposal-version conversation");
    };
    assert_eq!(
        proposal_messages,
        vec![owner_change_message.clone(), provider_response.clone()]
    );
    assert!(sqlx::query(
        "UPDATE owner_provider_initial_service_proposal_messages
         SET customer_safe_body = 'Mutated conversation' WHERE id = $1",
    )
    .bind(&owner_change_message.message_id)
    .execute(&pool)
    .await
    .is_err());
    assert!(matches!(
        repository
            .publish_initial_service_proposal(
                "recipient-user-1",
                recipient,
                &assessment.assessment_id,
                PublishOwnerProviderInitialServiceProposalRequest {
                    idempotency_key: "proposal-revise-stale-001".to_string(),
                    ..revised_request
                },
            )
            .await,
        OwnerProviderInitialServiceProposalWriteResult::Conflict
    ));
    assert!(matches!(
        repository
            .list_owner_initial_service_proposals(owner_b, &property.property_id)
            .await,
        OwnerReadResult::NotFound
    ));
    let OwnerReadResult::Loaded(owner_proposals) = repository
        .list_owner_initial_service_proposals(owner_a, &property.property_id)
        .await
    else {
        panic!("the owner should load the immutable proposal history");
    };
    assert_eq!(owner_proposals.len(), 2);
    assert_eq!(owner_proposals[0], proposal_v2);
    assert_eq!(owner_proposals[1].proposal_id, proposal_v1.proposal_id);
    assert_eq!(owner_proposals[1].status, "superseded");
    assert!(matches!(
        repository
            .get_owner_initial_service_proposal(
                owner_b,
                &property.property_id,
                &proposal_v2.proposal_id,
            )
            .await,
        OwnerReadResult::NotFound
    ));
    assert!(matches!(
        repository
            .get_owner_initial_service_proposal(
                owner_a,
                &property.property_id,
                &proposal_v2.proposal_id,
            )
            .await,
        OwnerReadResult::Loaded(proposal) if proposal == proposal_v2
    ));
    assert!(sqlx::query(
        "UPDATE owner_provider_initial_service_proposals
         SET title = 'Mutated published title' WHERE id = $1",
    )
    .bind(&proposal_v2.proposal_id)
    .execute(&pool)
    .await
    .is_err());

    let acquisition_side_effects_before = sqlx::query(
        "SELECT
             (SELECT COUNT(*) FROM customer_accounts) AS customer_accounts,
             (SELECT COUNT(*) FROM customer_properties) AS customer_properties,
             (SELECT COUNT(*) FROM service_jobs) AS service_jobs,
             (SELECT COUNT(*) FROM day_plans) AS day_plans,
             (SELECT COUNT(*) FROM crews) AS crews",
    )
    .fetch_one(&pool)
    .await
    .expect("pre-acceptance side-effect counts should load");
    let acceptance_request = DecideOwnerProviderInitialServiceProposalRequest {
        action: "accept".to_string(),
        expected_proposal_version: proposal_v2.proposal_version,
        reason_code: None,
        customer_safe_note: Some("Please contact me before proposing the first visit.".to_string()),
        affirmation_text_version: Some("initial_service_proposal_acceptance_v1".to_string()),
        idempotency_key: "proposal-accept-owner-001".to_string(),
    };
    assert!(matches!(
        repository
            .decide_initial_service_proposal(
                owner_b,
                &property.property_id,
                &proposal_v2.proposal_id,
                acceptance_request.clone(),
            )
            .await,
        OwnerProviderInitialServiceProposalDecisionResult::NotFound
    ));
    let (first_acceptance, second_acceptance) = tokio::join!(
        repository.decide_initial_service_proposal(
            owner_a,
            &property.property_id,
            &proposal_v2.proposal_id,
            acceptance_request.clone(),
        ),
        repository.decide_initial_service_proposal(
            owner_a,
            &property.property_id,
            &proposal_v2.proposal_id,
            acceptance_request.clone(),
        ),
    );
    let acceptance = match (first_acceptance, second_acceptance) {
        (
            OwnerProviderInitialServiceProposalDecisionResult::Decided(decided),
            OwnerProviderInitialServiceProposalDecisionResult::Replayed(replayed),
        )
        | (
            OwnerProviderInitialServiceProposalDecisionResult::Replayed(replayed),
            OwnerProviderInitialServiceProposalDecisionResult::Decided(decided),
        ) => {
            assert_eq!(decided, replayed);
            decided
        }
        (first, second) => panic!(
            "concurrent exact proposal acceptance should decide once and replay once, got {first:?} and {second:?}"
        ),
    };
    assert!(acceptance.acceptance_snapshot_id.is_some());
    assert_eq!(
        acceptance
            .acceptance_snapshot_sha256
            .as_deref()
            .map(str::len),
        Some(64)
    );
    assert!(matches!(
        repository
            .create_owner_initial_service_proposal_message(
                owner_a,
                &property.property_id,
                &proposal_v1.proposal_id,
                owner_change_request.clone(),
            )
            .await,
        OwnerProviderInitialServiceProposalMessageWriteResult::Replayed(message)
            if message == owner_change_message
    ));
    assert!(matches!(
        repository
            .create_owner_initial_service_proposal_message(
                owner_a,
                &property.property_id,
                &proposal_v2.proposal_id,
                CreateOwnerInitialServiceProposalMessageRequest {
                    message_kind: "owner_question".to_string(),
                    customer_safe_body: "Can service begin next week?".to_string(),
                    expected_proposal_version: proposal_v2.proposal_version,
                    idempotency_key: "proposal-question-after-accept-001".to_string(),
                },
            )
            .await,
        OwnerProviderInitialServiceProposalMessageWriteResult::Conflict
    ));
    assert!(matches!(
        repository
            .decide_initial_service_proposal(
                owner_a,
                &property.property_id,
                &proposal_v2.proposal_id,
                DecideOwnerProviderInitialServiceProposalRequest {
                    action: "decline".to_string(),
                    reason_code: Some("price".to_string()),
                    customer_safe_note: None,
                    affirmation_text_version: None,
                    idempotency_key: "proposal-decline-after-accept-001".to_string(),
                    ..acceptance_request
                },
            )
            .await,
        OwnerProviderInitialServiceProposalDecisionResult::Conflict
    ));
    let acquisition_side_effects_after = sqlx::query(
        "SELECT
             (SELECT COUNT(*) FROM customer_accounts) AS customer_accounts,
             (SELECT COUNT(*) FROM customer_properties) AS customer_properties,
             (SELECT COUNT(*) FROM service_jobs) AS service_jobs,
             (SELECT COUNT(*) FROM day_plans) AS day_plans,
             (SELECT COUNT(*) FROM crews) AS crews",
    )
    .fetch_one(&pool)
    .await
    .expect("post-acceptance side-effect counts should load");
    for column in [
        "customer_accounts",
        "customer_properties",
        "service_jobs",
        "day_plans",
        "crews",
    ] {
        assert_eq!(
            acquisition_side_effects_after.get::<i64, _>(column),
            acquisition_side_effects_before.get::<i64, _>(column),
            "proposal acceptance must not create {column}"
        );
    }
    let accepted_snapshot = sqlx::query_scalar::<_, serde_json::Value>(
        "SELECT snapshot
         FROM owner_provider_initial_service_proposal_acceptance_snapshots
         WHERE proposal_id = $1",
    )
    .bind(&proposal_v2.proposal_id)
    .fetch_one(&pool)
    .await
    .expect("accepted immutable proposal snapshot should load");
    assert_eq!(
        accepted_snapshot
            .get("affirmation_text_version")
            .and_then(serde_json::Value::as_str),
        Some("initial_service_proposal_acceptance_v1")
    );
    let proposal_audit = sqlx::query_scalar::<_, String>(
        "SELECT STRING_AGG(event_data::TEXT, ' ') FROM owner_provider_initial_service_proposal_events
         WHERE proposal_id IN ($1, $2)",
    )
    .bind(&proposal_v1.proposal_id)
    .bind(&proposal_v2.proposal_id)
    .fetch_one(&pool)
    .await
    .expect("minimized proposal audit should load");
    assert!(!proposal_audit.contains("Mow and edge"));
    assert!(!proposal_audit.contains("421 Private Canyon Road"));
    assert!(!proposal_audit.contains("revise the visit price"));
    assert!(!proposal_audit.contains("lower visit price"));

    let OwnerProviderInvitationCreateResult::Created(competing_invitation) = repository
        .create_provider_invitation(
            owner_a,
            &property.property_id,
            invitation_request(
                "competing@desertcare.example",
                "provider-invite-competing-activation-001",
            ),
        )
        .await
    else {
        panic!("a competing same-property invitation should be created before activation");
    };
    let activation_request = ActivateOwnerProviderRelationshipRequest {
        expected_proposal_version: proposal_v2.proposal_version,
        activation_affirmation_text_version: "owner_provider_relationship_activation_v1"
            .to_string(),
        owner_confirmed: true,
        idempotency_key: "owner-provider-activation-001".to_string(),
    };
    assert!(matches!(
        repository
            .activate_owner_provider_relationship(
                owner_b,
                &property.property_id,
                &proposal_v2.proposal_id,
                activation_request.clone(),
            )
            .await,
        OwnerProviderRelationshipActivationResult::NotFound
    ));
    let operational_side_effects_before = sqlx::query(
        "SELECT
             (SELECT COUNT(*) FROM service_jobs) AS service_jobs,
             (SELECT COUNT(*) FROM day_plans) AS day_plans,
             (SELECT COUNT(*) FROM crews) AS crews,
             (SELECT COUNT(*) FROM property_crew_assignments) AS crew_assignments",
    )
    .fetch_one(&pool)
    .await
    .expect("pre-activation operational counts should load");
    let (first_activation, second_activation) = tokio::join!(
        repository.activate_owner_provider_relationship(
            owner_a,
            &property.property_id,
            &proposal_v2.proposal_id,
            activation_request.clone(),
        ),
        repository.activate_owner_provider_relationship(
            owner_a,
            &property.property_id,
            &proposal_v2.proposal_id,
            activation_request.clone(),
        ),
    );
    let activation = match (first_activation, second_activation) {
        (
            OwnerProviderRelationshipActivationResult::Activated(activated),
            OwnerProviderRelationshipActivationResult::Replayed(replayed),
        )
        | (
            OwnerProviderRelationshipActivationResult::Replayed(replayed),
            OwnerProviderRelationshipActivationResult::Activated(activated),
        ) => {
            assert_eq!(activated, replayed);
            activated
        }
        (first, second) => panic!(
            "concurrent exact activation should activate once and replay once, got {first:?} and {second:?}"
        ),
    };
    assert_eq!(activation.status, "provider_setup");
    assert_eq!(activation.proposal_version, proposal_v2.proposal_version);
    assert_eq!(activation.closed_competing_invitation_count, 1);
    assert!(activation.persisted);
    assert!(matches!(
        repository
            .activate_owner_provider_relationship(
                owner_a,
                &property.property_id,
                &proposal_v2.proposal_id,
                ActivateOwnerProviderRelationshipRequest {
                    expected_proposal_version: proposal_v2.proposal_version + 1,
                    ..activation_request.clone()
                },
            )
            .await,
        OwnerProviderRelationshipActivationResult::Conflict
    ));
    let projection = sqlx::query(
        "SELECT account.customer_name, account.billing_model,
                account.payment_status, account.service_approval_status,
                relation.relationship_type,
                customer_property.display_name, customer_property.service_address,
                customer_property.status AS customer_property_status,
                membership.user_id, membership.role, membership.scope_type,
                membership.scope_id, portal.user_id AS portal_user_id,
                portal.status AS portal_status,
                portal.scope_type AS portal_scope_type,
                portal.scope_id AS portal_scope_id,
                owner_property.status AS owner_property_status,
                invitation.status AS selected_invitation_status,
                competing.status AS competing_invitation_status
         FROM owner_provider_relationship_activations activation
         JOIN customer_accounts account ON account.id = activation.customer_account_id
         JOIN organization_customer_accounts relation
           ON relation.organization_id = activation.organization_id
          AND relation.account_id = activation.customer_account_id
         JOIN customer_properties customer_property
           ON customer_property.id = activation.customer_property_id
         JOIN organization_memberships membership
           ON membership.id = activation.owner_membership_id
         JOIN customer_portal_access_grants portal
           ON portal.activation_id = activation.id
         JOIN owner_properties owner_property
           ON owner_property.id = activation.owner_property_id
         JOIN owner_provider_invitations invitation
           ON invitation.id = activation.invitation_id
         JOIN owner_provider_invitations competing ON competing.id = $2
         WHERE activation.id = $1",
    )
    .bind(&activation.activation_id)
    .bind(&competing_invitation.invitation.invitation_id)
    .fetch_one(&pool)
    .await
    .expect("activation projection should load");
    assert_eq!(
        projection.get::<String, _>("billing_model"),
        "manual_account"
    );
    assert_eq!(
        projection.get::<String, _>("payment_status"),
        "not_required"
    );
    assert_eq!(
        projection.get::<String, _>("service_approval_status"),
        "manager_review"
    );
    assert_eq!(projection.get::<String, _>("relationship_type"), "owner");
    assert_eq!(
        projection.get::<String, _>("customer_property_status"),
        "onboarding"
    );
    assert!(projection
        .get::<String, _>("service_address")
        .contains("421 Private Canyon Road"));
    assert_eq!(projection.get::<String, _>("user_id"), owner_a);
    assert_eq!(projection.get::<String, _>("role"), "property_owner");
    assert_eq!(
        projection.get::<String, _>("scope_type"),
        "customer_account"
    );
    assert_eq!(
        projection.get::<String, _>("scope_id"),
        activation.customer_account_id
    );
    assert_eq!(projection.get::<String, _>("portal_user_id"), owner_a);
    assert_eq!(projection.get::<String, _>("portal_status"), "active");
    assert_eq!(
        projection.get::<String, _>("portal_scope_type"),
        "customer_account"
    );
    assert_eq!(
        projection.get::<String, _>("portal_scope_id"),
        activation.customer_account_id
    );
    assert!(sqlx::query(
        "UPDATE customer_portal_access_grants
         SET scope_id = property_id
         WHERE activation_id = $1",
    )
    .bind(&activation.activation_id)
    .execute(&pool)
    .await
    .is_err());
    let sibling_property_id = "customer_portal_sibling_property_fixture";
    sqlx::query(
        "INSERT INTO customer_properties (
             id, organization_id, account_id, display_name, service_address, status
         ) VALUES ($1, $2, $3, 'Second owner yard', '422 Private Canyon Road', 'active')",
    )
    .bind(sibling_property_id)
    .bind(&activation.organization_id)
    .bind(&activation.customer_account_id)
    .execute(&pool)
    .await
    .expect("a sibling customer property should insert");
    let portal_access = CustomerPortalAccessRepository::from_pool(pool.clone());
    let account_property_result = portal_access.list_authorized_properties(owner_a).await;
    let CustomerPortalPropertyAccessResult::Loaded(account_properties) = account_property_result
    else {
        panic!(
            "the verified account owner should resolve authorized properties: {account_property_result:?}"
        );
    };
    assert!(account_properties
        .iter()
        .any(|property| property.property_id == activation.customer_property_id));
    assert!(account_properties.iter().any(|property| {
        property.property_id == sibling_property_id
            && property.effective_scope_type == "customer_account"
    }));

    sqlx::query(
        "UPDATE organization_memberships
         SET scope_type = 'property', scope_id = $2
         WHERE id = $1",
    )
    .bind(&activation.owner_membership_id)
    .bind(&activation.customer_property_id)
    .execute(&pool)
    .await
    .expect("the fixture membership should narrow to property scope");
    sqlx::query(
        "UPDATE customer_portal_access_grants
         SET scope_type = 'property', scope_id = property_id
         WHERE activation_id = $1",
    )
    .bind(&activation.activation_id)
    .execute(&pool)
    .await
    .expect("the fixture portal grant should narrow to property scope");
    let CustomerPortalPropertyAccessResult::Loaded(delegate_properties) =
        portal_access.list_authorized_properties(owner_a).await
    else {
        panic!("a matching property-scoped grant should resolve authorized properties");
    };
    assert_eq!(delegate_properties.len(), 1);
    assert_eq!(
        delegate_properties[0].property_id,
        activation.customer_property_id
    );
    assert_eq!(delegate_properties[0].effective_scope_type, "property");

    sqlx::query(
        "UPDATE organization_memberships
         SET scope_type = 'customer_account', scope_id = $2
         WHERE id = $1",
    )
    .bind(&activation.owner_membership_id)
    .bind(&activation.customer_account_id)
    .execute(&pool)
    .await
    .expect("the fixture membership should restore account scope");
    sqlx::query(
        "UPDATE customer_portal_access_grants
         SET scope_type = 'customer_account', scope_id = account_id
         WHERE activation_id = $1",
    )
    .bind(&activation.activation_id)
    .execute(&pool)
    .await
    .expect("the fixture portal grant should restore account scope");
    sqlx::query("UPDATE organization_memberships SET status = 'suspended' WHERE id = $1")
        .bind(&activation.owner_membership_id)
        .execute(&pool)
        .await
        .expect("the fixture membership should suspend");
    assert!(matches!(
        portal_access.list_authorized_properties(owner_a).await,
        CustomerPortalPropertyAccessResult::InvalidAuthorization
    ));
    assert!(matches!(
        portal_access.list_confirmed_visits(owner_a).await,
        CustomerPortalVisitReadResult::InvalidAuthorization
    ));
    sqlx::query("UPDATE organization_memberships SET status = 'active' WHERE id = $1")
        .bind(&activation.owner_membership_id)
        .execute(&pool)
        .await
        .expect("the fixture membership should reactivate");
    assert_eq!(
        projection.get::<String, _>("owner_property_status"),
        "provider_setup"
    );
    assert_eq!(
        projection.get::<String, _>("selected_invitation_status"),
        "activated"
    );
    assert_eq!(
        projection.get::<String, _>("competing_invitation_status"),
        "revoked"
    );
    let OwnerProviderFirstVisitReadResult::Loaded(awaiting_first_visit) = repository
        .get_owner_provider_first_visit(owner_a, &property.property_id, &activation.activation_id)
        .await
    else {
        panic!("the activated owner relationship should expose first-visit setup");
    };
    assert_eq!(awaiting_first_visit.status, "awaiting_provider");
    assert_eq!(awaiting_first_visit.current_version, 0);
    assert!(matches!(
        repository
            .get_owner_provider_first_visit(
                owner_b,
                &property.property_id,
                &activation.activation_id,
            )
            .await,
        OwnerProviderFirstVisitReadResult::NotFound
    ));
    assert!(matches!(
        repository
            .get_provider_first_visit(
                "recipient-user-1",
                "wrong@sonoranyard.example",
                &activation.activation_id,
                retry.delivery_token(),
            )
            .await,
        OwnerProviderFirstVisitReadResult::NotFound
    ));
    let first_visit_start = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("system time should follow the epoch")
        .as_secs() as i64
        + 86_400;
    let first_window_request = ProposeProviderFirstVisitRequest {
        token: retry.delivery_token().to_string(),
        expected_series_version: 0,
        window_start_epoch_seconds: first_visit_start,
        window_end_epoch_seconds: first_visit_start + 7_200,
        time_zone: "America/Phoenix".to_string(),
        customer_safe_arrival_note: Some(
            "Please unlock the side gate and keep pets inside.".to_string(),
        ),
        idempotency_key: "provider-first-visit-window-001".to_string(),
    };
    let OwnerProviderFirstVisitWriteResult::Saved(first_window) = repository
        .propose_provider_first_visit(
            "recipient-user-1",
            recipient,
            &activation.activation_id,
            first_window_request.clone(),
        )
        .await
    else {
        panic!("the activated provider should propose the first window");
    };
    assert_eq!(first_window.status, "proposed");
    assert_eq!(first_window.current_version, 1);
    assert!(matches!(
        repository
            .propose_provider_first_visit(
                "recipient-user-1",
                recipient,
                &activation.activation_id,
                first_window_request.clone(),
            )
            .await,
        OwnerProviderFirstVisitWriteResult::Replayed(record) if record == first_window
    ));
    assert!(matches!(
        repository
            .propose_provider_first_visit(
                "recipient-user-1",
                recipient,
                &activation.activation_id,
                ProposeProviderFirstVisitRequest {
                    window_end_epoch_seconds: first_visit_start + 10_800,
                    ..first_window_request
                },
            )
            .await,
        OwnerProviderFirstVisitWriteResult::Conflict
    ));
    let change_request = DecideOwnerProviderFirstVisitRequest {
        expected_window_version: 1,
        action: "request_change".to_string(),
        customer_safe_note: Some("Could we use the Friday afternoon window instead?".to_string()),
        confirmation_affirmation_text_version: None,
        idempotency_key: "owner-first-visit-change-001".to_string(),
    };
    let OwnerProviderFirstVisitWriteResult::Saved(change_requested) = repository
        .decide_owner_provider_first_visit(
            owner_a,
            &property.property_id,
            &activation.activation_id,
            change_request.clone(),
        )
        .await
    else {
        panic!("the owner should request a first-window change");
    };
    assert_eq!(change_requested.status, "change_requested");
    assert!(matches!(
        repository
            .decide_owner_provider_first_visit(
                owner_a,
                &property.property_id,
                &activation.activation_id,
                change_request,
            )
            .await,
        OwnerProviderFirstVisitWriteResult::Replayed(record) if record == change_requested
    ));
    let second_window_request = ProposeProviderFirstVisitRequest {
        token: retry.delivery_token().to_string(),
        expected_series_version: 1,
        window_start_epoch_seconds: first_visit_start + 86_400,
        window_end_epoch_seconds: first_visit_start + 86_400 + 7_200,
        time_zone: "America/Phoenix".to_string(),
        customer_safe_arrival_note: Some("Friday afternoon arrival window.".to_string()),
        idempotency_key: "provider-first-visit-window-002".to_string(),
    };
    let OwnerProviderFirstVisitWriteResult::Saved(second_window) = repository
        .propose_provider_first_visit(
            "recipient-user-1",
            recipient,
            &activation.activation_id,
            second_window_request,
        )
        .await
    else {
        panic!("the provider should respond with a new immutable window");
    };
    assert_eq!(second_window.current_version, 2);
    let confirmation = DecideOwnerProviderFirstVisitRequest {
        expected_window_version: 2,
        action: "confirm".to_string(),
        customer_safe_note: None,
        confirmation_affirmation_text_version: Some(
            "owner_provider_first_visit_confirmation_v1".to_string(),
        ),
        idempotency_key: "owner-first-visit-confirm-001".to_string(),
    };
    let (first_confirmation, second_confirmation) = tokio::join!(
        repository.decide_owner_provider_first_visit(
            owner_a,
            &property.property_id,
            &activation.activation_id,
            confirmation.clone(),
        ),
        repository.decide_owner_provider_first_visit(
            owner_a,
            &property.property_id,
            &activation.activation_id,
            confirmation.clone(),
        ),
    );
    let confirmed = match (first_confirmation, second_confirmation) {
        (
            OwnerProviderFirstVisitWriteResult::Saved(saved),
            OwnerProviderFirstVisitWriteResult::Replayed(replayed),
        )
        | (
            OwnerProviderFirstVisitWriteResult::Replayed(replayed),
            OwnerProviderFirstVisitWriteResult::Saved(saved),
        ) => {
            assert_eq!(saved, replayed);
            saved
        }
        (first, second) => panic!(
            "concurrent exact first-visit confirmation should save once and replay once, got {first:?} and {second:?}"
        ),
    };
    assert_eq!(confirmed.status, "confirmed");
    assert_eq!(confirmed.owner_decision.as_deref(), Some("confirm"));
    let CustomerPortalVisitReadResult::Loaded(customer_visits) =
        portal_access.list_confirmed_visits(owner_a).await
    else {
        panic!("the authorized owner should load confirmed customer visits");
    };
    assert_eq!(customer_visits.properties.len(), 2);
    assert!(customer_visits
        .properties
        .iter()
        .any(|property| property.property_id == sibling_property_id));
    assert_eq!(customer_visits.visits.len(), 1);
    let customer_visit = &customer_visits.visits[0];
    assert_eq!(customer_visit.property_id, activation.customer_property_id);
    assert_eq!(customer_visit.status, "confirmed");
    assert_eq!(customer_visit.service_title, proposal_v2.title);
    assert_eq!(customer_visit.service_scope, proposal_v2.included_scope);
    assert_eq!(
        customer_visit.preparation_message.as_deref(),
        Some("Friday afternoon arrival window.")
    );
    assert!(!customer_visit.delivered_proof_available);
    let customer_visit_json =
        serde_json::to_string(&customer_visits).expect("customer visits should serialize");
    for private_value in [
        "recipient-user-1",
        "owner_provider_first_visit_confirmation_v1",
        &activation.activation_id,
        second_window
            .proposal_id
            .as_deref()
            .expect("confirmed proposal id should exist"),
    ] {
        assert!(
            !customer_visit_json.contains(private_value),
            "customer visit JSON must exclude {private_value}"
        );
    }
    sqlx::query(
        "UPDATE customer_portal_access_grants
         SET status = 'revoked', revoked_at = NOW()
         WHERE activation_id = $1",
    )
    .bind(&activation.activation_id)
    .execute(&pool)
    .await
    .expect("the fixture portal grant should revoke");
    assert!(matches!(
        portal_access.list_confirmed_visits(owner_a).await,
        CustomerPortalVisitReadResult::NotAuthorized
    ));
    sqlx::query(
        "UPDATE customer_portal_access_grants
         SET status = 'active', revoked_at = NULL
         WHERE activation_id = $1",
    )
    .bind(&activation.activation_id)
    .execute(&pool)
    .await
    .expect("the fixture portal grant should restore");
    assert!(matches!(
        repository
            .decide_owner_provider_first_visit(
                owner_b,
                &property.property_id,
                &activation.activation_id,
                DecideOwnerProviderFirstVisitRequest {
                    idempotency_key: "wrong-owner-first-visit-001".to_string(),
                    ..confirmation
                },
            )
            .await,
        OwnerProviderFirstVisitWriteResult::NotFound
    ));
    assert_eq!(
        sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM owner_provider_first_visit_proposals
             WHERE activation_id = $1",
        )
        .bind(&activation.activation_id)
        .fetch_one(&pool)
        .await
        .expect("first-visit proposal count should load"),
        2
    );
    assert!(sqlx::query(
        "UPDATE owner_provider_first_visit_proposals
         SET time_zone = 'UTC' WHERE id = $1",
    )
    .bind(
        second_window
            .proposal_id
            .as_deref()
            .expect("proposal id should exist")
    )
    .execute(&pool)
    .await
    .is_err());
    let operational_side_effects_after = sqlx::query(
        "SELECT
             (SELECT COUNT(*) FROM service_jobs) AS service_jobs,
             (SELECT COUNT(*) FROM day_plans) AS day_plans,
             (SELECT COUNT(*) FROM crews) AS crews,
             (SELECT COUNT(*) FROM property_crew_assignments) AS crew_assignments",
    )
    .fetch_one(&pool)
    .await
    .expect("post-activation operational counts should load");
    for column in ["service_jobs", "day_plans", "crews", "crew_assignments"] {
        assert_eq!(
            operational_side_effects_after.get::<i64, _>(column),
            operational_side_effects_before.get::<i64, _>(column),
            "activation and first-visit confirmation must not create {column}"
        );
    }
    let mobilization = ServiceMobilizationRepository::from_pool(pool.clone());
    let release_request = ReleaseInitialServiceRequest {
        expected_first_visit_version: 2,
        idempotency_key: "initial-service-release-001".to_string(),
    };
    assert!(matches!(
        mobilization
            .release_initial_service(
                "recipient-user-without-membership",
                &activation.activation_id,
                release_request.clone(),
            )
            .await,
        ServiceWorkReleaseWriteResult::NotFound
    ));
    assert_eq!(
        sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM service_jobs")
            .fetch_one(&pool)
            .await
            .expect("job count after denied release should load"),
        operational_side_effects_before.get::<i64, _>("service_jobs")
    );
    let (first_release, second_release) = tokio::join!(
        mobilization.release_initial_service(
            "recipient-user-1",
            &activation.activation_id,
            release_request.clone(),
        ),
        mobilization.release_initial_service(
            "recipient-user-1",
            &activation.activation_id,
            release_request.clone(),
        ),
    );
    let service_release = match (first_release, second_release) {
        (
            ServiceWorkReleaseWriteResult::Released(released),
            ServiceWorkReleaseWriteResult::Replayed(replayed),
        )
        | (
            ServiceWorkReleaseWriteResult::Replayed(replayed),
            ServiceWorkReleaseWriteResult::Released(released),
        ) => {
            assert_eq!(released, replayed);
            released
        }
        (first, second) => panic!(
            "concurrent exact service release should save once and replay once, got {first:?} and {second:?}"
        ),
    };
    assert_eq!(service_release.activation_id, activation.activation_id);
    assert_eq!(
        service_release.customer_property_id,
        activation.customer_property_id
    );
    assert_eq!(service_release.first_visit_proposal_version, 2);
    assert!(service_release.persisted);
    assert!(matches!(
        mobilization
            .get_service_release(
                "recipient-user-without-membership",
                &activation.activation_id,
            )
            .await,
        ServiceMobilizationReadResult::NotFound
    ));
    let ServiceMobilizationReadResult::Loaded(initial_release_status) = mobilization
        .get_service_release("recipient-user-1", &activation.activation_id)
        .await
    else {
        panic!("an authorized provider should reload the service release");
    };
    assert_eq!(initial_release_status.release, service_release);
    assert_eq!(initial_release_status.service_job_status, "scheduled");
    assert_eq!(initial_release_status.current_customer_status, "confirmed");
    assert_eq!(initial_release_status.current_event_version, 0);
    assert!(initial_release_status.latest_customer_event.is_none());
    assert_eq!(initial_release_status.time_zone, "America/Phoenix");
    assert!(matches!(
        mobilization
            .release_initial_service(
                "recipient-user-1",
                &activation.activation_id,
                ReleaseInitialServiceRequest {
                    expected_first_visit_version: 1,
                    ..release_request.clone()
                },
            )
            .await,
        ServiceWorkReleaseWriteResult::Conflict
    ));
    assert!(matches!(
        mobilization
            .release_initial_service(
                "recipient-user-1",
                &activation.activation_id,
                ReleaseInitialServiceRequest {
                    idempotency_key: "initial-service-release-002".to_string(),
                    ..release_request
                },
            )
            .await,
        ServiceWorkReleaseWriteResult::InvalidState
    ));
    let release_projection = sqlx::query(
        "SELECT release.initial_service_proposal_id, release.first_visit_proposal_id,
                release.customer_property_id, job.status, job.scheduled_date,
                job.assigned_crew_id,
                (SELECT COUNT(*) FROM job_checklist_items checklist
                 WHERE checklist.job_id = job.id) AS checklist_count
         FROM owner_provider_service_releases release
         JOIN service_jobs job ON job.id = release.service_job_id
         WHERE release.id = $1",
    )
    .bind(&service_release.release_id)
    .fetch_one(&pool)
    .await
    .expect("immutable release projection should load");
    assert_eq!(
        release_projection.get::<String, _>("initial_service_proposal_id"),
        proposal_v2.proposal_id
    );
    assert_eq!(
        release_projection.get::<String, _>("first_visit_proposal_id"),
        second_window
            .proposal_id
            .as_deref()
            .expect("confirmed first-visit proposal should exist")
    );
    assert_eq!(release_projection.get::<String, _>("status"), "scheduled");
    assert_eq!(release_projection.get::<i64, _>("checklist_count"), 4);
    assert!(release_projection
        .get::<Option<String>, _>("assigned_crew_id")
        .is_none());
    assert!(!release_projection
        .get::<String, _>("scheduled_date")
        .trim()
        .is_empty());
    assert_eq!(
        sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM service_jobs")
            .fetch_one(&pool)
            .await
            .expect("job count after release should load"),
        operational_side_effects_before.get::<i64, _>("service_jobs") + 1
    );
    assert_eq!(
        sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM day_plans")
            .fetch_one(&pool)
            .await
            .expect("day-plan count after release should load"),
        operational_side_effects_before.get::<i64, _>("day_plans")
    );
    assert!(sqlx::query(
        "UPDATE owner_provider_service_releases
         SET released_by_user_id = 'changed' WHERE id = $1",
    )
    .bind(&service_release.release_id)
    .execute(&pool)
    .await
    .is_err());

    let customer_visit_reference = sqlx::query_scalar::<_, String>(
        "SELECT customer_visit_reference
         FROM customer_service_visit_threads WHERE release_id = $1",
    )
    .bind(&service_release.release_id)
    .fetch_one(&pool)
    .await
    .expect("service release should create its customer-safe visit reference");
    assert!(customer_visit_reference.starts_with("customer_visit_"));
    assert_eq!(customer_visit_reference.len(), 47);
    let CustomerPortalVisitReadResult::Loaded(released_customer_visits) =
        portal_access.list_confirmed_visits(owner_a).await
    else {
        panic!("the released visit should remain visible to the authorized customer");
    };
    assert_eq!(
        released_customer_visits.visits[0]
            .customer_visit_reference
            .as_deref(),
        Some(customer_visit_reference.as_str())
    );
    let visit_communication = CustomerVisitCommunicationRepository::from_pool(pool.clone());
    let cross_owner_thread = visit_communication
        .get_customer_thread(owner_b, &customer_visit_reference)
        .await;
    assert!(
        matches!(
            cross_owner_thread,
            CustomerVisitThreadReadResult::NotAuthorized
        ),
        "an owner without a portal grant should not resolve the exact visit: {cross_owner_thread:?}"
    );
    assert!(matches!(
        visit_communication
            .list_provider_threads("recipient-user-without-membership")
            .await,
        ProviderVisitThreadListResult::NotFound
    ));
    let ProviderVisitThreadListResult::Loaded(empty_provider_queue) = visit_communication
        .list_provider_threads("recipient-user-1")
        .await
    else {
        panic!("an exact provider owner/manager should load the visit-question queue");
    };
    assert_eq!(empty_provider_queue.threads.len(), 1);
    assert_eq!(
        empty_provider_queue.threads[0].customer_visit_reference,
        customer_visit_reference
    );
    assert!(!empty_provider_queue.threads[0].awaiting_provider_response);
    assert!(empty_provider_queue.threads[0].latest_message.is_none());
    assert!(matches!(
        visit_communication
            .get_provider_thread(
                "recipient-user-without-membership",
                &customer_visit_reference,
            )
            .await,
        CustomerVisitThreadReadResult::NotFound
    ));
    let CustomerVisitThreadReadResult::Loaded(empty_customer_thread) = visit_communication
        .get_customer_thread(owner_a, &customer_visit_reference)
        .await
    else {
        panic!("the exact hybrid-authorized customer should load the visit thread");
    };
    assert_eq!(empty_customer_thread.current_version, 0);
    assert!(empty_customer_thread.messages.is_empty());
    assert!(matches!(
        visit_communication
            .get_customer_proof(owner_a, &customer_visit_reference)
            .await,
        CustomerVisitProofReadResult::Pending
    ));
    assert!(matches!(
        visit_communication
            .get_customer_proof(owner_b, &customer_visit_reference)
            .await,
        CustomerVisitProofReadResult::NotAuthorized
    ));
    let delivered_report_id = format!("report_{}", service_release.service_job_id);
    let delivered_snapshot = serde_json::json!({
        "report_id": delivered_report_id.clone(),
        "job_id": service_release.service_job_id.clone(),
        "report_status": "delivered",
        "persisted": true,
        "ready_for_customer": true,
        "checklist_progress": 100,
        "before_photos": 1,
        "after_photos": 1,
        "issue_photos": 0,
        "job": {
            "customer_name": "Yard Owner",
            "property_address": "Protected property",
            "scheduled_date": "2026-08-30",
            "checklist": [{"label": "Completed approved service", "completed": true}]
        },
        "photo_evidence": [],
        "completed_add_ons": [{
            "service_name": "Approved hedge care",
            "service_description": "Completed with this visit.",
            "quantity": 1
        }],
        "snapshot_metadata": {
            "snapshot_version": 1,
            "report_id": delivered_report_id.clone(),
            "job_id": service_release.service_job_id.clone(),
            "captured_at_epoch_seconds": 1_800_000_000,
            "evidence": {
                "before_photos": 1,
                "after_photos": 1,
                "issue_photos": 0,
                "total_photo_evidence": 0,
                "completed_add_ons": 1
            }
        }
    });
    sqlx::query(
        "INSERT INTO job_completion_reports (
             id, job_id, report_status, ready_for_customer,
             checklist_progress, before_photos, after_photos, issue_photos,
             share_token, reviewed_by_user_id, reviewed_at,
             delivered_by_user_id, delivered_at, sent_at,
             delivered_snapshot, delivered_snapshot_at
         ) VALUES (
             $1, $2, 'delivered', TRUE, 100, 1, 1, 0,
             $3, 'recipient-user-1', NOW(), 'recipient-user-1', NOW(), NOW(),
             $4, NOW()
         )",
    )
    .bind(&delivered_report_id)
    .bind(&service_release.service_job_id)
    .bind(format!("share_{}", service_release.service_job_id))
    .bind(delivered_snapshot)
    .execute(&pool)
    .await
    .expect("the exact released job should receive one atomic delivered snapshot");
    let CustomerVisitProofReadResult::Delivered(customer_proof) = visit_communication
        .get_customer_proof(owner_a, &customer_visit_reference)
        .await
    else {
        panic!("the exact hybrid-authorized visit should load delivered proof");
    };
    assert_eq!(customer_proof.report_status, "delivered");
    assert_eq!(customer_proof.completed_recommendations.len(), 1);
    let proof_json = serde_json::to_string(&customer_proof)
        .expect("the minimized delivered proof should serialize");
    for private_value in [
        delivered_report_id.as_str(),
        service_release.service_job_id.as_str(),
        service_release.release_id.as_str(),
        activation.customer_account_id.as_str(),
        activation.customer_property_id.as_str(),
        "recipient-user-1",
    ] {
        assert!(!proof_json.contains(private_value));
    }
    let CustomerPortalVisitReadResult::Loaded(proof_available_visits) =
        portal_access.list_confirmed_visits(owner_a).await
    else {
        panic!("the customer visit projection should reload after proof delivery");
    };
    assert!(proof_available_visits.visits[0].delivered_proof_available);

    let recommendation_day_plan_id = "day_plan_customer_recommendation_fixture";
    let recommendation_stop_id = "stop_customer_recommendation_fixture";
    let recommendation_amendment_id = "amendment_customer_recommendation_fixture";
    let recommendation_bid_id = "bid_customer_recommendation_fixture";
    sqlx::query(
        "INSERT INTO crews (id, name, organization_id)
         VALUES ('crew_customer_recommendation_fixture', 'Recommendation fixture', $1)
         ON CONFLICT (id) DO UPDATE SET organization_id = EXCLUDED.organization_id",
    )
    .bind(&activation.organization_id)
    .execute(&pool)
    .await
    .expect("the recommendation fixture crew should persist");
    sqlx::query(
        "INSERT INTO day_plans (
             id, crew_id, service_date, status, route_status
         ) VALUES ($1, 'crew_customer_recommendation_fixture', '2026-08-30',
                   'published', 'manual')",
    )
    .bind(recommendation_day_plan_id)
    .execute(&pool)
    .await
    .expect("the recommendation fixture day plan should persist");
    sqlx::query(
        "INSERT INTO day_plan_stops (
             id, day_plan_id, job_id, stop_order, stop_status
         ) VALUES ($1, $2, $3, 1, 'pending')",
    )
    .bind(recommendation_stop_id)
    .bind(recommendation_day_plan_id)
    .bind(&service_release.service_job_id)
    .execute(&pool)
    .await
    .expect("the exact released job should receive a recommendation fixture stop");
    sqlx::query(
        "INSERT INTO day_plan_amendment_requests (
             id, day_plan_id, requested_by_crew_id, amendment_type, status,
             stop_id, service_id, service_name, service_description,
             default_duration_minutes, default_price_cents,
             requires_manager_approval, requires_bid, note
         ) VALUES (
             $1, $2, 'crew_customer_recommendation_fixture', 'add_service',
             'bid_review', $3, 'service_fixture_hedge', 'Hedge shaping',
             'Shape the front hedge and remove clippings.', 45, 12500,
             TRUE, TRUE, 'Provider-private fixture note'
         )",
    )
    .bind(recommendation_amendment_id)
    .bind(recommendation_day_plan_id)
    .bind(recommendation_stop_id)
    .execute(&pool)
    .await
    .expect("the exact stop should receive an add-service amendment");
    sqlx::query(
        "INSERT INTO project_bids (
             id, day_plan_id, customer_account_id, source_amendment_id,
             status, customer_message
         ) VALUES (
             $1, $2, $3, $4, 'draft',
             'We recommend shaping the hedge found during this visit.'
         )",
    )
    .bind(recommendation_bid_id)
    .bind(recommendation_day_plan_id)
    .bind(&activation.customer_account_id)
    .bind(recommendation_amendment_id)
    .execute(&pool)
    .await
    .expect("the exact amendment should receive a draft project bid");
    sqlx::query(
        "INSERT INTO project_bid_line_items (
             id, project_bid_id, service_id, service_name,
             service_description, quantity, unit_price_cents, note, sort_order
         ) VALUES (
             'bid_customer_recommendation_fixture_line_1', $1,
             'service_fixture_hedge', 'Hedge shaping',
             'Shape the front hedge and remove clippings.', 1, 12500,
             'Provider-private fixture note', 1
         )",
    )
    .bind(recommendation_bid_id)
    .execute(&pool)
    .await
    .expect("the sent project bid should retain its provider-authored line item");
    sqlx::query(
        "UPDATE customer_accounts
         SET contact_email = 'owner-a@example.com', email_notifications_enabled = TRUE
         WHERE id = $1",
    )
    .bind(&activation.customer_account_id)
    .execute(&pool)
    .await
    .expect("the recommendation fixture should enable its exact customer recipient");
    let recommendation_send = SendProjectBidRequest {
        channel: "email".to_string(),
        recipient: "owner-a@example.com".to_string(),
        idempotency_key: "recommendation-publish-fixture-001".to_string(),
    };
    let recommendation_bids = ProjectBidRepository::from_pool(pool.clone());
    assert!(matches!(
        recommendation_bids
            .send(
                recommendation_day_plan_id,
                recommendation_bid_id,
                "recipient-user-1",
                &recommendation_send,
            )
            .await,
        ProjectBidSendResult::Sent(_)
    ));
    let recommendation_publication = sqlx::query(
        "SELECT series.customer_recommendation_reference, series.current_version,
                series.lifecycle_status, publication.id AS publication_id,
                publication.customer_snapshot, publication.snapshot_sha256
         FROM customer_visit_recommendation_series series
         JOIN customer_visit_recommendation_publications publication
           ON publication.customer_recommendation_reference =
              series.customer_recommendation_reference
          AND publication.proposal_version = series.current_version
         WHERE series.source_amendment_id = $1",
    )
    .bind(recommendation_amendment_id)
    .fetch_one(&pool)
    .await
    .expect("provider delivery should atomically publish the exact customer recommendation");
    let recommendation_reference: String =
        recommendation_publication.get("customer_recommendation_reference");
    let recommendation_publication_id: String = recommendation_publication.get("publication_id");
    assert_eq!(
        recommendation_publication.get::<i64, _>("current_version"),
        1
    );
    assert_eq!(
        recommendation_publication.get::<String, _>("lifecycle_status"),
        "pending"
    );
    let recommendation_snapshot =
        recommendation_publication.get::<serde_json::Value, _>("customer_snapshot");
    assert_eq!(recommendation_snapshot["currency_code"], "USD");
    assert_eq!(recommendation_snapshot["total_cents"], 12500);
    assert_eq!(
        recommendation_snapshot["line_items"][0]["service_name"],
        "Hedge shaping"
    );
    let recommendation_snapshot_text = recommendation_snapshot.to_string();
    for private_value in [
        recommendation_bid_id,
        recommendation_amendment_id,
        recommendation_day_plan_id,
        recommendation_stop_id,
        service_release.service_job_id.as_str(),
        "Provider-private fixture note",
        "recommendation-fixture-share-token",
    ] {
        assert!(!recommendation_snapshot_text.contains(private_value));
    }
    assert_eq!(
        recommendation_publication
            .get::<String, _>("snapshot_sha256")
            .len(),
        64
    );
    let publication_count_before_replay = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM customer_visit_recommendation_publications
         WHERE customer_recommendation_reference = $1",
    )
    .bind(&recommendation_reference)
    .fetch_one(&pool)
    .await
    .expect("recommendation publication count should load");
    let notification_count_before_replay = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM notification_outbox
         WHERE entity_type = 'project_bid' AND entity_id = $1",
    )
    .bind(recommendation_bid_id)
    .fetch_one(&pool)
    .await
    .expect("recommendation notification count should load");
    assert!(matches!(
        recommendation_bids
            .send(
                recommendation_day_plan_id,
                recommendation_bid_id,
                "recipient-user-1",
                &recommendation_send,
            )
            .await,
        ProjectBidSendResult::Sent(_)
    ));
    assert_eq!(
        sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM customer_visit_recommendation_publications
             WHERE customer_recommendation_reference = $1",
        )
        .bind(&recommendation_reference)
        .fetch_one(&pool)
        .await
        .expect("recommendation replay count should load"),
        publication_count_before_replay
    );
    assert_eq!(
        sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM notification_outbox
             WHERE entity_type = 'project_bid' AND entity_id = $1",
        )
        .bind(recommendation_bid_id)
        .fetch_one(&pool)
        .await
        .expect("recommendation notification replay count should load"),
        notification_count_before_replay
    );
    assert!(matches!(
        recommendation_bids
            .send(
                recommendation_day_plan_id,
                recommendation_bid_id,
                "recipient-user-1",
                &SendProjectBidRequest {
                    idempotency_key: "recommendation-publish-changed-001".to_string(),
                    ..recommendation_send.clone()
                },
            )
            .await,
        ProjectBidSendResult::PublicationConflict
    ));
    assert!(sqlx::query(
        "UPDATE customer_visit_recommendation_publications
         SET customer_snapshot = '{}'::JSONB WHERE id = $1",
    )
    .bind(&recommendation_publication_id)
    .execute(&pool)
    .await
    .is_err());
    let revision_request = ReviseProjectBidRequest {
        expected_proposal_version: 1,
        customer_message: Some(
            "We revised the hedge recommendation to include two sections.".to_string(),
        ),
        line_items: vec![CreateProjectBidLineItemRequest {
            service_id: "service_fixture_hedge".to_string(),
            service_name: "Hedge shaping".to_string(),
            service_description: Some(
                "Shape two front hedge sections and remove clippings.".to_string(),
            ),
            quantity: 2,
            unit_price_cents: 11000,
            note: Some("Revised provider-private note".to_string()),
        }],
        channel: "email".to_string(),
        recipient: "owner-a@example.com".to_string(),
        idempotency_key: "recommendation-revision-fixture-001".to_string(),
    };
    assert!(matches!(
        recommendation_bids
            .revise(
                recommendation_day_plan_id,
                recommendation_bid_id,
                "recipient-user-1",
                &ReviseProjectBidRequest {
                    expected_proposal_version: 1,
                    customer_message: Some(
                        "We recommend shaping the hedge found during this visit.".to_string(),
                    ),
                    line_items: vec![CreateProjectBidLineItemRequest {
                        service_id: "service_fixture_hedge".to_string(),
                        service_name: "Hedge shaping".to_string(),
                        service_description: Some(
                            "Shape the front hedge and remove clippings.".to_string(),
                        ),
                        quantity: 1,
                        unit_price_cents: 12500,
                        note: Some("A changed private note is not customer scope".to_string()),
                    }],
                    channel: "email".to_string(),
                    recipient: "owner-a@example.com".to_string(),
                    idempotency_key: "recommendation-revision-noop-001".to_string(),
                },
            )
            .await,
        ProjectBidRevisionResult::Conflict
    ));
    let ProjectBidRevisionResult::Revised(revised_bid) = recommendation_bids
        .revise(
            recommendation_day_plan_id,
            recommendation_bid_id,
            "recipient-user-1",
            &revision_request,
        )
        .await
    else {
        panic!("the exact pending recommendation should publish a revision");
    };
    assert_eq!(revised_bid.customer_recommendation_version, Some(2));
    assert_eq!(revised_bid.total_cents, 22000);
    let revised_publication = sqlx::query(
        "SELECT publication.id, publication.supersedes_publication_id,
                publication.customer_snapshot, series.current_version,
                series.lifecycle_status
         FROM customer_visit_recommendation_series series
         JOIN customer_visit_recommendation_publications publication
           ON publication.customer_recommendation_reference =
              series.customer_recommendation_reference
          AND publication.proposal_version = series.current_version
         WHERE series.customer_recommendation_reference = $1",
    )
    .bind(&recommendation_reference)
    .fetch_one(&pool)
    .await
    .expect("the revised recommendation publication should load");
    let recommendation_publication_id: String = revised_publication.get("id");
    assert_eq!(revised_publication.get::<i64, _>("current_version"), 2);
    assert_eq!(
        revised_publication.get::<String, _>("lifecycle_status"),
        "pending"
    );
    assert_eq!(
        revised_publication.get::<Option<String>, _>("supersedes_publication_id"),
        Some(recommendation_publication.get::<String, _>("publication_id"))
    );
    let revised_snapshot = revised_publication.get::<serde_json::Value, _>("customer_snapshot");
    assert_eq!(revised_snapshot["proposal_version"], 2);
    assert_eq!(revised_snapshot["total_cents"], 22000);
    assert!(!revised_snapshot
        .to_string()
        .contains("Revised provider-private note"));
    assert_eq!(
        sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM customer_visit_recommendation_events
             WHERE customer_recommendation_reference = $1
               AND event_kind = 'superseded' AND proposal_version = 1",
        )
        .bind(&recommendation_reference)
        .fetch_one(&pool)
        .await
        .expect("the supersession event should load"),
        1
    );
    let publication_count_after_revision = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM customer_visit_recommendation_publications
         WHERE customer_recommendation_reference = $1",
    )
    .bind(&recommendation_reference)
    .fetch_one(&pool)
    .await
    .expect("the revised publication count should load");
    let notification_count_after_revision = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM notification_outbox
         WHERE entity_type = 'project_bid' AND entity_id = $1",
    )
    .bind(recommendation_bid_id)
    .fetch_one(&pool)
    .await
    .expect("the revised notification count should load");
    assert!(matches!(
        recommendation_bids
            .revise(
                recommendation_day_plan_id,
                recommendation_bid_id,
                "recipient-user-1",
                &revision_request,
            )
            .await,
        ProjectBidRevisionResult::Revised(_)
    ));
    assert_eq!(
        sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM customer_visit_recommendation_publications
             WHERE customer_recommendation_reference = $1",
        )
        .bind(&recommendation_reference)
        .fetch_one(&pool)
        .await
        .expect("the revision replay count should load"),
        publication_count_after_revision
    );
    assert_eq!(
        sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM notification_outbox
             WHERE entity_type = 'project_bid' AND entity_id = $1",
        )
        .bind(recommendation_bid_id)
        .fetch_one(&pool)
        .await
        .expect("the revision notification replay count should load"),
        notification_count_after_revision
    );
    assert!(matches!(
        recommendation_bids
            .revise(
                recommendation_day_plan_id,
                recommendation_bid_id,
                "recipient-user-1",
                &ReviseProjectBidRequest {
                    customer_message: Some("Changed retry content".to_string()),
                    ..revision_request.clone()
                },
            )
            .await,
        ProjectBidRevisionResult::Conflict
    ));
    assert!(matches!(
        recommendation_bids
            .revise(
                recommendation_day_plan_id,
                recommendation_bid_id,
                "recipient-user-1",
                &ReviseProjectBidRequest {
                    idempotency_key: "recommendation-revision-stale-001".to_string(),
                    ..revision_request.clone()
                },
            )
            .await,
        ProjectBidRevisionResult::Conflict
    ));
    sqlx::query(
        "INSERT INTO customer_visit_recommendation_messages (
             id, customer_recommendation_reference, publication_id,
             proposal_version, message_version, message_kind, author_role,
             author_user_id, customer_safe_body, idempotency_key
         ) VALUES (
             'customer_recommendation_message_11111111111111111111111111111111',
             $1, $2, 2, 1, 'customer_question', 'customer', $3,
             'Does this include clipping removal?',
             'recommendation-question-fixture-001'
         )",
    )
    .bind(&recommendation_reference)
    .bind(&recommendation_publication_id)
    .bind(owner_a)
    .execute(&pool)
    .await
    .expect("the current recommendation version should accept a customer question");
    sqlx::query(
        "INSERT INTO customer_visit_recommendation_messages (
             id, customer_recommendation_reference, publication_id,
             proposal_version, message_version, message_kind, author_role,
             author_user_id, customer_safe_body, in_reply_to_message_id,
             idempotency_key
         ) VALUES (
             'customer_recommendation_message_22222222222222222222222222222222',
             $1, $2, 2, 2, 'provider_response', 'provider',
             'recipient-user-1', 'Yes, clipping removal is included.',
             'customer_recommendation_message_11111111111111111111111111111111',
             'recommendation-response-fixture-001'
         )",
    )
    .bind(&recommendation_reference)
    .bind(&recommendation_publication_id)
    .execute(&pool)
    .await
    .expect("the provider response should target the exact customer question");
    assert!(sqlx::query(
        "UPDATE customer_visit_recommendation_messages
         SET customer_safe_body = 'changed' WHERE id =
             'customer_recommendation_message_11111111111111111111111111111111'",
    )
    .execute(&pool)
    .await
    .is_err());
    let customer_recommendations = CustomerVisitRecommendationRepository::from_pool(pool.clone());
    let decision_request = DecideCustomerRecommendationRequest {
        expected_proposal_version: 2,
        action: "approve".to_string(),
        reason_code: None,
        customer_safe_note: None,
        affirmation_text_version: Some("customer_recommendation_approval_v1".to_string()),
        idempotency_key: "recommendation-decision-fixture-001".to_string(),
    };
    let CustomerRecommendationDecisionResult::Recorded(decision_receipt) = customer_recommendations
        .decide(
            owner_a,
            &customer_visit_reference,
            &recommendation_reference,
            decision_request.clone(),
        )
        .await
    else {
        panic!("the exact current version should accept one affirmed decision");
    };
    assert_eq!(decision_receipt.lifecycle_status, "approved");
    assert!(!decision_receipt.replayed);
    assert!(matches!(
        customer_recommendations
            .decide(
                owner_a,
                &customer_visit_reference,
                &recommendation_reference,
                decision_request.clone(),
            )
            .await,
        CustomerRecommendationDecisionResult::Replayed(receipt) if receipt.replayed
    ));
    assert!(matches!(
        customer_recommendations
            .decide(
                owner_a,
                &customer_visit_reference,
                &recommendation_reference,
                DecideCustomerRecommendationRequest {
                    action: "decline".to_string(),
                    affirmation_text_version: None,
                    ..decision_request
                },
            )
            .await,
        CustomerRecommendationDecisionResult::Conflict
    ));
    assert!(sqlx::query(
        "UPDATE customer_visit_recommendation_series
         SET current_version = 3, lifecycle_status = 'pending', updated_at = NOW()
         WHERE customer_recommendation_reference = $1",
    )
    .bind(&recommendation_reference)
    .execute(&pool)
    .await
    .is_err());

    let bearer_amendment_id = "amendment_customer_recommendation_bearer_fixture";
    let bearer_bid_id = "bid_customer_recommendation_bearer_fixture";
    sqlx::query(
        "INSERT INTO day_plan_amendment_requests (
             id, day_plan_id, requested_by_crew_id, amendment_type, status,
             stop_id, service_id, service_name, default_duration_minutes,
             default_price_cents, requires_manager_approval, requires_bid
         ) VALUES (
             $1, $2, 'crew_customer_recommendation_fixture', 'add_service',
             'bid_review', $3, 'service_fixture_cleanup', 'Visit cleanup',
             30, 7500, TRUE, TRUE
         )",
    )
    .bind(bearer_amendment_id)
    .bind(recommendation_day_plan_id)
    .bind(recommendation_stop_id)
    .execute(&pool)
    .await
    .expect("the bearer reconciliation amendment should persist");
    sqlx::query(
        "INSERT INTO project_bids (
             id, day_plan_id, customer_account_id, source_amendment_id,
             status, customer_message
         ) VALUES ($1, $2, $3, $4, 'draft', 'Optional visit cleanup.')",
    )
    .bind(bearer_bid_id)
    .bind(recommendation_day_plan_id)
    .bind(&activation.customer_account_id)
    .bind(bearer_amendment_id)
    .execute(&pool)
    .await
    .expect("the bearer reconciliation bid should persist");
    sqlx::query(
        "INSERT INTO project_bid_line_items (
             id, project_bid_id, service_id, service_name, quantity,
             unit_price_cents, sort_order
         ) VALUES (
             'bid_customer_recommendation_bearer_fixture_line_1', $1,
             'service_fixture_cleanup', 'Visit cleanup', 1, 7500, 1
         )",
    )
    .bind(bearer_bid_id)
    .execute(&pool)
    .await
    .expect("the bearer reconciliation line item should persist");
    assert!(matches!(
        recommendation_bids
            .send(
                recommendation_day_plan_id,
                bearer_bid_id,
                "recipient-user-1",
                &SendProjectBidRequest {
                    channel: "email".to_string(),
                    recipient: "owner-a@example.com".to_string(),
                    idempotency_key: "recommendation-bearer-publish-001".to_string(),
                },
            )
            .await,
        ProjectBidSendResult::Sent(_)
    ));
    let bearer_share_token =
        sqlx::query_scalar::<_, String>("SELECT share_token FROM project_bids WHERE id = $1")
            .bind(bearer_bid_id)
            .fetch_one(&pool)
            .await
            .expect("the bearer reconciliation token should load");
    assert!(matches!(
        recommendation_bids
            .decide_shared(&bearer_share_token, "approve")
            .await,
        ProjectBidMutationResult::Updated(bid) if bid.status == "approved"
    ));
    let bearer_reconciliation = sqlx::query(
        "SELECT series.lifecycle_status, event.event_kind, event.event_data,
                (SELECT COUNT(*) FROM customer_visit_recommendation_decisions decision
                  WHERE decision.customer_recommendation_reference =
                        series.customer_recommendation_reference) AS decision_count
         FROM customer_visit_recommendation_series series
         JOIN customer_visit_recommendation_events event
           ON event.customer_recommendation_reference =
              series.customer_recommendation_reference
          AND event.proposal_version = series.current_version
          AND event.event_kind = 'withdrawn'
         WHERE series.source_amendment_id = $1",
    )
    .bind(bearer_amendment_id)
    .fetch_one(&pool)
    .await
    .expect("the legacy bearer decision should close the signed-in surface");
    assert_eq!(
        bearer_reconciliation.get::<String, _>("lifecycle_status"),
        "withdrawn"
    );
    assert_eq!(
        bearer_reconciliation.get::<String, _>("event_kind"),
        "withdrawn"
    );
    assert_eq!(
        bearer_reconciliation.get::<serde_json::Value, _>("event_data")["legacy_decision"],
        "approve"
    );
    assert_eq!(bearer_reconciliation.get::<i64, _>("decision_count"), 0);

    let CustomerRecommendationListResult::Loaded(recommendation_collection) =
        customer_recommendations
            .list_for_visit(owner_a, &customer_visit_reference)
            .await
    else {
        panic!("the exact owner should load minimized visit recommendations");
    };
    assert_eq!(
        recommendation_collection.customer_visit_reference,
        customer_visit_reference
    );
    assert_eq!(recommendation_collection.recommendations.len(), 2);
    let recommendation_summary = recommendation_collection
        .recommendations
        .iter()
        .find(|summary| summary.customer_recommendation_reference == recommendation_reference)
        .expect("the revised recommendation should appear in the exact visit list");
    assert_eq!(recommendation_summary.current_version, 2);
    assert_eq!(recommendation_summary.lifecycle_status, "approved");
    assert_eq!(
        recommendation_summary.current_publication.total_cents,
        22000
    );
    let recommendation_collection_json = serde_json::to_string(&recommendation_collection)
        .expect("the recommendation collection should serialize");
    for private_value in [
        recommendation_bid_id,
        recommendation_amendment_id,
        recommendation_day_plan_id,
        recommendation_stop_id,
        service_release.service_job_id.as_str(),
        "Revised provider-private note",
        "owner-a@example.com",
        bearer_share_token.as_str(),
    ] {
        assert!(!recommendation_collection_json.contains(private_value));
    }
    let CustomerRecommendationDetailResult::Loaded(recommendation_detail) =
        customer_recommendations
            .get_for_visit(
                owner_a,
                &customer_visit_reference,
                &recommendation_reference,
            )
            .await
    else {
        panic!("the exact owner should load immutable recommendation history");
    };
    assert_eq!(recommendation_detail.current_version, 2);
    assert_eq!(recommendation_detail.versions.len(), 2);
    assert_eq!(recommendation_detail.versions[0].proposal_version, 1);
    assert_eq!(recommendation_detail.versions[1].proposal_version, 2);
    assert!(matches!(
        customer_recommendations
            .get_for_visit(
                owner_b,
                &customer_visit_reference,
                &recommendation_reference
            )
            .await,
        CustomerRecommendationDetailResult::NotAuthorized
    ));
    assert!(matches!(
        customer_recommendations
            .get_for_visit(
                owner_a,
                "customer_visit_00000000000000000000000000000000",
                &recommendation_reference,
            )
            .await,
        CustomerRecommendationDetailResult::NotFound
    ));

    let question_request = CreateCustomerVisitQuestionRequest {
        expected_thread_version: 0,
        topic: "access".to_string(),
        customer_safe_body: "Should I leave the side gate unlocked?".to_string(),
        idempotency_key: "customer-visit-question-001".to_string(),
    };
    sqlx::query(
        "UPDATE customer_portal_access_grants
         SET status = 'revoked', revoked_at = NOW()
         WHERE activation_id = $1",
    )
    .bind(&activation.activation_id)
    .execute(&pool)
    .await
    .expect("the fixture portal grant should revoke before question checks");
    assert!(matches!(
        visit_communication
            .get_customer_thread(owner_a, &customer_visit_reference)
            .await,
        CustomerVisitThreadReadResult::NotAuthorized
    ));
    assert!(matches!(
        customer_recommendations
            .list_for_visit(owner_a, &customer_visit_reference)
            .await,
        CustomerRecommendationListResult::NotAuthorized
    ));
    assert!(matches!(
        visit_communication
            .get_customer_proof(owner_a, &customer_visit_reference)
            .await,
        CustomerVisitProofReadResult::NotAuthorized
    ));
    assert!(matches!(
        visit_communication
            .create_customer_question(owner_a, &customer_visit_reference, question_request.clone(),)
            .await,
        CustomerVisitMessageWriteResult::NotAuthorized
    ));
    sqlx::query(
        "UPDATE customer_portal_access_grants
         SET status = 'active', revoked_at = NULL
         WHERE activation_id = $1",
    )
    .bind(&activation.activation_id)
    .execute(&pool)
    .await
    .expect("the fixture portal grant should restore before question creation");
    sqlx::query("UPDATE organization_memberships SET status = 'suspended' WHERE id = $1")
        .bind(&activation.owner_membership_id)
        .execute(&pool)
        .await
        .expect("the fixture owner membership should suspend before question checks");
    assert!(matches!(
        visit_communication
            .get_customer_thread(owner_a, &customer_visit_reference)
            .await,
        CustomerVisitThreadReadResult::InvalidAuthorization
    ));
    assert!(matches!(
        customer_recommendations
            .list_for_visit(owner_a, &customer_visit_reference)
            .await,
        CustomerRecommendationListResult::InvalidAuthorization
    ));
    assert!(matches!(
        visit_communication
            .get_customer_proof(owner_a, &customer_visit_reference)
            .await,
        CustomerVisitProofReadResult::InvalidAuthorization
    ));
    assert!(matches!(
        visit_communication
            .create_customer_question(owner_a, &customer_visit_reference, question_request.clone(),)
            .await,
        CustomerVisitMessageWriteResult::InvalidAuthorization
    ));
    sqlx::query("UPDATE organization_memberships SET status = 'active' WHERE id = $1")
        .bind(&activation.owner_membership_id)
        .execute(&pool)
        .await
        .expect("the fixture owner membership should restore before question creation");
    let (first_question, second_question) = tokio::join!(
        visit_communication.create_customer_question(
            owner_a,
            &customer_visit_reference,
            question_request.clone(),
        ),
        visit_communication.create_customer_question(
            owner_a,
            &customer_visit_reference,
            question_request.clone(),
        ),
    );
    let question = match (first_question, second_question) {
        (
            CustomerVisitMessageWriteResult::Created(created),
            CustomerVisitMessageWriteResult::Replayed(replayed),
        )
        | (
            CustomerVisitMessageWriteResult::Replayed(replayed),
            CustomerVisitMessageWriteResult::Created(created),
        ) => {
            assert_eq!(created, replayed);
            created
        }
        (first, second) => panic!(
            "concurrent exact customer question should save once and replay once, got {first:?} and {second:?}"
        ),
    };
    assert_eq!(question.message_version, 1);
    assert_eq!(question.message_kind, "customer_question");
    assert_eq!(question.author_role, "customer");
    assert_eq!(question.topic, "access");
    let ProviderVisitThreadListResult::Loaded(question_queue) = visit_communication
        .list_provider_threads("recipient-user-1")
        .await
    else {
        panic!("the provider queue should reload after a customer question");
    };
    assert!(question_queue.threads[0].awaiting_provider_response);
    assert_eq!(
        question_queue.threads[0].latest_message.as_ref(),
        Some(&question)
    );
    assert!(matches!(
        visit_communication
            .create_customer_question(
                owner_a,
                &customer_visit_reference,
                CreateCustomerVisitQuestionRequest {
                    customer_safe_body: "This changed after the first attempt.".to_string(),
                    ..question_request.clone()
                },
            )
            .await,
        CustomerVisitMessageWriteResult::Conflict
    ));
    let response_request = CreateProviderVisitResponseRequest {
        expected_thread_version: 1,
        in_reply_to_message_id: question.message_id.clone(),
        customer_safe_body: "Yes. Please leave it unlocked for the arrival window.".to_string(),
        idempotency_key: "provider-visit-response-001".to_string(),
    };
    assert!(matches!(
        visit_communication
            .create_provider_response(
                "recipient-user-without-membership",
                &customer_visit_reference,
                response_request.clone(),
            )
            .await,
        CustomerVisitMessageWriteResult::NotFound
    ));
    let CustomerVisitMessageWriteResult::Created(response) = visit_communication
        .create_provider_response(
            "recipient-user-1",
            &customer_visit_reference,
            response_request.clone(),
        )
        .await
    else {
        panic!("an exact provider owner/manager should answer the customer question");
    };
    assert_eq!(response.message_version, 2);
    assert_eq!(response.message_kind, "provider_response");
    assert_eq!(response.author_role, "provider");
    assert_eq!(response.topic, question.topic);
    assert_eq!(
        response.in_reply_to_message_id.as_deref(),
        Some(question.message_id.as_str())
    );
    assert!(matches!(
        visit_communication
            .create_provider_response(
                "recipient-user-1",
                &customer_visit_reference,
                response_request.clone(),
            )
            .await,
        CustomerVisitMessageWriteResult::Replayed(record) if record == response
    ));
    assert!(matches!(
        visit_communication
            .create_provider_response(
                "recipient-user-1",
                &customer_visit_reference,
                CreateProviderVisitResponseRequest {
                    expected_thread_version: 2,
                    idempotency_key: "provider-second-response-001".to_string(),
                    ..response_request.clone()
                },
            )
            .await,
        CustomerVisitMessageWriteResult::Conflict
    ));
    let CustomerVisitThreadReadResult::Loaded(customer_thread) = visit_communication
        .get_customer_thread(owner_a, &customer_visit_reference)
        .await
    else {
        panic!("the customer should reload the authoritative visit conversation");
    };
    let CustomerVisitThreadReadResult::Loaded(provider_thread) = visit_communication
        .get_provider_thread("recipient-user-1", &customer_visit_reference)
        .await
    else {
        panic!("the exact provider should reload the authoritative visit conversation");
    };
    assert_eq!(customer_thread, provider_thread);
    assert_eq!(customer_thread.current_version, 2);
    assert_eq!(customer_thread.messages, vec![question.clone(), response]);
    let ProviderVisitThreadListResult::Loaded(answered_queue) = visit_communication
        .list_provider_threads("recipient-user-1")
        .await
    else {
        panic!("the provider queue should reload after its exact response");
    };
    assert!(!answered_queue.threads[0].awaiting_provider_response);
    assert_eq!(
        answered_queue.threads[0].latest_message,
        customer_thread.messages.last().cloned()
    );
    let thread_json =
        serde_json::to_string(&customer_thread).expect("customer visit thread should serialize");
    for private_value in [
        &service_release.release_id,
        &service_release.service_job_id,
        &activation.activation_id,
        &activation.customer_account_id,
        &activation.customer_property_id,
        "recipient-user-1",
        owner_a,
    ] {
        assert!(!thread_json.contains(private_value));
    }
    assert!(sqlx::query(
        "UPDATE customer_service_visit_threads
         SET customer_property_id = $2, current_version = current_version + 1
         WHERE customer_visit_reference = $1",
    )
    .bind(&customer_visit_reference)
    .bind(sibling_property_id)
    .execute(&pool)
    .await
    .is_err());
    assert!(sqlx::query(
        "UPDATE customer_service_visit_messages
         SET customer_safe_body = 'changed' WHERE id = $1",
    )
    .bind(&question.message_id)
    .execute(&pool)
    .await
    .is_err());
    assert!(sqlx::query(
        "INSERT INTO customer_service_visit_messages (
             id, customer_visit_reference, organization_id,
             customer_account_id, customer_property_id, message_version,
             message_kind, author_role, author_user_id, topic,
             customer_safe_body, idempotency_key
         )
         SELECT 'cross_property_customer_visit_message',
                customer_visit_reference, organization_id,
                customer_account_id, $2, 99, 'customer_question', 'customer',
                'cross-property-actor', 'other', 'Invalid cross-property message.',
                'cross-property-message-001'
         FROM customer_service_visit_threads
         WHERE customer_visit_reference = $1",
    )
    .bind(&customer_visit_reference)
    .bind(sibling_property_id)
    .execute(&pool)
    .await
    .is_err());

    let mut en_route_request = PublishCustomerServiceDayEventRequest {
        expected_event_version: 0,
        status: "en_route".to_string(),
        customer_safe_reason: None,
        next_update_message: "Your provider is on the way for the confirmed window.".to_string(),
        window_start_epoch_seconds: None,
        window_end_epoch_seconds: None,
        time_zone: None,
        idempotency_key: "service-day-en-route-001".to_string(),
    };
    sqlx::query(
        "UPDATE owner_provider_active_relationships
         SET status = 'ended', ended_at = NOW(), updated_at = NOW()
         WHERE activation_id = $1",
    )
    .bind(&activation.activation_id)
    .execute(&pool)
    .await
    .expect("the fixture relationship should end");
    assert!(matches!(
        visit_communication
            .get_customer_thread(owner_a, &customer_visit_reference)
            .await,
        CustomerVisitThreadReadResult::NotFound
    ));
    assert!(matches!(
        visit_communication
            .get_customer_proof(owner_a, &customer_visit_reference)
            .await,
        CustomerVisitProofReadResult::NotFound
    ));
    assert!(matches!(
        visit_communication
            .get_provider_thread("recipient-user-1", &customer_visit_reference)
            .await,
        CustomerVisitThreadReadResult::NotFound
    ));
    assert!(matches!(
        visit_communication
            .create_customer_question(owner_a, &customer_visit_reference, question_request,)
            .await,
        CustomerVisitMessageWriteResult::NotFound
    ));
    let ProviderVisitThreadListResult::Loaded(ended_queue) = visit_communication
        .list_provider_threads("recipient-user-1")
        .await
    else {
        panic!("an authorized provider should retain an empty queue after relationship closure");
    };
    assert!(ended_queue.threads.is_empty());
    assert!(matches!(
        mobilization
            .publish_customer_service_day_event(
                "recipient-user-1",
                &service_release.release_id,
                en_route_request.clone(),
            )
            .await,
        CustomerServiceDayEventWriteResult::NotFound
    ));
    assert!(matches!(
        mobilization
            .get_service_release("recipient-user-1", &activation.activation_id)
            .await,
        ServiceMobilizationReadResult::NotFound
    ));
    assert_eq!(
        sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM customer_service_day_events WHERE release_id = $1",
        )
        .bind(&service_release.release_id)
        .fetch_one(&pool)
        .await
        .expect("service-day event count after ended relationship should load"),
        0
    );
    sqlx::query(
        "UPDATE owner_provider_active_relationships
         SET status = 'active', ended_at = NULL, updated_at = NOW()
         WHERE activation_id = $1",
    )
    .bind(&activation.activation_id)
    .execute(&pool)
    .await
    .expect("the fixture relationship should restore");
    assert!(matches!(
        mobilization
            .publish_customer_service_day_event(
                "recipient-user-without-membership",
                &service_release.release_id,
                en_route_request.clone(),
            )
            .await,
        CustomerServiceDayEventWriteResult::NotFound
    ));
    let CustomerServiceDayEventWriteResult::Published(weather_delay) = mobilization
        .publish_customer_service_day_event(
            "recipient-user-1",
            &service_release.release_id,
            PublishCustomerServiceDayEventRequest {
                expected_event_version: 0,
                status: "weather_delay".to_string(),
                customer_safe_reason: Some("Lightning is nearby.".to_string()),
                next_update_message: "We will share another update in 30 minutes.".to_string(),
                window_start_epoch_seconds: None,
                window_end_epoch_seconds: None,
                time_zone: None,
                idempotency_key: "service-day-weather-delay-001".to_string(),
            },
        )
        .await
    else {
        panic!("an authorized provider should publish a customer-safe weather delay");
    };
    assert_eq!(weather_delay.event_version, 1);
    let CustomerPortalVisitReadResult::Loaded(weather_customer_visits) =
        portal_access.list_confirmed_visits(owner_a).await
    else {
        panic!("the authorized owner should load the explicit weather delay");
    };
    let weather_customer_visit = &weather_customer_visits.visits[0];
    assert_eq!(weather_customer_visit.status, "weather_delay");
    assert_eq!(
        weather_customer_visit.customer_safe_reason.as_deref(),
        Some("Lightning is nearby.")
    );
    assert_eq!(
        weather_customer_visit.next_update_message,
        "We will share another update in 30 minutes."
    );
    let rescheduled_start = first_visit_start + 172_800;
    let rescheduled_end = rescheduled_start + 7_200;
    let CustomerServiceDayEventWriteResult::Published(rescheduled) = mobilization
        .publish_customer_service_day_event(
            "recipient-user-1",
            &service_release.release_id,
            PublishCustomerServiceDayEventRequest {
                expected_event_version: 1,
                status: "rescheduled".to_string(),
                customer_safe_reason: None,
                next_update_message: "Your new arrival window is confirmed.".to_string(),
                window_start_epoch_seconds: Some(rescheduled_start),
                window_end_epoch_seconds: Some(rescheduled_end),
                time_zone: Some("America/Phoenix".to_string()),
                idempotency_key: "service-day-rescheduled-001".to_string(),
            },
        )
        .await
    else {
        panic!("an authorized provider should publish a bounded reschedule");
    };
    assert_eq!(rescheduled.event_version, 2);
    let CustomerPortalVisitReadResult::Loaded(rescheduled_customer_visits) =
        portal_access.list_confirmed_visits(owner_a).await
    else {
        panic!("the authorized owner should load the explicit reschedule");
    };
    let rescheduled_customer_visit = &rescheduled_customer_visits.visits[0];
    assert_eq!(rescheduled_customer_visit.status, "rescheduled");
    assert_eq!(
        rescheduled_customer_visit.window_start_epoch_seconds,
        rescheduled_start
    );
    assert_eq!(
        rescheduled_customer_visit.window_end_epoch_seconds,
        rescheduled_end
    );
    assert_eq!(
        rescheduled_customer_visit.original_window_start_epoch_seconds,
        Some(first_visit_start + 86_400)
    );
    assert_eq!(
        rescheduled_customer_visit.original_window_end_epoch_seconds,
        Some(first_visit_start + 93_600)
    );
    assert_eq!(
        rescheduled_customer_visit.original_time_zone.as_deref(),
        Some("America/Phoenix")
    );
    assert_eq!(
        rescheduled_customer_visit.next_update_message,
        "Your new arrival window is confirmed."
    );
    assert!(rescheduled_customer_visit.customer_safe_reason.is_none());
    en_route_request.expected_event_version = 2;
    let CustomerServiceDayEventWriteResult::Published(en_route) = mobilization
        .publish_customer_service_day_event(
            "recipient-user-1",
            &service_release.release_id,
            en_route_request.clone(),
        )
        .await
    else {
        panic!("an authorized provider should publish the en-route update");
    };
    assert_eq!(en_route.event_version, 3);
    assert_eq!(en_route.status, "en_route");
    let ServiceMobilizationReadResult::Loaded(en_route_status) = mobilization
        .get_service_release("recipient-user-1", &activation.activation_id)
        .await
    else {
        panic!("the provider should reload the published customer status");
    };
    assert_eq!(en_route_status.current_customer_status, "en_route");
    assert_eq!(en_route_status.current_event_version, 3);
    assert_eq!(
        en_route_status.latest_customer_event,
        Some(en_route.clone())
    );
    let CustomerPortalVisitReadResult::Loaded(en_route_customer_visits) =
        portal_access.list_confirmed_visits(owner_a).await
    else {
        panic!("the authorized owner should load the explicit en-route update");
    };
    let en_route_customer_visit = &en_route_customer_visits.visits[0];
    assert_eq!(en_route_customer_visit.status, "en_route");
    assert_eq!(
        en_route_customer_visit.window_start_epoch_seconds,
        rescheduled_start
    );
    assert_eq!(
        en_route_customer_visit.next_update_message,
        "Your provider is on the way for the confirmed window."
    );
    assert!(matches!(
        mobilization
            .publish_customer_service_day_event(
                "recipient-user-1",
                &service_release.release_id,
                en_route_request,
            )
            .await,
        CustomerServiceDayEventWriteResult::Replayed(record) if record == en_route
    ));
    let care_request = PublishCustomerServiceDayEventRequest {
        expected_event_version: 3,
        status: "care_in_progress".to_string(),
        customer_safe_reason: None,
        next_update_message: "Care is underway. Proof will follow after review.".to_string(),
        window_start_epoch_seconds: None,
        window_end_epoch_seconds: None,
        time_zone: None,
        idempotency_key: "service-day-care-001".to_string(),
    };
    assert!(matches!(
        mobilization
            .publish_customer_service_day_event(
                "recipient-user-1",
                &service_release.release_id,
                care_request.clone(),
            )
            .await,
        CustomerServiceDayEventWriteResult::InvalidState
    ));
    sqlx::query("UPDATE service_jobs SET status = 'in_progress' WHERE id = $1")
        .bind(&service_release.service_job_id)
        .execute(&pool)
        .await
        .expect("the released job should enter provider execution");
    let CustomerServiceDayEventWriteResult::Published(care) = mobilization
        .publish_customer_service_day_event(
            "recipient-user-1",
            &service_release.release_id,
            care_request,
        )
        .await
    else {
        panic!("in-progress operational work should permit the customer update");
    };
    assert_eq!(care.event_version, 4);
    let completion_request = PublishCustomerServiceDayEventRequest {
        expected_event_version: 4,
        status: "complete_proof_pending".to_string(),
        customer_safe_reason: None,
        next_update_message: "Care is complete. Proof will appear after provider review."
            .to_string(),
        window_start_epoch_seconds: None,
        window_end_epoch_seconds: None,
        time_zone: None,
        idempotency_key: "service-day-complete-001".to_string(),
    };
    assert!(matches!(
        mobilization
            .publish_customer_service_day_event(
                "recipient-user-1",
                &service_release.release_id,
                completion_request.clone(),
            )
            .await,
        CustomerServiceDayEventWriteResult::InvalidState
    ));
    sqlx::query("UPDATE service_jobs SET status = 'completed' WHERE id = $1")
        .bind(&service_release.service_job_id)
        .execute(&pool)
        .await
        .expect("the released job should complete provider execution");
    let CustomerServiceDayEventWriteResult::Published(completed) = mobilization
        .publish_customer_service_day_event(
            "recipient-user-1",
            &service_release.release_id,
            completion_request,
        )
        .await
    else {
        panic!("completed operational work should permit proof-pending publication");
    };
    assert_eq!(completed.event_version, 5);
    let CustomerPortalVisitReadResult::Loaded(completed_customer_visits) =
        portal_access.list_confirmed_visits(owner_a).await
    else {
        panic!("the authorized owner should load the explicit completion update");
    };
    let completed_customer_visit = &completed_customer_visits.visits[0];
    assert_eq!(completed_customer_visit.status, "complete_proof_pending");
    assert!(completed_customer_visit.delivered_proof_available);
    let completed_customer_json = serde_json::to_string(completed_customer_visit)
        .expect("completed customer visit should serialize");
    for private_value in [&service_release.release_id, &service_release.service_job_id] {
        assert!(!completed_customer_json.contains(private_value));
    }
    assert!(sqlx::query(
        "UPDATE customer_service_day_events
         SET next_update_message = 'changed' WHERE release_id = $1",
    )
    .bind(&service_release.release_id)
    .execute(&pool)
    .await
    .is_err());
    assert!(sqlx::query(
        "INSERT INTO customer_service_day_events (
             id, release_id, organization_id, customer_account_id,
             customer_property_id, actor_user_id, actor_membership_id,
             event_version, event_kind, next_update_message, idempotency_key
         )
         SELECT 'cross_property_service_day_event', release.id,
                release.organization_id, release.customer_account_id, $2,
                release.released_by_user_id, release.released_by_membership_id,
                99, 'en_route', 'Invalid cross-property update.',
                'cross-property-event-001'
         FROM owner_provider_service_releases release WHERE release.id = $1",
    )
    .bind(&service_release.release_id)
    .bind(sibling_property_id)
    .execute(&pool)
    .await
    .is_err());
    assert!(sqlx::query(
        "UPDATE owner_provider_relationship_activations
         SET proposal_version = proposal_version + 1 WHERE id = $1",
    )
    .bind(&activation.activation_id)
    .execute(&pool)
    .await
    .is_err());

    let expired_proposal_id = "owner_provider_proposal_expiration_fixture";
    sqlx::query(
        "INSERT INTO owner_provider_initial_service_proposals (
             id, owner_user_id, property_id, invitation_id, organization_id,
             disclosure_grant_id, assessment_id, provider_actor_user_id,
             proposal_version, status, title, customer_summary, included_scope,
             exclusions, cadence_code, cadence_detail, arrival_policy,
             weather_policy, cancellation_policy, proof_expectation,
             price_amount_minor, price_basis, currency_code,
             annualized_monthly_minor, revision_note, issued_at, expires_at,
             idempotency_key
         )
         SELECT $1, owner_user_id, property_id, invitation_id, organization_id,
                disclosure_grant_id, assessment_id, provider_actor_user_id,
                proposal_version + 1, 'sent', title, customer_summary,
                included_scope, exclusions, cadence_code, cadence_detail,
                arrival_policy, weather_policy, cancellation_policy,
                proof_expectation, price_amount_minor, price_basis, currency_code,
                annualized_monthly_minor, 'Expiration reconciliation fixture',
                NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day',
                'proposal-expiration-fixture-001'
         FROM owner_provider_initial_service_proposals WHERE id = $2",
    )
    .bind(expired_proposal_id)
    .bind(&proposal_v2.proposal_id)
    .execute(&pool)
    .await
    .expect("an already-expired immutable proposal fixture should insert");
    let OwnerReadResult::Loaded(proposals_after_expiration) = repository
        .list_owner_initial_service_proposals(owner_a, &property.property_id)
        .await
    else {
        panic!("owner proposal reads should reconcile server-derived expiration");
    };
    assert!(proposals_after_expiration.iter().any(|proposal| {
        proposal.proposal_id == expired_proposal_id && proposal.status == "expired"
    }));
    assert_eq!(
        sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM owner_provider_initial_service_proposal_events
             WHERE proposal_id = $1 AND actor_user_id = 'system'
               AND event_kind = 'expired'",
        )
        .bind(expired_proposal_id)
        .fetch_one(&pool)
        .await
        .expect("proposal expiration event should load"),
        1
    );
    assert!(matches!(
        repository
            .decide_initial_service_proposal(
                owner_a,
                &property.property_id,
                expired_proposal_id,
                DecideOwnerProviderInitialServiceProposalRequest {
                    action: "accept".to_string(),
                    expected_proposal_version: proposal_v2.proposal_version + 1,
                    reason_code: None,
                    customer_safe_note: None,
                    affirmation_text_version: Some(
                        "initial_service_proposal_acceptance_v1".to_string(),
                    ),
                    idempotency_key: "proposal-expired-decision-001".to_string(),
                },
            )
            .await,
        OwnerProviderInitialServiceProposalDecisionResult::InvalidState(proposal)
            if proposal.status == "expired"
    ));
    assert!(matches!(
        repository
            .create_owner_initial_service_proposal_message(
                owner_a,
                &property.property_id,
                expired_proposal_id,
                CreateOwnerInitialServiceProposalMessageRequest {
                    message_kind: "owner_question".to_string(),
                    customer_safe_body: "Is this expired proposal still available?".to_string(),
                    expected_proposal_version: proposal_v2.proposal_version + 1,
                    idempotency_key: "proposal-expired-question-001".to_string(),
                },
            )
            .await,
        OwnerProviderInitialServiceProposalMessageWriteResult::InvalidState(proposal)
            if proposal.status == "expired"
    ));

    assert!(matches!(
        repository
            .list_provider_disclosure_receipts(owner_b, &property.property_id)
            .await,
        OwnerReadResult::NotFound
    ));
    let OwnerReadResult::Loaded(active_receipts) = repository
        .list_provider_disclosure_receipts(owner_a, &property.property_id)
        .await
    else {
        panic!("owner disclosure receipt history should load");
    };
    assert_eq!(active_receipts.len(), 1);
    assert_eq!(active_receipts[0].status, "active");
    assert_eq!(active_receipts[0].latest_event_kind, "created");
    assert_eq!(active_receipts[0].selected_photos.len(), 1);
    let revoke_request = RevokeOwnerProviderDisclosureGrantRequest {
        expected_version: disclosure_grant.version,
        reason_code: "privacy_concern".to_string(),
        owner_confirmed: true,
        idempotency_key: "provider-disclosure-revoke-001".to_string(),
    };
    assert!(matches!(
        repository
            .revoke_provider_disclosure_grant(
                owner_b,
                &property.property_id,
                &disclosure_grant.grant_id,
                revoke_request.clone(),
            )
            .await,
        OwnerProviderDisclosureGrantRevokeResult::NotFound
    ));
    let OwnerProviderDisclosureGrantRevokeResult::Revoked(revoked_receipt) = repository
        .revoke_provider_disclosure_grant(
            owner_a,
            &property.property_id,
            &disclosure_grant.grant_id,
            revoke_request.clone(),
        )
        .await
    else {
        panic!("owner should revoke future provider assessment access");
    };
    assert_eq!(revoked_receipt.status, "revoked");
    assert_eq!(revoked_receipt.version, disclosure_grant.version + 1);
    assert_eq!(revoked_receipt.latest_event_kind, "revoked");
    assert_eq!(
        revoked_receipt.latest_reason_code.as_deref(),
        Some("privacy_concern")
    );
    assert!(matches!(
        repository
            .revoke_provider_disclosure_grant(
                owner_a,
                &property.property_id,
                &disclosure_grant.grant_id,
                revoke_request.clone(),
            )
            .await,
        OwnerProviderDisclosureGrantRevokeResult::Replayed(receipt)
            if receipt.version == revoked_receipt.version
    ));
    assert!(matches!(
        repository
            .revoke_provider_disclosure_grant(
                owner_a,
                &property.property_id,
                &disclosure_grant.grant_id,
                RevokeOwnerProviderDisclosureGrantRequest {
                    reason_code: "owner_choice".to_string(),
                    ..revoke_request
                },
            )
            .await,
        OwnerProviderDisclosureGrantRevokeResult::Conflict
    ));
    let OwnerProviderDisclosureAccessResult::Closed(revoked_access) = repository
        .open_provider_disclosure(
            "recipient-user-1",
            recipient,
            OpenOwnerProviderDisclosureRequest {
                token: retry.delivery_token().to_string(),
            },
        )
        .await
    else {
        panic!("revoked disclosure should return status-only provider recovery");
    };
    assert_eq!(revoked_access.status, "revoked");
    assert!(!revoked_access.can_access);
    let revoked_access_json =
        serde_json::to_string(&revoked_access).expect("revoked access should serialize");
    assert!(!revoked_access_json.contains("421 Private Canyon Road"));
    assert!(!revoked_access_json.contains("front-yard.jpg"));
    let OwnerProviderProgressResult::Loaded(revoked_access_progress) = repository
        .provider_invitation_progress(
            "recipient-user-1",
            recipient,
            OpenOwnerProviderInboxRequest {
                token: retry.delivery_token().to_string(),
            },
        )
        .await
    else {
        panic!("provider progress should show ended assessment access");
    };
    assert_eq!(
        revoked_access_progress.progress_stage,
        "relationship_activated"
    );
    let OwnerReadResult::Loaded(revoked_owner_progress) = repository
        .list_provider_connection_progress(owner_a, &property.property_id)
        .await
    else {
        panic!("owner progress should show ended assessment access");
    };
    assert_eq!(
        revoked_owner_progress
            .iter()
            .find(|entry| entry.invitation_id == retry.invitation.invitation_id)
            .expect("revoked grant progress")
            .progress_stage,
        "relationship_activated"
    );

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
        1,
        "one concurrent organization bootstrap should win: {concurrent_result_a:?}, {concurrent_result_b:?}"
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
        OwnerProviderInvitationMutationResult::InvalidState(invitation)
            if invitation.status == "activated" && invitation.delivery_status == "delivered"
    ));
    assert!(matches!(
        repository
            .revoke_provider_invitation(
                owner_a,
                &property.property_id,
                &created.invitation.invitation_id,
            )
            .await,
        OwnerProviderInvitationMutationResult::InvalidState(invitation)
            if invitation.status == "activated"
    ));
    assert!(matches!(
        repository
            .preview_provider_invitation(retry.delivery_token())
            .await,
        OwnerProviderInvitationPreviewResult::Closed(invitation)
            if invitation.status == "activated"
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
        0
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
    assert_eq!(
        closed_provider_progress.progress_stage,
        "relationship_activated"
    );
    assert_eq!(
        closed_provider_progress.status_label,
        "Provider relationship activated"
    );
    assert!(closed_provider_progress.response_action.is_none());
    assert!(closed_provider_progress.response_label.is_none());
    assert!(!closed_provider_progress.organization_relationship_checked);
    assert!(!closed_provider_progress.opportunity_response_capability);
    let OwnerProviderDisclosureAccessResult::Closed(closed_disclosure) = repository
        .open_provider_disclosure(
            "recipient-user-1",
            recipient,
            OpenOwnerProviderDisclosureRequest {
                token: retry.delivery_token().to_string(),
            },
        )
        .await
    else {
        panic!("revoked invitation should close future provider disclosure reads");
    };
    assert_eq!(closed_disclosure.status, "revoked");
    assert!(!closed_disclosure.can_access);
    let closed_disclosure_json =
        serde_json::to_string(&closed_disclosure).expect("closed disclosure should serialize");
    assert!(!closed_disclosure_json.contains("421 Private Canyon Road"));
    assert!(!closed_disclosure_json.contains("front-yard.jpg"));
    assert!(!closed_disclosure_json.contains("approved_categories"));
    assert_eq!(
        sqlx::query_scalar::<_, String>(
            "SELECT status FROM owner_provider_disclosure_grants WHERE id = $1",
        )
        .bind(&disclosure_grant.grant_id)
        .fetch_one(&pool)
        .await
        .expect("closed disclosure grant status should load"),
        "revoked"
    );
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
                invitation_request(
                    "replacement@sonoranyard.example",
                    "provider-invite-after-revoke",
                ),
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
    let report_result = repository
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
        .await;
    let OwnerProviderOpportunityResponseResult::Recorded(report) = report_result else {
        panic!("authorized safety report should be routed, got {report_result:?}");
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

    reset_provider_invitation_test_owners(&pool, &[owner_a, owner_b]).await;
    sqlx::query(
        "DELETE FROM organizations
         WHERE id = ANY($1)
            OR LOWER(BTRIM(display_name)) IN (
                'cactus bloom groundskeeping', 'concurrent mesa care'
            )",
    )
    .bind(vec![
        "org_provider_claim_owned",
        "org_provider_claim_private_duplicate",
    ])
    .execute(&pool)
    .await
    .expect("test provider organizations should clean up");
    sqlx::query(
        "DELETE FROM owner_provider_invitation_abuse_reports
         WHERE reporter_user_id = ANY($1)",
    )
    .bind(vec![abuse_reporter, "recipient-user-1"])
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
