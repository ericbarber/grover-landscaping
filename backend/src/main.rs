use axum::{
    extract::{Extension, Path, Query, State},
    http::{
        header::{AUTHORIZATION, CONTENT_TYPE},
        HeaderMap, HeaderName, HeaderValue, Method, StatusCode,
    },
    middleware,
    response::{IntoResponse, Response},
    routing::{delete, get, post, put},
    Json, Router,
};
use grover_landscaping_api::{
    access_control::{
        can_deliver_completion_report, can_manage_crew_assignments, can_manage_organization,
        can_manage_property_portfolios, can_manage_schedule, can_review_completion_report,
        can_submit_completion_report, can_view_crew_route, can_view_customer_property_portfolios,
        AccessRole,
    },
    accounts::{
        self, valid_customer_account_relationship, validate_create_customer_account_request,
        validate_create_customer_property_request, validate_update_customer_account_request,
        AccountRepository, CreateCustomerAccountRequest, CreateCustomerPropertyRequest,
        CustomerAccountArchiveError, CustomerAccountListResult, CustomerAccountSummaryResult,
        CustomerContextReadResult, CustomerPropertyListResult, CustomerPropertyMutationError,
        CustomerPropertyStatusError, UpdateCustomerAccountRelationshipRequest,
        UpdateCustomerAccountRequest, UpdateCustomerPropertyIdentityRequest,
        UpdateCustomerPropertyStatusRequest,
    },
    auth::{require_api_auth, AuthPrincipal, AuthService},
    completion_reports::{
        self, apply_completion_report_persistence, build_completion_report,
        completion_report_is_active_manager_queue_status,
        customer_completion_report_snapshot_response, is_valid_completion_report_lifecycle_status,
        prepare_delivered_completion_report_snapshot, CompletionReportActionResult,
        CompletionReportDeliveryCandidateResult, CompletionReportDeliveryNotificationResult,
        CompletionReportResponse,
    },
    customer_portal_access::{CustomerPortalAccessRepository, CustomerPortalVisitReadResult},
    customer_visit_communication::{
        validate_customer_question_request, validate_provider_response_request,
        CreateCustomerVisitQuestionRequest, CreateProviderVisitResponseRequest,
        CustomerVisitCommunicationRepository, CustomerVisitMessageWriteResult,
        CustomerVisitProofReadResult, CustomerVisitThreadReadResult, ProviderVisitThreadListResult,
    },
    customer_visit_recommendations::{
        validate_decision_request, CustomerRecommendationDecisionResult,
        CustomerRecommendationDetailResult, CustomerRecommendationListResult,
        CustomerVisitRecommendationRepository, DecideCustomerRecommendationRequest,
    },
    day_plans::{
        self, validate_amendment_request, validate_amendment_review, validate_create_crew_name,
        validate_create_organization_branch_request, validate_create_service_territory_request,
        AssignDayPlanStopRequest, CreateCrewRequest, CreateDayPlanAmendmentRequest,
        CreateDayPlanRequest, CreateOrganizationBranchRequest, CreateOrganizationBranchResult,
        CreateServiceTerritoryRequest, CreateServiceTerritoryResult, DayPlanRepository,
        PersistedMutationResult, PersistedReadResult, ReorderDayPlanStopsRequest,
        ReviewDayPlanAmendmentRequest, UpdateBranchStatusResult, UpdateCrewRequest,
        UpdateCrewResult, UpdateHierarchyStatusRequest, UpdateTerritoryStatusResult,
    },
    db::{
        ChecklistWriteResult, CustomerPhotoErasureResult, CustomerPrivacyExportResult,
        DatabaseConfig, DispatchCustomerNotificationResult, JobAddOnStatusUpdate,
        JobDispatchAssignmentResult, JobLifecycleWriteResult, JobRepository,
        PhotoErasureDeletionHistoryFilter, PhotoErasureDeletionResolveResult,
        PhotoErasureDeletionRetryResult, PhotoProcessingHistoryFilter,
        PhotoProcessingResolveResult, PhotoProcessingRetryResult, ResourceOwnershipResult,
        ResourceReadResult, StopProgressWriteResult,
    },
    marketing_events::{
        validate_marketing_event, CreateMarketingEventRequest, MarketingEventRepository,
    },
    marketing_leads::{
        is_marketing_lead_spam, validate_marketing_lead_request, validate_marketing_lead_workflow,
        CreateMarketingLeadRequest, MarketingLeadListResult, MarketingLeadRepository,
        MarketingLeadResponse, MarketingLeadWorkflowResult, MarketingLeadWriteResult,
        UpdateMarketingLeadRequest,
    },
    notifications::{
        start_notification_dispatcher, validate_notification_recipient,
        NotificationDispatcherConfig, NotificationHistoryFilter, NotificationHistoryListResult,
        NotificationOutboxRepository, NotificationResolveResult, NotificationRetryResult,
    },
    operational_exceptions::{
        validate_create_operational_exception, validate_operational_exception_filter,
        validate_update_operational_exception, CreateOperationalExceptionRequest,
        OperationalExceptionCreateResult, OperationalExceptionFilter,
        OperationalExceptionListResult, OperationalExceptionRepository,
        OperationalExceptionUpdateResult, UpdateOperationalExceptionRequest,
    },
    organizations::{
        validate_bootstrap_organization_request, validate_create_invitation_request,
        validate_reissue_invitation_request, validate_update_organization_profile_request,
        ActiveMembershipCheckResult, BootstrapOrganizationRequest, BootstrapOrganizationResult,
        CreateOrganizationInvitationRequest, MembershipProfileUpdateResult,
        MembershipRoleUpdateResult, MembershipStatusUpdateResult, OrganizationCollectionResult,
        OrganizationMutationResult, OrganizationProfileUpdateResult, OrganizationRepository,
        OrganizationResourceResult, ReissueOrganizationInvitationRequest,
        UpdateOrganizationMembershipProfileRequest, UpdateOrganizationMembershipRoleRequest,
        UpdateOrganizationMembershipStatusRequest, UpdateOrganizationProfileRequest,
    },
    owner_acquisition::{
        validate_initial_service_proposal_decision_request,
        validate_initial_service_proposal_request, validate_intake_media_request,
        validate_owner_assessment_message_request, validate_owner_first_visit_decision_request,
        validate_owner_initial_service_proposal_message_request,
        validate_owner_provider_relationship_activation_request, validate_property_request,
        validate_provider_assessment_message_request,
        validate_provider_assessment_private_note_request, validate_provider_assessment_request,
        validate_provider_assessment_transition_request,
        validate_provider_assessment_window_decision_request,
        validate_provider_assessment_window_proposal_request,
        validate_provider_claim_review_decision_request, validate_provider_claim_review_filter,
        validate_provider_disclosure_access_request, validate_provider_disclosure_grant_request,
        validate_provider_disclosure_revoke_request, validate_provider_first_visit_request,
        validate_provider_inbox_request,
        validate_provider_initial_service_proposal_response_request,
        validate_provider_invitation_abuse_report_request,
        validate_provider_invitation_opt_out_request, validate_provider_invitation_preview_request,
        validate_provider_invitation_recipient_check_request, validate_provider_invitation_request,
        validate_provider_opportunity_response_request,
        validate_provider_organization_bootstrap_request,
        validate_provider_organization_claim_appeal_request,
        validate_provider_organization_claim_request,
        validate_provider_organization_options_request,
        validate_provider_response_capability_request, validate_workspace_request,
        validate_yard_brief_request, ActivateOwnerProviderRelationshipRequest,
        AppealOwnerProviderOrganizationClaimRequest,
        BootstrapOwnerProviderOrganizationClaimRequest, CreateOwnerAssessmentMessageRequest,
        CreateOwnerInitialServiceProposalMessageRequest, CreateOwnerIntakeMediaRequest,
        CreateOwnerPropertyRequest, CreateOwnerProviderAssessmentRequest,
        CreateOwnerProviderDisclosureGrantRequest, CreateOwnerProviderInvitationRequest,
        CreateOwnerProviderOpportunityResponseRequest, CreateOwnerProviderOrganizationClaimRequest,
        CreateProviderAssessmentMessageRequest, CreateProviderAssessmentPrivateNoteRequest,
        CreateProviderInitialServiceProposalResponseRequest,
        DecideOwnerProviderAssessmentWindowRequest, DecideOwnerProviderClaimReviewRequest,
        DecideOwnerProviderFirstVisitRequest, DecideOwnerProviderInitialServiceProposalRequest,
        IssueOwnerProviderResponseCapabilityRequest, ListOwnerProviderOrganizationOptionsRequest,
        OpenOwnerProviderDisclosureRequest, OpenOwnerProviderInboxRequest,
        OptOutOwnerProviderInvitationRequest, OwnerAcquisitionRepository, OwnerMutationResult,
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
        OwnerProviderInvitationCreateResult, OwnerProviderInvitationMutationResult,
        OwnerProviderInvitationPreviewResult, OwnerProviderInvitationRecipientCheckResult,
        OwnerProviderOpportunityResponseResult, OwnerProviderOrganizationBootstrapResult,
        OwnerProviderOrganizationClaimResult, OwnerProviderOrganizationOptionsResult,
        OwnerProviderProgressResult, OwnerProviderRelationshipActivationResult,
        OwnerProviderResponseCapabilityResult, OwnerReadResult,
        PreviewOwnerProviderInvitationRequest, ProposeProviderAssessmentWindowRequest,
        ProposeProviderFirstVisitRequest, ProviderAssessmentWindowProposalResult,
        PublishOwnerProviderInitialServiceProposalRequest,
        ReportOwnerProviderInvitationAbuseRequest, RevokeOwnerProviderDisclosureGrantRequest,
        SaveOwnerWorkspaceRequest, SaveOwnerYardBriefRequest,
        TransitionOwnerProviderAssessmentRequest, VerifyOwnerProviderInvitationRecipientRequest,
    },
    photo_processing::{start_photo_processing_worker, PhotoProcessingWorkerConfig},
    photo_storage,
    project_bids::{
        customer_project_bid_response, validate_project_bid_decision, validate_project_bid_request,
        validate_revise_project_bid_request, validate_send_project_bid_request,
        CreateProjectBidRequest, ProjectBidDecisionRequest, ProjectBidDraftResult,
        ProjectBidListResult, ProjectBidMutationResult, ProjectBidRepository,
        ProjectBidRevisionResult, ProjectBidSendResult, ReviseProjectBidRequest,
        SendProjectBidRequest, SharedProjectBidReadResult,
    },
    property_crew_assignments::{
        is_valid_assign_property_crew_request, AssignPropertyCrewRequest,
        PropertyCrewAssignmentListResult, PropertyCrewAssignmentMutationResult,
        PropertyCrewAssignmentRepository, PropertyCrewAssignmentResponse,
    },
    property_onboarding::{
        validate_property_onboarding_request, PropertyOnboardingReadResult,
        PropertyOnboardingRepository, PropertyOnboardingWriteResult,
        UpsertPropertyOnboardingRequest,
    },
    property_portfolio_requests::{
        is_valid_add_property_to_portfolio_request, is_valid_create_property_portfolio_request,
        AddPropertyToPortfolioRequest, CreatePropertyPortfolioRequest,
    },
    property_portfolios::{
        CustomerPropertyPortfolioReadResult, PropertyPortfolioListResult,
        PropertyPortfolioMutationResult, PropertyPortfolioRepository,
    },
    service_mobilization::{
        validate_release_request, validate_service_day_event_request,
        CustomerServiceDayEventRecord, CustomerServiceDayEventWriteResult,
        PublishCustomerServiceDayEventRequest, ReleaseInitialServiceRequest,
        ServiceMobilizationReadResult, ServiceMobilizationRepository,
        ServiceMobilizationStatusRecord, ServiceWorkReleaseRecord, ServiceWorkReleaseWriteResult,
    },
    stop_progress::{
        is_valid_stop_progress_status, local_stop_progress_response,
        persisted_stop_progress_response, replayed_stop_progress_response, StopProgressRequest,
    },
    validate_photo_upload_request, JobAddOn, JobSummary, PhotoEvidence, PhotoUploadMetadata,
    PhotoUploadRequest,
};
use serde::{Deserialize, Serialize};
use std::{collections::HashSet, io, net::SocketAddr, path::PathBuf, sync::Arc};
use tower_http::{
    cors::CorsLayer,
    services::{ServeDir, ServeFile},
    set_header::SetResponseHeaderLayer,
    trace::TraceLayer,
};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use uuid::Uuid;

type DynError = Box<dyn std::error::Error + Send + Sync>;

#[derive(Clone)]
struct AppState {
    jobs: JobRepository,
    accounts: AccountRepository,
    day_plans: DayPlanRepository,
    project_bids: ProjectBidRepository,
    organizations: OrganizationRepository,
    notifications: NotificationOutboxRepository,
    operational_exceptions: OperationalExceptionRepository,
    property_portfolios: PropertyPortfolioRepository,
    property_crew_assignments: PropertyCrewAssignmentRepository,
    property_onboarding: PropertyOnboardingRepository,
    marketing_leads: MarketingLeadRepository,
    marketing_events: MarketingEventRepository,
    owner_acquisition: OwnerAcquisitionRepository,
    customer_portal: CustomerPortalAccessRepository,
    service_mobilization: ServiceMobilizationRepository,
    customer_visit_communication: CustomerVisitCommunicationRepository,
    customer_visit_recommendations: CustomerVisitRecommendationRepository,
}

macro_rules! organization_ids_or_return {
    ($result:expr) => {
        match $result {
            Ok(organization_ids) => organization_ids,
            Err(response) => return response,
        }
    };
}

#[derive(Debug, Serialize)]
struct HealthResponse {
    status: &'static str,
    service: &'static str,
    persistence: &'static str,
}

#[derive(Debug, Deserialize)]
struct JobAddOnStatusRequest {
    status: String,
}

#[derive(Debug, Deserialize)]
struct ChecklistItemStatusRequest {
    completed: bool,
}

#[derive(Debug, Serialize)]
struct ActionResponse {
    status: &'static str,
    message: String,
}

#[derive(Debug, Serialize)]
struct JobLifecycleActionResponse {
    status: &'static str,
    message: String,
    persisted: bool,
    idempotent_replay: bool,
}

#[derive(Debug, Serialize)]
struct ErrorResponse {
    error: &'static str,
    message: String,
}

#[derive(Debug, Serialize)]
struct ProviderServiceReleaseResponse {
    release_id: String,
    activation_id: String,
    first_visit_proposal_version: i64,
    service_job_id: String,
    released_at_epoch_seconds: i64,
    persisted: bool,
}

impl From<ServiceWorkReleaseRecord> for ProviderServiceReleaseResponse {
    fn from(record: ServiceWorkReleaseRecord) -> Self {
        Self {
            release_id: record.release_id,
            activation_id: record.activation_id,
            first_visit_proposal_version: record.first_visit_proposal_version,
            service_job_id: record.service_job_id,
            released_at_epoch_seconds: record.released_at_epoch_seconds,
            persisted: record.persisted,
        }
    }
}

#[derive(Debug, Serialize)]
struct ProviderServiceMobilizationStatusResponse {
    release: ProviderServiceReleaseResponse,
    service_job_status: String,
    current_customer_status: String,
    current_event_version: i64,
    window_start_epoch_seconds: i64,
    window_end_epoch_seconds: i64,
    time_zone: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    latest_customer_event: Option<CustomerServiceDayEventRecord>,
    persisted: bool,
}

impl From<ServiceMobilizationStatusRecord> for ProviderServiceMobilizationStatusResponse {
    fn from(record: ServiceMobilizationStatusRecord) -> Self {
        Self {
            release: record.release.into(),
            service_job_status: record.service_job_status,
            current_customer_status: record.current_customer_status,
            current_event_version: record.current_event_version,
            window_start_epoch_seconds: record.window_start_epoch_seconds,
            window_end_epoch_seconds: record.window_end_epoch_seconds,
            time_zone: record.time_zone,
            latest_customer_event: record.latest_customer_event,
            persisted: record.persisted,
        }
    }
}

#[derive(Debug, Deserialize)]
struct CompletionReportChangeRequest {
    reason: Option<String>,
}

#[derive(Debug, Deserialize)]
struct UpdateJobDispatchAssignmentRequest {
    crew_id: String,
    scheduled_date: String,
    customer_notification_required: bool,
}

#[derive(Debug, Deserialize)]
struct CompleteDispatchCustomerNotificationRequest {
    channel: String,
    note: Option<String>,
}

#[derive(Debug, Deserialize)]
struct CompletionReportDeliveryNotificationRequest {
    channel: String,
    recipient: String,
}

#[derive(Debug, Default, Deserialize)]
struct CompletionReportListQuery {
    status: Option<String>,
    readiness: Option<String>,
    readiness_blocker: Option<String>,
    organization_id: Option<String>,
    crew_id: Option<String>,
    customer: Option<String>,
    property: Option<String>,
    scheduled_from: Option<String>,
    scheduled_to: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
struct NotificationHistoryQuery {
    entity_type: Option<String>,
    status: Option<String>,
    limit: Option<i64>,
}

#[derive(Debug, Default, Deserialize)]
struct OperationalExceptionQuery {
    organization_id: Option<String>,
    category: Option<String>,
    priority: Option<String>,
    status: Option<String>,
    limit: Option<i64>,
}

#[derive(Debug, Default, Deserialize)]
struct OperationalActivityQuery {
    event_kind: Option<String>,
    before: Option<String>,
    limit: Option<i64>,
}

#[derive(Debug, Default, Deserialize)]
struct TeamActivityQuery {
    event_kind: Option<String>,
    move_scope: Option<String>,
    actor: Option<String>,
    target: Option<String>,
    source: Option<String>,
    destination: Option<String>,
    audit_id: Option<String>,
    before: Option<String>,
    limit: Option<i64>,
}

#[derive(Debug, Default, Deserialize)]
struct PhotoProcessingHistoryQuery {
    task_type: Option<String>,
    status: Option<String>,
    limit: Option<i64>,
}

#[derive(Debug, Default, Deserialize)]
struct PhotoErasureDeletionHistoryQuery {
    status: Option<String>,
    limit: Option<i64>,
}

#[derive(Debug, Default, Deserialize)]
struct NotificationResolveRequest {
    reason: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
struct PhotoProcessingResolveRequest {
    reason: Option<String>,
}

#[derive(Debug, Deserialize)]
struct CustomerPhotoErasureRequest {
    reason: String,
}

#[derive(Debug, Deserialize)]
struct PhotoCompleteRequest {
    photo_id: String,
    file_size_bytes: Option<i64>,
    image_width_px: Option<i32>,
    image_height_px: Option<i32>,
}

#[derive(Debug, Deserialize)]
struct OwnerIntakeMediaCompleteRequest {
    file_size_bytes: Option<i64>,
    image_width_px: Option<i32>,
    image_height_px: Option<i32>,
}

#[tokio::main]
async fn main() -> Result<(), DynError> {
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG")
                .unwrap_or_else(|_| "grover_landscaping_api=info,tower_http=info".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    let app = app_from_env().await?;
    let port = std::env::var("PORT")
        .unwrap_or_else(|_| "8080".to_string())
        .parse::<u16>()
        .map_err(|error| configuration_error(format!("PORT must be a valid TCP port: {error}")))?;
    let addr = SocketAddr::from(([0, 0, 0, 0], port));

    tracing::info!(%addr, "starting Grover Landscaping API");

    let listener = tokio::net::TcpListener::bind(addr).await?;

    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await?;

    Ok(())
}

async fn app_from_env() -> Result<Router, DynError> {
    let app_environment = std::env::var("APP_ENV").unwrap_or_else(|_| "local".to_string());
    let production = app_environment.eq_ignore_ascii_case("production");
    let photo_storage_config =
        photo_storage::PhotoStorageConfig::try_from_env().map_err(configuration_error)?;

    let (
        jobs,
        day_plans,
        project_bids,
        organizations,
        notifications,
        operational_exceptions,
        property_portfolios,
        property_crew_assignments,
        property_onboarding,
        marketing_leads,
        marketing_events,
        accounts,
        owner_acquisition,
        customer_portal,
        service_mobilization,
        customer_visit_communication,
        customer_visit_recommendations,
        persistence,
    ) = match DatabaseConfig::from_env() {
        Some(config) => {
            tracing::info!("connecting to PostgreSQL and applying migrations");
            let jobs = JobRepository::connect(&config).await?;
            let pool = jobs.pool().ok_or_else(|| {
                configuration_error("PostgreSQL connected without an available connection pool")
            })?;
            let day_plans = DayPlanRepository::from_pool(pool.clone());
            let project_bids = ProjectBidRepository::from_pool(pool.clone());
            let organizations = OrganizationRepository::from_pool(pool.clone());
            let notifications = NotificationOutboxRepository::from_pool(pool.clone());
            let operational_exceptions = OperationalExceptionRepository::from_pool(pool.clone());
            let property_portfolios = PropertyPortfolioRepository::from_pool(pool.clone());
            let property_crew_assignments =
                PropertyCrewAssignmentRepository::from_pool(pool.clone());
            let property_onboarding = PropertyOnboardingRepository::from_pool(pool.clone());
            let marketing_leads = MarketingLeadRepository::from_pool(pool.clone());
            let marketing_events = MarketingEventRepository::from_pool(pool.clone());
            let customer_portal = CustomerPortalAccessRepository::from_pool(pool.clone());
            let service_mobilization = ServiceMobilizationRepository::from_pool(pool.clone());
            let customer_visit_communication =
                CustomerVisitCommunicationRepository::from_pool(pool.clone());
            let customer_visit_recommendations =
                CustomerVisitRecommendationRepository::from_pool(pool.clone());
            let owner_acquisition = OwnerAcquisitionRepository::from_pool(pool);
            let accounts = AccountRepository::from_pool(
                jobs.pool()
                    .expect("connected jobs repository should expose a pool"),
            );
            (
                jobs,
                day_plans,
                project_bids,
                organizations,
                notifications,
                operational_exceptions,
                property_portfolios,
                property_crew_assignments,
                property_onboarding,
                marketing_leads,
                marketing_events,
                accounts,
                owner_acquisition,
                customer_portal,
                service_mobilization,
                customer_visit_communication,
                customer_visit_recommendations,
                "postgres",
            )
        }
        None if production => {
            return Err(
                configuration_error("DATABASE_URL is required when APP_ENV=production").into(),
            );
        }
        None => (
            JobRepository::default(),
            DayPlanRepository::default(),
            ProjectBidRepository::default(),
            OrganizationRepository::default(),
            NotificationOutboxRepository::default(),
            OperationalExceptionRepository::default(),
            PropertyPortfolioRepository::default(),
            PropertyCrewAssignmentRepository::default(),
            PropertyOnboardingRepository::default(),
            MarketingLeadRepository::default(),
            MarketingEventRepository::default(),
            AccountRepository::new(),
            OwnerAcquisitionRepository::new(),
            CustomerPortalAccessRepository::default(),
            ServiceMobilizationRepository::default(),
            CustomerVisitCommunicationRepository::default(),
            CustomerVisitRecommendationRepository::default(),
            "seed-local",
        ),
    };

    let notification_config =
        NotificationDispatcherConfig::from_env(production).map_err(configuration_error)?;
    start_notification_dispatcher(notifications.clone(), notification_config)
        .map_err(configuration_error)?;
    let photo_processing_config =
        PhotoProcessingWorkerConfig::from_env().map_err(configuration_error)?;
    start_photo_processing_worker(jobs.clone(), photo_storage_config, photo_processing_config)
        .map_err(configuration_error)?;

    let auth = AuthService::from_env(production).await?;
    let organizations = if auth.is_local_review() {
        organizations.with_local_reviewers()
    } else {
        organizations
    };
    let public_auth_config = auth.public_config();
    let cors = cors_layer(production)?;
    let frontend_dist = PathBuf::from(
        std::env::var("FRONTEND_DIST_DIR").unwrap_or_else(|_| "../frontend/dist".to_string()),
    );

    tracing::info!(
        environment = %app_environment,
        persistence,
        auth_mode = ?public_auth_config.mode,
        frontend_dist = %frontend_dist.display(),
        "application runtime configured"
    );

    Ok(app_with_runtime(
        Arc::new(AppState {
            jobs,
            accounts,
            day_plans,
            project_bids,
            organizations,
            notifications,
            operational_exceptions,
            property_portfolios,
            property_crew_assignments,
            property_onboarding,
            marketing_leads,
            marketing_events,
            owner_acquisition,
            customer_portal,
            service_mobilization,
            customer_visit_communication,
            customer_visit_recommendations,
        }),
        persistence,
        persistence == "postgres",
        cors,
        auth,
        frontend_dist,
        production,
    ))
}

#[cfg(test)]
fn app_with_state(state: Arc<AppState>, persistence: &'static str) -> Router {
    app_with_runtime(
        state,
        persistence,
        false,
        Some(CorsLayer::permissive()),
        AuthService::disabled(),
        PathBuf::from("../frontend/dist"),
        false,
    )
}

#[allow(clippy::too_many_arguments)]
fn app_with_runtime(
    state: Arc<AppState>,
    persistence: &'static str,
    database_required: bool,
    cors: Option<CorsLayer>,
    auth: AuthService,
    frontend_dist: PathBuf,
    production: bool,
) -> Router {
    let readiness_state = Arc::clone(&state);
    let auth = auth.with_organization_repository(state.organizations.clone());
    let public_auth_config = auth.public_config();
    let index_file = frontend_dist.join("index.html");
    let shared_bid_frontend = ServeFile::new(index_file.clone());
    let shared_report_frontend = ServeFile::new(index_file.clone());
    let frontend_service =
        ServeDir::new(frontend_dist).not_found_service(ServeFile::new(index_file));

    let mut router = Router::new()
        .route("/health", get(move || health(persistence)))
        .route("/health/live", get(move || health(persistence)))
        .route(
            "/auth/config",
            get(move || {
                let config = public_auth_config.clone();
                async move { Json(config) }
            }),
        )
        .route(
            "/marketing-leads",
            get(list_marketing_leads).post(create_marketing_lead),
        )
        .route("/marketing-leads/{lead_id}", put(update_marketing_lead))
        .route("/marketing-events", post(create_marketing_event))
        .route("/marketing-dashboard", get(get_marketing_dashboard))
        .route("/me/access", get(get_my_access))
        .route("/customer-portal/visits", get(list_customer_portal_visits))
        .route(
            "/customer-portal/visits/{customer_visit_reference}/messages",
            get(get_customer_visit_thread).post(create_customer_visit_question),
        )
        .route(
            "/customer-portal/visits/{customer_visit_reference}/proof",
            get(get_customer_visit_proof),
        )
        .route(
            "/customer-portal/visits/{customer_visit_reference}/recommendations",
            get(list_customer_visit_recommendations),
        )
        .route(
            "/customer-portal/visits/{customer_visit_reference}/recommendations/{customer_recommendation_reference}",
            get(get_customer_visit_recommendation).post(decide_customer_visit_recommendation),
        )
        .route(
            "/owner-workspace",
            get(get_owner_workspace).put(save_owner_workspace),
        )
        .route(
            "/owner-properties",
            get(list_owner_properties).post(create_owner_property),
        )
        .route("/owner-properties/{property_id}", get(get_owner_property))
        .route(
            "/owner-properties/{property_id}/yard-brief",
            get(get_owner_yard_brief).put(save_owner_yard_brief),
        )
        .route(
            "/owner-properties/{property_id}/intake-media",
            get(list_owner_intake_media).post(create_owner_intake_media_upload),
        )
        .route(
            "/owner-properties/{property_id}/intake-media/{media_id}",
            delete(delete_owner_intake_media),
        )
        .route(
            "/owner-properties/{property_id}/intake-media/{media_id}/complete",
            post(complete_owner_intake_media_upload),
        )
        .route(
            "/owner-properties/{property_id}/provider-invitations",
            get(list_owner_provider_invitations).post(create_owner_provider_invitation),
        )
        .route(
            "/owner-properties/{property_id}/provider-connection-progress",
            get(list_owner_provider_connection_progress),
        )
        .route(
            "/owner-properties/{property_id}/provider-disclosure-receipts",
            get(list_owner_provider_disclosure_receipts),
        )
        .route(
            "/owner-properties/{property_id}/provider-assessments",
            get(list_owner_provider_assessments),
        )
        .route(
            "/owner-properties/{property_id}/provider-assessments/{assessment_id}/window-decision",
            post(decide_owner_provider_assessment_window),
        )
        .route(
            "/owner-properties/{property_id}/provider-assessments/{assessment_id}/messages",
            get(list_owner_provider_assessment_messages)
                .post(create_owner_provider_assessment_message),
        )
        .route(
            "/owner-properties/{property_id}/initial-service-proposals",
            get(list_owner_initial_service_proposals),
        )
        .route(
            "/owner-properties/{property_id}/initial-service-proposals/{proposal_id}",
            get(get_owner_initial_service_proposal),
        )
        .route(
            "/owner-properties/{property_id}/initial-service-proposals/{proposal_id}/decision",
            post(decide_owner_initial_service_proposal),
        )
        .route(
            "/owner-properties/{property_id}/initial-service-proposals/{proposal_id}/messages",
            get(list_owner_initial_service_proposal_messages)
                .post(create_owner_initial_service_proposal_message),
        )
        .route(
            "/owner-properties/{property_id}/initial-service-proposals/{proposal_id}/activation",
            get(get_owner_provider_relationship_activation)
                .post(activate_owner_provider_relationship),
        )
        .route(
            "/owner-properties/{property_id}/provider-relationships/{activation_id}/first-visit",
            get(get_owner_provider_first_visit),
        )
        .route(
            "/owner-properties/{property_id}/provider-relationships/{activation_id}/first-visit/decision",
            post(decide_owner_provider_first_visit),
        )
        .route(
            "/owner-properties/{property_id}/provider-disclosure-grants/{grant_id}/revoke",
            post(revoke_owner_provider_disclosure_grant),
        )
        .route(
            "/owner-properties/{property_id}/provider-invitations/{invitation_id}",
            get(get_owner_provider_invitation),
        )
        .route(
            "/owner-properties/{property_id}/provider-invitations/{invitation_id}/disclosure-review",
            get(get_owner_provider_disclosure_review),
        )
        .route(
            "/owner-properties/{property_id}/provider-invitations/{invitation_id}/disclosure-grants",
            post(create_owner_provider_disclosure_grant),
        )
        .route(
            "/owner-properties/{property_id}/provider-invitations/{invitation_id}/revoke",
            post(revoke_owner_provider_invitation),
        )
        .route(
            "/provider-invitations/opt-out",
            post(opt_out_owner_provider_invitation),
        )
        .route(
            "/provider-invitations/report",
            post(report_owner_provider_invitation_abuse),
        )
        .route(
            "/provider-invitations/preview",
            post(preview_owner_provider_invitation),
        )
        .route(
            "/provider-invitations/verify-recipient",
            post(verify_owner_provider_invitation_recipient),
        )
        .route(
            "/provider-invitations/organization-options",
            post(list_owner_provider_organization_options),
        )
        .route(
            "/provider-invitations/organization-claims",
            post(create_owner_provider_organization_claim),
        )
        .route(
            "/provider-invitations/inbox",
            post(open_owner_provider_inbox),
        )
        .route(
            "/provider-invitations/progress",
            post(get_owner_provider_progress),
        )
        .route(
            "/provider-relationships/{activation_id}/first-visit/status",
            post(get_provider_first_visit),
        )
        .route(
            "/provider-relationships/{activation_id}/first-visit/proposal",
            post(propose_provider_first_visit),
        )
        .route(
            "/provider-relationships/{activation_id}/service-release",
            get(get_provider_service_release).post(release_provider_initial_service),
        )
        .route(
            "/provider-service-releases/{release_id}/customer-status",
            post(publish_provider_customer_service_status),
        )
        .route(
            "/provider-customer-visit-threads",
            get(list_provider_customer_visit_threads),
        )
        .route(
            "/provider-customer-visit-threads/{customer_visit_reference}",
            get(get_provider_customer_visit_thread),
        )
        .route(
            "/provider-customer-visit-threads/{customer_visit_reference}/responses",
            post(create_provider_customer_visit_response),
        )
        .route(
            "/provider-disclosures/access",
            post(open_owner_provider_disclosure),
        )
        .route(
            "/provider-assessments",
            post(create_owner_provider_assessment),
        )
        .route(
            "/provider-assessments/{assessment_id}/transitions",
            post(transition_owner_provider_assessment),
        )
        .route(
            "/provider-assessments/{assessment_id}/window-proposal",
            post(propose_provider_assessment_window),
        )
        .route(
            "/provider-assessments/{assessment_id}/messages",
            post(create_provider_assessment_message),
        )
        .route(
            "/provider-assessments/{assessment_id}/private-notes",
            post(create_provider_assessment_private_note),
        )
        .route(
            "/provider-assessments/{assessment_id}/initial-service-proposals",
            post(publish_provider_initial_service_proposal),
        )
        .route(
            "/provider-assessments/{assessment_id}/initial-service-proposal-responses",
            post(create_provider_initial_service_proposal_response),
        )
        .route(
            "/provider-opportunity-responses",
            post(create_owner_provider_opportunity_response),
        )
        .route(
            "/provider-invitation-organization-claims/{claim_id}/bootstrap",
            post(bootstrap_owner_provider_organization_claim),
        )
        .route(
            "/provider-invitation-organization-claims/{claim_id}/appeals",
            post(appeal_owner_provider_organization_claim),
        )
        .route(
            "/provider-invitation-organization-claims/{claim_id}/response-capabilities",
            post(issue_owner_provider_response_capability),
        )
        .route(
            "/provider-organization-claim-reviews",
            get(list_owner_provider_organization_claim_reviews),
        )
        .route(
            "/provider-organization-claim-review-metrics",
            get(owner_provider_organization_claim_review_metrics),
        )
        .route(
            "/provider-organization-claim-reviews/{claim_id}/decisions",
            post(decide_owner_provider_organization_claim_review),
        )
        .route(
            "/customer-accounts",
            get(list_customer_accounts).post(create_customer_account),
        )
        .route(
            "/customer-accounts/archived",
            get(list_archived_customer_accounts),
        )
        .route(
            "/customer-accounts/{account_id}",
            put(update_customer_account).delete(archive_customer_account),
        )
        .route(
            "/customer-accounts/{account_id}/reactivate",
            post(reactivate_customer_account),
        )
        .route(
            "/customer-accounts/{account_id}/relationship",
            put(update_customer_account_relationship),
        )
        .route(
            "/customer-accounts/{account_id}/onboarding-progress",
            get(get_customer_account_onboarding_progress),
        )
        .route(
            "/customer-accounts/{account_id}/properties",
            get(list_customer_properties).post(create_customer_property),
        )
        .route(
            "/customer-accounts/{account_id}/properties/{property_id}",
            put(update_customer_property_status),
        )
        .route(
            "/customer-accounts/{account_id}/properties/{property_id}/identity",
            put(update_customer_property_identity),
        )
        .route(
            "/customer-accounts/{account_id}/properties/{property_id}/activation-readiness",
            get(get_customer_property_activation_readiness),
        )
        .route("/organizations/bootstrap", post(bootstrap_organization))
        .route(
            "/organizations/{organization_id}",
            get(get_organization_profile).put(update_organization_profile),
        )
        .route(
            "/organizations/{organization_id}/setup-progress",
            get(get_first_owner_setup_progress),
        )
        .route(
            "/health/ready",
            get(move || readiness(Arc::clone(&readiness_state), persistence, database_required)),
        )
        .route("/reports/{share_token}", get(get_shared_completion_report))
        .route("/shared-bids/{share_token}", get(get_shared_project_bid))
        .route(
            "/shared-bids/{share_token}/decision",
            post(decide_shared_project_bid),
        )
        .route("/completion-reports", get(list_completion_reports))
        .route("/notifications", get(list_notification_history))
        .route(
            "/operational-exceptions",
            get(list_operational_exceptions).post(create_operational_exception),
        )
        .route(
            "/operational-exceptions/{id}",
            put(update_operational_exception),
        )
        .route("/photo-processing-jobs", get(list_photo_processing_history))
        .route(
            "/photo-processing-jobs/{id}/retry",
            post(retry_photo_processing_job),
        )
        .route(
            "/photo-processing-jobs/{id}/resolve",
            post(resolve_photo_processing_job),
        )
        .route(
            "/photo-erasure-deletion-jobs",
            get(list_photo_erasure_deletion_history),
        )
        .route(
            "/photo-erasure-deletion-jobs/{id}/retry",
            post(retry_photo_erasure_deletion_job),
        )
        .route(
            "/photo-erasure-deletion-jobs/{id}/resolve",
            post(resolve_photo_erasure_deletion_job),
        )
        .route(
            "/notifications/{id}/retry",
            post(retry_notification_delivery),
        )
        .route(
            "/notifications/{id}/resolve",
            post(resolve_notification_delivery),
        )
        .route("/jobs", get(list_jobs))
        .route("/jobs/{id}", get(get_job))
        .route(
            "/jobs/{id}/dispatch-assignment",
            put(update_job_dispatch_assignment),
        )
        .route(
            "/jobs/{id}/dispatch-customer-notification",
            post(complete_dispatch_customer_notification),
        )
        .route("/jobs/{id}/account", get(get_account_for_job))
        .route(
            "/organizations/{organization_id}/invitations",
            get(list_organization_invitations).post(create_organization_invitation),
        )
        .route(
            "/organization-invitations/{token}/accept",
            post(accept_organization_invitation),
        )
        .route(
            "/organizations/{organization_id}/invitations/{invitation_id}",
            delete(revoke_organization_invitation),
        )
        .route(
            "/organizations/{organization_id}/invitations/{invitation_id}/reissue",
            post(reissue_organization_invitation),
        )
        .route(
            "/organizations/{organization_id}/memberships/{membership_id}/role",
            put(update_organization_membership_role),
        )
        .route(
            "/organizations/{organization_id}/memberships/{membership_id}/profile",
            put(update_organization_membership_profile),
        )
        .route(
            "/organizations/{organization_id}/memberships/{membership_id}/status",
            put(update_organization_membership_status),
        )
        .route(
            "/organizations/{organization_id}/memberships",
            get(list_organization_memberships),
        )
        .route(
            "/organizations/{organization_id}/team-activity",
            get(list_team_administration_activity),
        )
        .route("/operational-activity", get(list_operational_activity))
        .route(
            "/accounts/{account_id}/property-portfolios",
            get(list_property_portfolios_for_account),
        )
        .route(
            "/accounts/{account_id}/customer-property-portfolio",
            get(get_customer_property_portfolio),
        )
        .route(
            "/accounts/{account_id}/bids",
            get(list_customer_project_bids),
        )
        .route(
            "/accounts/{account_id}/privacy-export",
            get(export_customer_privacy_data),
        )
        .route(
            "/accounts/{account_id}/photo-erasure",
            post(erase_customer_photo_evidence),
        )
        .route("/property-portfolios", post(create_property_portfolio))
        .route(
            "/property-portfolios/{portfolio_id}/properties",
            post(add_property_to_portfolio),
        )
        .route(
            "/properties/{property_id}/completion-reports",
            get(list_property_completion_reports),
        )
        .route(
            "/properties/{property_id}/crew-assignments",
            get(list_property_crew_assignments).post(assign_property_crew),
        )
        .route(
            "/properties/{property_id}/onboarding",
            get(get_property_onboarding).put(upsert_property_onboarding),
        )
        .route("/crews", get(list_crews))
        .route("/organization-branches", get(list_organization_branches))
        .route("/service-territories", get(list_service_territories))
        .route(
            "/organizations/{organization_id}/branches",
            post(create_organization_branch),
        )
        .route(
            "/organizations/{organization_id}/branches/{branch_id}",
            put(update_organization_branch_status),
        )
        .route(
            "/organizations/{organization_id}/territories",
            post(create_service_territory),
        )
        .route(
            "/organizations/{organization_id}/territories/{territory_id}",
            put(update_service_territory_status),
        )
        .route(
            "/organizations/{organization_id}/crews",
            get(list_organization_crews).post(create_organization_crew),
        )
        .route(
            "/organizations/{organization_id}/crews/{crew_id}",
            put(update_organization_crew),
        )
        .route(
            "/crews/{crew_id}/property-assignments/active",
            get(list_active_crew_property_assignments),
        )
        .route("/jobs/{id}/report", get(get_completion_report))
        .route(
            "/completion-reports/{report_id}/review",
            post(start_completion_report_review),
        )
        .route(
            "/completion-reports/{report_id}/request-changes",
            post(request_completion_report_changes),
        )
        .route(
            "/completion-reports/{report_id}/resubmit",
            post(resubmit_completion_report),
        )
        .route(
            "/completion-reports/{report_id}/deliver",
            post(deliver_completion_report),
        )
        .route(
            "/completion-reports/{report_id}/delivery-notifications",
            post(queue_completion_report_delivery_notification),
        )
        .route("/jobs/{id}/add-ons", get(list_job_add_ons))
        .route(
            "/jobs/{id}/add-ons/{add_on_id}/status",
            put(update_job_add_on_status),
        )
        .route("/jobs/{id}/start", post(start_job))
        .route("/jobs/{id}/complete", post(complete_job))
        .route("/jobs/{id}/checklist/{item_id}", put(update_checklist_item))
        .route("/jobs/{id}/photos", get(list_job_photos))
        .route("/jobs/{id}/photos/presign", post(create_local_photo_upload))
        .route("/jobs/{id}/photos/complete", post(complete_photo_upload))
        .route("/crews/{crew_id}/day-plan/today", get(get_today_day_plan))
        .route("/day-plans", post(create_draft_day_plan))
        .route("/day-plans/{day_plan_id}/publish", post(publish_day_plan))
        .route(
            "/day-plans/{day_plan_id}/amendments",
            get(list_day_plan_amendments).post(create_day_plan_amendment),
        )
        .route(
            "/day-plans/{day_plan_id}/amendments/{amendment_id}/review",
            put(review_day_plan_amendment),
        )
        .route(
            "/day-plans/{day_plan_id}/amendments/{amendment_id}/bid",
            post(save_project_bid_draft),
        )
        .route("/day-plans/{day_plan_id}/bids", get(list_project_bids))
        .route(
            "/day-plans/{day_plan_id}/bids/{bid_id}/send",
            post(send_project_bid),
        )
        .route(
            "/day-plans/{day_plan_id}/bids/{bid_id}/revise",
            post(revise_project_bid),
        )
        .route(
            "/day-plans/{day_plan_id}/bids/{bid_id}/revoke",
            post(revoke_project_bid),
        )
        .route(
            "/day-plans/{day_plan_id}/bids/{bid_id}/convert",
            post(convert_project_bid),
        )
        .route("/day-plans/{day_plan_id}/stops", post(assign_day_plan_stop))
        .route(
            "/day-plans/{day_plan_id}/stops/order",
            put(reorder_day_plan_stops),
        )
        .route(
            "/day-plans/{day_plan_id}/stops/{stop_id}",
            delete(remove_day_plan_stop),
        )
        .route(
            "/day-plans/{day_plan_id}/stops/{stop_id}/status",
            post(update_stop_progress),
        )
        .route_service("/bid-review/{share_token}", shared_bid_frontend)
        .route_service("/report-view/{share_token}", shared_report_frontend)
        .fallback_service(frontend_service)
        .with_state(state)
        .layer(SetResponseHeaderLayer::if_not_present(
            HeaderName::from_static("x-content-type-options"),
            HeaderValue::from_static("nosniff"),
        ))
        .layer(SetResponseHeaderLayer::if_not_present(
            HeaderName::from_static("x-frame-options"),
            HeaderValue::from_static("DENY"),
        ))
        .layer(SetResponseHeaderLayer::if_not_present(
            HeaderName::from_static("referrer-policy"),
            HeaderValue::from_static("same-origin"),
        ))
        .layer(TraceLayer::new_for_http());

    if production {
        router = router.layer(SetResponseHeaderLayer::if_not_present(
            HeaderName::from_static("strict-transport-security"),
            HeaderValue::from_static("max-age=31536000; includeSubDomains"),
        ));
    }

    if let Some(cors) = cors {
        router = router.layer(cors);
    }

    router = router.layer(middleware::from_fn_with_state(auth, require_api_auth));

    router
}

async fn health(persistence: &'static str) -> impl IntoResponse {
    Json(HealthResponse {
        status: "ok",
        service: "grover-landscaping-api",
        persistence,
    })
}

async fn create_marketing_lead(
    State(state): State<Arc<AppState>>,
    Json(request): Json<CreateMarketingLeadRequest>,
) -> Response {
    if let Err(code) = validate_marketing_lead_request(&request) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: code,
                message: "Marketing inquiry details are invalid.".to_string(),
            }),
        )
            .into_response();
    }

    if is_marketing_lead_spam(&request) {
        return (
            StatusCode::CREATED,
            Json(MarketingLeadResponse {
                id: format!("lead_{}", Uuid::new_v4()),
                status: "received",
                persisted: false,
            }),
        )
            .into_response();
    }

    match state.marketing_leads.create(request).await {
        MarketingLeadWriteResult::Saved(response) => {
            (StatusCode::CREATED, Json(response)).into_response()
        }
        MarketingLeadWriteResult::Unavailable => persisted_resource_unavailable_response(
            "marketing_lead_unavailable",
            "Your request could not be saved. Please try again.",
        ),
    }
}

async fn list_marketing_leads(State(state): State<Arc<AppState>>) -> Response {
    match state.marketing_leads.list().await {
        MarketingLeadListResult::Loaded(leads) => (StatusCode::OK, Json(leads)).into_response(),
        MarketingLeadListResult::Unavailable => persisted_resource_unavailable_response(
            "marketing_leads_unavailable",
            "The marketing lead inbox is temporarily unavailable.",
        ),
    }
}

async fn update_marketing_lead(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(lead_id): Path<String>,
    Json(request): Json<UpdateMarketingLeadRequest>,
) -> Response {
    if !validate_marketing_lead_workflow(&request) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "marketing_lead_workflow_invalid",
                message: "Lead status, owner, follow-up date, or note is invalid.".to_string(),
            }),
        )
            .into_response();
    }
    match state
        .marketing_leads
        .update_workflow(&lead_id, &principal.subject, request)
        .await
    {
        Ok(MarketingLeadWorkflowResult::Updated(detail)) => {
            (StatusCode::OK, Json(detail)).into_response()
        }
        Ok(MarketingLeadWorkflowResult::NotFound) => (
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                error: "marketing_lead_not_found",
                message: "Marketing lead was not found.".to_string(),
            }),
        )
            .into_response(),
        Ok(MarketingLeadWorkflowResult::Unavailable) => persisted_resource_unavailable_response(
            "marketing_lead_update_unavailable",
            "The marketing lead could not be updated.",
        ),
        Err(error) => {
            tracing::error!(%error, %lead_id, "marketing lead workflow update failed");
            persisted_resource_unavailable_response(
                "marketing_lead_update_unavailable",
                "The marketing lead could not be updated.",
            )
        }
    }
}

async fn create_marketing_event(
    State(state): State<Arc<AppState>>,
    Json(request): Json<CreateMarketingEventRequest>,
) -> Response {
    if !validate_marketing_event(&request) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "marketing_event_invalid",
                message: "Marketing event details are invalid.".to_string(),
            }),
        )
            .into_response();
    }

    let response = state.marketing_events.record(request).await;
    (StatusCode::ACCEPTED, Json(response)).into_response()
}

async fn get_marketing_dashboard(State(state): State<Arc<AppState>>) -> Response {
    match state.marketing_events.dashboard().await {
        Ok(dashboard) => (StatusCode::OK, Json(dashboard)).into_response(),
        Err(error) => {
            tracing::error!(%error, "marketing conversion dashboard query failed");
            persisted_resource_unavailable_response(
                "marketing_dashboard_unavailable",
                "Conversion reporting is temporarily unavailable.",
            )
        }
    }
}

async fn readiness(
    state: Arc<AppState>,
    persistence: &'static str,
    database_required: bool,
) -> Response {
    if database_required && !state.jobs.is_database_healthy().await {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(HealthResponse {
                status: "unavailable",
                service: "grover-landscaping-api",
                persistence,
            }),
        )
            .into_response();
    }

    Json(HealthResponse {
        status: "ok",
        service: "grover-landscaping-api",
        persistence,
    })
    .into_response()
}

async fn get_my_access(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
) -> Response {
    match state
        .organizations
        .principal_access_summary(
            &principal.subject,
            &principal.username,
            principal.verified_email.clone(),
            principal.claim_roles.clone(),
        )
        .await
    {
        OrganizationResourceResult::Found(summary) => Json(summary).into_response(),
        OrganizationResourceResult::Unavailable => persisted_resource_unavailable_response(
            "principal_access_unavailable",
            "Persisted organization access could not be loaded.",
        ),
        OrganizationResourceResult::NotFound => unreachable!("access summaries are never missing"),
    }
}

async fn get_owner_workspace(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
) -> Response {
    match state
        .owner_acquisition
        .get_workspace(&principal.subject)
        .await
    {
        OwnerReadResult::Loaded(workspace) => Json(workspace).into_response(),
        OwnerReadResult::NotFound => resource_not_found_response(
            "owner_workspace_not_found",
            "Your Yard Owner workspace has not been created yet.",
        ),
        OwnerReadResult::Unavailable => persisted_resource_unavailable_response(
            "owner_workspace_unavailable",
            "Your Yard Owner workspace could not be loaded.",
        ),
    }
}

async fn save_owner_workspace(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Json(request): Json<SaveOwnerWorkspaceRequest>,
) -> Response {
    if !validate_workspace_request(&request) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_owner_workspace",
                message: "Enter a name between 2 and 100 characters.".to_string(),
            }),
        )
            .into_response();
    }
    let Some(verified_email) = principal.verified_email.as_deref() else {
        return (
            StatusCode::FORBIDDEN,
            Json(ErrorResponse {
                error: "verified_email_required",
                message: "Verify your email address before creating a Yard Owner workspace."
                    .to_string(),
            }),
        )
            .into_response();
    };

    match state
        .owner_acquisition
        .save_workspace(&principal.subject, verified_email, request)
        .await
    {
        OwnerMutationResult::Saved(workspace) => Json(workspace).into_response(),
        OwnerMutationResult::Unavailable => persisted_resource_unavailable_response(
            "owner_workspace_save_unavailable",
            "Your Yard Owner workspace could not be saved.",
        ),
        OwnerMutationResult::NotFound => unreachable!("workspace saves are upserts"),
        OwnerMutationResult::Duplicate => unreachable!("workspace saves are idempotent"),
    }
}

async fn list_owner_properties(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
) -> Response {
    match state
        .owner_acquisition
        .list_properties(&principal.subject)
        .await
    {
        OwnerReadResult::Loaded(properties) => Json(properties).into_response(),
        OwnerReadResult::NotFound => unreachable!("property lists are never missing"),
        OwnerReadResult::Unavailable => persisted_resource_unavailable_response(
            "owner_properties_unavailable",
            "Your properties could not be loaded.",
        ),
    }
}

async fn get_owner_property(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(property_id): Path<String>,
) -> Response {
    match state
        .owner_acquisition
        .get_property(&principal.subject, &property_id)
        .await
    {
        OwnerReadResult::Loaded(property) => Json(property).into_response(),
        OwnerReadResult::NotFound => resource_not_found_response(
            "owner_property_not_found",
            "The requested property was not found.",
        ),
        OwnerReadResult::Unavailable => persisted_resource_unavailable_response(
            "owner_property_unavailable",
            "The requested property could not be loaded.",
        ),
    }
}

async fn create_owner_property(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Json(request): Json<CreateOwnerPropertyRequest>,
) -> Response {
    if !validate_property_request(&request) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_owner_property",
                message: "Enter a complete service address and confirm you are authorized to request care for this property."
                    .to_string(),
            }),
        )
            .into_response();
    }
    match state
        .owner_acquisition
        .get_workspace(&principal.subject)
        .await
    {
        OwnerReadResult::Loaded(_) => {}
        OwnerReadResult::NotFound => {
            return (
                StatusCode::CONFLICT,
                Json(ErrorResponse {
                    error: "owner_workspace_required",
                    message: "Create your Yard Owner workspace before adding a property."
                        .to_string(),
                }),
            )
                .into_response();
        }
        OwnerReadResult::Unavailable => {
            return persisted_resource_unavailable_response(
                "owner_workspace_unavailable",
                "Your Yard Owner workspace could not be loaded.",
            );
        }
    }

    match state
        .owner_acquisition
        .create_property(&principal.subject, request)
        .await
    {
        OwnerMutationResult::Saved(property) => {
            (StatusCode::CREATED, Json(property)).into_response()
        }
        OwnerMutationResult::Duplicate => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "duplicate_owner_property",
                message: "This service address is already in your Yard Owner workspace."
                    .to_string(),
            }),
        )
            .into_response(),
        OwnerMutationResult::NotFound => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "owner_workspace_required",
                message: "Create your Yard Owner workspace before adding a property.".to_string(),
            }),
        )
            .into_response(),
        OwnerMutationResult::Unavailable => persisted_resource_unavailable_response(
            "owner_property_save_unavailable",
            "Your property could not be saved.",
        ),
    }
}

async fn get_owner_yard_brief(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(property_id): Path<String>,
) -> Response {
    match state
        .owner_acquisition
        .get_latest_yard_brief(&principal.subject, &property_id)
        .await
    {
        OwnerReadResult::Loaded(brief) => Json(brief).into_response(),
        OwnerReadResult::NotFound => resource_not_found_response(
            "owner_yard_brief_not_found",
            "A private yard brief has not been saved for this property.",
        ),
        OwnerReadResult::Unavailable => persisted_resource_unavailable_response(
            "owner_yard_brief_unavailable",
            "Your private yard brief could not be loaded.",
        ),
    }
}

async fn save_owner_yard_brief(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(property_id): Path<String>,
    Json(request): Json<SaveOwnerYardBriefRequest>,
) -> Response {
    if !validate_yard_brief_request(&request) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_owner_yard_brief",
                message: "Choose at least one yard area and care goal before marking the brief ready; keep each entry concise."
                    .to_string(),
            }),
        )
            .into_response();
    }
    match state
        .owner_acquisition
        .save_yard_brief(&principal.subject, &property_id, request)
        .await
    {
        OwnerMutationResult::Saved(brief) => Json(brief).into_response(),
        OwnerMutationResult::NotFound => resource_not_found_response(
            "owner_property_not_found",
            "The requested property was not found.",
        ),
        OwnerMutationResult::Unavailable => persisted_resource_unavailable_response(
            "owner_yard_brief_save_unavailable",
            "Your private yard brief could not be saved.",
        ),
        OwnerMutationResult::Duplicate => unreachable!("yard brief versions are append-only"),
    }
}

async fn list_owner_intake_media(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(property_id): Path<String>,
) -> Response {
    match state
        .owner_acquisition
        .list_intake_media(&principal.subject, &property_id)
        .await
    {
        OwnerReadResult::Loaded(media) => Json(media).into_response(),
        OwnerReadResult::NotFound => resource_not_found_response(
            "owner_property_not_found",
            "The requested property was not found.",
        ),
        OwnerReadResult::Unavailable => persisted_resource_unavailable_response(
            "owner_intake_media_unavailable",
            "Your private yard photos could not be loaded.",
        ),
    }
}

async fn create_owner_intake_media_upload(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(property_id): Path<String>,
    Json(request): Json<CreateOwnerIntakeMediaRequest>,
) -> Response {
    if !validate_intake_media_request(&request) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_owner_intake_media",
                message: "Choose a supported guided view and a JPEG, PNG, GIF, or WebP image."
                    .to_string(),
            }),
        )
            .into_response();
    }
    match state
        .owner_acquisition
        .create_intake_media_upload(&principal.subject, &property_id, request)
        .await
    {
        OwnerMutationResult::Saved(upload) => (StatusCode::CREATED, Json(upload)).into_response(),
        OwnerMutationResult::NotFound => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "ready_owner_yard_brief_required",
                message: "Save a ready private yard brief before adding photographs.".to_string(),
            }),
        )
            .into_response(),
        OwnerMutationResult::Unavailable => persisted_resource_unavailable_response(
            "owner_intake_media_create_unavailable",
            "A private photo upload could not be prepared.",
        ),
        OwnerMutationResult::Duplicate => unreachable!("intake media IDs are generated"),
    }
}

async fn complete_owner_intake_media_upload(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path((property_id, media_id)): Path<(String, String)>,
    Json(request): Json<OwnerIntakeMediaCompleteRequest>,
) -> Response {
    if request.file_size_bytes.is_some_and(|value| value <= 0)
        || request.image_width_px.is_some_and(|value| value <= 0)
        || request.image_height_px.is_some_and(|value| value <= 0)
    {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_owner_intake_media_metadata",
                message: "Photo size and dimensions must be greater than zero when supplied."
                    .to_string(),
            }),
        )
            .into_response();
    }
    let has_metadata = request.file_size_bytes.is_some()
        || request.image_width_px.is_some()
        || request.image_height_px.is_some();
    let metadata = PhotoUploadMetadata {
        file_size_bytes: request.file_size_bytes,
        image_width_px: request.image_width_px,
        image_height_px: request.image_height_px,
        metadata_source: has_metadata.then(|| "client_reported".to_string()),
    };
    match state
        .owner_acquisition
        .complete_intake_media_upload(&principal.subject, &property_id, &media_id, metadata)
        .await
    {
        OwnerMutationResult::Saved(media) => Json(media).into_response(),
        OwnerMutationResult::NotFound => resource_not_found_response(
            "owner_intake_media_not_found",
            "The private photo upload was not found or cannot be completed.",
        ),
        OwnerMutationResult::Unavailable => persisted_resource_unavailable_response(
            "owner_intake_media_completion_unavailable",
            "The private photo upload could not be completed.",
        ),
        OwnerMutationResult::Duplicate => unreachable!("media completion is idempotent"),
    }
}

async fn delete_owner_intake_media(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path((property_id, media_id)): Path<(String, String)>,
) -> Response {
    match state
        .owner_acquisition
        .delete_intake_media(&principal.subject, &property_id, &media_id)
        .await
    {
        OwnerMutationResult::Saved(media) => Json(media).into_response(),
        OwnerMutationResult::NotFound => resource_not_found_response(
            "owner_intake_media_not_found",
            "The private yard photo was not found.",
        ),
        OwnerMutationResult::Unavailable => persisted_resource_unavailable_response(
            "owner_intake_media_delete_unavailable",
            "The private yard photo could not be deleted. It remains private and unchanged; try again.",
        ),
        OwnerMutationResult::Duplicate => unreachable!("media deletion is idempotent"),
    }
}

async fn list_owner_provider_invitations(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(property_id): Path<String>,
) -> Response {
    match state
        .owner_acquisition
        .list_provider_invitations(&principal.subject, &property_id)
        .await
    {
        OwnerReadResult::Loaded(invitations) => Json(invitations).into_response(),
        OwnerReadResult::NotFound => resource_not_found_response(
            "owner_property_not_found",
            "The requested property was not found.",
        ),
        OwnerReadResult::Unavailable => persisted_resource_unavailable_response(
            "owner_provider_invitations_unavailable",
            "Your provider invitations could not be loaded.",
        ),
    }
}

async fn list_owner_provider_connection_progress(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(property_id): Path<String>,
) -> Response {
    match state
        .owner_acquisition
        .list_provider_connection_progress(&principal.subject, &property_id)
        .await
    {
        OwnerReadResult::Loaded(entries) => Json(entries).into_response(),
        OwnerReadResult::NotFound => resource_not_found_response(
            "owner_property_not_found",
            "The requested property was not found.",
        ),
        OwnerReadResult::Unavailable => persisted_resource_unavailable_response(
            "owner_provider_connection_progress_unavailable",
            "Provider connection progress could not be loaded. Existing invitations and responses are unchanged.",
        ),
    }
}

async fn list_owner_provider_disclosure_receipts(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(property_id): Path<String>,
) -> Response {
    match state
        .owner_acquisition
        .list_provider_disclosure_receipts(&principal.subject, &property_id)
        .await
    {
        OwnerReadResult::Loaded(receipts) => Json(receipts).into_response(),
        OwnerReadResult::NotFound => resource_not_found_response(
            "owner_property_not_found",
            "The requested property was not found.",
        ),
        OwnerReadResult::Unavailable => persisted_resource_unavailable_response(
            "owner_provider_disclosure_receipts_unavailable",
            "Assessment access history could not be loaded. Existing access is unchanged.",
        ),
    }
}

async fn list_owner_provider_assessments(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(property_id): Path<String>,
) -> Response {
    match state
        .owner_acquisition
        .list_owner_provider_assessments(&principal.subject, &property_id)
        .await
    {
        OwnerReadResult::Loaded(assessments) => Json(assessments).into_response(),
        OwnerReadResult::NotFound => resource_not_found_response(
            "owner_property_not_found",
            "The requested property was not found.",
        ),
        OwnerReadResult::Unavailable => persisted_resource_unavailable_response(
            "owner_provider_assessments_unavailable",
            "Assessment progress could not be loaded. Existing assessment state is unchanged.",
        ),
    }
}

async fn list_owner_initial_service_proposals(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(property_id): Path<String>,
) -> Response {
    match state
        .owner_acquisition
        .list_owner_initial_service_proposals(&principal.subject, &property_id)
        .await
    {
        OwnerReadResult::Loaded(proposals) => Json(proposals).into_response(),
        OwnerReadResult::NotFound => resource_not_found_response(
            "owner_property_not_found",
            "The requested property was not found.",
        ),
        OwnerReadResult::Unavailable => persisted_resource_unavailable_response(
            "owner_initial_service_proposals_unavailable",
            "Initial service proposals could not be loaded. Existing proposal state is unchanged.",
        ),
    }
}

async fn get_owner_initial_service_proposal(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path((property_id, proposal_id)): Path<(String, String)>,
) -> Response {
    match state
        .owner_acquisition
        .get_owner_initial_service_proposal(&principal.subject, &property_id, &proposal_id)
        .await
    {
        OwnerReadResult::Loaded(proposal) => Json(proposal).into_response(),
        OwnerReadResult::NotFound => resource_not_found_response(
            "owner_initial_service_proposal_not_found",
            "The requested proposal was not found for this property.",
        ),
        OwnerReadResult::Unavailable => persisted_resource_unavailable_response(
            "owner_initial_service_proposal_unavailable",
            "The proposal could not be loaded. Existing proposal state is unchanged.",
        ),
    }
}

async fn decide_owner_initial_service_proposal(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path((property_id, proposal_id)): Path<(String, String)>,
    Json(request): Json<DecideOwnerProviderInitialServiceProposalRequest>,
) -> Response {
    if !validate_initial_service_proposal_decision_request(&request) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "owner_initial_service_proposal_decision_invalid",
                message: "Choose accept or a supported decline reason for the exact proposal version. Acceptance requires the current affirmation text."
                    .to_string(),
            }),
        )
            .into_response();
    }
    match state
        .owner_acquisition
        .decide_initial_service_proposal(
            &principal.subject,
            &property_id,
            &proposal_id,
            request,
        )
        .await
    {
        OwnerProviderInitialServiceProposalDecisionResult::Decided(decision)
        | OwnerProviderInitialServiceProposalDecisionResult::Replayed(decision) => {
            Json(decision).into_response()
        }
        OwnerProviderInitialServiceProposalDecisionResult::NotFound => {
            resource_not_found_response(
                "owner_initial_service_proposal_not_found",
                "The requested proposal was not found for this property.",
            )
        }
        OwnerProviderInitialServiceProposalDecisionResult::InvalidState(proposal) => {
            (StatusCode::CONFLICT, Json(proposal)).into_response()
        }
        OwnerProviderInitialServiceProposalDecisionResult::Conflict => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "owner_initial_service_proposal_decision_conflict",
                message: "The proposal changed, expired, or was already decided. Reload the exact version before retrying."
                    .to_string(),
            }),
        )
            .into_response(),
        OwnerProviderInitialServiceProposalDecisionResult::Unavailable => {
            persisted_resource_unavailable_response(
                "owner_initial_service_proposal_decision_unavailable",
                "The proposal decision could not be confirmed. Existing proposal state is unchanged; reload before retrying.",
            )
        }
    }
}

async fn get_owner_provider_relationship_activation(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path((property_id, proposal_id)): Path<(String, String)>,
) -> Response {
    match state
        .owner_acquisition
        .get_owner_provider_relationship_activation(&principal.subject, &property_id, &proposal_id)
        .await
    {
        OwnerReadResult::Loaded(activation) => Json(activation).into_response(),
        OwnerReadResult::NotFound => resource_not_found_response(
            "owner_provider_relationship_activation_not_found",
            "No activation was found for this proposal and property.",
        ),
        OwnerReadResult::Unavailable => persisted_resource_unavailable_response(
            "owner_provider_relationship_activation_unavailable",
            "Activation status could not be loaded. Existing provider setup is unchanged.",
        ),
    }
}

async fn activate_owner_provider_relationship(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path((property_id, proposal_id)): Path<(String, String)>,
    Json(request): Json<ActivateOwnerProviderRelationshipRequest>,
) -> Response {
    if !validate_owner_provider_relationship_activation_request(&request) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "owner_provider_relationship_activation_invalid",
                message: "Confirm provider setup using the current activation statement and exact accepted proposal version."
                    .to_string(),
            }),
        )
            .into_response();
    }
    match state
        .owner_acquisition
        .activate_owner_provider_relationship(
            &principal.subject,
            &property_id,
            &proposal_id,
            request,
        )
        .await
    {
        OwnerProviderRelationshipActivationResult::Activated(activation) => {
            (StatusCode::CREATED, Json(activation)).into_response()
        }
        OwnerProviderRelationshipActivationResult::Replayed(activation) => {
            Json(activation).into_response()
        }
        OwnerProviderRelationshipActivationResult::NotFound => resource_not_found_response(
            "owner_initial_service_proposal_not_found",
            "The accepted proposal was not found for this property.",
        ),
        OwnerProviderRelationshipActivationResult::InvalidState => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "owner_provider_relationship_activation_not_ready",
                message: "This proposal or property is no longer ready for activation. Reload the accepted proposal and current property status."
                    .to_string(),
            }),
        )
            .into_response(),
        OwnerProviderRelationshipActivationResult::Conflict => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "owner_provider_relationship_activation_conflict",
                message: "Provider setup was already completed, changed, or is being completed. Reload activation status before retrying."
                    .to_string(),
            }),
        )
            .into_response(),
        OwnerProviderRelationshipActivationResult::Unavailable => {
            persisted_resource_unavailable_response(
                "owner_provider_relationship_activation_unavailable",
                "Provider setup could not be confirmed. No partial setup is reported; reload activation status before retrying.",
            )
        }
    }
}

async fn get_owner_provider_first_visit(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path((property_id, activation_id)): Path<(String, String)>,
) -> Response {
    match state
        .owner_acquisition
        .get_owner_provider_first_visit(&principal.subject, &property_id, &activation_id)
        .await
    {
        OwnerProviderFirstVisitReadResult::Loaded(first_visit) => {
            Json(first_visit).into_response()
        }
        OwnerProviderFirstVisitReadResult::NotFound => resource_not_found_response(
            "owner_provider_first_visit_not_found",
            "The first-visit lifecycle was not found for this property relationship.",
        ),
        OwnerProviderFirstVisitReadResult::InvalidState => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "owner_provider_first_visit_not_ready",
                message: "This relationship is not ready for first-visit planning. Reload provider setup before continuing."
                    .to_string(),
            }),
        )
            .into_response(),
        OwnerProviderFirstVisitReadResult::Unavailable => {
            persisted_resource_unavailable_response(
                "owner_provider_first_visit_unavailable",
                "First-visit status could not be loaded. Existing provider setup and appointment state are unchanged.",
            )
        }
    }
}

async fn list_customer_portal_visits(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
) -> Response {
    match state
        .customer_portal
        .list_confirmed_visits(&principal.subject)
        .await
    {
        CustomerPortalVisitReadResult::Loaded(collection) => Json(collection).into_response(),
        CustomerPortalVisitReadResult::NotAuthorized => (
            StatusCode::FORBIDDEN,
            Json(ErrorResponse {
                error: "customer_portal_access_required",
                message: "No active customer portal access is available for this account."
                    .to_string(),
            }),
        )
            .into_response(),
        CustomerPortalVisitReadResult::InvalidAuthorization => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "customer_portal_access_inconsistent",
                message: "Customer portal access needs provider review before visit details can be shown."
                    .to_string(),
            }),
        )
            .into_response(),
        CustomerPortalVisitReadResult::Unavailable => persisted_resource_unavailable_response(
            "customer_portal_visits_unavailable",
            "Visit details could not be loaded. Customer information remains protected; try again later.",
        ),
    }
}

async fn get_customer_visit_thread(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(customer_visit_reference): Path<String>,
) -> Response {
    customer_visit_thread_read_response(
        state
            .customer_visit_communication
            .get_customer_thread(&principal.subject, &customer_visit_reference)
            .await,
        true,
    )
}

async fn get_customer_visit_proof(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(customer_visit_reference): Path<String>,
) -> Response {
    match state
        .customer_visit_communication
        .get_customer_proof(&principal.subject, &customer_visit_reference)
        .await
    {
        CustomerVisitProofReadResult::Delivered(proof) => Json(proof).into_response(),
        CustomerVisitProofReadResult::Pending => resource_not_found_response(
            "customer_visit_proof_pending",
            "Delivered proof is not available for this visit yet.",
        ),
        CustomerVisitProofReadResult::NotAuthorized => (
            StatusCode::FORBIDDEN,
            Json(ErrorResponse {
                error: "customer_portal_access_required",
                message: "No active customer portal access is available for this visit."
                    .to_string(),
            }),
        )
            .into_response(),
        CustomerVisitProofReadResult::InvalidAuthorization => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "customer_portal_access_inconsistent",
                message: "Customer portal access needs provider review before delivered proof can be shown."
                    .to_string(),
            }),
        )
            .into_response(),
        CustomerVisitProofReadResult::NotFound => resource_not_found_response(
            "customer_visit_proof_not_found",
            "The visit was not found in this authenticated scope.",
        ),
        CustomerVisitProofReadResult::InvalidSnapshot => {
            persisted_resource_unavailable_response(
                "customer_visit_proof_invalid",
                "The delivered proof could not be safely projected. No live work data was substituted.",
            )
        }
        CustomerVisitProofReadResult::Unavailable => persisted_resource_unavailable_response(
            "customer_visit_proof_unavailable",
            "Delivered proof could not be loaded. No live work data was substituted.",
        ),
    }
}

async fn list_customer_visit_recommendations(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(customer_visit_reference): Path<String>,
) -> Response {
    match state
        .customer_visit_recommendations
        .list_for_visit(&principal.subject, &customer_visit_reference)
        .await
    {
        CustomerRecommendationListResult::Loaded(collection) => Json(collection).into_response(),
        CustomerRecommendationListResult::NotAuthorized => (
            StatusCode::FORBIDDEN,
            Json(ErrorResponse {
                error: "customer_portal_access_required",
                message: "No active customer portal access is available for this visit."
                    .to_string(),
            }),
        )
            .into_response(),
        CustomerRecommendationListResult::InvalidAuthorization => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "customer_portal_access_inconsistent",
                message: "Customer portal access needs provider review before recommendations can be shown.".to_string(),
            }),
        )
            .into_response(),
        CustomerRecommendationListResult::NotFound => resource_not_found_response(
            "customer_visit_recommendations_not_found",
            "The visit was not found in this authenticated scope.",
        ),
        CustomerRecommendationListResult::InvalidSnapshot => {
            persisted_resource_unavailable_response(
                "customer_visit_recommendations_invalid",
                "Recommendations could not be safely projected. No live bid data was substituted.",
            )
        }
        CustomerRecommendationListResult::Unavailable => {
            persisted_resource_unavailable_response(
                "customer_visit_recommendations_unavailable",
                "Recommendations could not be loaded. No live bid data was substituted.",
            )
        }
    }
}

async fn get_customer_visit_recommendation(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path((customer_visit_reference, customer_recommendation_reference)): Path<(String, String)>,
) -> Response {
    match state
        .customer_visit_recommendations
        .get_for_visit(
            &principal.subject,
            &customer_visit_reference,
            &customer_recommendation_reference,
        )
        .await
    {
        CustomerRecommendationDetailResult::Loaded(detail) => Json(detail).into_response(),
        CustomerRecommendationDetailResult::NotAuthorized => (
            StatusCode::FORBIDDEN,
            Json(ErrorResponse {
                error: "customer_portal_access_required",
                message: "No active customer portal access is available for this visit."
                    .to_string(),
            }),
        )
            .into_response(),
        CustomerRecommendationDetailResult::InvalidAuthorization => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "customer_portal_access_inconsistent",
                message: "Customer portal access needs provider review before this recommendation can be shown.".to_string(),
            }),
        )
            .into_response(),
        CustomerRecommendationDetailResult::NotFound => resource_not_found_response(
            "customer_visit_recommendation_not_found",
            "The recommendation was not found in this authenticated visit scope.",
        ),
        CustomerRecommendationDetailResult::InvalidSnapshot => {
            persisted_resource_unavailable_response(
                "customer_visit_recommendation_invalid",
                "The recommendation could not be safely projected. No live bid data was substituted.",
            )
        }
        CustomerRecommendationDetailResult::Unavailable => {
            persisted_resource_unavailable_response(
                "customer_visit_recommendation_unavailable",
                "The recommendation could not be loaded. No live bid data was substituted.",
            )
        }
    }
}

async fn decide_customer_visit_recommendation(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path((customer_visit_reference, customer_recommendation_reference)): Path<(String, String)>,
    Json(request): Json<DecideCustomerRecommendationRequest>,
) -> Response {
    if !validate_decision_request(&request) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "customer_visit_recommendation_decision_invalid",
                message: "Provide the current version, an allowed action, action-specific context, and a valid retry key.".to_string(),
            }),
        )
            .into_response();
    }
    match state
        .customer_visit_recommendations
        .decide(
            &principal.subject,
            &customer_visit_reference,
            &customer_recommendation_reference,
            request,
        )
        .await
    {
        CustomerRecommendationDecisionResult::Recorded(receipt)
        | CustomerRecommendationDecisionResult::Replayed(receipt) => Json(receipt).into_response(),
        CustomerRecommendationDecisionResult::NotAuthorized => (
            StatusCode::FORBIDDEN,
            Json(ErrorResponse {
                error: "customer_portal_access_required",
                message: "No active customer portal access is available for this visit."
                    .to_string(),
            }),
        )
            .into_response(),
        CustomerRecommendationDecisionResult::InvalidAuthorization => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "customer_portal_access_inconsistent",
                message: "Customer portal access needs provider review before a recommendation decision can be recorded.".to_string(),
            }),
        )
            .into_response(),
        CustomerRecommendationDecisionResult::NotFound => resource_not_found_response(
            "customer_visit_recommendation_not_found",
            "The active recommendation was not found in this authenticated visit scope.",
        ),
        CustomerRecommendationDecisionResult::Conflict => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "customer_visit_recommendation_decision_conflict",
                message: "The recommendation version, state, or retry identity changed. Reload before deciding again.".to_string(),
            }),
        )
            .into_response(),
        CustomerRecommendationDecisionResult::Unavailable => {
            persisted_resource_unavailable_response(
                "customer_visit_recommendation_decision_unavailable",
                "The recommendation decision could not be persisted.",
            )
        }
    }
}

async fn create_customer_visit_question(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(customer_visit_reference): Path<String>,
    Json(request): Json<CreateCustomerVisitQuestionRequest>,
) -> Response {
    if !validate_customer_question_request(&request) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "customer_visit_question_invalid",
                message: "Provide the current thread version, an allowed visit topic, bounded customer-safe text, and a valid retry key."
                    .to_string(),
            }),
        )
            .into_response();
    }
    customer_visit_message_write_response(
        state
            .customer_visit_communication
            .create_customer_question(&principal.subject, &customer_visit_reference, request)
            .await,
        true,
    )
}

async fn list_provider_customer_visit_threads(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
) -> Response {
    match state
        .customer_visit_communication
        .list_provider_threads(&principal.subject)
        .await
    {
        ProviderVisitThreadListResult::Loaded(queue) => Json(queue).into_response(),
        ProviderVisitThreadListResult::NotFound => resource_not_found_response(
            "provider_customer_visit_threads_not_found",
            "No visit-question queue is available for an active organization owner or manager membership.",
        ),
        ProviderVisitThreadListResult::Unavailable => persisted_resource_unavailable_response(
            "provider_customer_visit_threads_unavailable",
            "The visit-question queue could not be loaded. Existing messages are unchanged.",
        ),
    }
}

async fn get_provider_customer_visit_thread(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(customer_visit_reference): Path<String>,
) -> Response {
    customer_visit_thread_read_response(
        state
            .customer_visit_communication
            .get_provider_thread(&principal.subject, &customer_visit_reference)
            .await,
        false,
    )
}

async fn create_provider_customer_visit_response(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(customer_visit_reference): Path<String>,
    Json(request): Json<CreateProviderVisitResponseRequest>,
) -> Response {
    if !validate_provider_response_request(&request) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "provider_customer_visit_response_invalid",
                message: "Provide the current thread version, exact customer-question reply, bounded customer-safe text, and a valid retry key."
                    .to_string(),
            }),
        )
            .into_response();
    }
    customer_visit_message_write_response(
        state
            .customer_visit_communication
            .create_provider_response(&principal.subject, &customer_visit_reference, request)
            .await,
        false,
    )
}

fn customer_visit_thread_read_response(
    result: CustomerVisitThreadReadResult,
    customer_route: bool,
) -> Response {
    match result {
        CustomerVisitThreadReadResult::Loaded(thread) => Json(thread).into_response(),
        CustomerVisitThreadReadResult::NotAuthorized => (
            StatusCode::FORBIDDEN,
            Json(ErrorResponse {
                error: "customer_portal_access_required",
                message: "No active customer portal access is available for this visit."
                    .to_string(),
            }),
        )
            .into_response(),
        CustomerVisitThreadReadResult::InvalidAuthorization => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "customer_portal_access_inconsistent",
                message: "Customer portal access needs provider review before visit messages can be shown."
                    .to_string(),
            }),
        )
            .into_response(),
        CustomerVisitThreadReadResult::NotFound => resource_not_found_response(
            if customer_route {
                "customer_visit_thread_not_found"
            } else {
                "provider_customer_visit_thread_not_found"
            },
            "The visit conversation was not found in this authenticated scope.",
        ),
        CustomerVisitThreadReadResult::Unavailable => persisted_resource_unavailable_response(
            if customer_route {
                "customer_visit_thread_unavailable"
            } else {
                "provider_customer_visit_thread_unavailable"
            },
            "The visit conversation could not be loaded. Existing messages are unchanged.",
        ),
    }
}

fn customer_visit_message_write_response(
    result: CustomerVisitMessageWriteResult,
    customer_route: bool,
) -> Response {
    match result {
        CustomerVisitMessageWriteResult::Created(message) => {
            (StatusCode::CREATED, Json(message)).into_response()
        }
        CustomerVisitMessageWriteResult::Replayed(message) => Json(message).into_response(),
        CustomerVisitMessageWriteResult::NotAuthorized => (
            StatusCode::FORBIDDEN,
            Json(ErrorResponse {
                error: "customer_portal_access_required",
                message: "No active customer portal access is available for this visit."
                    .to_string(),
            }),
        )
            .into_response(),
        CustomerVisitMessageWriteResult::InvalidAuthorization => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "customer_portal_access_inconsistent",
                message: "Customer portal access needs provider review before a visit question can be saved."
                    .to_string(),
            }),
        )
            .into_response(),
        CustomerVisitMessageWriteResult::NotFound => resource_not_found_response(
            if customer_route {
                "customer_visit_thread_not_found"
            } else {
                "provider_customer_visit_thread_not_found"
            },
            "The visit conversation was not found in this authenticated scope.",
        ),
        CustomerVisitMessageWriteResult::Conflict => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: if customer_route {
                    "customer_visit_question_conflict"
                } else {
                    "provider_customer_visit_response_conflict"
                },
                message: "The thread changed, the question was already answered, or this retry key identifies different content. Reload the conversation before retrying."
                    .to_string(),
            }),
        )
            .into_response(),
        CustomerVisitMessageWriteResult::Unavailable => {
            persisted_resource_unavailable_response(
                if customer_route {
                    "customer_visit_question_unavailable"
                } else {
                    "provider_customer_visit_response_unavailable"
                },
                "The message could not be confirmed. Retain the retry key and reload the conversation before retrying.",
            )
        }
    }
}

async fn decide_owner_provider_first_visit(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path((property_id, activation_id)): Path<(String, String)>,
    Json(request): Json<DecideOwnerProviderFirstVisitRequest>,
) -> Response {
    if !validate_owner_first_visit_decision_request(&request) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "owner_provider_first_visit_decision_invalid",
                message: "Confirm the exact proposed window using the current statement, or include a customer-safe change request."
                    .to_string(),
            }),
        )
            .into_response();
    }
    first_visit_write_response(
        state
            .owner_acquisition
            .decide_owner_provider_first_visit(
                &principal.subject,
                &property_id,
                &activation_id,
                request,
            )
            .await,
        "owner_provider_first_visit_not_found",
    )
}

async fn get_provider_first_visit(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(activation_id): Path<String>,
    Json(request): Json<OpenOwnerProviderInboxRequest>,
) -> Response {
    if !validate_provider_inbox_request(&request) {
        return resource_not_found_response(
            "provider_first_visit_not_found",
            "The provider relationship is not available to this verified account.",
        );
    }
    let Some(verified_email) = principal.verified_email.as_deref() else {
        return (
            StatusCode::FORBIDDEN,
            Json(ErrorResponse {
                error: "verified_email_required",
                message: "Verify the invited business email before planning a first visit."
                    .to_string(),
            }),
        )
            .into_response();
    };
    match state
        .owner_acquisition
        .get_provider_first_visit(
            &principal.subject,
            verified_email,
            &activation_id,
            &request.token,
        )
        .await
    {
        OwnerProviderFirstVisitReadResult::Loaded(first_visit) => {
            Json(first_visit).into_response()
        }
        OwnerProviderFirstVisitReadResult::NotFound => resource_not_found_response(
            "provider_first_visit_not_found",
            "The provider relationship is not available to this verified account.",
        ),
        OwnerProviderFirstVisitReadResult::InvalidState => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "provider_first_visit_not_ready",
                message: "The relationship is no longer ready for first-visit planning. Reload provider progress."
                    .to_string(),
            }),
        )
            .into_response(),
        OwnerProviderFirstVisitReadResult::Unavailable => {
            persisted_resource_unavailable_response(
                "provider_first_visit_unavailable",
                "First-visit status could not be loaded. Existing relationship and appointment state are unchanged.",
            )
        }
    }
}

async fn propose_provider_first_visit(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(activation_id): Path<String>,
    Json(request): Json<ProposeProviderFirstVisitRequest>,
) -> Response {
    if !validate_provider_first_visit_request(&request) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "provider_first_visit_proposal_invalid",
                message: "Provide the current series version, a future arrival window of four hours or less, its time zone, and a valid retry key."
                    .to_string(),
            }),
        )
            .into_response();
    }
    let Some(verified_email) = principal.verified_email.as_deref() else {
        return (
            StatusCode::FORBIDDEN,
            Json(ErrorResponse {
                error: "verified_email_required",
                message: "Verify the invited business email before proposing a first visit."
                    .to_string(),
            }),
        )
            .into_response();
    };
    first_visit_write_response(
        state
            .owner_acquisition
            .propose_provider_first_visit(
                &principal.subject,
                verified_email,
                &activation_id,
                request,
            )
            .await,
        "provider_first_visit_not_found",
    )
}

fn first_visit_write_response(
    result: OwnerProviderFirstVisitWriteResult,
    not_found_code: &'static str,
) -> Response {
    match result {
        OwnerProviderFirstVisitWriteResult::Saved(first_visit) => {
            (StatusCode::CREATED, Json(first_visit)).into_response()
        }
        OwnerProviderFirstVisitWriteResult::Replayed(first_visit) => {
            Json(first_visit).into_response()
        }
        OwnerProviderFirstVisitWriteResult::NotFound => resource_not_found_response(
            not_found_code,
            "The active provider relationship was not found in this authenticated scope.",
        ),
        OwnerProviderFirstVisitWriteResult::InvalidState(first_visit) => {
            (StatusCode::CONFLICT, Json(first_visit)).into_response()
        }
        OwnerProviderFirstVisitWriteResult::Conflict => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "owner_provider_first_visit_conflict",
                message: "The first-visit version changed, was already decided, or this retry key identifies different content. Reload status before retrying."
                    .to_string(),
            }),
        )
            .into_response(),
        OwnerProviderFirstVisitWriteResult::Unavailable => {
            persisted_resource_unavailable_response(
                "owner_provider_first_visit_unavailable",
                "The first-visit write could not be confirmed. Retain the retry key and reload status before retrying.",
            )
        }
    }
}

async fn get_provider_service_release(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(activation_id): Path<String>,
) -> Response {
    match state
        .service_mobilization
        .get_service_release(&principal.subject, &activation_id)
        .await
    {
        ServiceMobilizationReadResult::Loaded(status) => {
            Json(ProviderServiceMobilizationStatusResponse::from(status)).into_response()
        }
        ServiceMobilizationReadResult::NotFound => resource_not_found_response(
            "provider_service_release_not_found",
            "No service release is available for this active provider relationship and organization membership.",
        ),
        ServiceMobilizationReadResult::Unavailable => persisted_resource_unavailable_response(
            "provider_service_release_unavailable",
            "Service release status could not be loaded. Existing work and customer-visible status are unchanged.",
        ),
    }
}

async fn release_provider_initial_service(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(activation_id): Path<String>,
    Json(request): Json<ReleaseInitialServiceRequest>,
) -> Response {
    if !validate_release_request(&request) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "provider_service_release_invalid",
                message: "Provide the confirmed first-visit version and a valid retry key."
                    .to_string(),
            }),
        )
            .into_response();
    }
    match state
        .service_mobilization
        .release_initial_service(&principal.subject, &activation_id, request)
        .await
    {
        ServiceWorkReleaseWriteResult::Released(release) => {
            (
                StatusCode::CREATED,
                Json(ProviderServiceReleaseResponse::from(release)),
            )
                .into_response()
        }
        ServiceWorkReleaseWriteResult::Replayed(release) => {
            Json(ProviderServiceReleaseResponse::from(release)).into_response()
        }
        ServiceWorkReleaseWriteResult::NotFound => resource_not_found_response(
            "provider_service_release_not_found",
            "The active provider relationship was not found for an authorized organization owner or manager.",
        ),
        ServiceWorkReleaseWriteResult::InvalidState => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "provider_service_release_not_ready",
                message: "The accepted service and confirmed first visit are not in the expected unreleased state. Reload status before continuing."
                    .to_string(),
            }),
        )
            .into_response(),
        ServiceWorkReleaseWriteResult::Conflict => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "provider_service_release_conflict",
                message: "The release version changed or this retry key identifies different content. Reload status before retrying."
                    .to_string(),
            }),
        )
            .into_response(),
        ServiceWorkReleaseWriteResult::Unavailable => persisted_resource_unavailable_response(
            "provider_service_release_unavailable",
            "The service release could not be confirmed. Retain the retry key and reload status before retrying.",
        ),
    }
}

async fn publish_provider_customer_service_status(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(release_id): Path<String>,
    Json(request): Json<PublishCustomerServiceDayEventRequest>,
) -> Response {
    if !validate_service_day_event_request(&request) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "customer_service_status_invalid",
                message: "Provide an allowed customer status, current event version, bounded customer-safe update, and valid retry key."
                    .to_string(),
            }),
        )
            .into_response();
    }
    match state
        .service_mobilization
        .publish_customer_service_day_event(&principal.subject, &release_id, request)
        .await
    {
        CustomerServiceDayEventWriteResult::Published(event) => {
            (StatusCode::CREATED, Json(event)).into_response()
        }
        CustomerServiceDayEventWriteResult::Replayed(event) => Json(event).into_response(),
        CustomerServiceDayEventWriteResult::NotFound => resource_not_found_response(
            "customer_service_status_release_not_found",
            "The service release was not found for an active relationship and authorized organization membership.",
        ),
        CustomerServiceDayEventWriteResult::InvalidState => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "customer_service_status_not_ready",
                message: "The event version, customer-status transition, or linked job state changed. Reload service release status before continuing."
                    .to_string(),
            }),
        )
            .into_response(),
        CustomerServiceDayEventWriteResult::Conflict => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "customer_service_status_conflict",
                message: "The status update is invalid or this retry key identifies different content. Reload status before retrying."
                    .to_string(),
            }),
        )
            .into_response(),
        CustomerServiceDayEventWriteResult::Unavailable => {
            persisted_resource_unavailable_response(
                "customer_service_status_unavailable",
                "The customer-visible update could not be confirmed. Retain the retry key and reload service release status before retrying.",
            )
        }
    }
}

async fn list_owner_initial_service_proposal_messages(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path((property_id, proposal_id)): Path<(String, String)>,
) -> Response {
    match state
        .owner_acquisition
        .list_owner_initial_service_proposal_messages(
            &principal.subject,
            &property_id,
            &proposal_id,
        )
        .await
    {
        OwnerReadResult::Loaded(messages) => Json(messages).into_response(),
        OwnerReadResult::NotFound => resource_not_found_response(
            "owner_initial_service_proposal_not_found",
            "The requested proposal was not found for this property.",
        ),
        OwnerReadResult::Unavailable => persisted_resource_unavailable_response(
            "owner_initial_service_proposal_messages_unavailable",
            "Proposal messages could not be loaded. Existing messages are unchanged.",
        ),
    }
}

async fn create_owner_initial_service_proposal_message(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path((property_id, proposal_id)): Path<(String, String)>,
    Json(request): Json<CreateOwnerInitialServiceProposalMessageRequest>,
) -> Response {
    if !validate_owner_initial_service_proposal_message_request(&request) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "owner_initial_service_proposal_message_invalid",
                message: "Choose question or change request and provide customer-safe text for the exact current proposal version."
                    .to_string(),
            }),
        )
            .into_response();
    }
    match state
        .owner_acquisition
        .create_owner_initial_service_proposal_message(
            &principal.subject,
            &property_id,
            &proposal_id,
            request,
        )
        .await
    {
        OwnerProviderInitialServiceProposalMessageWriteResult::Created(message) => {
            (StatusCode::CREATED, Json(message)).into_response()
        }
        OwnerProviderInitialServiceProposalMessageWriteResult::Replayed(message) => {
            Json(message).into_response()
        }
        OwnerProviderInitialServiceProposalMessageWriteResult::NotFound => {
            resource_not_found_response(
                "owner_initial_service_proposal_not_found",
                "The requested proposal was not found for this property.",
            )
        }
        OwnerProviderInitialServiceProposalMessageWriteResult::InvalidState(proposal) => {
            (StatusCode::CONFLICT, Json(proposal)).into_response()
        }
        OwnerProviderInitialServiceProposalMessageWriteResult::Conflict => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "owner_initial_service_proposal_message_conflict",
                message: "The proposal changed, expired, or was already decided. Reload before sending this message."
                    .to_string(),
            }),
        )
            .into_response(),
        OwnerProviderInitialServiceProposalMessageWriteResult::Unavailable => {
            persisted_resource_unavailable_response(
                "owner_initial_service_proposal_message_unavailable",
                "The proposal message could not be confirmed. Existing proposal state is unchanged; reload before retrying.",
            )
        }
    }
}

async fn list_owner_provider_assessment_messages(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path((property_id, assessment_id)): Path<(String, String)>,
) -> Response {
    match state
        .owner_acquisition
        .list_owner_assessment_messages(&principal.subject, &property_id, &assessment_id)
        .await
    {
        OwnerReadResult::Loaded(messages) => Json(messages).into_response(),
        OwnerReadResult::NotFound => resource_not_found_response(
            "owner_provider_assessment_not_found",
            "The requested assessment was not found for this property.",
        ),
        OwnerReadResult::Unavailable => persisted_resource_unavailable_response(
            "owner_provider_assessment_messages_unavailable",
            "Assessment messages could not be loaded. Existing messages are unchanged.",
        ),
    }
}

async fn create_owner_provider_assessment_message(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path((property_id, assessment_id)): Path<(String, String)>,
    Json(request): Json<CreateOwnerAssessmentMessageRequest>,
) -> Response {
    if !validate_owner_assessment_message_request(&request) {
        return assessment_communication_invalid_response();
    }
    match state
        .owner_acquisition
        .create_owner_assessment_message(&principal.subject, &property_id, &assessment_id, request)
        .await
    {
        OwnerProviderAssessmentCommunicationWriteResult::Created(message) => {
            (StatusCode::CREATED, Json(message)).into_response()
        }
        OwnerProviderAssessmentCommunicationWriteResult::Replayed(message) => {
            Json(message).into_response()
        }
        OwnerProviderAssessmentCommunicationWriteResult::NotFound => resource_not_found_response(
            "owner_provider_assessment_not_found",
            "The requested assessment was not found for this property.",
        ),
        OwnerProviderAssessmentCommunicationWriteResult::InvalidState(status) => {
            (StatusCode::CONFLICT, Json(status)).into_response()
        }
        OwnerProviderAssessmentCommunicationWriteResult::Conflict => {
            assessment_communication_conflict_response()
        }
        OwnerProviderAssessmentCommunicationWriteResult::Unavailable => {
            assessment_communication_unavailable_response()
        }
    }
}

async fn decide_owner_provider_assessment_window(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path((property_id, assessment_id)): Path<(String, String)>,
    Json(request): Json<DecideOwnerProviderAssessmentWindowRequest>,
) -> Response {
    if !validate_provider_assessment_window_decision_request(&request) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "owner_provider_assessment_window_decision_invalid",
                message: "Choose to confirm this assessment window or request a different one."
                    .to_string(),
            }),
        )
            .into_response();
    }
    match state
        .owner_acquisition
        .decide_provider_assessment_window(
            &principal.subject,
            &property_id,
            &assessment_id,
            request,
        )
        .await
    {
        OwnerProviderAssessmentWindowDecisionResult::Updated(assessment)
        | OwnerProviderAssessmentWindowDecisionResult::Replayed(assessment) => {
            Json(assessment).into_response()
        }
        OwnerProviderAssessmentWindowDecisionResult::NotFound => resource_not_found_response(
            "owner_provider_assessment_not_found",
            "The proposed assessment window was not found for this property.",
        ),
        OwnerProviderAssessmentWindowDecisionResult::InvalidState(assessment) => {
            (StatusCode::CONFLICT, Json(assessment)).into_response()
        }
        OwnerProviderAssessmentWindowDecisionResult::Conflict => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "owner_provider_assessment_window_decision_conflict",
                message: "The proposed assessment window changed before this decision was applied. Reload and review its current status."
                    .to_string(),
            }),
        )
            .into_response(),
        OwnerProviderAssessmentWindowDecisionResult::Unavailable => {
            persisted_resource_unavailable_response(
                "owner_provider_assessment_window_decision_unavailable",
                "The window decision could not be confirmed. Existing assessment state is unchanged; reload before retrying.",
            )
        }
    }
}

async fn revoke_owner_provider_disclosure_grant(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path((property_id, grant_id)): Path<(String, String)>,
    Json(request): Json<RevokeOwnerProviderDisclosureGrantRequest>,
) -> Response {
    if !validate_provider_disclosure_revoke_request(&request) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "owner_provider_disclosure_revoke_invalid",
                message: "Confirm that you want to end future assessment access and choose a supported reason.".to_string(),
            }),
        )
            .into_response();
    }
    match state
        .owner_acquisition
        .revoke_provider_disclosure_grant(
            &principal.subject,
            &property_id,
            &grant_id,
            request,
        )
        .await
    {
        OwnerProviderDisclosureGrantRevokeResult::Revoked(receipt)
        | OwnerProviderDisclosureGrantRevokeResult::Replayed(receipt) => {
            Json(receipt).into_response()
        }
        OwnerProviderDisclosureGrantRevokeResult::NotFound => resource_not_found_response(
            "owner_provider_disclosure_grant_not_found",
            "The assessment access grant was not found for this property.",
        ),
        OwnerProviderDisclosureGrantRevokeResult::InvalidState(receipt) => {
            (StatusCode::CONFLICT, Json(receipt)).into_response()
        }
        OwnerProviderDisclosureGrantRevokeResult::Conflict => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "owner_provider_disclosure_revoke_conflict",
                message: "Assessment access changed before this request was applied. Reload the access history and review its current status.".to_string(),
            }),
        )
            .into_response(),
        OwnerProviderDisclosureGrantRevokeResult::Unavailable => persisted_resource_unavailable_response(
            "owner_provider_disclosure_revoke_unavailable",
            "Future access could not be confirmed as ended. Reload the access history before retrying.",
        ),
    }
}

async fn get_owner_provider_invitation(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path((property_id, invitation_id)): Path<(String, String)>,
) -> Response {
    match state
        .owner_acquisition
        .get_provider_invitation(&principal.subject, &property_id, &invitation_id)
        .await
    {
        OwnerReadResult::Loaded(invitation) => Json(invitation).into_response(),
        OwnerReadResult::NotFound => resource_not_found_response(
            "owner_provider_invitation_not_found",
            "The requested provider invitation was not found.",
        ),
        OwnerReadResult::Unavailable => persisted_resource_unavailable_response(
            "owner_provider_invitation_unavailable",
            "The provider invitation could not be loaded.",
        ),
    }
}

async fn get_owner_provider_disclosure_review(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path((property_id, invitation_id)): Path<(String, String)>,
) -> Response {
    match state
        .owner_acquisition
        .get_provider_disclosure_review(&principal.subject, &property_id, &invitation_id)
        .await
    {
        OwnerProviderDisclosureReviewResult::Loaded(review) => Json(review).into_response(),
        OwnerProviderDisclosureReviewResult::NotFound => resource_not_found_response(
            "owner_provider_disclosure_review_not_found",
            "The provider disclosure review was not found for this property.",
        ),
        OwnerProviderDisclosureReviewResult::InvalidState => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "owner_provider_disclosure_review_not_ready",
                message: "This provider request is not ready for disclosure approval. Reload connection progress before continuing.".to_string(),
            }),
        )
            .into_response(),
        OwnerProviderDisclosureReviewResult::Unavailable => persisted_resource_unavailable_response(
            "owner_provider_disclosure_review_unavailable",
            "The disclosure review could not be loaded. Nothing new was shared.",
        ),
    }
}

async fn create_owner_provider_disclosure_grant(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path((property_id, invitation_id)): Path<(String, String)>,
    Json(request): Json<CreateOwnerProviderDisclosureGrantRequest>,
) -> Response {
    if !validate_provider_disclosure_grant_request(&request) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "owner_provider_disclosure_grant_invalid",
                message: "Select at least one available category, review any selected photos, and affirm assessment-only access.".to_string(),
            }),
        )
            .into_response();
    }
    match state
        .owner_acquisition
        .create_provider_disclosure_grant(
            &principal.subject,
            &property_id,
            &invitation_id,
            request,
        )
        .await
    {
        OwnerProviderDisclosureGrantCreateResult::Created(grant) => {
            (StatusCode::CREATED, Json(grant)).into_response()
        }
        OwnerProviderDisclosureGrantCreateResult::Replayed(grant) => Json(grant).into_response(),
        OwnerProviderDisclosureGrantCreateResult::NotFound => resource_not_found_response(
            "owner_provider_disclosure_grant_not_found",
            "The provider request was not found for this property.",
        ),
        OwnerProviderDisclosureGrantCreateResult::InvalidState => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "owner_provider_disclosure_grant_not_ready",
                message: "Assessment access cannot be approved in the request's current state. Nothing new was shared.".to_string(),
            }),
        )
            .into_response(),
        OwnerProviderDisclosureGrantCreateResult::Conflict => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "owner_provider_disclosure_grant_conflict",
                message: "The disclosure review changed or this approval key was already used. Reload and review the current details; nothing new was shared.".to_string(),
            }),
        )
            .into_response(),
        OwnerProviderDisclosureGrantCreateResult::Unavailable => persisted_resource_unavailable_response(
            "owner_provider_disclosure_grant_unavailable",
            "Assessment access could not be confirmed. Nothing new was shared; retry before leaving this page.",
        ),
    }
}

async fn create_owner_provider_invitation(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(property_id): Path<String>,
    Json(request): Json<CreateOwnerProviderInvitationRequest>,
) -> Response {
    if !validate_provider_invitation_request(&request) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_owner_provider_invitation",
                message: "Enter the provider's name and business email, choose a 7-, 14-, or 30-day invitation window, and submit a valid request key."
                    .to_string(),
            }),
        )
            .into_response();
    }
    match state
        .owner_acquisition
        .create_provider_invitation(&principal.subject, &property_id, request)
        .await
    {
        OwnerProviderInvitationCreateResult::Created(creation) => {
            (StatusCode::ACCEPTED, Json(creation.invitation)).into_response()
        }
        OwnerProviderInvitationCreateResult::Replayed(invitation) => {
            Json(invitation).into_response()
        }
        OwnerProviderInvitationCreateResult::NotFound => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "ready_owner_yard_brief_required",
                message: "Save a ready private yard brief for this property before inviting a provider."
                    .to_string(),
            }),
        )
            .into_response(),
        OwnerProviderInvitationCreateResult::Conflict => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "active_owner_provider_invitation_exists",
                message: "An active invitation already exists for this property and recipient. Review its status before creating another."
                    .to_string(),
            }),
        )
            .into_response(),
        OwnerProviderInvitationCreateResult::Suppressed => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "owner_provider_recipient_suppressed",
                message: "An invitation cannot be sent to this business email because of its delivery or contact preference. Choose another legitimate provider contact."
                    .to_string(),
            }),
        )
            .into_response(),
        OwnerProviderInvitationCreateResult::Unavailable => {
            persisted_resource_unavailable_response(
                "owner_provider_invitation_create_unavailable",
                "The provider invitation could not be prepared. No delivery was confirmed.",
            )
        }
    }
}

async fn revoke_owner_provider_invitation(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path((property_id, invitation_id)): Path<(String, String)>,
) -> Response {
    match state
        .owner_acquisition
        .revoke_provider_invitation(&principal.subject, &property_id, &invitation_id)
        .await
    {
        OwnerProviderInvitationMutationResult::Saved(invitation) => {
            Json(invitation).into_response()
        }
        OwnerProviderInvitationMutationResult::NotFound => resource_not_found_response(
            "owner_provider_invitation_not_found",
            "The requested provider invitation was not found.",
        ),
        OwnerProviderInvitationMutationResult::InvalidState(_) => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "owner_provider_invitation_not_revocable",
                message: "This invitation is already closed and cannot be revoked. Review its current status before choosing another action."
                    .to_string(),
            }),
        )
            .into_response(),
        OwnerProviderInvitationMutationResult::Unavailable => {
            persisted_resource_unavailable_response(
                "owner_provider_invitation_revoke_unavailable",
                "The invitation could not be revoked. Its prior access state remains unchanged.",
            )
        }
    }
}

async fn opt_out_owner_provider_invitation(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Json(request): Json<OptOutOwnerProviderInvitationRequest>,
) -> Response {
    if !validate_provider_invitation_opt_out_request(&request) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_provider_invitation_opt_out",
                message: "The invitation reference is invalid. Open the original invitation and try again."
                    .to_string(),
            }),
        )
            .into_response();
    }
    let Some(verified_email) = principal.verified_email.as_deref() else {
        return (
            StatusCode::FORBIDDEN,
            Json(ErrorResponse {
                error: "verified_email_required",
                message:
                    "Verify the invited business email before changing its invitation preferences."
                        .to_string(),
            }),
        )
            .into_response();
    };
    match state
        .owner_acquisition
        .opt_out_provider_invitation(verified_email, request.token.trim())
        .await
    {
        OwnerProviderInvitationMutationResult::Saved(_) => {
            Json(serde_json::json!({ "status": "opted_out" })).into_response()
        }
        OwnerProviderInvitationMutationResult::NotFound => resource_not_found_response(
            "provider_invitation_not_found",
            "The invitation was not found for this verified email.",
        ),
        OwnerProviderInvitationMutationResult::InvalidState(_) => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "provider_invitation_already_closed",
                message: "This invitation is already closed. No contact preference was changed."
                    .to_string(),
            }),
        )
            .into_response(),
        OwnerProviderInvitationMutationResult::Unavailable => {
            persisted_resource_unavailable_response(
                "provider_invitation_opt_out_unavailable",
                "The invitation preference could not be changed. Try again before relying on the update.",
            )
        }
    }
}

async fn report_owner_provider_invitation_abuse(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Json(request): Json<ReportOwnerProviderInvitationAbuseRequest>,
) -> Response {
    if !validate_provider_invitation_abuse_report_request(&request) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_provider_invitation_abuse_report",
                message: "Choose a report category, confirm future invitations should be blocked, and keep the description to 500 characters or fewer."
                    .to_string(),
            }),
        )
            .into_response();
    }
    let Some(verified_email) = principal.verified_email.as_deref() else {
        return (
            StatusCode::FORBIDDEN,
            Json(ErrorResponse {
                error: "verified_email_required",
                message: "Verify the invited business email before reporting this invitation."
                    .to_string(),
            }),
        )
            .into_response();
    };
    match state
        .owner_acquisition
        .report_provider_invitation_abuse(&principal.subject, verified_email, request)
        .await
    {
        OwnerProviderInvitationAbuseReportResult::Created(report) => {
            (StatusCode::CREATED, Json(report)).into_response()
        }
        OwnerProviderInvitationAbuseReportResult::Replayed(report) => {
            Json(report).into_response()
        }
        OwnerProviderInvitationAbuseReportResult::NotFound => resource_not_found_response(
            "provider_invitation_not_found",
            "The invitation was not found for this verified email.",
        ),
        OwnerProviderInvitationAbuseReportResult::Invalid => (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_provider_invitation_abuse_report",
                message: "The safety report did not pass validation and was not submitted."
                    .to_string(),
            }),
        )
            .into_response(),
        OwnerProviderInvitationAbuseReportResult::Conflict => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "provider_invitation_abuse_report_exists",
                message: "A safety report already exists for this invitation. Future invitations remain blocked."
                    .to_string(),
            }),
        )
            .into_response(),
        OwnerProviderInvitationAbuseReportResult::Unavailable => {
            persisted_resource_unavailable_response(
                "provider_invitation_abuse_report_unavailable",
                "The report could not be submitted and blocking was not confirmed. Try again or use the approved support channel.",
            )
        }
    }
}

async fn preview_owner_provider_invitation(
    State(state): State<Arc<AppState>>,
    Json(request): Json<PreviewOwnerProviderInvitationRequest>,
) -> Response {
    if !validate_provider_invitation_preview_request(&request) {
        return resource_not_found_response(
            "provider_invitation_not_found",
            "The invitation link is invalid or no longer available.",
        );
    }
    match state
        .owner_acquisition
        .preview_provider_invitation(request.token.trim())
        .await
    {
        OwnerProviderInvitationPreviewResult::Opened(invitation) => {
            Json(invitation).into_response()
        }
        OwnerProviderInvitationPreviewResult::Closed(invitation) => {
            (StatusCode::GONE, Json(invitation)).into_response()
        }
        OwnerProviderInvitationPreviewResult::NotReady => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "provider_invitation_not_delivered",
                message: "This invitation is not available for recipient review. No additional yard information was shown."
                    .to_string(),
            }),
        )
            .into_response(),
        OwnerProviderInvitationPreviewResult::NotFound => resource_not_found_response(
            "provider_invitation_not_found",
            "The invitation link is invalid or no longer available.",
        ),
        OwnerProviderInvitationPreviewResult::Unavailable => {
            persisted_resource_unavailable_response(
                "provider_invitation_preview_unavailable",
                "The limited invitation could not be loaded. No additional yard information was shown.",
            )
        }
    }
}

async fn verify_owner_provider_invitation_recipient(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Json(request): Json<VerifyOwnerProviderInvitationRecipientRequest>,
) -> Response {
    if !validate_provider_invitation_recipient_check_request(&request) {
        return resource_not_found_response(
            "provider_invitation_not_found",
            "The invitation link is invalid or no longer available.",
        );
    }
    let Some(verified_email) = principal.verified_email.as_deref() else {
        return (
            StatusCode::FORBIDDEN,
            Json(ErrorResponse {
                error: "verified_email_required",
                message: "Verify the invited business email before continuing to provider setup."
                    .to_string(),
            }),
        )
            .into_response();
    };
    match state
        .owner_acquisition
        .verify_provider_invitation_recipient(
            &principal.subject,
            verified_email,
            request.token.trim(),
        )
        .await
    {
        OwnerProviderInvitationRecipientCheckResult::Checked(invitation) => {
            (StatusCode::CREATED, Json(invitation)).into_response()
        }
        OwnerProviderInvitationRecipientCheckResult::Replayed(invitation) => {
            Json(invitation).into_response()
        }
        OwnerProviderInvitationRecipientCheckResult::NotFound => resource_not_found_response(
            "provider_invitation_not_found",
            "The invitation was not found for this verified email.",
        ),
        OwnerProviderInvitationRecipientCheckResult::InvalidState => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "provider_invitation_not_ready_for_recipient_check",
                message: "Review the active limited invitation before verifying the recipient account. Closed invitations cannot continue."
                    .to_string(),
            }),
        )
            .into_response(),
        OwnerProviderInvitationRecipientCheckResult::Conflict => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "provider_invitation_recipient_conflict",
                message: "This invitation is already linked to another recipient account. Provider Operations must review the identity dispute before access can continue."
                    .to_string(),
            }),
        )
            .into_response(),
        OwnerProviderInvitationRecipientCheckResult::Unavailable => {
            persisted_resource_unavailable_response(
                "provider_invitation_recipient_check_unavailable",
                "Recipient verification could not be confirmed. No provider authority was granted.",
            )
        }
    }
}

async fn list_owner_provider_organization_options(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Json(request): Json<ListOwnerProviderOrganizationOptionsRequest>,
) -> Response {
    if !validate_provider_organization_options_request(&request) {
        return resource_not_found_response(
            "provider_invitation_not_found",
            "The invitation link is invalid or no longer available.",
        );
    }
    let Some(verified_email) = principal.verified_email.as_deref() else {
        return (
            StatusCode::FORBIDDEN,
            Json(ErrorResponse {
                error: "verified_email_required",
                message:
                    "Verify the invited business email before selecting a provider organization."
                        .to_string(),
            }),
        )
            .into_response();
    };
    match state
        .owner_acquisition
        .list_provider_organization_options(
            &principal.subject,
            verified_email,
            request.token.trim(),
        )
        .await
    {
        OwnerProviderOrganizationOptionsResult::Loaded(options) => Json(options).into_response(),
        OwnerProviderOrganizationOptionsResult::NotFound => resource_not_found_response(
            "provider_invitation_not_found",
            "The invitation was not found for this verified email.",
        ),
        OwnerProviderOrganizationOptionsResult::InvalidState => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "provider_organization_options_not_ready",
                message: "Verify the active invitation recipient before selecting a provider organization."
                    .to_string(),
            }),
        )
            .into_response(),
        OwnerProviderOrganizationOptionsResult::Unavailable => {
            persisted_resource_unavailable_response(
                "provider_organization_options_unavailable",
                "Eligible provider organizations could not be loaded. No organization access was changed.",
            )
        }
    }
}

async fn create_owner_provider_organization_claim(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Json(request): Json<CreateOwnerProviderOrganizationClaimRequest>,
) -> Response {
    if !validate_provider_organization_claim_request(&request) {
        return (
            StatusCode::UNPROCESSABLE_ENTITY,
            Json(ErrorResponse {
                error: "provider_organization_claim_invalid",
                message: "Choose an eligible organization or provide a business name and confirm your authority."
                    .to_string(),
            }),
        )
            .into_response();
    }
    let Some(verified_email) = principal.verified_email.as_deref() else {
        return (
            StatusCode::FORBIDDEN,
            Json(ErrorResponse {
                error: "verified_email_required",
                message: "Verify the invited business email before continuing provider setup."
                    .to_string(),
            }),
        )
            .into_response();
    };
    match state
        .owner_acquisition
        .create_provider_organization_claim(&principal.subject, verified_email, request)
        .await
    {
        OwnerProviderOrganizationClaimResult::Created(claim) => {
            (StatusCode::CREATED, Json(claim)).into_response()
        }
        OwnerProviderOrganizationClaimResult::Replayed(claim) => Json(claim).into_response(),
        OwnerProviderOrganizationClaimResult::NotFound => resource_not_found_response(
            "provider_organization_not_available",
            "The invitation or selected organization is not available to this verified account.",
        ),
        OwnerProviderOrganizationClaimResult::InvalidState => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "provider_organization_claim_not_ready",
                message: "Verify the active invitation recipient before continuing provider setup."
                    .to_string(),
            }),
        )
            .into_response(),
        OwnerProviderOrganizationClaimResult::Conflict => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "provider_organization_claim_conflict",
                message: "An active organization selection already exists for this invitation. Review that selection or contact Provider Operations."
                    .to_string(),
            }),
        )
            .into_response(),
        OwnerProviderOrganizationClaimResult::Unavailable => {
            persisted_resource_unavailable_response(
                "provider_organization_claim_unavailable",
                "Provider organization setup could not be recorded. No organization or opportunity access was granted.",
            )
        }
    }
}

async fn bootstrap_owner_provider_organization_claim(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(claim_id): Path<String>,
    Json(request): Json<BootstrapOwnerProviderOrganizationClaimRequest>,
) -> Response {
    if claim_id.trim().is_empty() || !validate_provider_organization_bootstrap_request(&request) {
        return (
            StatusCode::UNPROCESSABLE_ENTITY,
            Json(ErrorResponse {
                error: "provider_organization_bootstrap_invalid",
                message: "The provider setup request is incomplete or no longer current."
                    .to_string(),
            }),
        )
            .into_response();
    }
    let Some(verified_email) = principal.verified_email.as_deref() else {
        return (
            StatusCode::FORBIDDEN,
            Json(ErrorResponse {
                error: "verified_email_required",
                message: "Verify the invited business email before final provider setup."
                    .to_string(),
            }),
        )
            .into_response();
    };
    match state
        .owner_acquisition
        .bootstrap_provider_organization_claim(
            &principal.subject,
            verified_email,
            claim_id.trim(),
            request,
        )
        .await
    {
        OwnerProviderOrganizationBootstrapResult::Bootstrapped(claim) => {
            (StatusCode::CREATED, Json(claim)).into_response()
        }
        OwnerProviderOrganizationBootstrapResult::Replayed(claim)
        | OwnerProviderOrganizationBootstrapResult::DuplicateReview(claim) => {
            Json(claim).into_response()
        }
        OwnerProviderOrganizationBootstrapResult::NotFound => resource_not_found_response(
            "provider_organization_claim_not_found",
            "The provider setup claim is not available to this verified account.",
        ),
        OwnerProviderOrganizationBootstrapResult::InvalidState => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "provider_organization_bootstrap_not_ready",
                message: "This provider setup is not ready for final creation. Review its current status or contact Provider Operations."
                    .to_string(),
            }),
        )
            .into_response(),
        OwnerProviderOrganizationBootstrapResult::Conflict => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "provider_organization_bootstrap_conflict",
                message: "The provider setup changed before it could be completed. Reload the claim before trying again."
                    .to_string(),
            }),
        )
            .into_response(),
        OwnerProviderOrganizationBootstrapResult::Unavailable => {
            persisted_resource_unavailable_response(
                "provider_organization_bootstrap_unavailable",
                "Final provider setup could not be confirmed. No opportunity-response authority was granted.",
            )
        }
    }
}

async fn appeal_owner_provider_organization_claim(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(claim_id): Path<String>,
    Json(request): Json<AppealOwnerProviderOrganizationClaimRequest>,
) -> Response {
    if claim_id.trim().is_empty() || !validate_provider_organization_claim_appeal_request(&request)
    {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "provider_organization_claim_appeal_invalid",
                message: "Choose an appeal category and attach an approved restricted evidence reference."
                    .to_string(),
            }),
        )
            .into_response();
    }
    let Some(verified_email) = principal.verified_email.as_deref() else {
        return (
            StatusCode::FORBIDDEN,
            Json(ErrorResponse {
                error: "verified_email_required",
                message: "Verify the invited business email before appealing this decision."
                    .to_string(),
            }),
        )
            .into_response();
    };
    match state
        .owner_acquisition
        .appeal_provider_organization_claim(
            &principal.subject,
            verified_email,
            claim_id.trim(),
            request,
        )
        .await
    {
        OwnerProviderClaimAppealResult::Submitted(review) => {
            (StatusCode::CREATED, Json(review)).into_response()
        }
        OwnerProviderClaimAppealResult::Replayed(review) => Json(review).into_response(),
        OwnerProviderClaimAppealResult::NotFound => resource_not_found_response(
            "provider_organization_claim_not_found",
            "The provider organization claim is not available to this verified account.",
        ),
        OwnerProviderClaimAppealResult::InvalidState => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "provider_organization_claim_appeal_not_available",
                message: "Only a current rejected claim may be appealed by its checked recipient."
                    .to_string(),
            }),
        )
            .into_response(),
        OwnerProviderClaimAppealResult::Conflict => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "provider_organization_claim_appeal_conflict",
                message: "The claim changed before the appeal was recorded. Reload its status before trying again."
                    .to_string(),
            }),
        )
            .into_response(),
        OwnerProviderClaimAppealResult::Unavailable => persisted_resource_unavailable_response(
            "provider_organization_claim_appeal_unavailable",
            "The appeal could not be confirmed. The claim was not reported as reopened.",
        ),
    }
}

async fn issue_owner_provider_response_capability(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(claim_id): Path<String>,
    Json(request): Json<IssueOwnerProviderResponseCapabilityRequest>,
) -> Response {
    if claim_id.trim().is_empty() || !validate_provider_response_capability_request(&request) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "provider_response_capability_request_invalid",
                message:
                    "Acknowledge the withheld information before opening the bounded response path."
                        .to_string(),
            }),
        )
            .into_response();
    }
    let Some(verified_email) = principal.verified_email.as_deref() else {
        return (
            StatusCode::FORBIDDEN,
            Json(ErrorResponse {
                error: "verified_email_required",
                message: "Verify the invited business email before opening the response path."
                    .to_string(),
            }),
        )
            .into_response();
    };
    match state
        .owner_acquisition
        .issue_provider_response_capability(
            &principal.subject,
            verified_email,
            claim_id.trim(),
            request,
        )
        .await
    {
        OwnerProviderResponseCapabilityResult::Issued(capability) => {
            (StatusCode::CREATED, Json(capability)).into_response()
        }
        OwnerProviderResponseCapabilityResult::Replayed(capability) => {
            Json(capability).into_response()
        }
        OwnerProviderResponseCapabilityResult::NotFound => resource_not_found_response(
            "provider_response_capability_not_found",
            "The invitation or provider relationship is not available to this verified account.",
        ),
        OwnerProviderResponseCapabilityResult::InvalidState => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "provider_response_capability_not_ready",
                message: "The invitation, provider relationship, organization membership, or expiry state is not eligible for responses."
                    .to_string(),
            }),
        )
            .into_response(),
        OwnerProviderResponseCapabilityResult::Conflict => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "provider_response_capability_conflict",
                message: "An active response capability already exists. Reload the provider inbox before continuing."
                    .to_string(),
            }),
        )
            .into_response(),
        OwnerProviderResponseCapabilityResult::Unavailable => {
            persisted_resource_unavailable_response(
                "provider_response_capability_unavailable",
                "The bounded response capability could not be confirmed. No response authority was granted.",
            )
        }
    }
}

async fn open_owner_provider_inbox(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Json(request): Json<OpenOwnerProviderInboxRequest>,
) -> Response {
    if !validate_provider_inbox_request(&request) {
        return resource_not_found_response(
            "provider_inbox_not_found",
            "The provider invitation is invalid or no longer available.",
        );
    }
    let Some(verified_email) = principal.verified_email.as_deref() else {
        return (
            StatusCode::FORBIDDEN,
            Json(ErrorResponse {
                error: "verified_email_required",
                message: "Verify the invited business email before opening the provider inbox."
                    .to_string(),
            }),
        )
            .into_response();
    };
    match state
        .owner_acquisition
        .open_provider_inbox(&principal.subject, verified_email, request)
        .await
    {
        OwnerProviderInboxResult::Loaded(entry) => Json(entry).into_response(),
        OwnerProviderInboxResult::Closed(entry) => {
            (StatusCode::GONE, Json(entry)).into_response()
        }
        OwnerProviderInboxResult::NotFound => resource_not_found_response(
            "provider_inbox_not_found",
            "The provider invitation is not available to this verified account.",
        ),
        OwnerProviderInboxResult::InvalidState => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "provider_inbox_not_ready",
                message: "Complete recipient, organization, and bounded response authorization before opening the provider inbox."
                    .to_string(),
            }),
        )
            .into_response(),
        OwnerProviderInboxResult::Unavailable => persisted_resource_unavailable_response(
            "provider_inbox_unavailable",
            "The provider inbox could not be loaded. No additional yard information was shown.",
        ),
    }
}

async fn get_owner_provider_progress(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Json(request): Json<OpenOwnerProviderInboxRequest>,
) -> Response {
    if !validate_provider_inbox_request(&request) {
        return resource_not_found_response(
            "provider_progress_not_found",
            "The provider invitation is invalid or no longer available.",
        );
    }
    let Some(verified_email) = principal.verified_email.as_deref() else {
        return (
            StatusCode::FORBIDDEN,
            Json(ErrorResponse {
                error: "verified_email_required",
                message: "Verify the invited business email before viewing progress.".to_string(),
            }),
        )
            .into_response();
    };
    match state
        .owner_acquisition
        .provider_invitation_progress(&principal.subject, verified_email, request)
        .await
    {
        OwnerProviderProgressResult::Loaded(progress) => Json(progress).into_response(),
        OwnerProviderProgressResult::NotFound => resource_not_found_response(
            "provider_progress_not_found",
            "The provider invitation is not available to this verified account.",
        ),
        OwnerProviderProgressResult::InvalidState => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "provider_progress_not_ready",
                message: "Complete invited-recipient verification before viewing provider progress."
                    .to_string(),
            }),
        )
            .into_response(),
        OwnerProviderProgressResult::Unavailable => persisted_resource_unavailable_response(
            "provider_progress_unavailable",
            "Provider progress could not be loaded. Existing authorization and responses are unchanged.",
        ),
    }
}

async fn create_owner_provider_opportunity_response(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Json(request): Json<CreateOwnerProviderOpportunityResponseRequest>,
) -> Response {
    if !validate_provider_opportunity_response_request(&request) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "provider_opportunity_response_invalid",
                message:
                    "Choose one available response and its supported reason before continuing."
                        .to_string(),
            }),
        )
            .into_response();
    }
    let Some(verified_email) = principal.verified_email.as_deref() else {
        return (
            StatusCode::FORBIDDEN,
            Json(ErrorResponse {
                error: "verified_email_required",
                message: "Verify the invited business email before responding to this request."
                    .to_string(),
            }),
        )
            .into_response();
    };
    match state
        .owner_acquisition
        .create_provider_opportunity_response(&principal.subject, verified_email, request)
        .await
    {
        OwnerProviderOpportunityResponseResult::Recorded(response) => {
            (StatusCode::CREATED, Json(response)).into_response()
        }
        OwnerProviderOpportunityResponseResult::Replayed(response) => {
            Json(response).into_response()
        }
        OwnerProviderOpportunityResponseResult::NotFound => resource_not_found_response(
            "provider_opportunity_response_not_found",
            "The invitation or response authority is not available to this verified account.",
        ),
        OwnerProviderOpportunityResponseResult::InvalidState => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "provider_opportunity_response_not_ready",
                message: "This response path is no longer active. Reload the provider inbox before continuing."
                    .to_string(),
            }),
        )
            .into_response(),
        OwnerProviderOpportunityResponseResult::Conflict => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "provider_opportunity_response_conflict",
                message: "This response was already recorded or the response path changed. Reload the provider inbox."
                    .to_string(),
            }),
        )
            .into_response(),
        OwnerProviderOpportunityResponseResult::Unavailable => {
            persisted_resource_unavailable_response(
                "provider_opportunity_response_unavailable",
                "The response could not be confirmed. Please retry before leaving this page.",
            )
        }
    }
}

async fn open_owner_provider_disclosure(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Json(request): Json<OpenOwnerProviderDisclosureRequest>,
) -> Response {
    if !validate_provider_disclosure_access_request(&request) {
        return resource_not_found_response(
            "provider_disclosure_not_found",
            "Assessment access is not available to this verified account.",
        );
    }
    let Some(verified_email) = principal.verified_email.as_deref() else {
        return (
            StatusCode::FORBIDDEN,
            Json(ErrorResponse {
                error: "verified_email_required",
                message: "Verify the invited business email before opening assessment details."
                    .to_string(),
            }),
        )
            .into_response();
    };
    match state
        .owner_acquisition
        .open_provider_disclosure(&principal.subject, verified_email, request)
        .await
    {
        OwnerProviderDisclosureAccessResult::Loaded(access) => Json(access).into_response(),
        OwnerProviderDisclosureAccessResult::Closed(access) => {
            (StatusCode::GONE, Json(access)).into_response()
        }
        OwnerProviderDisclosureAccessResult::NotFound => resource_not_found_response(
            "provider_disclosure_not_found",
            "Assessment access is not available to this verified account.",
        ),
        OwnerProviderDisclosureAccessResult::InvalidState => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "provider_disclosure_not_ready",
                message: "The owner has not approved assessment details for this provider request."
                    .to_string(),
            }),
        )
            .into_response(),
        OwnerProviderDisclosureAccessResult::Unavailable => {
            persisted_resource_unavailable_response(
                "provider_disclosure_unavailable",
                "Assessment details could not be loaded. Existing access is unchanged; try again.",
            )
        }
    }
}

async fn create_owner_provider_assessment(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Json(request): Json<CreateOwnerProviderAssessmentRequest>,
) -> Response {
    if !validate_provider_assessment_request(&request) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "provider_assessment_invalid",
                message: "Choose remote review or provide one valid on-site assessment window and time zone."
                    .to_string(),
            }),
        )
            .into_response();
    }
    let Some(verified_email) = principal.verified_email.as_deref() else {
        return (
            StatusCode::FORBIDDEN,
            Json(ErrorResponse {
                error: "verified_email_required",
                message: "Verify the invited business email before starting an assessment."
                    .to_string(),
            }),
        )
            .into_response();
    };
    match state
        .owner_acquisition
        .create_provider_assessment(&principal.subject, verified_email, request)
        .await
    {
        OwnerProviderAssessmentCreateResult::Created(assessment) => {
            (StatusCode::CREATED, Json(assessment)).into_response()
        }
        OwnerProviderAssessmentCreateResult::Replayed(assessment) => {
            Json(assessment).into_response()
        }
        OwnerProviderAssessmentCreateResult::NotFound => resource_not_found_response(
            "provider_assessment_not_found",
            "Assessment access is not available to this verified account.",
        ),
        OwnerProviderAssessmentCreateResult::InvalidState => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "provider_assessment_not_ready",
                message: "This request is not ready for assessment or its owner-approved access ended. Reload assessment access before continuing."
                    .to_string(),
            }),
        )
            .into_response(),
        OwnerProviderAssessmentCreateResult::Conflict => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "provider_assessment_conflict",
                message: "An assessment already exists or this request key was used for different assessment details. Reload before continuing."
                    .to_string(),
            }),
        )
            .into_response(),
        OwnerProviderAssessmentCreateResult::Unavailable => {
            persisted_resource_unavailable_response(
                "provider_assessment_unavailable",
                "The assessment could not be confirmed. Existing access is unchanged; retry before leaving this page.",
            )
        }
    }
}

async fn transition_owner_provider_assessment(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(assessment_id): Path<String>,
    Json(request): Json<TransitionOwnerProviderAssessmentRequest>,
) -> Response {
    if !validate_provider_assessment_transition_request(&request) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "provider_assessment_transition_invalid",
                message: "Choose a valid assessment action, current version, and customer-safe outcome when required."
                    .to_string(),
            }),
        )
            .into_response();
    }
    let Some(verified_email) = principal.verified_email.as_deref() else {
        return (
            StatusCode::FORBIDDEN,
            Json(ErrorResponse {
                error: "verified_email_required",
                message: "Verify the invited business email before updating an assessment."
                    .to_string(),
            }),
        )
            .into_response();
    };
    match state
        .owner_acquisition
        .transition_provider_assessment(
            &principal.subject,
            verified_email,
            &assessment_id,
            request,
        )
        .await
    {
        OwnerProviderAssessmentTransitionResult::Updated(assessment)
        | OwnerProviderAssessmentTransitionResult::Replayed(assessment) => {
            Json(assessment).into_response()
        }
        OwnerProviderAssessmentTransitionResult::NotFound => resource_not_found_response(
            "provider_assessment_not_found",
            "Assessment access is not available to this verified account.",
        ),
        OwnerProviderAssessmentTransitionResult::InvalidState(assessment) => {
            (StatusCode::CONFLICT, Json(assessment)).into_response()
        }
        OwnerProviderAssessmentTransitionResult::Conflict => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "provider_assessment_transition_conflict",
                message: "The assessment changed before this update was applied. Reload its current status before continuing."
                    .to_string(),
            }),
        )
            .into_response(),
        OwnerProviderAssessmentTransitionResult::Unavailable => {
            persisted_resource_unavailable_response(
                "provider_assessment_transition_unavailable",
                "The assessment update could not be confirmed. Existing assessment state is unchanged; reload before retrying.",
            )
        }
    }
}

async fn propose_provider_assessment_window(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(assessment_id): Path<String>,
    Json(request): Json<ProposeProviderAssessmentWindowRequest>,
) -> Response {
    if !validate_provider_assessment_window_proposal_request(&request) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "provider_assessment_window_proposal_invalid",
                message: "Provide one valid replacement assessment window, time zone, current version, and request key.".to_string(),
            }),
        )
            .into_response();
    }
    let Some(verified_email) = principal.verified_email.as_deref() else {
        return verified_provider_assessment_email_required_response();
    };
    match state
        .owner_acquisition
        .propose_provider_assessment_window(
            &principal.subject,
            verified_email,
            &assessment_id,
            request,
        )
        .await
    {
        ProviderAssessmentWindowProposalResult::Updated(assessment)
        | ProviderAssessmentWindowProposalResult::Replayed(assessment) => {
            Json(assessment).into_response()
        }
        ProviderAssessmentWindowProposalResult::NotFound => resource_not_found_response(
            "provider_assessment_not_found",
            "The assessment is not available to this verified provider.",
        ),
        ProviderAssessmentWindowProposalResult::InvalidState(status) => {
            (StatusCode::CONFLICT, Json(status)).into_response()
        }
        ProviderAssessmentWindowProposalResult::Conflict => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "provider_assessment_window_proposal_conflict",
                message: "The assessment or replacement window changed. Reload its current state before retrying.".to_string(),
            }),
        )
            .into_response(),
        ProviderAssessmentWindowProposalResult::Unavailable => {
            persisted_resource_unavailable_response(
                "provider_assessment_window_proposal_unavailable",
                "The replacement window could not be confirmed. Existing assessment state is unchanged; reload before retrying.",
            )
        }
    }
}

fn assessment_communication_invalid_response() -> Response {
    (
        StatusCode::BAD_REQUEST,
        Json(ErrorResponse {
            error: "provider_assessment_communication_invalid",
            message: "Choose an allowed message or note kind, current assessment version, and valid body."
                .to_string(),
        }),
    )
        .into_response()
}

fn assessment_communication_conflict_response() -> Response {
    (
        StatusCode::CONFLICT,
        Json(ErrorResponse {
            error: "provider_assessment_communication_conflict",
            message: "The assessment changed or this request key was used for different content. Reload before retrying."
                .to_string(),
        }),
    )
        .into_response()
}

fn assessment_communication_unavailable_response() -> Response {
    persisted_resource_unavailable_response(
        "provider_assessment_communication_unavailable",
        "The assessment update could not be confirmed. Existing messages and notes are unchanged; reload before retrying.",
    )
}

async fn create_provider_assessment_message(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(assessment_id): Path<String>,
    Json(request): Json<CreateProviderAssessmentMessageRequest>,
) -> Response {
    if !validate_provider_assessment_message_request(&request) {
        return assessment_communication_invalid_response();
    }
    let Some(verified_email) = principal.verified_email.as_deref() else {
        return verified_provider_assessment_email_required_response();
    };
    match state
        .owner_acquisition
        .create_provider_assessment_message(
            &principal.subject,
            verified_email,
            &assessment_id,
            request,
        )
        .await
    {
        OwnerProviderAssessmentCommunicationWriteResult::Created(message) => {
            (StatusCode::CREATED, Json(message)).into_response()
        }
        OwnerProviderAssessmentCommunicationWriteResult::Replayed(message) => {
            Json(message).into_response()
        }
        OwnerProviderAssessmentCommunicationWriteResult::NotFound => resource_not_found_response(
            "provider_assessment_not_found",
            "Assessment access is not available to this verified account.",
        ),
        OwnerProviderAssessmentCommunicationWriteResult::InvalidState(status) => {
            (StatusCode::CONFLICT, Json(status)).into_response()
        }
        OwnerProviderAssessmentCommunicationWriteResult::Conflict => {
            assessment_communication_conflict_response()
        }
        OwnerProviderAssessmentCommunicationWriteResult::Unavailable => {
            assessment_communication_unavailable_response()
        }
    }
}

async fn create_provider_assessment_private_note(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(assessment_id): Path<String>,
    Json(request): Json<CreateProviderAssessmentPrivateNoteRequest>,
) -> Response {
    if !validate_provider_assessment_private_note_request(&request) {
        return assessment_communication_invalid_response();
    }
    let Some(verified_email) = principal.verified_email.as_deref() else {
        return verified_provider_assessment_email_required_response();
    };
    match state
        .owner_acquisition
        .create_provider_assessment_private_note(
            &principal.subject,
            verified_email,
            &assessment_id,
            request,
        )
        .await
    {
        OwnerProviderAssessmentCommunicationWriteResult::Created(note) => {
            (StatusCode::CREATED, Json(note)).into_response()
        }
        OwnerProviderAssessmentCommunicationWriteResult::Replayed(note) => {
            Json(note).into_response()
        }
        OwnerProviderAssessmentCommunicationWriteResult::NotFound => resource_not_found_response(
            "provider_assessment_not_found",
            "Assessment access is not available to this verified account.",
        ),
        OwnerProviderAssessmentCommunicationWriteResult::InvalidState(status) => {
            (StatusCode::CONFLICT, Json(status)).into_response()
        }
        OwnerProviderAssessmentCommunicationWriteResult::Conflict => {
            assessment_communication_conflict_response()
        }
        OwnerProviderAssessmentCommunicationWriteResult::Unavailable => {
            assessment_communication_unavailable_response()
        }
    }
}

async fn publish_provider_initial_service_proposal(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(assessment_id): Path<String>,
    Json(request): Json<PublishOwnerProviderInitialServiceProposalRequest>,
) -> Response {
    if !validate_initial_service_proposal_request(&request) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "provider_initial_service_proposal_invalid",
                message: "Provide bounded customer-safe scope, terms, price, expiration, current proposal version, and request key."
                    .to_string(),
            }),
        )
            .into_response();
    }
    let Some(verified_email) = principal.verified_email.as_deref() else {
        return (
            StatusCode::FORBIDDEN,
            Json(ErrorResponse {
                error: "verified_email_required",
                message: "Verify the invited business email before publishing a proposal."
                    .to_string(),
            }),
        )
            .into_response();
    };
    match state
        .owner_acquisition
        .publish_initial_service_proposal(
            &principal.subject,
            verified_email,
            &assessment_id,
            request,
        )
        .await
    {
        OwnerProviderInitialServiceProposalWriteResult::Published(proposal) => {
            (StatusCode::CREATED, Json(proposal)).into_response()
        }
        OwnerProviderInitialServiceProposalWriteResult::Replayed(proposal) => {
            Json(proposal).into_response()
        }
        OwnerProviderInitialServiceProposalWriteResult::NotFound => {
            resource_not_found_response(
                "provider_assessment_not_found",
                "The completed assessment is not available to this verified provider.",
            )
        }
        OwnerProviderInitialServiceProposalWriteResult::InvalidState => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "provider_initial_service_proposal_invalid_state",
                message: "The assessment is not completed, current authority ended, or an accepted proposal already closes this series."
                    .to_string(),
            }),
        )
            .into_response(),
        OwnerProviderInitialServiceProposalWriteResult::Conflict => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "provider_initial_service_proposal_conflict",
                message: "The proposal series changed or this request key was used for different content. Reload before retrying."
                    .to_string(),
            }),
        )
            .into_response(),
        OwnerProviderInitialServiceProposalWriteResult::Unavailable => {
            persisted_resource_unavailable_response(
                "provider_initial_service_proposal_unavailable",
                "The proposal could not be confirmed. Existing proposal state is unchanged; reload before retrying.",
            )
        }
    }
}

async fn create_provider_initial_service_proposal_response(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(assessment_id): Path<String>,
    Json(request): Json<CreateProviderInitialServiceProposalResponseRequest>,
) -> Response {
    if !validate_provider_initial_service_proposal_response_request(&request) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "provider_initial_service_proposal_response_invalid",
                message: "Reply to an owner proposal message with customer-safe text and the exact current proposal version. Link the current revision when the question targets an earlier version."
                    .to_string(),
            }),
        )
            .into_response();
    }
    let Some(verified_email) = principal.verified_email.as_deref() else {
        return (
            StatusCode::FORBIDDEN,
            Json(ErrorResponse {
                error: "verified_email_required",
                message: "Verify the invited business email before replying to a proposal message."
                    .to_string(),
            }),
        )
            .into_response();
    };
    match state
        .owner_acquisition
        .create_provider_initial_service_proposal_response(
            &principal.subject,
            verified_email,
            &assessment_id,
            request,
        )
        .await
    {
        OwnerProviderInitialServiceProposalMessageWriteResult::Created(message) => {
            (StatusCode::CREATED, Json(message)).into_response()
        }
        OwnerProviderInitialServiceProposalMessageWriteResult::Replayed(message) => {
            Json(message).into_response()
        }
        OwnerProviderInitialServiceProposalMessageWriteResult::NotFound => {
            resource_not_found_response(
                "provider_assessment_not_found",
                "Proposal conversation access is not available to this verified provider.",
            )
        }
        OwnerProviderInitialServiceProposalMessageWriteResult::InvalidState(proposal) => {
            (StatusCode::CONFLICT, Json(proposal)).into_response()
        }
        OwnerProviderInitialServiceProposalMessageWriteResult::Conflict => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "provider_initial_service_proposal_response_conflict",
                message: "The proposal conversation or current revision changed. Reload before replying."
                    .to_string(),
            }),
        )
            .into_response(),
        OwnerProviderInitialServiceProposalMessageWriteResult::Unavailable => {
            persisted_resource_unavailable_response(
                "provider_initial_service_proposal_response_unavailable",
                "The response could not be confirmed. Existing proposal state is unchanged; reload before retrying.",
            )
        }
    }
}

fn verified_provider_assessment_email_required_response() -> Response {
    (
        StatusCode::FORBIDDEN,
        Json(ErrorResponse {
            error: "verified_email_required",
            message: "Verify the invited business email before updating an assessment.".to_string(),
        }),
    )
        .into_response()
}

async fn list_owner_provider_organization_claim_reviews(
    State(state): State<Arc<AppState>>,
    Query(filter): Query<OwnerProviderClaimReviewFilter>,
) -> Response {
    if !validate_provider_claim_review_filter(&filter) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "provider_claim_review_filter_invalid",
                message: "Choose duplicate_review, under_review, or disputed.".to_string(),
            }),
        )
            .into_response();
    }
    match state
        .owner_acquisition
        .list_provider_organization_claim_reviews(filter)
        .await
    {
        OwnerProviderClaimReviewListResult::Loaded(reviews) => Json(reviews).into_response(),
        OwnerProviderClaimReviewListResult::Unavailable => persisted_resource_unavailable_response(
            "provider_claim_review_queue_unavailable",
            "Provider claim reviews could not be loaded.",
        ),
    }
}

async fn owner_provider_organization_claim_review_metrics(
    State(state): State<Arc<AppState>>,
) -> Response {
    match state
        .owner_acquisition
        .provider_organization_claim_review_metrics()
        .await
    {
        OwnerProviderClaimReviewMetricsResult::Loaded(metrics) => Json(metrics).into_response(),
        OwnerProviderClaimReviewMetricsResult::Unavailable => {
            persisted_resource_unavailable_response(
                "provider_claim_review_metrics_unavailable",
                "Provider claim review metrics could not be loaded.",
            )
        }
    }
}

async fn decide_owner_provider_organization_claim_review(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(claim_id): Path<String>,
    Json(request): Json<DecideOwnerProviderClaimReviewRequest>,
) -> Response {
    if claim_id.trim().is_empty() || !validate_provider_claim_review_decision_request(&request) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "provider_claim_review_decision_invalid",
                message: "Choose an allowed review action, current version, controlled reason, and restricted evidence reference."
                    .to_string(),
            }),
        )
            .into_response();
    }
    match state
        .owner_acquisition
        .decide_provider_organization_claim_review(&principal.subject, claim_id.trim(), request)
        .await
    {
        OwnerProviderClaimReviewDecisionResult::Updated(review) => {
            (StatusCode::CREATED, Json(review)).into_response()
        }
        OwnerProviderClaimReviewDecisionResult::Replayed(review) => Json(review).into_response(),
        OwnerProviderClaimReviewDecisionResult::NotFound => resource_not_found_response(
            "provider_claim_review_not_found",
            "The provider organization claim was not found.",
        ),
        OwnerProviderClaimReviewDecisionResult::InvalidState => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "provider_claim_review_transition_invalid",
                message: "That review action is not allowed from the claim's current state."
                    .to_string(),
            }),
        )
            .into_response(),
        OwnerProviderClaimReviewDecisionResult::Conflict => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "provider_claim_review_conflict",
                message: "The claim changed before this decision was recorded. Reload the queue before trying again."
                    .to_string(),
            }),
        )
            .into_response(),
        OwnerProviderClaimReviewDecisionResult::Unavailable => {
            persisted_resource_unavailable_response(
                "provider_claim_review_decision_unavailable",
                "The review decision could not be confirmed. The claim status was not reported as changed.",
            )
        }
    }
}

fn cors_layer(production: bool) -> Result<Option<CorsLayer>, DynError> {
    match std::env::var("CORS_ALLOWED_ORIGIN") {
        Ok(origin) if !origin.trim().is_empty() => {
            let origin = HeaderValue::from_str(origin.trim())?;
            Ok(Some(
                CorsLayer::new()
                    .allow_origin(origin)
                    .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE])
                    .allow_headers([
                        CONTENT_TYPE,
                        AUTHORIZATION,
                        HeaderName::from_static("x-grover-local-reviewer"),
                    ])
                    .allow_credentials(true),
            ))
        }
        _ if production => Ok(None),
        _ => Ok(Some(CorsLayer::permissive())),
    }
}

fn configuration_error(message: impl Into<String>) -> io::Error {
    io::Error::new(io::ErrorKind::InvalidInput, message.into())
}

async fn shutdown_signal() {
    let ctrl_c = async {
        tokio::signal::ctrl_c()
            .await
            .expect("failed to install Ctrl+C handler");
    };

    #[cfg(unix)]
    let terminate = async {
        tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
            .expect("failed to install SIGTERM handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        () = ctrl_c => {},
        () = terminate => {},
    }

    tracing::info!("shutdown signal received");
}

async fn list_jobs(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
) -> Response {
    let organization_ids = match principal_active_organization_ids(&state, &principal).await {
        Ok(organization_ids) => organization_ids,
        Err(response) => return response,
    };
    let visible_organization_ids: HashSet<&str> =
        organization_ids.iter().map(String::as_str).collect();
    if visible_organization_ids.is_empty() {
        return Json(Vec::<JobSummary>::new()).into_response();
    }

    let jobs = match state.jobs.list_jobs().await {
        ResourceReadResult::Loaded(jobs) => jobs,
        ResourceReadResult::NotFound => Vec::new(),
        ResourceReadResult::Unavailable => {
            return persisted_resource_unavailable_response(
                "jobs_unavailable",
                "The persisted field schedule could not be loaded.",
            );
        }
    };
    let jobs: Vec<JobSummary> = jobs
        .into_iter()
        .filter(|job| {
            completion_report_job_is_visible_to_membership(
                &job.organization_id,
                &visible_organization_ids,
            )
        })
        .collect();

    Json(jobs).into_response()
}

async fn get_job(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(id): Path<String>,
) -> Response {
    if let Err(response) =
        require_job_organization_access(&state, &principal, &id, can_view_crew_route).await
    {
        return response;
    }
    match state.jobs.get_job(id).await {
        ResourceReadResult::Loaded(job) => Json(job).into_response(),
        ResourceReadResult::NotFound => {
            resource_not_found_response("job_not_found", "Job was not found.")
        }
        ResourceReadResult::Unavailable => persisted_resource_unavailable_response(
            "job_unavailable",
            "The persisted job detail could not be loaded.",
        ),
    }
}

fn valid_service_date(value: &str) -> bool {
    let bytes = value.as_bytes();
    if bytes.len() != 10
        || bytes[4] != b'-'
        || bytes[7] != b'-'
        || bytes
            .iter()
            .enumerate()
            .any(|(index, byte)| index != 4 && index != 7 && !byte.is_ascii_digit())
    {
        return false;
    }
    let parts: Vec<_> = value.split('-').collect();
    let Ok(year) = parts[0].parse::<u32>() else {
        return false;
    };
    let Ok(month) = parts[1].parse::<u32>() else {
        return false;
    };
    let Ok(day) = parts[2].parse::<u32>() else {
        return false;
    };
    let leap = year % 4 == 0 && (year % 100 != 0 || year % 400 == 0);
    let max_day = match month {
        1 | 3 | 5 | 7 | 8 | 10 | 12 => 31,
        4 | 6 | 9 | 11 => 30,
        2 if leap => 29,
        2 => 28,
        _ => return false,
    };
    (1..=max_day).contains(&day)
}

async fn update_job_dispatch_assignment(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(id): Path<String>,
    Json(request): Json<UpdateJobDispatchAssignmentRequest>,
) -> Response {
    if let Err(response) =
        require_job_organization_access(&state, &principal, &id, can_manage_schedule).await
    {
        return response;
    }
    if request.crew_id.trim().is_empty() || request.crew_id.chars().count() > 120 {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_crew_id",
                message: "crew_id must be between 1 and 120 characters.".to_string(),
            }),
        )
            .into_response();
    }
    if !valid_service_date(&request.scheduled_date) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_scheduled_date",
                message: "scheduled_date must be a valid YYYY-MM-DD date.".to_string(),
            }),
        )
            .into_response();
    }

    match state
        .jobs
        .update_dispatch_assignment(
            &id,
        request.crew_id.trim(),
        &request.scheduled_date,
        request.customer_notification_required,
        &principal.subject,
        )
        .await
    {
        JobDispatchAssignmentResult::Updated(job) => Json(job).into_response(),
        JobDispatchAssignmentResult::JobNotFound => {
            resource_not_found_response("job_not_found", "Job was not found.")
        }
        JobDispatchAssignmentResult::CrewNotFound => (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "crew_not_available",
                message: "Select an active crew in the job organization.".to_string(),
            }),
        )
            .into_response(),
        JobDispatchAssignmentResult::CrewCapacityExceeded {
            capacity,
            projected,
        } => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "crew_capacity_exceeded",
                message: format!(
                    "This move would schedule {projected} active stops against a crew capacity of {capacity}."
                ),
            }),
        )
            .into_response(),
        JobDispatchAssignmentResult::JobAlreadyStarted => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "job_already_started",
                message: "Only scheduled jobs can be reassigned.".to_string(),
            }),
        )
            .into_response(),
        JobDispatchAssignmentResult::Unavailable => (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(ErrorResponse {
                error: "dispatch_assignment_unavailable",
                message: "The dispatch assignment could not be saved.".to_string(),
            }),
        )
            .into_response(),
    }
}

async fn complete_dispatch_customer_notification(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(id): Path<String>,
    Json(request): Json<CompleteDispatchCustomerNotificationRequest>,
) -> Response {
    if let Err(response) =
        require_job_organization_access(&state, &principal, &id, can_manage_schedule).await
    {
        return response;
    }
    if !matches!(request.channel.as_str(), "email" | "sms" | "phone") {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_notification_channel",
                message: "channel must be email, sms, or phone.".to_string(),
            }),
        )
            .into_response();
    }
    let note = request
        .note
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty());
    if note.is_some_and(|value| value.chars().count() > 500) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_notification_note",
                message: "note cannot exceed 500 characters.".to_string(),
            }),
        )
            .into_response();
    }
    match state
        .jobs
        .complete_dispatch_customer_notification(&id, &request.channel, note, &principal.subject)
        .await
    {
        DispatchCustomerNotificationResult::Completed => (
            StatusCode::CREATED,
            Json(serde_json::json!({
                "job_id": id,
                "status": "completed",
                "channel": request.channel,
                "persisted": true
            })),
        )
            .into_response(),
        DispatchCustomerNotificationResult::NoPendingNotification => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "no_pending_dispatch_notification",
                message: "This job has no unresolved dispatch customer notification.".to_string(),
            }),
        )
            .into_response(),
        DispatchCustomerNotificationResult::Unavailable => (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(ErrorResponse {
                error: "dispatch_notification_unavailable",
                message: "Customer notification follow-up could not be recorded.".to_string(),
            }),
        )
            .into_response(),
    }
}

async fn get_account_for_job(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(id): Path<String>,
) -> Response {
    if let Err(response) =
        require_job_organization_access(&state, &principal, &id, can_view_crew_route).await
    {
        return response;
    }

    let account = match state.accounts.get_account_for_job(&id).await {
        CustomerAccountSummaryResult::Loaded(account) => account,
        CustomerAccountSummaryResult::NotFound => {
            return resource_not_found_response(
                "job_account_not_found",
                "Customer account context was not found for this job.",
            );
        }
        CustomerAccountSummaryResult::Unavailable => {
            return persisted_resource_unavailable_response(
                "job_account_unavailable",
                "The persisted customer account context could not be loaded.",
            );
        }
    };
    match state
        .jobs
        .record_account_view(&id, &principal.subject)
        .await
    {
        ResourceReadResult::Loaded(_) => {}
        ResourceReadResult::NotFound => {
            return resource_not_found_response(
                "job_account_not_found",
                "Customer account context was no longer available for this job.",
            );
        }
        ResourceReadResult::Unavailable => {
            return persisted_resource_unavailable_response(
                "account_view_audit_unavailable",
                "The customer account view could not be recorded in the persisted audit trail.",
            );
        }
    }

    Json(account).into_response()
}

async fn bootstrap_organization(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Json(request): Json<BootstrapOrganizationRequest>,
) -> Response {
    if let Err(reason) = validate_bootstrap_organization_request(&request) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_organization_bootstrap",
                message: format!("Organization bootstrap payload is invalid: {reason}."),
            }),
        )
            .into_response();
    }
    if !principal.roles.iter().any(|role| {
        matches!(
            role,
            AccessRole::OrganizationOwner | AccessRole::SupportAdmin
        )
    }) {
        return (
            StatusCode::FORBIDDEN,
            Json(ErrorResponse {
                error: "organization_bootstrap_access_denied",
                message: "Organization-owner access is required to bootstrap an organization."
                    .to_string(),
            }),
        )
            .into_response();
    }
    match state
        .organizations
        .bootstrap_organization(&principal.subject, request)
        .await
    {
        Ok(BootstrapOrganizationResult::Created(result)) => {
            (StatusCode::CREATED, Json(result)).into_response()
        }
        Ok(BootstrapOrganizationResult::AlreadyMember) => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "organization_bootstrap_not_available",
                message: "The signed-in user already has an active organization membership."
                    .to_string(),
            }),
        )
            .into_response(),
        Ok(BootstrapOrganizationResult::Unavailable) | Err(_) => (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(ErrorResponse {
                error: "organization_bootstrap_unavailable",
                message: "Organization bootstrap requires database persistence.".to_string(),
            }),
        )
            .into_response(),
    }
}

async fn get_organization_profile(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(organization_id): Path<String>,
) -> Response {
    if let Err(response) = require_organization_membership(
        &state,
        &principal,
        &organization_id,
        can_manage_organization,
    )
    .await
    {
        return response;
    }
    match state
        .organizations
        .organization_profile(&organization_id)
        .await
    {
        OrganizationResourceResult::Found(profile) => Json(profile).into_response(),
        OrganizationResourceResult::NotFound => resource_not_found_response(
            "organization_not_found",
            "The requested organization was not found.",
        ),
        OrganizationResourceResult::Unavailable => persisted_resource_unavailable_response(
            "organization_profile_unavailable",
            "The persisted organization profile could not be loaded.",
        ),
    }
}

async fn get_first_owner_setup_progress(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(organization_id): Path<String>,
) -> Response {
    if let Err(response) = require_organization_membership(
        &state,
        &principal,
        &organization_id,
        can_manage_organization,
    )
    .await
    {
        return response;
    }
    match state
        .organizations
        .first_owner_setup_progress(&organization_id)
        .await
    {
        OrganizationResourceResult::Found(progress) => Json(progress).into_response(),
        OrganizationResourceResult::NotFound => resource_not_found_response(
            "organization_not_found",
            "The requested organization was not found.",
        ),
        OrganizationResourceResult::Unavailable => persisted_resource_unavailable_response(
            "organization_setup_progress_unavailable",
            "Persisted first-owner setup progress could not be loaded.",
        ),
    }
}

async fn update_organization_profile(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(organization_id): Path<String>,
    Json(request): Json<UpdateOrganizationProfileRequest>,
) -> Response {
    if let Err(reason) = validate_update_organization_profile_request(&request) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_organization_profile",
                message: format!("Organization profile is invalid: {reason}."),
            }),
        )
            .into_response();
    }
    if let Err(response) = require_organization_membership(
        &state,
        &principal,
        &organization_id,
        can_manage_organization,
    )
    .await
    {
        return response;
    }
    match state
        .organizations
        .update_organization_profile(&organization_id, &principal.subject, request)
        .await
    {
        OrganizationProfileUpdateResult::Updated(profile) => Json(profile).into_response(),
        OrganizationProfileUpdateResult::NotFound => resource_not_found_response(
            "organization_not_found",
            "The requested active organization was not found.",
        ),
        OrganizationProfileUpdateResult::Invalid => (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_organization_profile",
                message: "The normalized organization profile is invalid.".to_string(),
            }),
        )
            .into_response(),
        OrganizationProfileUpdateResult::Unavailable => persisted_resource_unavailable_response(
            "organization_profile_update_unavailable",
            "The persisted organization profile could not be updated.",
        ),
    }
}

async fn list_customer_accounts(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
) -> Response {
    let organization_ids = organization_ids_or_return!(
        principal_active_organization_ids_for_role(
            &state,
            &principal,
            can_manage_property_portfolios,
        )
        .await
    );
    match state.accounts.list(&organization_ids).await {
        CustomerAccountListResult::Loaded(accounts) => Json(accounts).into_response(),
        CustomerAccountListResult::Unavailable => persisted_resource_unavailable_response(
            "customer_accounts_unavailable",
            "The persisted customer accounts could not be loaded.",
        ),
    }
}

async fn list_archived_customer_accounts(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
) -> Response {
    let organization_ids = organization_ids_or_return!(
        principal_active_organization_ids_for_role(
            &state,
            &principal,
            can_manage_property_portfolios,
        )
        .await
    );
    match state.accounts.list_archived(&organization_ids).await {
        CustomerAccountListResult::Loaded(accounts) => Json(accounts).into_response(),
        CustomerAccountListResult::Unavailable => persisted_resource_unavailable_response(
            "archived_customer_accounts_unavailable",
            "The persisted archived customer accounts could not be loaded.",
        ),
    }
}

async fn create_customer_account(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Json(request): Json<CreateCustomerAccountRequest>,
) -> Response {
    if let Err(reason) = validate_create_customer_account_request(&request) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_customer_account",
                message: format!("Customer account payload is invalid: {reason}."),
            }),
        )
            .into_response();
    }
    if let Err(response) = require_organization_membership(
        &state,
        &principal,
        request.organization_id.trim(),
        can_manage_property_portfolios,
    )
    .await
    {
        return response;
    }
    match state.accounts.create(request).await {
        CustomerContextReadResult::Loaded(account) => {
            (StatusCode::CREATED, Json(account)).into_response()
        }
        CustomerContextReadResult::NotFound => resource_not_found_response(
            "customer_account_organization_not_found",
            "The requested organization was not found.",
        ),
        CustomerContextReadResult::Unavailable => persisted_resource_unavailable_response(
            "customer_account_creation_unavailable",
            "The customer account could not be persisted.",
        ),
    }
}

async fn update_customer_account(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(account_id): Path<String>,
    Json(request): Json<UpdateCustomerAccountRequest>,
) -> Response {
    if let Err(reason) = validate_update_customer_account_request(&request) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_customer_account",
                message: format!("Customer account payload is invalid: {reason}."),
            }),
        )
            .into_response();
    }
    let organization_ids = organization_ids_or_return!(
        principal_active_organization_ids_for_role(
            &state,
            &principal,
            can_manage_property_portfolios,
        )
        .await
    );
    match state
        .accounts
        .update(&account_id, &organization_ids, request)
        .await
    {
        CustomerContextReadResult::Loaded(account) => Json(account).into_response(),
        CustomerContextReadResult::NotFound => resource_not_found_response(
            "customer_account_not_found",
            "The requested customer account was not found.",
        ),
        CustomerContextReadResult::Unavailable => persisted_resource_unavailable_response(
            "customer_account_update_unavailable",
            "The customer account update could not be persisted.",
        ),
    }
}

async fn archive_customer_account(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(account_id): Path<String>,
) -> Response {
    let organization_ids = organization_ids_or_return!(
        principal_active_organization_ids_for_role(
            &state,
            &principal,
            can_manage_property_portfolios,
        )
        .await
    );
    match state
        .accounts
        .archive(&account_id, &organization_ids, &principal.subject)
        .await
    {
        Ok(()) => StatusCode::NO_CONTENT.into_response(),
        Err(CustomerAccountArchiveError::NotFound) => resource_not_found_response(
            "customer_account_not_found",
            "The requested active customer account was not found.",
        ),
        Err(CustomerAccountArchiveError::HasCurrentProperties) => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "customer_account_has_current_properties",
                message: "Archive every current property before archiving this customer account."
                    .to_string(),
            }),
        )
            .into_response(),
        Err(CustomerAccountArchiveError::HasActiveJobs) => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "customer_account_has_active_jobs",
                message: "Complete current scheduled or in-progress work before archiving this customer account."
                    .to_string(),
            }),
        )
            .into_response(),
        Err(CustomerAccountArchiveError::Persistence) => (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(ErrorResponse {
                error: "customer_account_not_archived",
                message: "The customer account could not be archived.".to_string(),
            }),
        )
            .into_response(),
    }
}

async fn reactivate_customer_account(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(account_id): Path<String>,
) -> Response {
    let organization_ids = organization_ids_or_return!(
        principal_active_organization_ids_for_role(
            &state,
            &principal,
            can_manage_property_portfolios,
        )
        .await
    );
    match state
        .accounts
        .reactivate(&account_id, &organization_ids, &principal.subject)
        .await
    {
        Ok(account) => Json(account).into_response(),
        Err(CustomerAccountArchiveError::NotFound) => resource_not_found_response(
            "archived_customer_account_not_found",
            "The requested archived customer account was not found.",
        ),
        Err(_) => (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(ErrorResponse {
                error: "customer_account_not_reactivated",
                message: "The customer account could not be reactivated.".to_string(),
            }),
        )
            .into_response(),
    }
}

async fn update_customer_account_relationship(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(account_id): Path<String>,
    Json(request): Json<UpdateCustomerAccountRelationshipRequest>,
) -> Response {
    if !valid_customer_account_relationship(&request.relationship_type) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "customer_account_relationship_invalid",
                message: "Choose a direct owner, property manager, or service-provider partner."
                    .to_string(),
            }),
        )
            .into_response();
    }
    let organization_ids = organization_ids_or_return!(
        principal_active_organization_ids_for_role(
            &state,
            &principal,
            can_manage_property_portfolios,
        )
        .await
    );
    match state
        .accounts
        .update_relationship(
            &account_id,
            &organization_ids,
            request.relationship_type.trim(),
            &principal.subject,
        )
        .await
    {
        Ok(account) => Json(account).into_response(),
        Err(CustomerAccountArchiveError::NotFound) => resource_not_found_response(
            "customer_account_not_found",
            "The requested active customer account was not found.",
        ),
        Err(_) => (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(ErrorResponse {
                error: "customer_account_relationship_not_updated",
                message: "The customer relationship could not be updated.".to_string(),
            }),
        )
            .into_response(),
    }
}

async fn list_customer_properties(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(account_id): Path<String>,
) -> Response {
    let organization_ids = organization_ids_or_return!(
        principal_active_organization_ids_for_role(
            &state,
            &principal,
            can_manage_property_portfolios,
        )
        .await
    );
    match state
        .accounts
        .list_properties(&account_id, &organization_ids)
        .await
    {
        CustomerPropertyListResult::Loaded(properties) => Json(properties).into_response(),
        CustomerPropertyListResult::Unavailable => persisted_resource_unavailable_response(
            "customer_properties_unavailable",
            "The persisted customer properties could not be loaded.",
        ),
    }
}

async fn get_customer_account_onboarding_progress(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(account_id): Path<String>,
) -> Response {
    let organization_ids = organization_ids_or_return!(
        principal_active_organization_ids_for_role(
            &state,
            &principal,
            can_manage_property_portfolios,
        )
        .await
    );
    match state
        .accounts
        .account_onboarding_progress(&account_id, &organization_ids)
        .await
    {
        CustomerContextReadResult::Loaded(progress) => Json(progress).into_response(),
        CustomerContextReadResult::NotFound => resource_not_found_response(
            "customer_account_not_found",
            "The requested customer account was not found.",
        ),
        CustomerContextReadResult::Unavailable => persisted_resource_unavailable_response(
            "customer_account_onboarding_unavailable",
            "The persisted customer account onboarding progress could not be loaded.",
        ),
    }
}

async fn create_customer_property(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(account_id): Path<String>,
    Json(request): Json<CreateCustomerPropertyRequest>,
) -> Response {
    if let Err(reason) = validate_create_customer_property_request(&request) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_customer_property",
                message: format!("Customer property payload is invalid: {reason}."),
            }),
        )
            .into_response();
    }
    if let Err(response) = require_organization_membership(
        &state,
        &principal,
        request.organization_id.trim(),
        can_manage_property_portfolios,
    )
    .await
    {
        return response;
    }
    match state.accounts.create_property(&account_id, request).await {
        Ok(property) => (StatusCode::CREATED, Json(property)).into_response(),
        Err(CustomerPropertyMutationError::NotFound) => resource_not_found_response(
            "customer_account_not_found",
            "The requested customer account was not found.",
        ),
        Err(CustomerPropertyMutationError::Duplicate) => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "duplicate_customer_property",
                message: "A property with this name and service address already exists."
                    .to_string(),
            }),
        )
            .into_response(),
        Err(CustomerPropertyMutationError::Persistence) => (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(ErrorResponse {
                error: "customer_property_persistence_unavailable",
                message: "The customer property could not be persisted.".to_string(),
            }),
        )
            .into_response(),
    }
}

async fn update_customer_property_identity(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path((account_id, property_id)): Path<(String, String)>,
    Json(request): Json<UpdateCustomerPropertyIdentityRequest>,
) -> Response {
    if let Err(reason) = accounts::validate_update_customer_property_identity_request(&request) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_customer_property_identity",
                message: format!("Customer property identity is invalid: {reason}."),
            }),
        )
            .into_response();
    }
    let organization_ids = organization_ids_or_return!(
        principal_active_organization_ids_for_role(
            &state,
            &principal,
            can_manage_property_portfolios,
        )
        .await
    );
    match state
        .accounts
        .update_property_identity(
            &account_id,
            &property_id,
            &organization_ids,
            request,
            &principal.subject,
        )
        .await
    {
        Ok(property) => Json(property).into_response(),
        Err(CustomerPropertyMutationError::NotFound) => resource_not_found_response(
            "customer_property_not_found",
            "The requested customer property was not found.",
        ),
        Err(CustomerPropertyMutationError::Duplicate) => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "duplicate_customer_property",
                message: "A property with this name and service address already exists."
                    .to_string(),
            }),
        )
            .into_response(),
        Err(CustomerPropertyMutationError::Persistence) => (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(ErrorResponse {
                error: "customer_property_persistence_unavailable",
                message: "The customer property could not be updated.".to_string(),
            }),
        )
            .into_response(),
    }
}

async fn update_customer_property_status(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path((account_id, property_id)): Path<(String, String)>,
    Json(request): Json<UpdateCustomerPropertyStatusRequest>,
) -> Response {
    if let Err(reason) = accounts::validate_update_customer_property_status_request(&request) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_customer_property_status",
                message: format!("Customer property status is invalid: {reason}."),
            }),
        )
            .into_response();
    }
    let organization_ids = organization_ids_or_return!(
        principal_active_organization_ids_for_role(
            &state,
            &principal,
            can_manage_property_portfolios,
        )
        .await
    );
    match state
        .accounts
        .update_property_status(
            &account_id,
            &property_id,
            &organization_ids,
            request,
            &principal.subject,
        )
        .await
    {
        Ok(property) => Json(property).into_response(),
        Err(CustomerPropertyStatusError::NotFound) => resource_not_found_response(
            "customer_property_not_found",
            "The requested customer property was not found.",
        ),
        Err(CustomerPropertyStatusError::NotReady) => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "customer_property_not_ready",
                message: "Activate the operational onboarding profile and assign a crew before activating this property.".to_string(),
            }),
        )
            .into_response(),
        Err(CustomerPropertyStatusError::InvalidTransition) => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "invalid_customer_property_transition",
                message: "Archived properties must return to onboarding before activation."
                    .to_string(),
            }),
        )
            .into_response(),
        Err(CustomerPropertyStatusError::Persistence) => (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(ErrorResponse {
                error: "customer_property_persistence_unavailable",
                message: "The customer property status could not be updated.".to_string(),
            }),
        )
            .into_response(),
    }
}

async fn get_customer_property_activation_readiness(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path((account_id, property_id)): Path<(String, String)>,
) -> Response {
    let organization_ids = organization_ids_or_return!(
        principal_active_organization_ids_for_role(
            &state,
            &principal,
            can_manage_property_portfolios,
        )
        .await
    );
    match state
        .accounts
        .property_activation_readiness(&account_id, &property_id, &organization_ids)
        .await
    {
        CustomerContextReadResult::Loaded(readiness) => Json(readiness).into_response(),
        CustomerContextReadResult::NotFound => resource_not_found_response(
            "customer_property_not_found",
            "The requested customer property was not found.",
        ),
        CustomerContextReadResult::Unavailable => persisted_resource_unavailable_response(
            "customer_property_readiness_unavailable",
            "The persisted customer property activation readiness could not be loaded.",
        ),
    }
}

async fn create_organization_invitation(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(organization_id): Path<String>,
    Json(request): Json<CreateOrganizationInvitationRequest>,
) -> Response {
    if let Err(reason) = validate_create_invitation_request(&request) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_organization_invitation",
                message: format!("Organization invitation payload is invalid: {reason}."),
            }),
        )
            .into_response();
    }

    if let Err(response) = require_organization_membership(
        &state,
        &principal,
        &organization_id,
        can_manage_organization,
    )
    .await
    {
        return response;
    }

    match state
        .organizations
        .create_invitation(&organization_id, &principal.subject, request)
        .await
    {
        OrganizationMutationResult::Applied(invitation) => {
            (StatusCode::CREATED, Json(invitation)).into_response()
        }
        OrganizationMutationResult::Conflict => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "organization_invitation_not_created",
                message: "The invitation could not be created. This recipient may already have pending access; refresh invitation history before trying again.".to_string(),
            }),
        )
            .into_response(),
        OrganizationMutationResult::Invalid => (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_organization_invitation",
                message: "The normalized organization invitation is invalid.".to_string(),
            }),
        )
            .into_response(),
        OrganizationMutationResult::Unavailable => persisted_resource_unavailable_response(
            "organization_invitation_create_unavailable",
            "The persisted organization invitation could not be created.",
        ),
    }
}

async fn list_organization_invitations(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(organization_id): Path<String>,
) -> Response {
    if let Err(response) = require_organization_membership(
        &state,
        &principal,
        &organization_id,
        can_manage_organization,
    )
    .await
    {
        return response;
    }

    match state.organizations.list_invitations(&organization_id).await {
        OrganizationCollectionResult::Loaded(invitations) => Json(invitations).into_response(),
        OrganizationCollectionResult::Unavailable => persisted_resource_unavailable_response(
            "organization_invitations_unavailable",
            "The persisted organization invitations could not be loaded.",
        ),
    }
}

async fn revoke_organization_invitation(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path((organization_id, invitation_id)): Path<(String, String)>,
) -> Response {
    if let Err(response) = require_organization_membership(
        &state,
        &principal,
        &organization_id,
        can_manage_organization,
    )
    .await
    {
        return response;
    }

    match state
        .organizations
        .revoke_invitation(&organization_id, &invitation_id, &principal.subject)
        .await
    {
        OrganizationMutationResult::Applied(invitation) => Json(invitation).into_response(),
        OrganizationMutationResult::Conflict | OrganizationMutationResult::Invalid => {
            resource_not_found_response(
                "organization_invitation_not_pending",
                "The invitation was not found or is no longer pending.",
            )
        }
        OrganizationMutationResult::Unavailable => persisted_resource_unavailable_response(
            "organization_invitation_revoke_unavailable",
            "The persisted organization invitation could not be revoked.",
        ),
    }
}

async fn reissue_organization_invitation(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path((organization_id, invitation_id)): Path<(String, String)>,
    Json(request): Json<ReissueOrganizationInvitationRequest>,
) -> Response {
    if let Err(reason) = validate_reissue_invitation_request(&request) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_organization_invitation_reissue",
                message: format!("Invitation reissue payload is invalid: {reason}."),
            }),
        )
            .into_response();
    }

    if let Err(response) = require_organization_membership(
        &state,
        &principal,
        &organization_id,
        can_manage_organization,
    )
    .await
    {
        return response;
    }

    match state
        .organizations
        .reissue_invitation(
            &organization_id,
            &invitation_id,
            &principal.subject,
            request,
        )
        .await
    {
        OrganizationMutationResult::Applied(invitation) => Json(invitation).into_response(),
        OrganizationMutationResult::Conflict | OrganizationMutationResult::Invalid => resource_not_found_response(
            "organization_invitation_not_reissuable",
            "The invitation was not found, is not expired or revoked, or has an invalid new expiration.",
        ),
        OrganizationMutationResult::Unavailable => persisted_resource_unavailable_response(
            "organization_invitation_reissue_unavailable",
            "The persisted organization invitation could not be reissued.",
        ),
    }
}

async fn accept_organization_invitation(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(token): Path<String>,
) -> Response {
    match state
        .organizations
        .accept_invitation(
            &token,
            &principal.subject,
            principal.verified_email.as_deref(),
        )
        .await
    {
        OrganizationMutationResult::Applied(accepted) => Json(accepted).into_response(),
        OrganizationMutationResult::Conflict | OrganizationMutationResult::Invalid => resource_not_found_response(
            "organization_invitation_not_found",
            "The organization invitation was not found, is no longer pending, or is addressed to a different verified email.",
        ),
        OrganizationMutationResult::Unavailable => persisted_resource_unavailable_response(
            "organization_invitation_acceptance_unavailable",
            "The persisted organization invitation could not be accepted.",
        ),
    }
}

async fn update_organization_membership_role(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path((organization_id, membership_id)): Path<(String, String)>,
    Json(request): Json<UpdateOrganizationMembershipRoleRequest>,
) -> Response {
    if grover_landscaping_api::organizations::access_role_from_storage(request.role.trim())
        .is_none()
    {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_membership_role",
                message: "Membership role must be a supported application role.".to_string(),
            }),
        )
            .into_response();
    }

    if let Err(response) = require_organization_membership(
        &state,
        &principal,
        &organization_id,
        can_manage_organization,
    )
    .await
    {
        return response;
    }

    match state
        .organizations
        .update_membership_role(
            &organization_id,
            &membership_id,
            &principal.subject,
            request,
        )
        .await
    {
        MembershipRoleUpdateResult::Updated(membership) => Json(membership).into_response(),
        MembershipRoleUpdateResult::LastActiveOwner => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "last_organization_owner",
                message: "Assign another active organization owner before changing this role."
                    .to_string(),
            }),
        )
            .into_response(),
        MembershipRoleUpdateResult::NotFound => resource_not_found_response(
            "organization_membership_not_found",
            "The organization membership was not found.",
        ),
        MembershipRoleUpdateResult::Unavailable => persisted_resource_unavailable_response(
            "membership_role_update_unavailable",
            "The persisted membership role could not be updated.",
        ),
    }
}

async fn update_organization_membership_profile(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path((organization_id, membership_id)): Path<(String, String)>,
    Json(request): Json<UpdateOrganizationMembershipProfileRequest>,
) -> Response {
    let display_name = request.display_name.trim();
    if !(2..=120).contains(&display_name.chars().count()) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_membership_profile",
                message: "Display name must contain 2 to 120 characters.".to_string(),
            }),
        )
            .into_response();
    }
    if let Err(response) = require_organization_membership(
        &state,
        &principal,
        &organization_id,
        can_manage_organization,
    )
    .await
    {
        return response;
    }
    match state
        .organizations
        .update_membership_profile(
            &organization_id,
            &membership_id,
            &principal.subject,
            request,
        )
        .await
    {
        MembershipProfileUpdateResult::Updated(membership) => Json(membership).into_response(),
        MembershipProfileUpdateResult::NotFound => resource_not_found_response(
            "organization_membership_not_found",
            "The organization membership was not found.",
        ),
        MembershipProfileUpdateResult::Unavailable => persisted_resource_unavailable_response(
            "membership_profile_update_unavailable",
            "The persisted membership profile could not be updated.",
        ),
    }
}

async fn list_organization_memberships(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(organization_id): Path<String>,
) -> Response {
    if let Err(response) = require_organization_membership(
        &state,
        &principal,
        &organization_id,
        can_manage_organization,
    )
    .await
    {
        return response;
    }
    match state
        .organizations
        .list_organization_memberships(&organization_id)
        .await
    {
        OrganizationCollectionResult::Loaded(memberships) => Json(memberships).into_response(),
        OrganizationCollectionResult::Unavailable => persisted_resource_unavailable_response(
            "organization_memberships_unavailable",
            "The persisted organization memberships could not be loaded.",
        ),
    }
}

async fn update_organization_membership_status(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path((organization_id, membership_id)): Path<(String, String)>,
    Json(request): Json<UpdateOrganizationMembershipStatusRequest>,
) -> Response {
    if !matches!(request.status.trim(), "active" | "suspended") {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_membership_status",
                message: "Membership status must be active or suspended.".to_string(),
            }),
        )
            .into_response();
    }
    if let Err(response) = require_organization_membership(
        &state,
        &principal,
        &organization_id,
        can_manage_organization,
    )
    .await
    {
        return response;
    }
    match state
        .organizations
        .update_membership_status(
            &organization_id,
            &membership_id,
            &principal.subject,
            request,
        )
        .await
    {
        MembershipStatusUpdateResult::Updated(membership) => Json(membership).into_response(),
        MembershipStatusUpdateResult::LastActiveOwner => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "last_organization_owner",
                message:
                    "Assign another active organization owner before suspending this membership."
                        .to_string(),
            }),
        )
            .into_response(),
        MembershipStatusUpdateResult::NotManageable => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "membership_status_not_manageable",
                message: "Only active or suspended memberships can use this lifecycle action."
                    .to_string(),
            }),
        )
            .into_response(),
        MembershipStatusUpdateResult::NotFound => resource_not_found_response(
            "organization_membership_not_found",
            "The organization membership was not found.",
        ),
        MembershipStatusUpdateResult::Unavailable => persisted_resource_unavailable_response(
            "membership_status_update_unavailable",
            "The persisted membership status could not be updated.",
        ),
    }
}

async fn list_team_administration_activity(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(organization_id): Path<String>,
    Query(query): Query<TeamActivityQuery>,
) -> Response {
    const EVENT_KINDS: &[&str] = &[
        "organization_profile_updated",
        "invite_accepted",
        "invitation_revoked",
        "invitation_reissued",
        "role_changed",
        "membership_suspended",
        "membership_reactivated",
        "membership_profile_updated",
        "branch_created",
        "branch_status_updated",
        "territory_created",
        "territory_status_updated",
        "crew_profile_updated",
        "crew_hierarchy_updated",
        "crew_deactivated",
        "crew_reactivated",
    ];
    if let Err(response) = require_organization_membership(
        &state,
        &principal,
        &organization_id,
        can_manage_organization,
    )
    .await
    {
        return response;
    }
    let event_kind = query.event_kind.as_deref().map(str::trim);
    if event_kind.is_some_and(|value| !EVENT_KINDS.contains(&value)) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_team_activity_filter",
                message: "event_kind is not a supported team activity event.".to_string(),
            }),
        )
            .into_response();
    }
    let move_scope = query.move_scope.as_deref().map(str::trim);
    if move_scope.is_some_and(|value| !matches!(value, "cross_branch" | "within_branch")) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_team_activity_filter",
                message: "move_scope must be cross_branch or within_branch.".to_string(),
            }),
        )
            .into_response();
    }
    let actor_query = query.actor.as_deref().map(str::trim);
    if actor_query.is_some_and(|value| value.is_empty() || value.chars().count() > 120) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_team_activity_filter",
                message: "actor must be a non-empty search no longer than 120 characters."
                    .to_string(),
            }),
        )
            .into_response();
    }
    let target_query = query.target.as_deref().map(str::trim);
    if target_query.is_some_and(|value| value.is_empty() || value.chars().count() > 120) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_team_activity_filter",
                message: "target must be a non-empty search no longer than 120 characters."
                    .to_string(),
            }),
        )
            .into_response();
    }
    let source_query = query.source.as_deref().map(str::trim);
    if source_query.is_some_and(|value| value.is_empty() || value.chars().count() > 120) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_team_activity_filter",
                message: "source must be a non-empty search no longer than 120 characters."
                    .to_string(),
            }),
        )
            .into_response();
    }
    let destination_query = query.destination.as_deref().map(str::trim);
    if destination_query.is_some_and(|value| value.is_empty() || value.chars().count() > 120) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_team_activity_filter",
                message: "destination must be a non-empty search no longer than 120 characters."
                    .to_string(),
            }),
        )
            .into_response();
    }
    let audit_id_query = query.audit_id.as_deref().map(str::trim);
    if audit_id_query.is_some_and(|value| value.is_empty() || value.chars().count() > 120) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_team_activity_filter",
                message: "audit_id must be a non-empty search no longer than 120 characters."
                    .to_string(),
            }),
        )
            .into_response();
    }
    let before = query.before.as_deref().map(str::trim);
    if before.is_some_and(|value| value.is_empty() || value.len() > 64) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_team_activity_filter",
                message: "before must be a non-empty timestamp no longer than 64 characters."
                    .to_string(),
            }),
        )
            .into_response();
    }
    let limit = query.limit.unwrap_or(25);
    if !(1..=100).contains(&limit) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_team_activity_filter",
                message: "limit must be between 1 and 100.".to_string(),
            }),
        )
            .into_response();
    }
    match state
        .organizations
        .list_team_administration_activity_page(
            &organization_id,
            event_kind,
            move_scope,
            actor_query,
            target_query,
            source_query,
            destination_query,
            audit_id_query,
            before,
            limit,
        )
        .await
    {
        OrganizationCollectionResult::Loaded(activity) => Json(activity).into_response(),
        OrganizationCollectionResult::Unavailable => persisted_resource_unavailable_response(
            "team_activity_unavailable",
            "Persisted team administration activity could not be loaded.",
        ),
    }
}

async fn list_operational_activity(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Query(query): Query<OperationalActivityQuery>,
) -> Response {
    const EVENT_KINDS: &[&str] = &[
        "route_draft_saved",
        "route_published",
        "route_completed",
        "route_stop_assigned",
        "route_stop_removed",
        "route_stops_reordered",
        "job_reassigned",
        "dispatch_customer_notified",
        "report_review_started",
        "report_changes_requested",
        "report_resubmitted",
        "report_delivered",
        "bid_approved",
        "bid_rejected",
        "bid_converted",
        "photo_processing_retried",
        "photo_processing_resolved",
        "photo_erasure_deletion_retried",
        "photo_erasure_deletion_resolved",
        "customer_photo_evidence_erased",
    ];
    let event_kind = query.event_kind.as_deref().map(str::trim);
    if event_kind.is_some_and(|value| !EVENT_KINDS.contains(&value)) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_operational_activity_filter",
                message: "event_kind is not a supported operational activity event.".to_string(),
            }),
        )
            .into_response();
    }
    let before = query.before.as_deref().map(str::trim);
    if before.is_some_and(|value| value.is_empty() || value.len() > 64) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_operational_activity_filter",
                message: "before must be a non-empty timestamp no longer than 64 characters."
                    .to_string(),
            }),
        )
            .into_response();
    }
    let limit = query.limit.unwrap_or(50);
    if !(1..=100).contains(&limit) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_operational_activity_filter",
                message: "limit must be between 1 and 100.".to_string(),
            }),
        )
            .into_response();
    }
    let organization_ids = organization_ids_or_return!(
        principal_active_organization_ids_for_role(&state, &principal, can_manage_schedule).await
    );
    match state
        .organizations
        .list_operational_activity_page(&organization_ids, event_kind, before, limit)
        .await
    {
        OrganizationCollectionResult::Loaded(activity) => Json(activity).into_response(),
        OrganizationCollectionResult::Unavailable => persisted_resource_unavailable_response(
            "operational_activity_unavailable",
            "Persisted operational activity could not be loaded.",
        ),
    }
}

async fn list_property_portfolios_for_account(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(account_id): Path<String>,
) -> Response {
    let organization_ids = organization_ids_or_return!(
        principal_active_organization_ids_for_role(
            &state,
            &principal,
            can_manage_property_portfolios,
        )
        .await
    );
    match state
        .property_portfolios
        .list_for_account(&account_id, &organization_ids)
        .await
    {
        PropertyPortfolioListResult::Loaded(portfolios) => Json(portfolios).into_response(),
        PropertyPortfolioListResult::Unavailable => persisted_resource_unavailable_response(
            "property_portfolios_unavailable",
            "The persisted property portfolios could not be loaded.",
        ),
    }
}

async fn get_customer_property_portfolio(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(account_id): Path<String>,
) -> Response {
    let organization_ids = organization_ids_or_return!(
        principal_active_organization_ids_for_role(
            &state,
            &principal,
            can_view_customer_property_portfolios,
        )
        .await
    );
    match state
        .property_portfolios
        .customer_portfolio_read(&account_id, &organization_ids)
        .await
    {
        CustomerPropertyPortfolioReadResult::Loaded(response) => Json(response).into_response(),
        CustomerPropertyPortfolioReadResult::Unavailable => {
            persisted_resource_unavailable_response(
                "customer_property_portfolio_unavailable",
                "The persisted customer property portfolio could not be loaded.",
            )
        }
    }
}

async fn list_customer_project_bids(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(account_id): Path<String>,
) -> Response {
    let organization_ids = organization_ids_or_return!(
        principal_active_organization_ids_for_role(
            &state,
            &principal,
            can_manage_property_portfolios,
        )
        .await
    );
    match state
        .project_bids
        .list_for_account(&account_id, &organization_ids)
        .await
    {
        ProjectBidListResult::Loaded(bids) => Json(bids).into_response(),
        ProjectBidListResult::Unavailable => persisted_resource_unavailable_response(
            "customer_project_bids_unavailable",
            "The persisted customer bid history could not be loaded.",
        ),
    }
}

async fn export_customer_privacy_data(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(account_id): Path<String>,
) -> Response {
    let organization_ids = organization_ids_or_return!(
        principal_active_organization_ids_for_role(
            &state,
            &principal,
            can_review_completion_report,
        )
        .await
    );

    match state
        .jobs
        .export_customer_privacy_data(&account_id, &organization_ids, &principal.subject)
        .await
    {
        CustomerPrivacyExportResult::Exported(export) => Json(export).into_response(),
        CustomerPrivacyExportResult::NotFound => resource_not_found_response(
            "customer_account_not_found",
            "The requested customer account was not found.",
        ),
        CustomerPrivacyExportResult::Unavailable => (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(ErrorResponse {
                error: "customer_privacy_export_unavailable",
                message: "Customer privacy export requires database persistence.".to_string(),
            }),
        )
            .into_response(),
    }
}

async fn erase_customer_photo_evidence(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(account_id): Path<String>,
    Json(request): Json<CustomerPhotoErasureRequest>,
) -> Response {
    let reason = match normalize_customer_photo_erasure_reason(request.reason) {
        Ok(reason) => reason,
        Err(()) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: "invalid_customer_photo_erasure_reason",
                    message: "reason is required and must be no more than 1000 characters."
                        .to_string(),
                }),
            )
                .into_response();
        }
    };
    let organization_ids = organization_ids_or_return!(
        principal_active_organization_ids_for_role(
            &state,
            &principal,
            can_review_completion_report,
        )
        .await
    );

    match state
        .jobs
        .erase_customer_photo_evidence(&account_id, &organization_ids, &principal.subject, &reason)
        .await
    {
        CustomerPhotoErasureResult::Erased(summary) => Json(summary).into_response(),
        CustomerPhotoErasureResult::NotFound => resource_not_found_response(
            "customer_account_not_found",
            "The requested customer account was not found.",
        ),
        CustomerPhotoErasureResult::Unavailable => (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(ErrorResponse {
                error: "customer_photo_erasure_unavailable",
                message: "Customer photo erasure requires database persistence.".to_string(),
            }),
        )
            .into_response(),
    }
}

async fn list_property_completion_reports(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(property_id): Path<String>,
) -> Response {
    let organization_ids = organization_ids_or_return!(
        principal_active_organization_ids_for_role(
            &state,
            &principal,
            can_view_customer_property_portfolios,
        )
        .await
    );
    match state
        .jobs
        .list_delivered_completion_reports_for_property(&property_id, &organization_ids)
        .await
    {
        ResourceReadResult::Loaded(reports) => Json(reports).into_response(),
        ResourceReadResult::NotFound => {
            unreachable!("property completion-report collections are never singularly missing")
        }
        ResourceReadResult::Unavailable => persisted_resource_unavailable_response(
            "property_completion_reports_unavailable",
            "Persisted property completion reports could not be loaded.",
        ),
    }
}

async fn create_property_portfolio(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Json(request): Json<CreatePropertyPortfolioRequest>,
) -> Response {
    if !is_valid_create_property_portfolio_request(&request) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_property_portfolio",
                message: "Portfolio account, organization, display name, and type are required."
                    .to_string(),
            }),
        )
            .into_response();
    }

    if let Err(response) = require_organization_membership(
        &state,
        &principal,
        request.organization_id.trim(),
        can_manage_property_portfolios,
    )
    .await
    {
        return response;
    }

    match state
        .property_portfolios
        .create_portfolio(request, &principal.subject)
        .await
    {
        PropertyPortfolioMutationResult::Saved(portfolio) => {
            (StatusCode::CREATED, Json(portfolio)).into_response()
        }
        PropertyPortfolioMutationResult::Conflict => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "property_portfolio_not_created",
                message: "The property portfolio could not be created.".to_string(),
            }),
        )
            .into_response(),
        PropertyPortfolioMutationResult::Unavailable => persisted_resource_unavailable_response(
            "property_portfolio_creation_unavailable",
            "The property portfolio could not be persisted.",
        ),
    }
}

async fn add_property_to_portfolio(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(portfolio_id): Path<String>,
    Json(request): Json<AddPropertyToPortfolioRequest>,
) -> Response {
    if !is_valid_add_property_to_portfolio_request(&request) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_portfolio_property",
                message: "Property and organization are required.".to_string(),
            }),
        )
            .into_response();
    }

    if let Err(response) = require_organization_membership(
        &state,
        &principal,
        request.organization_id.trim(),
        can_manage_property_portfolios,
    )
    .await
    {
        return response;
    }

    match state
        .property_portfolios
        .add_property(&portfolio_id, request, &principal.subject)
        .await
    {
        PropertyPortfolioMutationResult::Saved(link) => {
            (StatusCode::CREATED, Json(link)).into_response()
        }
        PropertyPortfolioMutationResult::Conflict => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "portfolio_property_not_linkable",
                message: "The property could not be linked to that portfolio.".to_string(),
            }),
        )
            .into_response(),
        PropertyPortfolioMutationResult::Unavailable => persisted_resource_unavailable_response(
            "portfolio_property_link_unavailable",
            "The property portfolio link could not be persisted.",
        ),
    }
}

async fn assign_property_crew(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(property_id): Path<String>,
    Json(request): Json<AssignPropertyCrewRequest>,
) -> Response {
    if !is_valid_assign_property_crew_request(&request) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_property_crew_assignment",
                message: "Crew and organization are required for property assignment.".to_string(),
            }),
        )
            .into_response();
    }

    if let Err(response) = require_organization_membership(
        &state,
        &principal,
        request.organization_id.trim(),
        can_manage_crew_assignments,
    )
    .await
    {
        return response;
    }

    match state
        .property_crew_assignments
        .assign_crew(&property_id, request, &principal.subject)
        .await
    {
        PropertyCrewAssignmentMutationResult::Assigned(assignment) => {
            (StatusCode::CREATED, Json(assignment)).into_response()
        }
        PropertyCrewAssignmentMutationResult::Conflict => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "property_crew_not_assignable",
                message: "The crew could not be assigned to that property.".to_string(),
            }),
        )
            .into_response(),
        PropertyCrewAssignmentMutationResult::Unavailable => {
            persisted_resource_unavailable_response(
                "property_crew_assignment_unavailable",
                "The crew assignment could not be persisted.",
            )
        }
    }
}

async fn list_crews(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
) -> Response {
    let organization_ids = organization_ids_or_return!(
        principal_active_organization_ids_for_role(&state, &principal, can_manage_crew_assignments)
            .await
    );
    match state.day_plans.list_crews(&organization_ids).await {
        PersistedReadResult::Loaded(crews) => Json(crews).into_response(),
        PersistedReadResult::Unavailable => persisted_resource_unavailable_response(
            "crews_unavailable",
            "Persisted crews could not be loaded.",
        ),
    }
}

async fn list_organization_branches(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
) -> Response {
    let organization_ids =
        organization_ids_or_return!(principal_active_organization_ids(&state, &principal).await);
    match state
        .day_plans
        .list_organization_branches(&organization_ids)
        .await
    {
        PersistedReadResult::Loaded(branches) => Json(branches).into_response(),
        PersistedReadResult::Unavailable => persisted_resource_unavailable_response(
            "organization_branches_unavailable",
            "Persisted organization branches could not be loaded.",
        ),
    }
}

async fn list_service_territories(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
) -> Response {
    let organization_ids =
        organization_ids_or_return!(principal_active_organization_ids(&state, &principal).await);
    match state
        .day_plans
        .list_service_territories(&organization_ids)
        .await
    {
        PersistedReadResult::Loaded(territories) => Json(territories).into_response(),
        PersistedReadResult::Unavailable => persisted_resource_unavailable_response(
            "service_territories_unavailable",
            "Persisted service territories could not be loaded.",
        ),
    }
}

async fn create_organization_branch(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(organization_id): Path<String>,
    Json(request): Json<CreateOrganizationBranchRequest>,
) -> Response {
    if let Err(response) = require_organization_membership(
        &state,
        &principal,
        &organization_id,
        can_manage_organization,
    )
    .await
    {
        return response;
    }
    if let Err(error) = validate_create_organization_branch_request(&request) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error,
                message: "Provide a valid branch name, code, supported timezone, and optional service area."
                    .to_string(),
            }),
        )
            .into_response();
    }
    match state
        .day_plans
        .create_organization_branch(&organization_id, &principal.subject, &request)
        .await
    {
        CreateOrganizationBranchResult::Created(branch) => {
            (StatusCode::CREATED, Json(branch)).into_response()
        }
        CreateOrganizationBranchResult::DuplicateCode => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "branch_code_exists",
                message: "Branch codes must be unique within the organization.".to_string(),
            }),
        )
            .into_response(),
        CreateOrganizationBranchResult::Unavailable => (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(ErrorResponse {
                error: "branch_creation_unavailable",
                message: "The branch could not be created.".to_string(),
            }),
        )
            .into_response(),
    }
}

async fn create_service_territory(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(organization_id): Path<String>,
    Json(request): Json<CreateServiceTerritoryRequest>,
) -> Response {
    if let Err(response) = require_organization_membership(
        &state,
        &principal,
        &organization_id,
        can_manage_organization,
    )
    .await
    {
        return response;
    }
    if let Err(error) = validate_create_service_territory_request(&request) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error,
                message: "Select an active branch and provide a territory name.".to_string(),
            }),
        )
            .into_response();
    }
    match state
        .day_plans
        .create_service_territory(&organization_id, &principal.subject, &request)
        .await
    {
        CreateServiceTerritoryResult::Created(territory) => {
            (StatusCode::CREATED, Json(territory)).into_response()
        }
        CreateServiceTerritoryResult::BranchNotFound => (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "territory_branch_not_available",
                message: "Select an active branch in this organization.".to_string(),
            }),
        )
            .into_response(),
        CreateServiceTerritoryResult::DuplicateName => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "territory_name_exists",
                message: "Territory names must be unique within the branch.".to_string(),
            }),
        )
            .into_response(),
        CreateServiceTerritoryResult::Unavailable => (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(ErrorResponse {
                error: "territory_creation_unavailable",
                message: "The service territory could not be created.".to_string(),
            }),
        )
            .into_response(),
    }
}

async fn update_organization_branch_status(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path((organization_id, branch_id)): Path<(String, String)>,
    Json(request): Json<UpdateHierarchyStatusRequest>,
) -> Response {
    let status = request.status.trim();
    if !matches!(status, "active" | "inactive") {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_branch_status",
                message: "Branch status must be active or inactive.".to_string(),
            }),
        )
            .into_response();
    }
    if let Err(response) = require_organization_membership(
        &state,
        &principal,
        &organization_id,
        can_manage_organization,
    )
    .await
    {
        return response;
    }
    match state
        .day_plans
        .update_organization_branch_status(
            &organization_id,
            &branch_id,
            &principal.subject,
            status,
        )
        .await
    {
        UpdateBranchStatusResult::Updated(branch) => Json(branch).into_response(),
        UpdateBranchStatusResult::OperationalConflict => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "branch_has_active_scopes",
                message:
                    "Move active crews and deactivate every territory before deactivating this branch."
                        .to_string(),
            }),
        )
            .into_response(),
        UpdateBranchStatusResult::NotFound => resource_not_found_response(
            "branch_not_found",
            "The branch was not found in this organization.",
        ),
        UpdateBranchStatusResult::Unavailable => (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(ErrorResponse {
                error: "branch_update_unavailable",
                message: "The branch status could not be updated.".to_string(),
            }),
        )
            .into_response(),
    }
}

async fn update_service_territory_status(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path((organization_id, territory_id)): Path<(String, String)>,
    Json(request): Json<UpdateHierarchyStatusRequest>,
) -> Response {
    let status = request.status.trim();
    if !matches!(status, "active" | "inactive") {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_territory_status",
                message: "Territory status must be active or inactive.".to_string(),
            }),
        )
            .into_response();
    }
    if let Err(response) = require_organization_membership(
        &state,
        &principal,
        &organization_id,
        can_manage_organization,
    )
    .await
    {
        return response;
    }
    match state
        .day_plans
        .update_service_territory_status(
            &organization_id,
            &territory_id,
            &principal.subject,
            status,
        )
        .await
    {
        UpdateTerritoryStatusResult::Updated(territory) => Json(territory).into_response(),
        UpdateTerritoryStatusResult::OperationalConflict => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "territory_has_active_crews",
                message: "Move active crews before deactivating this territory.".to_string(),
            }),
        )
            .into_response(),
        UpdateTerritoryStatusResult::NotFound => resource_not_found_response(
            "territory_not_found",
            "The territory was not found or its branch is inactive.",
        ),
        UpdateTerritoryStatusResult::Unavailable => (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(ErrorResponse {
                error: "territory_update_unavailable",
                message: "The territory status could not be updated.".to_string(),
            }),
        )
            .into_response(),
    }
}

async fn create_organization_crew(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(organization_id): Path<String>,
    Json(request): Json<CreateCrewRequest>,
) -> Response {
    if let Err(reason) = validate_create_crew_name(&request.name) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_crew",
                message: format!("Crew is invalid: {reason}."),
            }),
        )
            .into_response();
    }
    if let Err(response) = require_organization_membership(
        &state,
        &principal,
        &organization_id,
        can_manage_organization,
    )
    .await
    {
        return response;
    }
    match state.day_plans.create_crew(&organization_id, request).await {
        PersistedMutationResult::Applied(crew) => (StatusCode::CREATED, Json(crew)).into_response(),
        PersistedMutationResult::Conflict => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "crew_already_exists",
                message: "A crew with this name already exists in the organization.".to_string(),
            }),
        )
            .into_response(),
        PersistedMutationResult::Unavailable => persisted_resource_unavailable_response(
            "crew_creation_unavailable",
            "The crew could not be created in persisted storage.",
        ),
        PersistedMutationResult::NotFound => unreachable!("crew creation has no missing target"),
    }
}

async fn list_organization_crews(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(organization_id): Path<String>,
) -> Response {
    if let Err(response) = require_organization_membership(
        &state,
        &principal,
        &organization_id,
        can_manage_organization,
    )
    .await
    {
        return response;
    }
    match state
        .day_plans
        .list_organization_crews(&organization_id)
        .await
    {
        PersistedReadResult::Loaded(crews) => Json(crews).into_response(),
        PersistedReadResult::Unavailable => persisted_resource_unavailable_response(
            "organization_crews_unavailable",
            "Persisted organization crews could not be loaded.",
        ),
    }
}

async fn update_organization_crew(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path((organization_id, crew_id)): Path<(String, String)>,
    Json(request): Json<UpdateCrewRequest>,
) -> Response {
    if let Err(reason) = validate_create_crew_name(&request.name) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_crew",
                message: format!("Crew is invalid: {reason}."),
            }),
        )
            .into_response();
    }
    if !matches!(request.status.trim(), "active" | "inactive") {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_crew",
                message: "Crew status must be active or inactive.".to_string(),
            }),
        )
            .into_response();
    }
    if request
        .daily_stop_capacity
        .is_some_and(|capacity| !(1..=100).contains(&capacity))
    {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_crew",
                message: "Crew daily stop capacity must be from 1 to 100.".to_string(),
            }),
        )
            .into_response();
    }
    if request.branch_id.is_some() != request.territory_id.is_some() {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_crew_hierarchy",
                message: "Crew branch and territory must be updated together.".to_string(),
            }),
        )
            .into_response();
    }
    if let Err(response) = require_organization_membership(
        &state,
        &principal,
        &organization_id,
        can_manage_organization,
    )
    .await
    {
        return response;
    }
    match state
        .day_plans
        .update_crew(&organization_id, &crew_id, &principal.subject, request)
        .await
    {
        UpdateCrewResult::Updated(crew) => Json(crew).into_response(),
        UpdateCrewResult::OperationalConflict => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "crew_has_active_work",
                message:
                    "Reassign active properties and current routes before deactivating this crew."
                        .to_string(),
            }),
        )
            .into_response(),
        UpdateCrewResult::InvalidHierarchy => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "invalid_crew_hierarchy",
                message: "Choose an active territory inside an active branch in this organization."
                    .to_string(),
            }),
        )
            .into_response(),
        UpdateCrewResult::NotFound => resource_not_found_response(
            "crew_not_found",
            "The requested crew was not found in this organization.",
        ),
        UpdateCrewResult::Unavailable => persisted_resource_unavailable_response(
            "crew_update_unavailable",
            "The crew could not be updated in persisted storage.",
        ),
    }
}

async fn list_property_crew_assignments(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(property_id): Path<String>,
) -> Response {
    let organization_ids = organization_ids_or_return!(
        principal_active_organization_ids_for_role(&state, &principal, can_manage_crew_assignments)
            .await
    );
    match state
        .property_crew_assignments
        .list_for_property(&property_id, &organization_ids)
        .await
    {
        PropertyCrewAssignmentListResult::Loaded(assignments) => Json(assignments).into_response(),
        PropertyCrewAssignmentListResult::Unavailable => persisted_resource_unavailable_response(
            "property_crew_assignments_unavailable",
            "The persisted property crew assignments could not be loaded.",
        ),
    }
}

async fn list_active_crew_property_assignments(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(crew_id): Path<String>,
) -> Response {
    let organization_ids = organization_ids_or_return!(
        principal_active_organization_ids_for_role(&state, &principal, can_manage_crew_assignments)
            .await
    );
    if organization_ids.is_empty() {
        return Json(Vec::<PropertyCrewAssignmentResponse>::new()).into_response();
    }

    let crew_organization_id = match state.day_plans.organization_id_for_crew(&crew_id).await {
        day_plans::PersistedReadResult::Loaded(Some(organization_id)) => organization_id,
        day_plans::PersistedReadResult::Loaded(None) => {
            return resource_not_found_response("crew_not_found", "Crew was not found.");
        }
        day_plans::PersistedReadResult::Unavailable => {
            return persisted_ownership_unavailable_response("crew_ownership_unavailable");
        }
    };

    if !organization_ids
        .iter()
        .any(|organization_id| organization_id == &crew_organization_id)
    {
        return (
            StatusCode::FORBIDDEN,
            Json(ErrorResponse {
                error: "organization_access_denied",
                message: "Active organization membership is required for this resource."
                    .to_string(),
            }),
        )
            .into_response();
    }

    match state
        .property_crew_assignments
        .list_active_for_crew(&crew_id, &organization_ids)
        .await
    {
        PropertyCrewAssignmentListResult::Loaded(assignments) => Json(assignments).into_response(),
        PropertyCrewAssignmentListResult::Unavailable => persisted_resource_unavailable_response(
            "crew_property_assignments_unavailable",
            "The persisted active property assignments could not be loaded.",
        ),
    }
}

async fn get_property_onboarding(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(property_id): Path<String>,
) -> Response {
    let organization_ids = organization_ids_or_return!(
        principal_active_organization_ids_for_role(
            &state,
            &principal,
            can_view_customer_property_portfolios,
        )
        .await
    );
    match state
        .property_onboarding
        .get(&property_id, &organization_ids)
        .await
    {
        PropertyOnboardingReadResult::Found(profile) => Json(profile).into_response(),
        PropertyOnboardingReadResult::NotFound => resource_not_found_response(
            "property_onboarding_not_found",
            "The requested property onboarding profile was not found.",
        ),
        PropertyOnboardingReadResult::Unavailable => persisted_resource_unavailable_response(
            "property_onboarding_unavailable",
            "The persisted property onboarding profile could not be loaded.",
        ),
    }
}

async fn upsert_property_onboarding(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(property_id): Path<String>,
    Json(request): Json<UpsertPropertyOnboardingRequest>,
) -> Response {
    if let Err(reason) = validate_property_onboarding_request(&request) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_property_onboarding",
                message: format!("Property onboarding payload is invalid: {reason}."),
            }),
        )
            .into_response();
    }

    if let Err(response) = require_organization_membership(
        &state,
        &principal,
        request.organization_id.trim(),
        can_manage_property_portfolios,
    )
    .await
    {
        return response;
    }

    match state
        .property_onboarding
        .upsert(&property_id, request)
        .await
    {
        PropertyOnboardingWriteResult::Saved(profile) => {
            (StatusCode::CREATED, Json(profile)).into_response()
        }
        PropertyOnboardingWriteResult::Conflict => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "property_onboarding_not_saved",
                message: "The property onboarding profile could not be saved.".to_string(),
            }),
        )
            .into_response(),
        PropertyOnboardingWriteResult::Unavailable => persisted_resource_unavailable_response(
            "property_onboarding_save_unavailable",
            "The property onboarding profile could not be saved to persisted storage.",
        ),
    }
}

async fn get_completion_report(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(id): Path<String>,
) -> Response {
    if let Err(response) =
        require_job_organization_access(&state, &principal, &id, can_view_crew_route).await
    {
        return response;
    }

    match build_and_persist_completion_report(&state, &id).await {
        Ok(report) => Json(report).into_response(),
        Err(response) => response,
    }
}

async fn list_completion_reports(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Query(query): Query<CompletionReportListQuery>,
) -> Response {
    if let Err(message) = validate_completion_report_list_query(&query) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_completion_report_filter",
                message,
            }),
        )
            .into_response();
    }

    let organization_ids =
        organization_ids_or_return!(principal_active_organization_ids(&state, &principal).await);
    let visible_organization_ids: HashSet<&str> =
        organization_ids.iter().map(String::as_str).collect();
    if visible_organization_ids.is_empty() {
        return Json(Vec::<CompletionReportResponse>::new()).into_response();
    }

    let jobs = match state.jobs.list_jobs().await {
        ResourceReadResult::Loaded(jobs) => jobs,
        ResourceReadResult::NotFound => Vec::new(),
        ResourceReadResult::Unavailable => {
            return persisted_resource_unavailable_response(
                "completion_report_jobs_unavailable",
                "The persisted jobs for completion review could not be loaded.",
            );
        }
    };
    let mut reports = Vec::with_capacity(jobs.len());

    for job in jobs {
        if !completion_report_job_is_visible_to_membership(
            &job.organization_id,
            &visible_organization_ids,
        ) {
            continue;
        }
        let report = match build_and_persist_completion_report(&state, &job.id).await {
            Ok(report) => report,
            Err(response) => return response,
        };
        if completion_report_matches_list_query(&report, &query) {
            reports.push(report);
        }
    }

    Json(reports).into_response()
}

fn completion_report_job_is_visible_to_membership(
    organization_id: &str,
    visible_organization_ids: &HashSet<&str>,
) -> bool {
    visible_organization_ids.contains(organization_id)
}

fn validate_completion_report_list_query(query: &CompletionReportListQuery) -> Result<(), String> {
    if let Some(status) = query.status.as_deref() {
        if status != "all"
            && status != "active"
            && !is_valid_completion_report_lifecycle_status(status)
        {
            return Err(
                "status must be all, active, draft, submitted, in_review, changes_requested, or delivered"
                    .to_string(),
            );
        }
    }

    if let Some(readiness) = query.readiness.as_deref() {
        if !matches!(readiness, "all" | "ready" | "blocked" | "local_only") {
            return Err("readiness must be all, ready, blocked, or local_only".to_string());
        }
    }

    if let Some(readiness_blocker) = query.readiness_blocker.as_deref() {
        if !matches!(
            readiness_blocker,
            "all"
                | "any"
                | "checklist"
                | "before_photos"
                | "after_photos"
                | "add_ons"
                | "route_stop"
        ) {
            return Err(
                "readiness_blocker must be all, any, checklist, before_photos, after_photos, add_ons, or route_stop"
                    .to_string(),
            );
        }
    }

    validate_completion_report_text_filter(query.crew_id.as_deref(), "crew_id")?;
    validate_completion_report_text_filter(query.organization_id.as_deref(), "organization_id")?;
    validate_completion_report_text_filter(query.customer.as_deref(), "customer")?;
    validate_completion_report_text_filter(query.property.as_deref(), "property")?;
    validate_completion_report_date_filter(query.scheduled_from.as_deref(), "scheduled_from")?;
    validate_completion_report_date_filter(query.scheduled_to.as_deref(), "scheduled_to")?;

    if let (Some(scheduled_from), Some(scheduled_to)) = (
        query.scheduled_from.as_deref(),
        query.scheduled_to.as_deref(),
    ) {
        if scheduled_from > scheduled_to {
            return Err("scheduled_from cannot be after scheduled_to".to_string());
        }
    }

    Ok(())
}

fn validate_completion_report_text_filter(value: Option<&str>, name: &str) -> Result<(), String> {
    let Some(value) = value else {
        return Ok(());
    };
    let trimmed = value.trim();
    if trimmed.is_empty() {
        return Err(format!("{name} cannot be blank when provided"));
    }
    if trimmed.chars().count() > 120 {
        return Err(format!("{name} cannot exceed 120 characters"));
    }
    Ok(())
}

fn validate_completion_report_date_filter(value: Option<&str>, name: &str) -> Result<(), String> {
    let Some(value) = value else {
        return Ok(());
    };
    if value.len() != 10 {
        return Err(format!("{name} must use YYYY-MM-DD format"));
    }
    let bytes = value.as_bytes();
    let valid_shape = bytes[4] == b'-'
        && bytes[7] == b'-'
        && bytes
            .iter()
            .enumerate()
            .all(|(index, byte)| index == 4 || index == 7 || byte.is_ascii_digit());
    if !valid_shape {
        return Err(format!("{name} must use YYYY-MM-DD format"));
    }
    Ok(())
}

fn completion_report_matches_list_query(
    report: &CompletionReportResponse,
    query: &CompletionReportListQuery,
) -> bool {
    match query.status.as_deref().unwrap_or("all") {
        "all" => {}
        "active" => {
            if !completion_report_is_active_manager_queue_status(&report.report_status) {
                return false;
            }
        }
        status if report.report_status != status => return false,
        _ => {}
    }

    let readiness_matches = match query.readiness.as_deref().unwrap_or("all") {
        "all" => true,
        "ready" => report.ready_for_customer,
        "blocked" => !report.ready_for_customer,
        "local_only" => !report.persisted,
        _ => true,
    };

    readiness_matches && completion_report_matches_operational_filters(report, query)
}

fn completion_report_matches_operational_filters(
    report: &CompletionReportResponse,
    query: &CompletionReportListQuery,
) -> bool {
    if let Some(organization_id) =
        normalized_completion_report_exact_filter(query.organization_id.as_deref())
    {
        if report.job.organization_id != organization_id {
            return false;
        }
    }

    if let Some(customer) = normalized_completion_report_text_filter(query.customer.as_deref()) {
        if !report
            .job
            .customer_name
            .to_lowercase()
            .contains(customer.as_str())
        {
            return false;
        }
    }

    if let Some(property) = normalized_completion_report_text_filter(query.property.as_deref()) {
        if !report
            .job
            .property_address
            .to_lowercase()
            .contains(property.as_str())
        {
            return false;
        }
    }

    if let Some(crew_id) = normalized_completion_report_exact_filter(query.crew_id.as_deref()) {
        if report.job.assigned_crew_id.as_deref() != Some(crew_id.as_str()) {
            return false;
        }
    }

    if !completion_report_matches_readiness_blocker_filter(report, query) {
        return false;
    }

    if let Some(scheduled_from) = query.scheduled_from.as_deref() {
        if report.job.scheduled_date.as_str() < scheduled_from {
            return false;
        }
    }

    if let Some(scheduled_to) = query.scheduled_to.as_deref() {
        if report.job.scheduled_date.as_str() > scheduled_to {
            return false;
        }
    }

    true
}

fn completion_report_matches_readiness_blocker_filter(
    report: &CompletionReportResponse,
    query: &CompletionReportListQuery,
) -> bool {
    match query.readiness_blocker.as_deref().unwrap_or("all") {
        "all" => true,
        "any" => !report.ready_for_customer,
        "checklist" => report.checklist_progress < 100,
        "before_photos" => report.before_photos == 0,
        "after_photos" => report.after_photos == 0,
        "add_ons" => report.readiness_blockers.contains(&"add_ons".to_string()),
        "route_stop" => report
            .readiness_blockers
            .contains(&"route_stop".to_string()),
        _ => true,
    }
}

fn normalized_completion_report_text_filter(value: Option<&str>) -> Option<String> {
    value
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_lowercase)
}

fn normalized_completion_report_exact_filter(value: Option<&str>) -> Option<String> {
    value
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string)
}

async fn list_notification_history(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Query(query): Query<NotificationHistoryQuery>,
) -> Response {
    match notification_history_filter(query) {
        Ok(mut filter) => {
            filter.organization_ids = organization_ids_or_return!(
                principal_active_organization_ids(&state, &principal).await
            );
            match state.notifications.list_history(filter).await {
                NotificationHistoryListResult::Loaded(items) => Json(items).into_response(),
                NotificationHistoryListResult::Unavailable => (
                    StatusCode::SERVICE_UNAVAILABLE,
                    Json(ErrorResponse {
                        error: "notification_history_unavailable",
                        message: "Notification history could not be loaded from persistence."
                            .to_string(),
                    }),
                )
                    .into_response(),
            }
        }
        Err(message) => (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_notification_history_filter",
                message,
            }),
        )
            .into_response(),
    }
}

async fn list_operational_exceptions(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Query(query): Query<OperationalExceptionQuery>,
) -> Response {
    let mut filter = OperationalExceptionFilter {
        organization_id: query.organization_id,
        category: query.category,
        priority: query.priority,
        status: query.status,
        limit: query.limit.unwrap_or(25),
        ..OperationalExceptionFilter::default()
    };
    if let Err(message) = validate_operational_exception_filter(&filter) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_operational_exception_filter",
                message,
            }),
        )
            .into_response();
    }

    filter.organization_ids = organization_ids_or_return!(
        principal_active_organization_ids_for_role(&state, &principal, can_manage_schedule).await
    );
    match state.operational_exceptions.list(filter).await {
        Ok(OperationalExceptionListResult::Loaded(items)) => Json(items).into_response(),
        Ok(OperationalExceptionListResult::Unavailable) | Err(_) => (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(ErrorResponse {
                error: "operational_exceptions_unavailable",
                message: "Operational exceptions could not be loaded from persistence.".to_string(),
            }),
        )
            .into_response(),
    }
}

async fn create_operational_exception(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Json(request): Json<CreateOperationalExceptionRequest>,
) -> Response {
    if let Err(message) = validate_create_operational_exception(&request) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_operational_exception",
                message,
            }),
        )
            .into_response();
    }

    let organization_ids = organization_ids_or_return!(
        principal_active_organization_ids_for_role(&state, &principal, can_manage_schedule).await
    );
    if !organization_ids.contains(&request.organization_id) {
        return resource_not_found_response(
            "operational_exception_organization_not_found",
            "The requested organization was not found.",
        );
    }

    match state
        .operational_exceptions
        .create(request, &principal.subject)
        .await
    {
        Ok(OperationalExceptionCreateResult::Created(exception)) => {
            (StatusCode::CREATED, Json(exception)).into_response()
        }
        Ok(OperationalExceptionCreateResult::Unavailable) | Err(_) => (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(ErrorResponse {
                error: "operational_exception_persistence_unavailable",
                message: "The operational exception could not be saved.".to_string(),
            }),
        )
            .into_response(),
    }
}

async fn update_operational_exception(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(id): Path<String>,
    Json(request): Json<UpdateOperationalExceptionRequest>,
) -> Response {
    if id.trim().is_empty() || id != id.trim() {
        return resource_not_found_response(
            "operational_exception_not_found",
            "The requested operational exception was not found.",
        );
    }
    if let Err(message) = validate_update_operational_exception(&request) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_operational_exception_update",
                message,
            }),
        )
            .into_response();
    }
    let organization_ids = organization_ids_or_return!(
        principal_active_organization_ids_for_role(&state, &principal, can_manage_schedule).await
    );
    match state
        .operational_exceptions
        .update(&id, &organization_ids, request, &principal.subject)
        .await
    {
        Ok(OperationalExceptionUpdateResult::Updated(exception)) => Json(exception).into_response(),
        Ok(OperationalExceptionUpdateResult::NotFound) => resource_not_found_response(
            "operational_exception_not_found",
            "The requested operational exception was not found.",
        ),
        Ok(OperationalExceptionUpdateResult::Conflict) => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "operational_exception_conflict",
                message: "The exception changed or the requested lifecycle transition is no longer valid. Reload and try again.".to_string(),
            }),
        ).into_response(),
        Ok(OperationalExceptionUpdateResult::Unavailable) | Err(_) => (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(ErrorResponse {
                error: "operational_exception_persistence_unavailable",
                message: "The operational exception could not be updated.".to_string(),
            }),
        ).into_response(),
    }
}

fn notification_history_filter(
    query: NotificationHistoryQuery,
) -> Result<NotificationHistoryFilter, String> {
    if let Some(entity_type) = query.entity_type.as_deref() {
        if !matches!(
            entity_type,
            "project_bid" | "completion_report" | "organization_invitation"
        ) {
            return Err(
                "entity_type must be project_bid, completion_report, or organization_invitation when provided"
                    .to_string(),
            );
        }
    }

    if let Some(status) = query.status.as_deref() {
        if !matches!(
            status,
            "queued" | "sending" | "sent" | "failed" | "skipped" | "dead_letter" | "resolved"
        ) {
            return Err(
                "status must be queued, sending, sent, failed, skipped, dead_letter, or resolved"
                    .to_string(),
            );
        }
    }

    let limit = query.limit.unwrap_or(25);
    if !(1..=100).contains(&limit) {
        return Err("limit must be between 1 and 100".to_string());
    }

    Ok(NotificationHistoryFilter {
        organization_ids: Vec::new(),
        entity_type: query.entity_type,
        status: query.status,
        limit,
    })
}

async fn list_photo_processing_history(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Query(query): Query<PhotoProcessingHistoryQuery>,
) -> Response {
    match photo_processing_history_filter(query) {
        Ok(mut filter) => {
            filter.organization_ids = organization_ids_or_return!(
                principal_active_organization_ids(&state, &principal).await
            );
            match state.jobs.list_photo_processing_history(filter).await {
                ResourceReadResult::Loaded(items) => Json(items).into_response(),
                ResourceReadResult::NotFound | ResourceReadResult::Unavailable => (
                    StatusCode::SERVICE_UNAVAILABLE,
                    Json(ErrorResponse {
                        error: "photo_processing_history_unavailable",
                        message: "Photo processing history could not be loaded from persistence."
                            .to_string(),
                    }),
                )
                    .into_response(),
            }
        }
        Err(message) => (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_photo_processing_history_filter",
                message,
            }),
        )
            .into_response(),
    }
}

fn photo_processing_history_filter(
    query: PhotoProcessingHistoryQuery,
) -> Result<PhotoProcessingHistoryFilter, String> {
    if let Some(task_type) = query.task_type.as_deref() {
        if task_type != "thumbnail_generation" {
            return Err("task_type must be thumbnail_generation when provided".to_string());
        }
    }

    if let Some(status) = query.status.as_deref() {
        if !matches!(
            status,
            "queued" | "processing" | "completed" | "failed" | "dead_letter" | "resolved"
        ) {
            return Err(
                "status must be queued, processing, completed, failed, dead_letter, or resolved"
                    .to_string(),
            );
        }
    }

    let limit = query.limit.unwrap_or(25);
    if !(1..=100).contains(&limit) {
        return Err("limit must be between 1 and 100".to_string());
    }

    Ok(PhotoProcessingHistoryFilter {
        organization_ids: Vec::new(),
        task_type: query.task_type,
        status: query.status,
        limit,
    })
}

async fn retry_photo_processing_job(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(id): Path<String>,
) -> Response {
    let organization_ids =
        organization_ids_or_return!(principal_active_organization_ids(&state, &principal).await);
    match state
        .jobs
        .retry_photo_processing_job(&id, &organization_ids, &principal.subject)
        .await
    {
        Ok(PhotoProcessingRetryResult::Retried(item)) => Json(item).into_response(),
        Ok(PhotoProcessingRetryResult::InvalidStatus) => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "photo_processing_not_retryable",
                message: "Only failed or dead-letter photo processing jobs can be retried."
                    .to_string(),
            }),
        )
            .into_response(),
        Ok(PhotoProcessingRetryResult::NotFound) => (
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                error: "photo_processing_job_not_found",
                message: "The requested photo processing job was not found.".to_string(),
            }),
        )
            .into_response(),
        Ok(PhotoProcessingRetryResult::Unavailable) | Err(_) => (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(ErrorResponse {
                error: "photo_processing_retry_unavailable",
                message: "Photo processing retry requires database persistence.".to_string(),
            }),
        )
            .into_response(),
    }
}

async fn resolve_photo_processing_job(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(id): Path<String>,
    Json(request): Json<PhotoProcessingResolveRequest>,
) -> Response {
    let reason = match normalize_notification_resolution_reason(request.reason) {
        Ok(reason) => reason,
        Err(()) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: "invalid_photo_processing_resolution_reason",
                    message: "Resolution reason cannot exceed 1000 characters.".to_string(),
                }),
            )
                .into_response();
        }
    };

    let organization_ids =
        organization_ids_or_return!(principal_active_organization_ids(&state, &principal).await);
    match state
        .jobs
        .resolve_photo_processing_job(
            &id,
            &organization_ids,
            &principal.subject,
            reason.as_deref(),
        )
        .await
    {
        Ok(PhotoProcessingResolveResult::Resolved(item)) => Json(item).into_response(),
        Ok(PhotoProcessingResolveResult::InvalidStatus) => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "photo_processing_not_resolvable",
                message:
                    "Only failed or dead-letter photo processing jobs can be manually resolved."
                        .to_string(),
            }),
        )
            .into_response(),
        Ok(PhotoProcessingResolveResult::NotFound) => (
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                error: "photo_processing_job_not_found",
                message: "The requested photo processing job was not found.".to_string(),
            }),
        )
            .into_response(),
        Ok(PhotoProcessingResolveResult::Unavailable) | Err(_) => (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(ErrorResponse {
                error: "photo_processing_resolution_unavailable",
                message: "Photo processing resolution requires database persistence.".to_string(),
            }),
        )
            .into_response(),
    }
}

async fn list_photo_erasure_deletion_history(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Query(query): Query<PhotoErasureDeletionHistoryQuery>,
) -> Response {
    if let Some(status) = query.status.as_deref() {
        if !matches!(
            status,
            "queued" | "processing" | "completed" | "failed" | "dead_letter" | "resolved"
        ) {
            return (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: "invalid_photo_erasure_deletion_filter",
                    message: "status must be queued, processing, completed, failed, dead_letter, or resolved".to_string(),
                }),
            )
                .into_response();
        }
    }
    let limit = query.limit.unwrap_or(25);
    if !(1..=100).contains(&limit) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_photo_erasure_deletion_filter",
                message: "limit must be between 1 and 100".to_string(),
            }),
        )
            .into_response();
    }
    let filter = PhotoErasureDeletionHistoryFilter {
        organization_ids: organization_ids_or_return!(
            principal_active_organization_ids(&state, &principal).await
        ),
        status: query.status,
        limit,
    };
    match state.jobs.list_photo_erasure_deletion_history(filter).await {
        ResourceReadResult::Loaded(items) => Json(items).into_response(),
        ResourceReadResult::NotFound | ResourceReadResult::Unavailable => (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(ErrorResponse {
                error: "photo_erasure_deletion_history_unavailable",
                message: "Photo erasure deletion history could not be loaded from persistence."
                    .to_string(),
            }),
        )
            .into_response(),
    }
}

async fn retry_photo_erasure_deletion_job(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(id): Path<String>,
) -> Response {
    let organization_ids =
        organization_ids_or_return!(principal_active_organization_ids(&state, &principal).await);
    match state
        .jobs
        .retry_photo_erasure_deletion_job(&id, &organization_ids, &principal.subject)
        .await
    {
        Ok(PhotoErasureDeletionRetryResult::Retried(item)) => Json(item).into_response(),
        Ok(PhotoErasureDeletionRetryResult::InvalidStatus) => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "photo_erasure_deletion_not_retryable",
                message: "Only failed or dead-letter deletion jobs can be retried.".to_string(),
            }),
        )
            .into_response(),
        Ok(PhotoErasureDeletionRetryResult::NotFound) => (
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                error: "photo_erasure_deletion_job_not_found",
                message: "The requested photo erasure deletion job was not found.".to_string(),
            }),
        )
            .into_response(),
        Ok(PhotoErasureDeletionRetryResult::Unavailable) | Err(_) => (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(ErrorResponse {
                error: "photo_erasure_deletion_retry_unavailable",
                message: "Photo erasure deletion retry requires database persistence.".to_string(),
            }),
        )
            .into_response(),
    }
}

async fn resolve_photo_erasure_deletion_job(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(id): Path<String>,
    Json(request): Json<PhotoProcessingResolveRequest>,
) -> Response {
    let reason = match normalize_notification_resolution_reason(request.reason) {
        Ok(reason) => reason,
        Err(()) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: "invalid_photo_erasure_deletion_resolution_reason",
                    message: "Resolution reason cannot exceed 1000 characters.".to_string(),
                }),
            )
                .into_response();
        }
    };
    let organization_ids =
        organization_ids_or_return!(principal_active_organization_ids(&state, &principal).await);
    match state
        .jobs
        .resolve_photo_erasure_deletion_job(
            &id,
            &organization_ids,
            &principal.subject,
            reason.as_deref(),
        )
        .await
    {
        Ok(PhotoErasureDeletionResolveResult::Resolved(item)) => Json(item).into_response(),
        Ok(PhotoErasureDeletionResolveResult::InvalidStatus) => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "photo_erasure_deletion_not_resolvable",
                message: "Only failed or dead-letter deletion jobs can be resolved.".to_string(),
            }),
        )
            .into_response(),
        Ok(PhotoErasureDeletionResolveResult::NotFound) => (
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                error: "photo_erasure_deletion_job_not_found",
                message: "The requested photo erasure deletion job was not found.".to_string(),
            }),
        )
            .into_response(),
        Ok(PhotoErasureDeletionResolveResult::Unavailable) | Err(_) => (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(ErrorResponse {
                error: "photo_erasure_deletion_resolution_unavailable",
                message: "Photo erasure deletion resolution requires database persistence."
                    .to_string(),
            }),
        )
            .into_response(),
    }
}

async fn retry_notification_delivery(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(id): Path<String>,
) -> Response {
    let organization_ids =
        organization_ids_or_return!(principal_active_organization_ids(&state, &principal).await);
    match state
        .notifications
        .retry_failed(&id, &organization_ids, &principal.subject)
        .await
    {
        Ok(NotificationRetryResult::Retried(item)) => Json(item).into_response(),
        Ok(NotificationRetryResult::InvalidStatus) => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "notification_not_retryable",
                message: "Only failed or dead-letter notifications can be retried.".to_string(),
            }),
        )
            .into_response(),
        Ok(NotificationRetryResult::NotFound) => (
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                error: "notification_not_found",
                message: "The requested notification was not found.".to_string(),
            }),
        )
            .into_response(),
        Ok(NotificationRetryResult::Unavailable) | Err(_) => (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(ErrorResponse {
                error: "notification_retry_unavailable",
                message: "Notification retry requires database persistence.".to_string(),
            }),
        )
            .into_response(),
    }
}

async fn resolve_notification_delivery(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(id): Path<String>,
    Json(request): Json<NotificationResolveRequest>,
) -> Response {
    let reason = match normalize_notification_resolution_reason(request.reason) {
        Ok(reason) => reason,
        Err(()) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: "invalid_notification_resolution_reason",
                    message: "Resolution reason cannot exceed 1000 characters.".to_string(),
                }),
            )
                .into_response();
        }
    };

    let organization_ids =
        organization_ids_or_return!(principal_active_organization_ids(&state, &principal).await);
    match state
        .notifications
        .resolve_failed(
            &id,
            &organization_ids,
            &principal.subject,
            reason.as_deref(),
        )
        .await
    {
        Ok(NotificationResolveResult::Resolved(item)) => Json(item).into_response(),
        Ok(NotificationResolveResult::InvalidStatus) => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "notification_not_resolvable",
                message: "Only failed or dead-letter notifications can be manually resolved."
                    .to_string(),
            }),
        )
            .into_response(),
        Ok(NotificationResolveResult::NotFound) => (
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                error: "notification_not_found",
                message: "The requested notification was not found.".to_string(),
            }),
        )
            .into_response(),
        Ok(NotificationResolveResult::Unavailable) | Err(_) => (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(ErrorResponse {
                error: "notification_resolution_unavailable",
                message: "Notification resolution requires database persistence.".to_string(),
            }),
        )
            .into_response(),
    }
}

async fn principal_active_organization_ids(
    state: &AppState,
    principal: &AuthPrincipal,
) -> Result<Vec<String>, Response> {
    principal_active_organization_ids_for_role(state, principal, |_| true).await
}

async fn principal_active_organization_ids_for_role(
    state: &AppState,
    principal: &AuthPrincipal,
    required_role: fn(&AccessRole) -> bool,
) -> Result<Vec<String>, Response> {
    let mut seen = HashSet::new();
    match state
        .organizations
        .list_active_memberships(&principal.subject)
        .await
    {
        OrganizationCollectionResult::Loaded(memberships) => Ok(memberships
            .into_iter()
            .filter(|membership| required_role(&membership.role))
            .filter_map(|membership| {
                if seen.insert(membership.organization_id.clone()) {
                    Some(membership.organization_id)
                } else {
                    None
                }
            })
            .collect()),
        OrganizationCollectionResult::Unavailable => Err(persisted_resource_unavailable_response(
            "organization_memberships_unavailable",
            "Active organization memberships could not be loaded.",
        )),
    }
}

async fn require_crew_organization_access(
    state: &AppState,
    principal: &AuthPrincipal,
    crew_id: &str,
    required_role: fn(&AccessRole) -> bool,
) -> Result<(), Response> {
    let organization_id = match state.day_plans.organization_id_for_crew(crew_id).await {
        day_plans::PersistedReadResult::Loaded(Some(organization_id)) => organization_id,
        day_plans::PersistedReadResult::Loaded(None) => {
            return Err(resource_not_found_response(
                "crew_not_found",
                "Crew was not found.",
            ));
        }
        day_plans::PersistedReadResult::Unavailable => {
            return Err(persisted_ownership_unavailable_response(
                "crew_ownership_unavailable",
            ));
        }
    };

    require_organization_membership(state, principal, &organization_id, required_role).await
}

async fn require_day_plan_organization_access(
    state: &AppState,
    principal: &AuthPrincipal,
    day_plan_id: &str,
    required_role: fn(&AccessRole) -> bool,
) -> Result<(), Response> {
    let organization_id = match state
        .day_plans
        .organization_id_for_day_plan(day_plan_id)
        .await
    {
        day_plans::PersistedReadResult::Loaded(Some(organization_id)) => organization_id,
        day_plans::PersistedReadResult::Loaded(None) => {
            return Err(resource_not_found_response(
                "day_plan_not_found",
                "Day plan was not found.",
            ));
        }
        day_plans::PersistedReadResult::Unavailable => {
            return Err(persisted_ownership_unavailable_response(
                "day_plan_ownership_unavailable",
            ));
        }
    };

    require_organization_membership(state, principal, &organization_id, required_role).await
}

fn persisted_ownership_unavailable_response(error: &'static str) -> Response {
    (
        StatusCode::SERVICE_UNAVAILABLE,
        Json(ErrorResponse {
            error,
            message: "Persisted resource ownership could not be verified. Access is denied until persistence recovers.".to_string(),
        }),
    )
        .into_response()
}

fn persisted_resource_unavailable_response(error: &'static str, message: &'static str) -> Response {
    (
        StatusCode::SERVICE_UNAVAILABLE,
        Json(ErrorResponse {
            error,
            message: message.to_string(),
        }),
    )
        .into_response()
}

async fn require_job_organization_access(
    state: &AppState,
    principal: &AuthPrincipal,
    job_id: &str,
    required_role: fn(&AccessRole) -> bool,
) -> Result<(), Response> {
    let organization_id = match state.jobs.organization_id_for_job(job_id).await {
        ResourceOwnershipResult::Loaded(Some(organization_id)) => organization_id,
        ResourceOwnershipResult::Loaded(None) => {
            return Err(resource_not_found_response(
                "job_not_found",
                "Job was not found.",
            ));
        }
        ResourceOwnershipResult::Unavailable => {
            return Err(persisted_ownership_unavailable_response(
                "job_ownership_unavailable",
            ));
        }
    };

    require_organization_membership(state, principal, &organization_id, required_role).await
}

async fn require_completion_report_organization_access(
    state: &AppState,
    principal: &AuthPrincipal,
    report_id: &str,
    required_role: fn(&AccessRole) -> bool,
) -> Result<(), Response> {
    let organization_id = match state
        .jobs
        .organization_id_for_completion_report(report_id)
        .await
    {
        ResourceOwnershipResult::Loaded(Some(organization_id)) => organization_id,
        ResourceOwnershipResult::Loaded(None) => {
            return Err(resource_not_found_response(
                "completion_report_not_found",
                "The requested completion report was not found.",
            ));
        }
        ResourceOwnershipResult::Unavailable => {
            return Err(persisted_ownership_unavailable_response(
                "completion_report_ownership_unavailable",
            ));
        }
    };

    require_organization_membership(state, principal, &organization_id, required_role).await
}

async fn require_organization_membership(
    state: &AppState,
    principal: &AuthPrincipal,
    organization_id: &str,
    required_role: fn(&AccessRole) -> bool,
) -> Result<(), Response> {
    match state
        .organizations
        .user_has_active_membership(&principal.subject, organization_id, required_role)
        .await
    {
        ActiveMembershipCheckResult::Allowed => Ok(()),
        ActiveMembershipCheckResult::Denied => Err((
            StatusCode::FORBIDDEN,
            Json(ErrorResponse {
                error: "organization_access_denied",
                message: "Active organization membership is required for this resource."
                    .to_string(),
            }),
        )
            .into_response()),
        ActiveMembershipCheckResult::Unavailable => Err(persisted_resource_unavailable_response(
            "organization_membership_verification_unavailable",
            "Active organization membership could not be verified.",
        )),
    }
}

fn resource_not_found_response(error: &'static str, message: &'static str) -> Response {
    (
        StatusCode::NOT_FOUND,
        Json(ErrorResponse {
            error,
            message: message.to_string(),
        }),
    )
        .into_response()
}

fn normalize_notification_resolution_reason(reason: Option<String>) -> Result<Option<String>, ()> {
    let Some(reason) = reason else {
        return Ok(None);
    };
    let trimmed = reason.trim();
    if trimmed.is_empty() {
        return Ok(None);
    }
    if trimmed.chars().count() > 1000 {
        return Err(());
    }
    Ok(Some(trimmed.to_string()))
}

fn normalize_customer_photo_erasure_reason(reason: String) -> Result<String, ()> {
    let trimmed = reason.trim();
    if trimmed.is_empty() || trimmed.chars().count() > 1000 {
        return Err(());
    }
    Ok(trimmed.to_string())
}

async fn start_completion_report_review(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(report_id): Path<String>,
) -> Response {
    if let Err(response) = require_completion_report_organization_access(
        &state,
        &principal,
        &report_id,
        can_review_completion_report,
    )
    .await
    {
        return response;
    }

    match state
        .jobs
        .start_completion_report_review(&report_id, &principal.subject)
        .await
    {
        CompletionReportActionResult::Updated(report) => Json(report).into_response(),
        CompletionReportActionResult::InvalidTransition => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "invalid_completion_report_transition",
                message: "Only submitted completion reports can enter manager review.".to_string(),
            }),
        )
            .into_response(),
        CompletionReportActionResult::NotFound => (
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                error: "completion_report_not_found",
                message: "The requested completion report was not found.".to_string(),
            }),
        )
            .into_response(),
        CompletionReportActionResult::Unavailable => (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(ErrorResponse {
                error: "completion_report_persistence_unavailable",
                message: "Starting manager review requires database persistence.".to_string(),
            }),
        )
            .into_response(),
    }
}

async fn request_completion_report_changes(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(report_id): Path<String>,
    Json(request): Json<CompletionReportChangeRequest>,
) -> Response {
    let reason = match normalize_completion_report_change_reason(request.reason) {
        Ok(reason) => reason,
        Err(()) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: "invalid_completion_report_change_reason",
                    message: "Change request reason must be 1000 characters or fewer.".to_string(),
                }),
            )
                .into_response();
        }
    };

    if let Err(response) = require_completion_report_organization_access(
        &state,
        &principal,
        &report_id,
        can_review_completion_report,
    )
    .await
    {
        return response;
    }

    match state
        .jobs
        .request_completion_report_changes(&report_id, &principal.subject, reason.as_deref())
        .await
    {
        CompletionReportActionResult::Updated(report) => Json(report).into_response(),
        CompletionReportActionResult::InvalidTransition => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "invalid_completion_report_transition",
                message: "Only in-review completion reports can have changes requested."
                    .to_string(),
            }),
        )
            .into_response(),
        CompletionReportActionResult::NotFound => (
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                error: "completion_report_not_found",
                message: "The requested completion report was not found.".to_string(),
            }),
        )
            .into_response(),
        CompletionReportActionResult::Unavailable => (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(ErrorResponse {
                error: "completion_report_persistence_unavailable",
                message: "Requesting changes requires database persistence.".to_string(),
            }),
        )
            .into_response(),
    }
}

async fn deliver_completion_report(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(report_id): Path<String>,
) -> Response {
    if let Err(response) = require_completion_report_organization_access(
        &state,
        &principal,
        &report_id,
        can_deliver_completion_report,
    )
    .await
    {
        return response;
    }

    let delivery_job_id = match state
        .jobs
        .completion_report_delivery_candidate(&report_id)
        .await
    {
        CompletionReportDeliveryCandidateResult::Ready(job_id) => job_id,
        CompletionReportDeliveryCandidateResult::InvalidTransition => {
            return (
                StatusCode::CONFLICT,
                Json(ErrorResponse {
                    error: "invalid_completion_report_transition",
                    message: "Only ready in-review completion reports can be delivered."
                        .to_string(),
                }),
            )
                .into_response();
        }
        CompletionReportDeliveryCandidateResult::NotFound => {
            return resource_not_found_response(
                "completion_report_not_found",
                "The requested completion report was not found.",
            );
        }
        CompletionReportDeliveryCandidateResult::Unavailable => {
            return persisted_resource_unavailable_response(
                "completion_report_persistence_unavailable",
                "Delivering a completion report requires database persistence.",
            );
        }
    };
    let snapshot = match build_and_persist_completion_report(&state, &delivery_job_id).await {
        Ok(report) => prepare_delivered_completion_report_snapshot(&report),
        Err(response) => return response,
    };

    match state
        .jobs
        .deliver_completion_report(&report_id, &principal.subject, &snapshot)
        .await
    {
        CompletionReportActionResult::Updated(report) => Json(report).into_response(),
        CompletionReportActionResult::InvalidTransition => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "invalid_completion_report_transition",
                message: "Only ready in-review completion reports can be delivered.".to_string(),
            }),
        )
            .into_response(),
        CompletionReportActionResult::NotFound => (
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                error: "completion_report_not_found",
                message: "The requested completion report was not found.".to_string(),
            }),
        )
            .into_response(),
        CompletionReportActionResult::Unavailable => (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(ErrorResponse {
                error: "completion_report_persistence_unavailable",
                message: "Delivering a completion report requires database persistence."
                    .to_string(),
            }),
        )
            .into_response(),
    }
}

async fn queue_completion_report_delivery_notification(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(report_id): Path<String>,
    Json(request): Json<CompletionReportDeliveryNotificationRequest>,
) -> Response {
    if let Err(message) = validate_notification_recipient(&request.channel, &request.recipient) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_notification_recipient",
                message,
            }),
        )
            .into_response();
    }

    if let Err(response) = require_completion_report_organization_access(
        &state,
        &principal,
        &report_id,
        can_deliver_completion_report,
    )
    .await
    {
        return response;
    }

    match state
        .jobs
        .queue_completion_report_delivery_notification(
            &report_id,
            &request.channel,
            &request.recipient,
        )
        .await
    {
        CompletionReportDeliveryNotificationResult::Queued(notification) => {
            Json(notification).into_response()
        }
        CompletionReportDeliveryNotificationResult::NotFound => (
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                error: "completion_report_not_found",
                message: "The requested completion report was not found.".to_string(),
            }),
        )
            .into_response(),
        CompletionReportDeliveryNotificationResult::NotDelivered => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "completion_report_not_delivered",
                message:
                    "Completion report delivery notifications require a delivered report share link."
                        .to_string(),
            }),
        )
            .into_response(),
        CompletionReportDeliveryNotificationResult::PreferenceBlocked => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "completion_report_notification_preference_blocked",
                message: "The selected channel or recipient is not enabled in this customer's account preferences.".to_string(),
            }),
        )
            .into_response(),
        CompletionReportDeliveryNotificationResult::Unavailable => (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(ErrorResponse {
                error: "completion_report_notification_unavailable",
                message: "Completion report delivery notifications require database persistence."
                    .to_string(),
            }),
        )
            .into_response(),
    }
}

async fn resubmit_completion_report(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(report_id): Path<String>,
) -> Response {
    if let Err(response) = require_completion_report_organization_access(
        &state,
        &principal,
        &report_id,
        can_submit_completion_report,
    )
    .await
    {
        return response;
    }

    match state
        .jobs
        .resubmit_completion_report(&report_id, &principal.subject)
        .await
    {
        CompletionReportActionResult::Updated(report) => Json(report).into_response(),
        CompletionReportActionResult::InvalidTransition => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "invalid_completion_report_transition",
                message: "Only ready change-requested completion reports can be resubmitted."
                    .to_string(),
            }),
        )
            .into_response(),
        CompletionReportActionResult::NotFound => (
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                error: "completion_report_not_found",
                message: "The requested completion report was not found.".to_string(),
            }),
        )
            .into_response(),
        CompletionReportActionResult::Unavailable => (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(ErrorResponse {
                error: "completion_report_persistence_unavailable",
                message: "Resubmitting a completion report requires database persistence."
                    .to_string(),
            }),
        )
            .into_response(),
    }
}

fn normalize_completion_report_change_reason(reason: Option<String>) -> Result<Option<String>, ()> {
    let Some(reason) = reason else {
        return Ok(None);
    };
    let trimmed = reason.trim();

    if trimmed.is_empty() {
        return Ok(None);
    }

    if trimmed.chars().count() > 1000 {
        return Err(());
    }

    Ok(Some(trimmed.to_string()))
}

async fn list_job_add_ons(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(id): Path<String>,
) -> Response {
    if let Err(response) =
        require_job_organization_access(&state, &principal, &id, can_view_crew_route).await
    {
        return response;
    }

    match state.jobs.list_job_add_ons(&id).await {
        ResourceReadResult::Loaded(add_ons) => Json(add_ons).into_response(),
        ResourceReadResult::NotFound => Json(Vec::<JobAddOn>::new()).into_response(),
        ResourceReadResult::Unavailable => persisted_resource_unavailable_response(
            "job_add_ons_unavailable",
            "The persisted job add-ons could not be loaded.",
        ),
    }
}

async fn update_job_add_on_status(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path((job_id, add_on_id)): Path<(String, String)>,
    Json(request): Json<JobAddOnStatusRequest>,
) -> Response {
    if let Err(response) =
        require_job_organization_access(&state, &principal, &job_id, can_view_crew_route).await
    {
        return response;
    }

    match state
        .jobs
        .update_job_add_on_status(&job_id, &add_on_id, &request.status)
        .await
    {
        JobAddOnStatusUpdate::Updated(add_on) => Json(add_on).into_response(),
        JobAddOnStatusUpdate::InvalidStatus => (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_add_on_status",
                message: "Add-on status must be scheduled, in_progress, completed, or cancelled."
                    .to_string(),
            }),
        )
            .into_response(),
        JobAddOnStatusUpdate::InvalidTransition => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "invalid_add_on_transition",
                message: "The requested add-on status transition is not allowed.".to_string(),
            }),
        )
            .into_response(),
        JobAddOnStatusUpdate::NotFound => (
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                error: "job_add_on_not_found",
                message: "The requested job add-on was not found.".to_string(),
            }),
        )
            .into_response(),
        JobAddOnStatusUpdate::Unavailable => (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(ErrorResponse {
                error: "job_add_on_persistence_unavailable",
                message: "Job add-on status updates require database persistence.".to_string(),
            }),
        )
            .into_response(),
    }
}

async fn get_shared_completion_report(
    State(state): State<Arc<AppState>>,
    Path(share_token): Path<String>,
) -> impl IntoResponse {
    match state
        .jobs
        .delivered_snapshot_for_report_share_token(&share_token)
        .await
    {
        ResourceReadResult::Loaded(snapshot) => {
            match customer_completion_report_snapshot_response(&snapshot) {
                Some(report) => Json(report).into_response(),
                None => persisted_resource_unavailable_response(
                    "shared_report_snapshot_invalid",
                    "The persisted shared report snapshot could not be safely projected.",
                ),
            }
        }
        ResourceReadResult::Unavailable => persisted_resource_unavailable_response(
            "shared_report_unavailable",
            "The persisted shared report could not be loaded.",
        ),
        ResourceReadResult::NotFound => (
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                error: "shared_report_not_found",
                message: "Shared report link was not found.".to_string(),
            }),
        )
            .into_response(),
    }
}

async fn build_and_persist_completion_report(
    state: &AppState,
    id: &str,
) -> Result<completion_reports::CompletionReportResponse, Response> {
    let job = match state.jobs.get_job(id.to_string()).await {
        ResourceReadResult::Loaded(job) => job,
        ResourceReadResult::NotFound => {
            return Err(resource_not_found_response(
                "job_not_found",
                "Job was not found.",
            ));
        }
        ResourceReadResult::Unavailable => {
            return Err(persisted_resource_unavailable_response(
                "job_unavailable",
                "The persisted job detail could not be loaded.",
            ));
        }
    };
    let account = match state.accounts.get_account_for_job(id).await {
        CustomerAccountSummaryResult::Loaded(account) => account,
        CustomerAccountSummaryResult::NotFound => {
            return Err(resource_not_found_response(
                "job_account_not_found",
                "Customer account context was not found for this job.",
            ));
        }
        CustomerAccountSummaryResult::Unavailable => {
            return Err(persisted_resource_unavailable_response(
                "job_account_unavailable",
                "The persisted customer account context could not be loaded.",
            ));
        }
    };
    let photo_evidence = match state.jobs.list_photo_evidence(id).await {
        ResourceReadResult::Loaded(photos) => photos,
        ResourceReadResult::NotFound => Vec::new(),
        ResourceReadResult::Unavailable => {
            return Err(persisted_resource_unavailable_response(
                "photo_evidence_unavailable",
                "The persisted photo evidence could not be loaded.",
            ));
        }
    };
    let add_ons = match state.jobs.list_job_add_ons(id).await {
        ResourceReadResult::Loaded(add_ons) => add_ons,
        ResourceReadResult::NotFound => Vec::new(),
        ResourceReadResult::Unavailable => {
            return Err(persisted_resource_unavailable_response(
                "job_add_ons_unavailable",
                "The persisted job add-ons could not be loaded.",
            ));
        }
    };
    let mut report = build_completion_report(job, account, photo_evidence, add_ons);
    if let Some(crew_id) = report.job.assigned_crew_id.as_deref() {
        match state.day_plans.today_for_crew(crew_id).await {
            day_plans::TodayDayPlanResult::Found(day_plan) => {
                if let Some(stop) = day_plan.stops.iter().find(|stop| stop.job_id == id) {
                    completion_reports::attach_completion_report_route_stop(
                        &mut report,
                        completion_reports::CompletionReportRouteStopContext {
                            day_plan_id: day_plan.id,
                            crew_id: day_plan.crew_id,
                            service_date: day_plan.service_date,
                            stop_id: stop.id.clone(),
                            stop_order: stop.stop_order,
                            stop_status: stop.stop_status.clone(),
                        },
                    );
                }
            }
            day_plans::TodayDayPlanResult::NotFound => {}
            day_plans::TodayDayPlanResult::Unavailable => {
                return Err(persisted_resource_unavailable_response(
                    "completion_report_route_unavailable",
                    "The persisted route context required for this completion report could not be loaded.",
                ));
            }
        }
    }
    let persistence = match state.jobs.persist_completion_report(&report).await {
        ResourceReadResult::Loaded(persistence) => persistence,
        ResourceReadResult::Unavailable => {
            return Err(persisted_resource_unavailable_response(
                "completion_report_persistence_unavailable",
                "The completion report could not be saved to persisted storage.",
            ));
        }
        ResourceReadResult::NotFound => {
            unreachable!("completion report persistence is never a read miss")
        }
    };
    apply_completion_report_persistence(&mut report, persistence);

    Ok(report)
}

async fn get_today_day_plan(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(crew_id): Path<String>,
) -> Response {
    if let Err(response) =
        require_crew_organization_access(&state, &principal, &crew_id, can_view_crew_route).await
    {
        return response;
    }

    match state.day_plans.today_for_crew(&crew_id).await {
        day_plans::TodayDayPlanResult::Found(day_plan) => Json(day_plan).into_response(),
        day_plans::TodayDayPlanResult::NotFound => resource_not_found_response(
            "crew_day_plan_not_found",
            "No published persisted route is available for this crew.",
        ),
        day_plans::TodayDayPlanResult::Unavailable => (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(ErrorResponse {
                error: "crew_day_plan_unavailable",
                message: "The persisted crew route could not be loaded.".to_string(),
            }),
        )
            .into_response(),
    }
}

async fn create_draft_day_plan(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Json(request): Json<CreateDayPlanRequest>,
) -> Response {
    if let Err(response) = require_crew_organization_access(
        &state,
        &principal,
        request.crew_id.trim(),
        can_manage_schedule,
    )
    .await
    {
        return response;
    }

    match state
        .day_plans
        .create_draft_day_plan_as(request, &principal.subject)
        .await
    {
        day_plans::PersistedMutationResult::Applied(response) => {
            (StatusCode::CREATED, Json(response)).into_response()
        }
        day_plans::PersistedMutationResult::NotFound => resource_not_found_response(
            "day_plan_draft_not_found",
            "The selected crew is no longer available.",
        ),
        day_plans::PersistedMutationResult::Conflict => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "day_plan_draft_conflict",
                message: "A route draft could not be created for this crew and service date. Refresh scheduling and try again.".to_string(),
            }),
        )
            .into_response(),
        day_plans::PersistedMutationResult::Unavailable => (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(ErrorResponse {
                error: "day_plan_draft_unavailable",
                message: "The route draft could not be saved.".to_string(),
            }),
        )
            .into_response(),
    }
}

async fn publish_day_plan(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(day_plan_id): Path<String>,
) -> Response {
    if let Err(response) =
        require_day_plan_organization_access(&state, &principal, &day_plan_id, can_manage_schedule)
            .await
    {
        return response;
    }

    match state
        .day_plans
        .publish_day_plan_as(&day_plan_id, &principal.subject)
        .await
    {
        day_plans::PersistedMutationResult::Applied(response) => Json(response).into_response(),
        day_plans::PersistedMutationResult::NotFound => resource_not_found_response(
            "day_plan_publish_not_found",
            "The route draft is no longer available.",
        ),
        day_plans::PersistedMutationResult::Conflict => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "day_plan_publish_conflict",
                message: "The route could not be published. Refresh the draft and confirm it has saved stops.".to_string(),
            }),
        )
            .into_response(),
        day_plans::PersistedMutationResult::Unavailable => (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(ErrorResponse {
                error: "day_plan_publish_unavailable",
                message: "The route could not be published.".to_string(),
            }),
        )
            .into_response(),
    }
}

async fn create_day_plan_amendment(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(day_plan_id): Path<String>,
    Json(request): Json<CreateDayPlanAmendmentRequest>,
) -> Response {
    if let Err(message) = validate_amendment_request(&request) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_day_plan_amendment",
                message,
            }),
        )
            .into_response();
    }

    if let Err(response) =
        require_day_plan_organization_access(&state, &principal, &day_plan_id, can_view_crew_route)
            .await
    {
        return response;
    }

    match state
        .day_plans
        .create_amendment(&day_plan_id, request)
        .await
    {
        day_plans::PersistedMutationResult::Applied(response) => {
            (StatusCode::CREATED, Json(response)).into_response()
        }
        day_plans::PersistedMutationResult::NotFound => resource_not_found_response(
            "day_plan_amendment_not_found",
            "The persisted route or stop is no longer available.",
        ),
        day_plans::PersistedMutationResult::Conflict => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "day_plan_amendment_conflict",
                message: "The route request conflicts with the current persisted route. Refresh it before trying again.".to_string(),
            }),
        )
            .into_response(),
        day_plans::PersistedMutationResult::Unavailable => (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(ErrorResponse {
                error: "day_plan_amendment_unavailable",
                message: "The route request could not be saved.".to_string(),
            }),
        )
            .into_response(),
    }
}

async fn list_day_plan_amendments(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(day_plan_id): Path<String>,
) -> Response {
    if let Err(response) =
        require_day_plan_organization_access(&state, &principal, &day_plan_id, can_view_crew_route)
            .await
    {
        return response;
    }

    match state.day_plans.list_amendments(&day_plan_id).await {
        day_plans::PersistedReadResult::Loaded(amendments) => Json(amendments).into_response(),
        day_plans::PersistedReadResult::Unavailable => (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(ErrorResponse {
                error: "day_plan_amendments_unavailable",
                message: "The persisted route request queue could not be loaded.".to_string(),
            }),
        )
            .into_response(),
    }
}

async fn review_day_plan_amendment(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path((day_plan_id, amendment_id)): Path<(String, String)>,
    Json(request): Json<ReviewDayPlanAmendmentRequest>,
) -> Response {
    if let Err(message) = validate_amendment_review(&request) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_day_plan_amendment_review",
                message,
            }),
        )
            .into_response();
    }

    if let Err(response) =
        require_day_plan_organization_access(&state, &principal, &day_plan_id, can_manage_schedule)
            .await
    {
        return response;
    }

    match state
        .day_plans
        .review_amendment(&day_plan_id, &amendment_id, request)
        .await
    {
        day_plans::PersistedMutationResult::Applied(response) => Json(response).into_response(),
        day_plans::PersistedMutationResult::NotFound => resource_not_found_response(
            "day_plan_amendment_review_not_found",
            "The route request is no longer available.",
        ),
        day_plans::PersistedMutationResult::Conflict => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "day_plan_amendment_review_conflict",
                message: "The route request changed before this decision was saved. Refresh the review queue and try again.".to_string(),
            }),
        )
            .into_response(),
        day_plans::PersistedMutationResult::Unavailable => (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(ErrorResponse {
                error: "day_plan_amendment_review_unavailable",
                message: "The route request decision could not be saved.".to_string(),
            }),
        )
            .into_response(),
    }
}

async fn save_project_bid_draft(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path((day_plan_id, amendment_id)): Path<(String, String)>,
    Json(request): Json<CreateProjectBidRequest>,
) -> Response {
    if let Err(message) = validate_project_bid_request(&request) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_project_bid",
                message,
            }),
        )
            .into_response();
    }

    if let Err(response) =
        require_day_plan_organization_access(&state, &principal, &day_plan_id, can_manage_schedule)
            .await
    {
        return response;
    }

    match state
        .project_bids
        .save_draft(&day_plan_id, &amendment_id, request)
        .await
    {
        ProjectBidDraftResult::Saved(bid) => {
            (StatusCode::CREATED, Json(bid)).into_response()
        }
        ProjectBidDraftResult::Conflict => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "project_bid_draft_conflict",
                message: "The bid request is no longer eligible for a draft. Refresh the amendment review.".to_string(),
            }),
        )
            .into_response(),
        ProjectBidDraftResult::Unavailable => persisted_resource_unavailable_response(
            "project_bid_draft_unavailable",
            "The project bid draft could not be persisted.",
        ),
    }
}

async fn list_project_bids(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(day_plan_id): Path<String>,
) -> Response {
    if let Err(response) =
        require_day_plan_organization_access(&state, &principal, &day_plan_id, can_manage_schedule)
            .await
    {
        return response;
    }

    match state.project_bids.list_for_day_plan(&day_plan_id).await {
        ProjectBidListResult::Loaded(bids) => Json(bids).into_response(),
        ProjectBidListResult::Unavailable => persisted_resource_unavailable_response(
            "project_bids_unavailable",
            "The persisted day-plan bids could not be loaded.",
        ),
    }
}

async fn send_project_bid(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path((day_plan_id, bid_id)): Path<(String, String)>,
    Json(request): Json<SendProjectBidRequest>,
) -> Response {
    if let Err(message) = validate_send_project_bid_request(&request) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_project_bid_delivery",
                message,
            }),
        )
            .into_response();
    }

    if let Err(response) =
        require_day_plan_organization_access(&state, &principal, &day_plan_id, can_manage_schedule)
            .await
    {
        return response;
    }

    match state
        .project_bids
        .send(&day_plan_id, &bid_id, &principal.subject, &request)
        .await
    {
        ProjectBidSendResult::Sent(bid) => Json(bid).into_response(),
        ProjectBidSendResult::PreferenceBlocked => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "project_bid_notification_preference_blocked",
                message: "The selected channel or recipient is not enabled in this customer's account preferences.".to_string(),
            }),
        )
            .into_response(),
        ProjectBidSendResult::NotSendable => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "project_bid_not_sendable",
                message: "Only a persisted draft bid can be sent.".to_string(),
            }),
        )
            .into_response(),
        ProjectBidSendResult::PublicationConflict => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "customer_recommendation_publication_conflict",
                message: "The customer recommendation changed or was already published. Reload the bid before retrying delivery.".to_string(),
            }),
        )
            .into_response(),
        ProjectBidSendResult::Unavailable => (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(ErrorResponse {
                error: "project_bid_notification_unavailable",
                message: "Project bid delivery requires database persistence.".to_string(),
            }),
        )
            .into_response(),
    }
}

async fn revise_project_bid(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path((day_plan_id, bid_id)): Path<(String, String)>,
    Json(request): Json<ReviseProjectBidRequest>,
) -> Response {
    if let Err(message) = validate_revise_project_bid_request(&request) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_project_bid_revision",
                message,
            }),
        )
            .into_response();
    }
    if let Err(response) =
        require_day_plan_organization_access(&state, &principal, &day_plan_id, can_manage_schedule)
            .await
    {
        return response;
    }

    match state
        .project_bids
        .revise(&day_plan_id, &bid_id, &principal.subject, &request)
        .await
    {
        ProjectBidRevisionResult::Revised(bid) => Json(bid).into_response(),
        ProjectBidRevisionResult::PreferenceBlocked => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "project_bid_notification_preference_blocked",
                message: "The selected channel or recipient is not enabled in this customer's account preferences.".to_string(),
            }),
        )
            .into_response(),
        ProjectBidRevisionResult::NotRevisable => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "project_bid_not_revisable",
                message: "Only an unanswered exact customer recommendation can be revised."
                    .to_string(),
            }),
        )
            .into_response(),
        ProjectBidRevisionResult::Conflict => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "customer_recommendation_revision_conflict",
                message: "The customer recommendation version or retry identity changed. Reload before revising again.".to_string(),
            }),
        )
            .into_response(),
        ProjectBidRevisionResult::Unavailable => persisted_resource_unavailable_response(
            "project_bid_revision_unavailable",
            "The revised customer recommendation could not be persisted.",
        ),
    }
}

async fn revoke_project_bid(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path((day_plan_id, bid_id)): Path<(String, String)>,
) -> Response {
    if let Err(response) =
        require_day_plan_organization_access(&state, &principal, &day_plan_id, can_manage_schedule)
            .await
    {
        return response;
    }

    match state.project_bids.revoke(&day_plan_id, &bid_id).await {
        ProjectBidMutationResult::Updated(bid) => Json(bid).into_response(),
        ProjectBidMutationResult::Conflict => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "project_bid_not_revocable",
                message: "Only an unanswered active bid link can be revoked.".to_string(),
            }),
        )
            .into_response(),
        ProjectBidMutationResult::Unavailable => persisted_resource_unavailable_response(
            "project_bid_revoke_unavailable",
            "The project bid link revocation could not be persisted.",
        ),
    }
}

async fn convert_project_bid(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path((day_plan_id, bid_id)): Path<(String, String)>,
) -> Response {
    if let Err(response) =
        require_day_plan_organization_access(&state, &principal, &day_plan_id, can_manage_schedule)
            .await
    {
        return response;
    }

    match state
        .project_bids
        .convert_to_job_add_ons(&day_plan_id, &bid_id, &principal.subject)
        .await
    {
        ProjectBidMutationResult::Updated(bid) => Json(bid).into_response(),
        ProjectBidMutationResult::Conflict => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "project_bid_not_convertible",
                message: "Only an approved persisted bid can be converted to work.".to_string(),
            }),
        )
            .into_response(),
        ProjectBidMutationResult::Unavailable => persisted_resource_unavailable_response(
            "project_bid_conversion_unavailable",
            "The approved project bid could not be converted to persisted work.",
        ),
    }
}

async fn get_shared_project_bid(
    State(state): State<Arc<AppState>>,
    Path(share_token): Path<String>,
) -> Response {
    match state.project_bids.shared_for_token(&share_token).await {
        SharedProjectBidReadResult::Loaded(bid) => {
            Json(customer_project_bid_response(&bid)).into_response()
        }
        SharedProjectBidReadResult::NotFound => {
            resource_not_found_response("shared_bid_not_found", "Shared bid link was not found.")
        }
        SharedProjectBidReadResult::Unavailable => persisted_resource_unavailable_response(
            "shared_bid_unavailable",
            "The shared bid could not be loaded from persisted storage.",
        ),
    }
}

async fn decide_shared_project_bid(
    State(state): State<Arc<AppState>>,
    Path(share_token): Path<String>,
    Json(request): Json<ProjectBidDecisionRequest>,
) -> Response {
    if let Err(message) = validate_project_bid_decision(&request) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_project_bid_decision",
                message,
            }),
        )
            .into_response();
    }

    let current = match state.project_bids.shared_for_token(&share_token).await {
        SharedProjectBidReadResult::Loaded(bid) => bid,
        SharedProjectBidReadResult::NotFound => {
            return resource_not_found_response(
                "shared_bid_not_found",
                "Shared bid link was not found.",
            );
        }
        SharedProjectBidReadResult::Unavailable => {
            return persisted_resource_unavailable_response(
                "shared_bid_unavailable",
                "The shared bid could not be loaded from persisted storage.",
            );
        }
    };

    if current.status != "sent" {
        return (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "project_bid_already_answered",
                message: "This bid already has a customer response.".to_string(),
            }),
        )
            .into_response();
    }

    match state
        .project_bids
        .decide_shared(&share_token, &request.decision)
        .await
    {
        ProjectBidMutationResult::Updated(bid) => {
            Json(customer_project_bid_response(&bid)).into_response()
        }
        ProjectBidMutationResult::Conflict => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "project_bid_decision_conflict",
                message: "The bid changed before this response was recorded.".to_string(),
            }),
        )
            .into_response(),
        ProjectBidMutationResult::Unavailable => persisted_resource_unavailable_response(
            "shared_bid_decision_unavailable",
            "The bid decision could not be persisted.",
        ),
    }
}

async fn assign_day_plan_stop(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(day_plan_id): Path<String>,
    Json(request): Json<AssignDayPlanStopRequest>,
) -> Response {
    if let Err(response) =
        require_day_plan_organization_access(&state, &principal, &day_plan_id, can_manage_schedule)
            .await
    {
        return response;
    }

    match state
        .day_plans
        .assign_stop_as(&day_plan_id, request, &principal.subject)
        .await
    {
        day_plans::PersistedMutationResult::Applied(response) => {
            (StatusCode::CREATED, Json(response)).into_response()
        }
        day_plans::PersistedMutationResult::NotFound => resource_not_found_response(
            "day_plan_stop_assignment_not_found",
            "The draft day plan or service job is no longer available.",
        ),
        day_plans::PersistedMutationResult::Conflict => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "day_plan_stop_assignment_conflict",
                message: "The stop could not be added. Refresh the draft and confirm its capacity and job availability.".to_string(),
            }),
        )
            .into_response(),
        day_plans::PersistedMutationResult::Unavailable => (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(ErrorResponse {
                error: "day_plan_stop_assignment_unavailable",
                message: "The route stop could not be saved.".to_string(),
            }),
        )
            .into_response(),
    }
}

async fn remove_day_plan_stop(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path((day_plan_id, stop_id)): Path<(String, String)>,
) -> Response {
    if let Err(response) =
        require_day_plan_organization_access(&state, &principal, &day_plan_id, can_manage_schedule)
            .await
    {
        return response;
    }

    match state
        .day_plans
        .remove_stop_as(&day_plan_id, &stop_id, &principal.subject)
        .await
    {
        day_plans::PersistedMutationResult::Applied(response) => Json(response).into_response(),
        day_plans::PersistedMutationResult::NotFound => resource_not_found_response(
            "day_plan_stop_removal_not_found",
            "The draft route stop is no longer available.",
        ),
        day_plans::PersistedMutationResult::Conflict => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "day_plan_stop_removal_conflict",
                message: "The route stop could not be removed from the current draft.".to_string(),
            }),
        )
            .into_response(),
        day_plans::PersistedMutationResult::Unavailable => (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(ErrorResponse {
                error: "day_plan_stop_removal_unavailable",
                message: "The route stop could not be removed.".to_string(),
            }),
        )
            .into_response(),
    }
}

async fn reorder_day_plan_stops(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(day_plan_id): Path<String>,
    Json(request): Json<ReorderDayPlanStopsRequest>,
) -> Response {
    if let Err(response) =
        require_day_plan_organization_access(&state, &principal, &day_plan_id, can_manage_schedule)
            .await
    {
        return response;
    }

    match state
        .day_plans
        .reorder_stops_as(&day_plan_id, request, &principal.subject)
        .await
    {
        day_plans::PersistedMutationResult::Applied(response) => Json(response).into_response(),
        day_plans::PersistedMutationResult::NotFound => resource_not_found_response(
            "day_plan_stop_reorder_not_found",
            "The draft route or one of its stops is no longer available.",
        ),
        day_plans::PersistedMutationResult::Conflict => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "day_plan_stop_reorder_conflict",
                message: "The route order changed before it could be saved. Refresh the draft and try again.".to_string(),
            }),
        )
            .into_response(),
        day_plans::PersistedMutationResult::Unavailable => (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(ErrorResponse {
                error: "day_plan_stop_reorder_unavailable",
                message: "The route order could not be saved.".to_string(),
            }),
        )
            .into_response(),
    }
}

async fn update_stop_progress(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path((day_plan_id, stop_id)): Path<(String, String)>,
    Json(request): Json<StopProgressRequest>,
) -> impl IntoResponse {
    if !is_valid_stop_progress_status(&request.status) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_stop_progress_status",
                message: format!("Unsupported stop progress status: {}", request.status),
            }),
        )
            .into_response();
    }
    if request
        .client_mutation_id
        .as_deref()
        .is_some_and(|id| Uuid::parse_str(id).is_err())
    {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_client_mutation_id",
                message: "client_mutation_id must be a UUID".to_string(),
            }),
        )
            .into_response();
    }

    if let Err(response) =
        require_day_plan_organization_access(&state, &principal, &day_plan_id, can_view_crew_route)
            .await
    {
        return response;
    }

    let persisted = state
        .jobs
        .update_stop_progress(
            &day_plan_id,
            &stop_id,
            &request.status,
            request.client_mutation_id.as_deref(),
            &principal.subject,
        )
        .await;

    match persisted {
        StopProgressWriteResult::Persisted => Json(persisted_stop_progress_response(
            &day_plan_id,
            &stop_id,
            &request.status,
        ))
        .into_response(),
        StopProgressWriteResult::Replayed => Json(replayed_stop_progress_response(
            &day_plan_id,
            &stop_id,
            &request.status,
        ))
        .into_response(),
        StopProgressWriteResult::IdempotencyConflict => (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "stop_progress_idempotency_conflict",
                message: "The client mutation ID was already used for different stop progress."
                    .to_string(),
            }),
        )
            .into_response(),
        StopProgressWriteResult::NotFound => resource_not_found_response(
            "stop_progress_not_found",
            "The persisted route stop is no longer available.",
        ),
        StopProgressWriteResult::Unavailable => (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(ErrorResponse {
                error: "stop_progress_unavailable",
                message: "The route progress change could not be saved.".to_string(),
            }),
        )
            .into_response(),
        StopProgressWriteResult::LocalFallback => Json(local_stop_progress_response(
            &day_plan_id,
            &stop_id,
            &request.status,
        ))
        .into_response(),
    }
}

async fn start_job(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    headers: HeaderMap,
    Path(id): Path<String>,
) -> Response {
    if let Err(response) =
        require_job_organization_access(&state, &principal, &id, can_view_crew_route).await
    {
        return response;
    }

    let client_mutation_id = headers
        .get("x-client-mutation-id")
        .and_then(|value| value.to_str().ok());
    if client_mutation_id.is_some_and(|value| Uuid::parse_str(value).is_err()) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_client_mutation_id",
                message: "x-client-mutation-id must be a UUID".to_string(),
            }),
        )
            .into_response();
    }
    let result = state
        .jobs
        .start_job(&id, client_mutation_id, &principal.subject)
        .await;
    if result == JobLifecycleWriteResult::IdempotencyConflict {
        return (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "job_lifecycle_idempotency_conflict",
                message: "The client mutation ID was already used for a different job action."
                    .to_string(),
            }),
        )
            .into_response();
    }
    if result == JobLifecycleWriteResult::Unavailable {
        return persisted_resource_unavailable_response(
            "job_lifecycle_write_unavailable",
            "The persisted job lifecycle could not be updated.",
        );
    }
    if result == JobLifecycleWriteResult::NotFound {
        return resource_not_found_response("job_not_found", "The requested job was not found.");
    }

    (
        StatusCode::ACCEPTED,
        Json(JobLifecycleActionResponse {
            status: "accepted",
            message: format!("Job {id} has been marked as started."),
            persisted: matches!(
                result,
                JobLifecycleWriteResult::Persisted | JobLifecycleWriteResult::Replayed
            ),
            idempotent_replay: result == JobLifecycleWriteResult::Replayed,
        }),
    )
        .into_response()
}

async fn complete_job(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    headers: HeaderMap,
    Path(id): Path<String>,
) -> Response {
    if let Err(response) =
        require_job_organization_access(&state, &principal, &id, can_view_crew_route).await
    {
        return response;
    }

    let client_mutation_id = headers
        .get("x-client-mutation-id")
        .and_then(|value| value.to_str().ok());
    if client_mutation_id.is_some_and(|value| Uuid::parse_str(value).is_err()) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_client_mutation_id",
                message: "x-client-mutation-id must be a UUID".to_string(),
            }),
        )
            .into_response();
    }
    let result = state
        .jobs
        .complete_job(&id, client_mutation_id, &principal.subject)
        .await;
    if result == JobLifecycleWriteResult::IdempotencyConflict {
        return (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "job_lifecycle_idempotency_conflict",
                message: "The client mutation ID was already used for a different job action."
                    .to_string(),
            }),
        )
            .into_response();
    }
    if result == JobLifecycleWriteResult::Unavailable {
        return persisted_resource_unavailable_response(
            "job_lifecycle_write_unavailable",
            "The persisted job lifecycle could not be updated.",
        );
    }
    if result == JobLifecycleWriteResult::NotFound {
        return resource_not_found_response("job_not_found", "The requested job was not found.");
    }

    (
        StatusCode::ACCEPTED,
        Json(JobLifecycleActionResponse {
            status: "accepted",
            message: format!("Job {id} has been marked as complete."),
            persisted: matches!(
                result,
                JobLifecycleWriteResult::Persisted | JobLifecycleWriteResult::Replayed
            ),
            idempotent_replay: result == JobLifecycleWriteResult::Replayed,
        }),
    )
        .into_response()
}

async fn update_checklist_item(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    headers: HeaderMap,
    Path((id, item_id)): Path<(String, String)>,
    Json(request): Json<ChecklistItemStatusRequest>,
) -> Response {
    if let Err(response) =
        require_job_organization_access(&state, &principal, &id, can_view_crew_route).await
    {
        return response;
    }
    let client_mutation_id = headers
        .get("x-client-mutation-id")
        .and_then(|value| value.to_str().ok());
    if client_mutation_id.is_some_and(|value| Uuid::parse_str(value).is_err()) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_client_mutation_id",
                message: "x-client-mutation-id must be a UUID".to_string(),
            }),
        )
            .into_response();
    }
    let persisted = state
        .jobs
        .update_checklist_item(
            &id,
            &item_id,
            request.completed,
            client_mutation_id,
            &principal.subject,
        )
        .await;
    if persisted == ChecklistWriteResult::IdempotencyConflict {
        return (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "checklist_idempotency_conflict",
                message:
                    "The client mutation ID was already used for a different checklist change."
                        .to_string(),
            }),
        )
            .into_response();
    }
    if persisted == ChecklistWriteResult::Unavailable {
        return persisted_resource_unavailable_response(
            "checklist_write_unavailable",
            "The persisted checklist item could not be updated.",
        );
    }
    if persisted == ChecklistWriteResult::NotFound {
        return resource_not_found_response(
            "checklist_item_not_found",
            "The requested checklist item was not found.",
        );
    }
    Json(JobLifecycleActionResponse {
        status: "accepted",
        message: format!("Checklist item {item_id} was updated."),
        persisted: matches!(
            persisted,
            ChecklistWriteResult::Persisted | ChecklistWriteResult::Replayed
        ),
        idempotent_replay: persisted == ChecklistWriteResult::Replayed,
    })
    .into_response()
}

async fn create_local_photo_upload(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(id): Path<String>,
    Json(request): Json<PhotoUploadRequest>,
) -> Response {
    if let Err(response) =
        require_job_organization_access(&state, &principal, &id, can_view_crew_route).await
    {
        return response;
    }

    if let Err(message) = validate_photo_upload_request(&request) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_photo_upload",
                message,
            }),
        )
            .into_response();
    }

    match state.jobs.create_photo_upload(id, request).await {
        ResourceReadResult::Loaded(ticket) => (StatusCode::CREATED, Json(ticket)).into_response(),
        ResourceReadResult::NotFound => {
            resource_not_found_response("job_not_found", "The requested job was not found.")
        }
        ResourceReadResult::Unavailable => persisted_resource_unavailable_response(
            "photo_upload_create_unavailable",
            "The persisted photo upload could not be created.",
        ),
    }
}

async fn list_job_photos(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(id): Path<String>,
) -> Response {
    if let Err(response) =
        require_job_organization_access(&state, &principal, &id, can_view_crew_route).await
    {
        return response;
    }

    match state.jobs.list_photo_evidence(&id).await {
        ResourceReadResult::Loaded(photos) => Json(photos).into_response(),
        ResourceReadResult::NotFound => Json(Vec::<PhotoEvidence>::new()).into_response(),
        ResourceReadResult::Unavailable => persisted_resource_unavailable_response(
            "photo_evidence_unavailable",
            "The persisted photo evidence could not be loaded.",
        ),
    }
}

async fn complete_photo_upload(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(id): Path<String>,
    Json(request): Json<PhotoCompleteRequest>,
) -> Response {
    if let Err(response) =
        require_job_organization_access(&state, &principal, &id, can_view_crew_route).await
    {
        return response;
    }

    let metadata = match request.metadata() {
        Ok(metadata) => metadata,
        Err(message) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: "invalid_photo_metadata",
                    message,
                }),
            )
                .into_response();
        }
    };

    match state
        .jobs
        .complete_photo_upload(&id, &request.photo_id, metadata)
        .await
    {
        ResourceReadResult::Loaded(message) => (
            StatusCode::ACCEPTED,
            Json(ActionResponse {
                status: "accepted",
                message,
            }),
        )
            .into_response(),
        ResourceReadResult::NotFound => resource_not_found_response(
            "photo_upload_not_found",
            "The requested photo upload was not found.",
        ),
        ResourceReadResult::Unavailable => persisted_resource_unavailable_response(
            "photo_upload_completion_unavailable",
            "The persisted photo upload could not be completed.",
        ),
    }
}

impl PhotoCompleteRequest {
    fn metadata(&self) -> Result<PhotoUploadMetadata, String> {
        if self.photo_id.trim().is_empty() {
            return Err("photo_id is required".to_string());
        }
        if self.file_size_bytes.is_some_and(|value| value <= 0) {
            return Err("file_size_bytes must be greater than zero when provided".to_string());
        }
        if self.image_width_px.is_some_and(|value| value <= 0) {
            return Err("image_width_px must be greater than zero when provided".to_string());
        }
        if self.image_height_px.is_some_and(|value| value <= 0) {
            return Err("image_height_px must be greater than zero when provided".to_string());
        }

        Ok(PhotoUploadMetadata {
            file_size_bytes: self.file_size_bytes,
            image_width_px: self.image_width_px,
            image_height_px: self.image_height_px,
            metadata_source: self.has_metadata().then(|| "client_reported".to_string()),
        })
    }

    fn has_metadata(&self) -> bool {
        self.file_size_bytes.is_some()
            || self.image_width_px.is_some()
            || self.image_height_px.is_some()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::Body;
    use axum::http::{Request, StatusCode};
    use http_body_util::BodyExt;
    use serde_json::Value;
    use tower::ServiceExt;

    #[test]
    fn service_date_validation_rejects_impossible_calendar_dates() {
        assert!(valid_service_date("2026-07-19"));
        assert!(valid_service_date("2028-02-29"));
        assert!(!valid_service_date("2026-02-29"));
        assert!(!valid_service_date("2026-13-01"));
        assert!(!valid_service_date("07/19/2026"));
    }

    fn seed_state() -> Arc<AppState> {
        Arc::new(AppState {
            jobs: JobRepository::default(),
            accounts: AccountRepository::new(),
            day_plans: DayPlanRepository::default(),
            project_bids: ProjectBidRepository::default(),
            organizations: OrganizationRepository::default(),
            notifications: NotificationOutboxRepository::default(),
            operational_exceptions: OperationalExceptionRepository::default(),
            property_portfolios: PropertyPortfolioRepository::default(),
            property_crew_assignments: PropertyCrewAssignmentRepository::default(),
            property_onboarding: PropertyOnboardingRepository::default(),
            marketing_leads: MarketingLeadRepository::default(),
            marketing_events: MarketingEventRepository::default(),
            owner_acquisition: OwnerAcquisitionRepository::new(),
            customer_portal: CustomerPortalAccessRepository::default(),
            service_mobilization: ServiceMobilizationRepository::default(),
            customer_visit_communication: CustomerVisitCommunicationRepository::default(),
            customer_visit_recommendations: CustomerVisitRecommendationRepository::default(),
        })
    }

    fn seed_app() -> Router {
        app_with_state(seed_state(), "seed-local")
    }

    fn seed_app_with_frontend(frontend_dist: PathBuf) -> Router {
        app_with_runtime(
            seed_state(),
            "seed-local",
            false,
            Some(CorsLayer::permissive()),
            AuthService::disabled(),
            frontend_dist,
            false,
        )
    }

    #[tokio::test]
    async fn service_mobilization_api_validates_requests_and_fails_closed_without_persistence() {
        let app = seed_app();
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/provider-relationships/activation-1/service-release")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);

        let valid_release = serde_json::json!({
            "expected_first_visit_version": 1,
            "idempotency_key": "service-release-api-001"
        });
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/provider-relationships/activation-1/service-release")
                    .header("content-type", "application/json")
                    .body(Body::from(valid_release.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);

        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/provider-relationships/activation-1/service-release")
                    .header("content-type", "application/json")
                    .body(Body::from(
                        serde_json::json!({
                            "expected_first_visit_version": 0,
                            "idempotency_key": "service-release-api-invalid-001"
                        })
                        .to_string(),
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);

        let valid_event = serde_json::json!({
            "expected_event_version": 0,
            "status": "en_route",
            "customer_safe_reason": null,
            "next_update_message": "Your provider is on the way.",
            "window_start_epoch_seconds": null,
            "window_end_epoch_seconds": null,
            "time_zone": null,
            "idempotency_key": "service-status-api-001"
        });
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/provider-service-releases/release-1/customer-status")
                    .header("content-type", "application/json")
                    .body(Body::from(valid_event.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);

        let mut invalid_event = valid_event;
        invalid_event["status"] = serde_json::json!("completed");
        let response = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/provider-service-releases/release-1/customer-status")
                    .header("content-type", "application/json")
                    .body(Body::from(invalid_event.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn visit_question_api_validates_requests_and_fails_closed_without_persistence() {
        let app = seed_app();
        let customer_path = "/customer-portal/visits/customer_visit_1/messages";
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri(customer_path)
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);

        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/customer-portal/visits/customer_visit_1/proof")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);

        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/customer-portal/visits/customer_visit_1/recommendations")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);

        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/customer-portal/visits/customer_visit_1/recommendations/customer_recommendation_11111111111111111111111111111111")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);

        let valid_question = serde_json::json!({
            "expected_thread_version": 0,
            "topic": "timing",
            "customer_safe_body": "Will you arrive near the start of the window?",
            "idempotency_key": "customer-question-api-001"
        });
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri(customer_path)
                    .header("content-type", "application/json")
                    .body(Body::from(valid_question.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);

        let mut invalid_question = valid_question;
        invalid_question["topic"] = serde_json::json!("billing");
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri(customer_path)
                    .header("content-type", "application/json")
                    .body(Body::from(invalid_question.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);

        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/provider-customer-visit-threads")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/provider-customer-visit-threads/customer_visit_1")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);

        let response_path = "/provider-customer-visit-threads/customer_visit_1/responses";
        let valid_response = serde_json::json!({
            "expected_thread_version": 1,
            "in_reply_to_message_id": "customer_visit_message_1",
            "customer_safe_body": "We expect to arrive near the start of the window.",
            "idempotency_key": "provider-response-api-001"
        });
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri(response_path)
                    .header("content-type", "application/json")
                    .body(Body::from(valid_response.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);

        let mut invalid_response = valid_response;
        invalid_response["in_reply_to_message_id"] = serde_json::json!("");
        let response = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri(response_path)
                    .header("content-type", "application/json")
                    .body(Body::from(invalid_response.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    }

    #[test]
    fn provider_service_release_projection_omits_customer_and_organization_ids() {
        let response = ProviderServiceReleaseResponse::from(ServiceWorkReleaseRecord {
            release_id: "release-1".to_string(),
            activation_id: "activation-1".to_string(),
            organization_id: "organization-private".to_string(),
            customer_account_id: "account-private".to_string(),
            customer_property_id: "property-private".to_string(),
            first_visit_proposal_version: 2,
            service_job_id: "job-1".to_string(),
            released_at_epoch_seconds: 1_800_000_000,
            persisted: true,
        });
        let value = serde_json::to_value(response).expect("projection should serialize");
        assert_eq!(value["release_id"], "release-1");
        assert_eq!(value["service_job_id"], "job-1");
        assert!(value.get("organization_id").is_none());
        assert!(value.get("customer_account_id").is_none());
        assert!(value.get("customer_property_id").is_none());
    }

    #[tokio::test]
    async fn owner_self_service_endpoints_create_and_read_a_private_property() {
        let app = seed_app();
        let property_payload = serde_json::json!({
            "display_name": "Home",
            "address_line_1": "123 Oak Street",
            "address_line_2": null,
            "city": "Phoenix",
            "region": "AZ",
            "postal_code": "85004",
            "country_code": "US",
            "coarse_area": "Central Phoenix",
            "address_status": "owner_confirmed",
            "authority_attested": true
        });

        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/owner-properties")
                    .header("content-type", "application/json")
                    .body(Body::from(property_payload.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::CONFLICT);

        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("PUT")
                    .uri("/owner-workspace")
                    .header("content-type", "application/json")
                    .body(Body::from(r#"{"display_name":"Morgan Reyes"}"#))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let workspace: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(workspace["owner_user_id"], "local-development-user");
        assert_eq!(workspace["verified_email"], "invited@example.com");
        assert_eq!(workspace["persisted"], false);

        let invalid_payload = serde_json::json!({
            "display_name": "Home",
            "address_line_1": "123 Oak Street",
            "address_line_2": null,
            "city": "Phoenix",
            "region": "AZ",
            "postal_code": "85004",
            "country_code": "US",
            "coarse_area": null,
            "address_status": "owner_confirmed",
            "authority_attested": false
        });
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/owner-properties")
                    .header("content-type", "application/json")
                    .body(Body::from(invalid_payload.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);

        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/owner-properties/not-owned")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::NOT_FOUND);

        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/owner-properties")
                    .header("content-type", "application/json")
                    .body(Body::from(property_payload.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::CREATED);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let property: Value = serde_json::from_slice(&body).unwrap();
        let property_id = property["property_id"].as_str().unwrap();
        assert_eq!(property["owner_user_id"], "local-development-user");
        assert_eq!(property["status"], "draft");

        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri(format!("/owner-properties/{property_id}"))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);

        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/owner-properties")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let properties: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(properties.as_array().unwrap().len(), 1);

        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri(format!("/owner-properties/{property_id}/yard-brief"))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::NOT_FOUND);

        let brief_payload = serde_json::json!({
            "status": "ready",
            "yard_areas": ["Front yard", "Back yard"],
            "care_goals": ["Routine upkeep"],
            "cadence_preference": "every_two_weeks",
            "considerations": "Keep the side gate closed for the dog."
        });
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("PUT")
                    .uri(format!("/owner-properties/{property_id}/yard-brief"))
                    .header("content-type", "application/json")
                    .body(Body::from(brief_payload.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let brief: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(brief["version"], 1);
        assert_eq!(brief["status"], "ready");
        assert_eq!(brief["owner_user_id"], "local-development-user");

        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri(format!("/owner-properties/{property_id}/yard-brief"))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let brief: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(brief["version"], 1);

        let invitation_payload = serde_json::json!({
            "provider_name": "Sonoran Yard Care",
            "recipient_business_email": "dispatch@sonoranyard.example",
            "expires_in_days": 7,
            "idempotency_key": "owner-provider-api-001"
        });
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri(format!(
                        "/owner-properties/{property_id}/provider-invitations"
                    ))
                    .header("content-type", "application/json")
                    .body(Body::from(invitation_payload.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::ACCEPTED);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let invitation: Value = serde_json::from_slice(&body).unwrap();
        let invitation_id = invitation["invitation_id"].as_str().unwrap();
        assert_eq!(invitation["status"], "pending_delivery");
        assert_eq!(invitation["delivery_status"], "pending");
        assert!(invitation.get("delivery_token").is_none());
        assert!(invitation.get("token_hash").is_none());

        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri(format!(
                        "/owner-properties/{property_id}/provider-invitations"
                    ))
                    .header("content-type", "application/json")
                    .body(Body::from(invitation_payload.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);

        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri(format!(
                        "/owner-properties/{property_id}/provider-invitations/{invitation_id}"
                    ))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);

        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri(format!(
                        "/owner-properties/{property_id}/provider-invitations/{invitation_id}/revoke"
                    ))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let invitation: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(invitation["status"], "revoked");

        let media_payload = serde_json::json!({
            "file_name": "front-yard.jpg",
            "content_type": "image/jpeg",
            "shot_type": "front_yard",
            "replaces_media_id": null
        });
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri(format!("/owner-properties/{property_id}/intake-media"))
                    .header("content-type", "application/json")
                    .body(Body::from(media_payload.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::CREATED);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let upload: Value = serde_json::from_slice(&body).unwrap();
        let media_id = upload["media"]["media_id"].as_str().unwrap();
        assert_eq!(upload["media"]["status"], "pending_upload");
        assert!(upload["media"]["object_key"]
            .as_str()
            .unwrap()
            .contains("owner-intake"));

        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri(format!(
                        "/owner-properties/{property_id}/intake-media/{media_id}/complete"
                    ))
                    .header("content-type", "application/json")
                    .body(Body::from(
                        r#"{"file_size_bytes":2048,"image_width_px":1200,"image_height_px":800}"#,
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let media: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(media["status"], "ready");

        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri(format!("/owner-properties/{property_id}/intake-media"))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let media: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(media.as_array().unwrap().len(), 1);

        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("DELETE")
                    .uri(format!(
                        "/owner-properties/{property_id}/intake-media/{media_id}"
                    ))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);

        let duplicate_payload = serde_json::json!({
            "display_name": "Primary home",
            "address_line_1": " 123   OAK street ",
            "address_line_2": null,
            "city": "phoenix",
            "region": "az",
            "postal_code": "85004",
            "country_code": "us",
            "coarse_area": null,
            "address_status": "owner_confirmed",
            "authority_attested": true
        });
        let response = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/owner-properties")
                    .header("content-type", "application/json")
                    .body(Body::from(duplicate_payload.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::CONFLICT);
    }

    #[tokio::test]
    async fn provider_assessment_endpoints_validate_and_fail_closed_without_persistence() {
        let app = seed_app();
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/owner-properties/property-1/provider-assessments")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);

        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/owner-properties/property-1/provider-assessments/assessment-1/window-decision")
                    .header("content-type", "application/json")
                    .body(Body::from(
                        r#"{"action":"accept_service","expected_version":1,"idempotency_key":"assessment-window-invalid-001"}"#,
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);

        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/owner-properties/property-1/provider-assessments/assessment-1/window-decision")
                    .header("content-type", "application/json")
                    .body(Body::from(
                        r#"{"action":"confirm","expected_version":1,"idempotency_key":"assessment-window-outage-001"}"#,
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);

        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/provider-assessments")
                    .header("content-type", "application/json")
                    .body(Body::from(
                        serde_json::json!({
                            "token": "owner_provider_0000000000000000000000000000000000000000000000000000000000000000",
                            "disclosure_grant_id": "owner_disclosure_grant_0001",
                            "assessment_method": "on_site",
                            "proposed_window_start_epoch_seconds": null,
                            "proposed_window_end_epoch_seconds": null,
                            "time_zone": null,
                            "idempotency_key": "assessment-api-invalid-001"
                        })
                        .to_string(),
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);

        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/provider-assessments")
                    .header("content-type", "application/json")
                    .body(Body::from(
                        serde_json::json!({
                            "token": "owner_provider_0000000000000000000000000000000000000000000000000000000000000000",
                            "disclosure_grant_id": "owner_disclosure_grant_0001",
                            "assessment_method": "remote",
                            "proposed_window_start_epoch_seconds": null,
                            "proposed_window_end_epoch_seconds": null,
                            "time_zone": null,
                            "idempotency_key": "assessment-api-outage-001"
                        })
                        .to_string(),
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);

        let replacement_payload = serde_json::json!({
            "token": "owner_provider_0000000000000000000000000000000000000000000000000000000000000000",
            "proposed_window_start_epoch_seconds": 1_800_086_400_i64,
            "proposed_window_end_epoch_seconds": 1_800_090_000_i64,
            "time_zone": "America/Phoenix",
            "expected_version": 2,
            "idempotency_key": "assessment-window-replacement-api-001"
        });
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/provider-assessments/assessment-1/window-proposal")
                    .header("content-type", "application/json")
                    .body(Body::from(replacement_payload.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);

        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/provider-assessments/assessment-1/window-proposal")
                    .header("content-type", "application/json")
                    .body(Body::from(
                        serde_json::json!({
                            "token": "owner_provider_0000000000000000000000000000000000000000000000000000000000000000",
                            "proposed_window_start_epoch_seconds": 1_800_086_400_i64,
                            "proposed_window_end_epoch_seconds": 1_800_080_000_i64,
                            "time_zone": "America/Phoenix",
                            "expected_version": 2,
                            "idempotency_key": "assessment-window-replacement-invalid-001"
                        })
                        .to_string(),
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);

        let transition_payload = serde_json::json!({
            "token": "owner_provider_0000000000000000000000000000000000000000000000000000000000000000",
            "action": "complete",
            "expected_version": 2,
            "reason_code": null,
            "owner_visible_summary": null,
            "idempotency_key": "assessment-transition-invalid-001"
        });
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/provider-assessments/assessment-1/transitions")
                    .header("content-type", "application/json")
                    .body(Body::from(transition_payload.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);

        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/provider-assessments/assessment-1/transitions")
                    .header("content-type", "application/json")
                    .body(Body::from(
                        serde_json::json!({
                            "token": "owner_provider_0000000000000000000000000000000000000000000000000000000000000000",
                            "action": "complete",
                            "expected_version": 2,
                            "reason_code": null,
                            "owner_visible_summary": "The yard conditions were reviewed and documented.",
                            "idempotency_key": "assessment-transition-outage-001"
                        })
                        .to_string(),
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);

        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/owner-properties/property-1/provider-assessments/assessment-1/messages")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);

        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/owner-properties/property-1/provider-assessments/assessment-1/messages")
                    .header("content-type", "application/json")
                    .body(Body::from(
                        r#"{"message_kind":"owner_question","customer_safe_body":"Can you check the irrigation controller?","expected_assessment_version":1,"idempotency_key":"assessment-owner-message-outage-001"}"#,
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);

        let provider_communication_base = serde_json::json!({
            "token": "owner_provider_0000000000000000000000000000000000000000000000000000000000000000",
            "expected_assessment_version": 1
        });
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/provider-assessments/assessment-1/messages")
                    .header("content-type", "application/json")
                    .body(Body::from(
                        serde_json::json!({
                            "token": provider_communication_base["token"],
                            "message_kind": "provider_answer",
                            "customer_safe_body": "Yes, the controller can be included.",
                            "expected_assessment_version": provider_communication_base["expected_assessment_version"],
                            "idempotency_key": "assessment-provider-message-outage-001"
                        })
                        .to_string(),
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);

        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/provider-assessments/assessment-1/private-notes")
                    .header("content-type", "application/json")
                    .body(Body::from(
                        serde_json::json!({
                            "token": provider_communication_base["token"],
                            "note_kind": "scope_basis",
                            "private_body": "Internal measurement basis.",
                            "expected_assessment_version": provider_communication_base["expected_assessment_version"],
                            "idempotency_key": "assessment-provider-note-outage-001"
                        })
                        .to_string(),
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);

        let proposal_payload = serde_json::json!({
            "token": "owner_provider_0000000000000000000000000000000000000000000000000000000000000000",
            "expected_proposal_version": 0,
            "title": "Every-two-week yard care",
            "customer_summary": "Routine care based on the completed assessment.",
            "included_scope": ["Mow and edge turf"],
            "exclusions": ["Tree work above eight feet"],
            "cadence_code": "every_two_weeks",
            "cadence_detail": "One visit every two weeks",
            "arrival_policy": "Confirm the first service day with the owner.",
            "weather_policy": "Unsafe weather may move the visit.",
            "cancellation_policy": "Cancel at least 24 hours before service.",
            "proof_expectation": "Send a completion note after each visit.",
            "price_amount_minor": 12_000,
            "price_basis": "per_visit",
            "currency_code": "USD",
            "revision_note": null,
            "expires_at_epoch_seconds": 1_800_000_000_i64,
            "idempotency_key": "proposal-api-outage-001"
        });
        let mut invalid_proposal_payload = proposal_payload.clone();
        invalid_proposal_payload["currency_code"] = serde_json::json!("usd");
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/provider-assessments/assessment-1/initial-service-proposals")
                    .header("content-type", "application/json")
                    .body(Body::from(proposal_payload.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);

        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/provider-assessments/assessment-1/initial-service-proposals")
                    .header("content-type", "application/json")
                    .body(Body::from(invalid_proposal_payload.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);

        for uri in [
            "/owner-properties/property-1/initial-service-proposals",
            "/owner-properties/property-1/initial-service-proposals/proposal-1",
            "/owner-properties/property-1/initial-service-proposals/proposal-1/activation",
        ] {
            let response = app
                .clone()
                .oneshot(Request::builder().uri(uri).body(Body::empty()).unwrap())
                .await
                .unwrap();
            assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);
        }

        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/owner-properties/property-1/initial-service-proposals/proposal-1/messages")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);

        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/owner-properties/property-1/initial-service-proposals/proposal-1/messages")
                    .header("content-type", "application/json")
                    .body(Body::from(
                        r#"{"message_kind":"owner_question","customer_safe_body":"Can this include the irrigation controller?","expected_proposal_version":1,"idempotency_key":"proposal-owner-message-outage-001"}"#,
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);

        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/owner-properties/property-1/initial-service-proposals/proposal-1/messages")
                    .header("content-type", "application/json")
                    .body(Body::from(
                        r#"{"message_kind":"provider_answer","customer_safe_body":"Invalid owner kind","expected_proposal_version":1,"idempotency_key":"proposal-owner-message-invalid-001"}"#,
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);

        let provider_response_payload = serde_json::json!({
            "token": "owner_provider_0000000000000000000000000000000000000000000000000000000000000000",
            "in_reply_to_message_id": "owner_provider_proposal_message_0001",
            "customer_safe_body": "The current revision includes that change.",
            "expected_proposal_version": 2,
            "related_proposal_id": "owner_provider_proposal_0002",
            "idempotency_key": "proposal-provider-response-outage-001"
        });
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/provider-assessments/assessment-1/initial-service-proposal-responses")
                    .header("content-type", "application/json")
                    .body(Body::from(provider_response_payload.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);

        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/provider-assessments/assessment-1/initial-service-proposal-responses")
                    .header("content-type", "application/json")
                    .body(Body::from(
                        serde_json::json!({
                            "token": provider_response_payload["token"],
                            "in_reply_to_message_id": "short",
                            "customer_safe_body": "Invalid reply target.",
                            "expected_proposal_version": 2,
                            "related_proposal_id": null,
                            "idempotency_key": "proposal-provider-response-invalid-001"
                        })
                        .to_string(),
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);

        let activation_payload = serde_json::json!({
            "expected_proposal_version": 1,
            "activation_affirmation_text_version": "owner_provider_relationship_activation_v1",
            "owner_confirmed": true,
            "idempotency_key": "relationship-activation-outage-001"
        });
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/owner-properties/property-1/initial-service-proposals/proposal-1/activation")
                    .header("content-type", "application/json")
                    .body(Body::from(activation_payload.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);

        let mut invalid_activation_payload = activation_payload;
        invalid_activation_payload["owner_confirmed"] = serde_json::json!(false);
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/owner-properties/property-1/initial-service-proposals/proposal-1/activation")
                    .header("content-type", "application/json")
                    .body(Body::from(invalid_activation_payload.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);

        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/owner-properties/property-1/initial-service-proposals/proposal-1/decision")
                    .header("content-type", "application/json")
                    .body(Body::from(
                        r#"{"action":"accept","expected_proposal_version":1,"reason_code":null,"customer_safe_note":null,"affirmation_text_version":null,"idempotency_key":"proposal-decision-invalid-001"}"#,
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);

        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/owner-properties/property-1/provider-relationships/activation-1/first-visit")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);

        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/customer-portal/visits")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);
        let body: Value = serde_json::from_slice(
            &response
                .into_body()
                .collect()
                .await
                .expect("customer portal outage body should collect")
                .to_bytes(),
        )
        .expect("customer portal outage body should be JSON");
        assert_eq!(body["error"], "customer_portal_visits_unavailable");

        let first_visit_decision_payload = serde_json::json!({
            "expected_window_version": 1,
            "action": "confirm",
            "customer_safe_note": null,
            "confirmation_affirmation_text_version": "owner_provider_first_visit_confirmation_v1",
            "idempotency_key": "first-visit-decision-api-outage-001"
        });
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/owner-properties/property-1/provider-relationships/activation-1/first-visit/decision")
                    .header("content-type", "application/json")
                    .body(Body::from(first_visit_decision_payload.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);

        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/owner-properties/property-1/provider-relationships/activation-1/first-visit/decision")
                    .header("content-type", "application/json")
                    .body(Body::from(
                        serde_json::json!({
                            "expected_window_version": 1,
                            "action": "request_change",
                            "customer_safe_note": null,
                            "confirmation_affirmation_text_version": null,
                            "idempotency_key": "first-visit-decision-api-invalid-001"
                        })
                        .to_string(),
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);

        let provider_first_visit_token =
            "owner_provider_0000000000000000000000000000000000000000000000000000000000000000";
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/provider-relationships/activation-1/first-visit/status")
                    .header("content-type", "application/json")
                    .body(Body::from(
                        serde_json::json!({ "token": provider_first_visit_token }).to_string(),
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);

        let provider_first_visit_payload = serde_json::json!({
            "token": provider_first_visit_token,
            "expected_series_version": 0,
            "window_start_epoch_seconds": 1_800_000_000_i64,
            "window_end_epoch_seconds": 1_800_007_200_i64,
            "time_zone": "America/Phoenix",
            "customer_safe_arrival_note": "Please unlock the side gate.",
            "idempotency_key": "first-visit-proposal-api-outage-001"
        });
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/provider-relationships/activation-1/first-visit/proposal")
                    .header("content-type", "application/json")
                    .body(Body::from(provider_first_visit_payload.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);

        let mut invalid_provider_first_visit_payload = provider_first_visit_payload;
        invalid_provider_first_visit_payload["window_end_epoch_seconds"] =
            serde_json::json!(1_800_020_000_i64);
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/provider-relationships/activation-1/first-visit/proposal")
                    .header("content-type", "application/json")
                    .body(Body::from(invalid_provider_first_visit_payload.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);

        let response = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/owner-properties/property-1/initial-service-proposals/proposal-1/decision")
                    .header("content-type", "application/json")
                    .body(Body::from(
                        r#"{"action":"accept","expected_proposal_version":1,"reason_code":null,"customer_safe_note":null,"affirmation_text_version":"initial_service_proposal_acceptance_v1","idempotency_key":"proposal-decision-outage-001"}"#,
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);
    }

    #[tokio::test]
    async fn day_plan_organization_access_allows_seed_owner_membership() {
        let state = seed_state();
        let principal = AuthPrincipal {
            subject: "local-development-user".to_string(),
            username: "Local Developer".to_string(),
            verified_email: Some("invited@example.com".to_string()),
            claim_roles: vec![AccessRole::OrganizationOwner],
            roles: vec![AccessRole::OrganizationOwner],
        };

        assert!(require_day_plan_organization_access(
            &state,
            &principal,
            "day_plan_2026_06_15_crew_1001",
            can_manage_schedule,
        )
        .await
        .is_ok());
    }

    #[tokio::test]
    async fn day_plan_organization_access_rejects_missing_membership() {
        let state = seed_state();
        let principal = AuthPrincipal {
            subject: "other-user".to_string(),
            username: "Other User".to_string(),
            verified_email: None,
            claim_roles: vec![AccessRole::Manager],
            roles: vec![AccessRole::Manager],
        };

        let response = require_day_plan_organization_access(
            &state,
            &principal,
            "day_plan_2026_06_15_crew_1001",
            can_manage_schedule,
        )
        .await
        .unwrap_err();

        assert_eq!(response.status(), StatusCode::FORBIDDEN);
    }

    #[tokio::test]
    async fn crew_organization_access_returns_not_found_for_unknown_seed_crew() {
        let state = seed_state();
        let principal = AuthPrincipal {
            subject: "local-development-user".to_string(),
            username: "Local Developer".to_string(),
            verified_email: Some("invited@example.com".to_string()),
            claim_roles: vec![AccessRole::OrganizationOwner],
            roles: vec![AccessRole::OrganizationOwner],
        };

        let response = require_crew_organization_access(
            &state,
            &principal,
            "crew_unknown",
            can_view_crew_route,
        )
        .await
        .unwrap_err();

        assert_eq!(response.status(), StatusCode::NOT_FOUND);
    }

    #[tokio::test]
    async fn day_plan_organization_access_fails_closed_when_persistence_is_unavailable() {
        let mut state = (*seed_state()).clone();
        let pool = sqlx::postgres::PgPoolOptions::new()
            .acquire_timeout(std::time::Duration::from_millis(100))
            .connect_lazy("postgres://grover:grover@127.0.0.1:1/grover_landscaping")
            .expect("unavailable test pool URL should be valid");
        state.day_plans = DayPlanRepository::from_pool(pool);
        let principal = AuthPrincipal {
            subject: "local-development-user".to_string(),
            username: "Local Developer".to_string(),
            verified_email: Some("invited@example.com".to_string()),
            claim_roles: vec![AccessRole::OrganizationOwner],
            roles: vec![AccessRole::OrganizationOwner],
        };

        let response = require_day_plan_organization_access(
            &state,
            &principal,
            "day_plan_2026_06_15_crew_1001",
            can_manage_schedule,
        )
        .await
        .unwrap_err();

        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);
    }

    #[tokio::test]
    async fn active_organization_scope_distinguishes_loaded_empty_and_unavailable() {
        let principal = AuthPrincipal {
            subject: "local-development-user".to_string(),
            username: "Local Developer".to_string(),
            verified_email: Some("invited@example.com".to_string()),
            claim_roles: vec![AccessRole::OrganizationOwner],
            roles: vec![AccessRole::OrganizationOwner],
        };
        let state = seed_state();

        assert_eq!(
            principal_active_organization_ids(&state, &principal)
                .await
                .expect("seed membership scope should load"),
            vec!["org_demo_landscaping".to_string()]
        );
        assert!(
            principal_active_organization_ids_for_role(&state, &principal, |_| false)
                .await
                .expect("role-filtered seed membership scope should load")
                .is_empty()
        );

        let mut unavailable_state = (*state).clone();
        let pool = sqlx::postgres::PgPoolOptions::new()
            .acquire_timeout(std::time::Duration::from_millis(100))
            .connect_lazy("postgres://grover:grover@127.0.0.1:1/grover_landscaping")
            .expect("unavailable test pool URL should be valid");
        unavailable_state.organizations = OrganizationRepository::from_pool(pool);

        let response = principal_active_organization_ids(&unavailable_state, &principal)
            .await
            .expect_err("unavailable membership storage should fail closed");
        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);

        let authorization_response = require_organization_membership(
            &unavailable_state,
            &principal,
            "org_demo_landscaping",
            can_manage_schedule,
        )
        .await
        .expect_err("unavailable membership verification should fail closed");
        assert_eq!(
            authorization_response.status(),
            StatusCode::SERVICE_UNAVAILABLE
        );
    }

    #[tokio::test]
    async fn customer_account_collection_fails_closed_when_memberships_are_unavailable() {
        let mut state = (*seed_state()).clone();
        let pool = sqlx::postgres::PgPoolOptions::new()
            .acquire_timeout(std::time::Duration::from_millis(100))
            .connect_lazy("postgres://grover:grover@127.0.0.1:1/grover_landscaping")
            .expect("unavailable test pool URL should be valid");
        state.organizations = OrganizationRepository::from_pool(pool);

        let response = app_with_state(Arc::new(state), "seed-local")
            .oneshot(
                Request::builder()
                    .uri("/customer-accounts")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json["error"], "organization_memberships_unavailable");
    }

    #[tokio::test]
    async fn job_and_report_access_fail_closed_when_persistence_is_unavailable() {
        let mut state = (*seed_state()).clone();
        let pool = sqlx::postgres::PgPoolOptions::new()
            .acquire_timeout(std::time::Duration::from_millis(100))
            .connect_lazy("postgres://grover:grover@127.0.0.1:1/grover_landscaping")
            .expect("unavailable test pool URL should be valid");
        state.jobs = JobRepository::from_pool(pool);
        let principal = AuthPrincipal {
            subject: "local-development-user".to_string(),
            username: "Local Developer".to_string(),
            verified_email: Some("invited@example.com".to_string()),
            claim_roles: vec![AccessRole::OrganizationOwner],
            roles: vec![AccessRole::OrganizationOwner],
        };

        let job_response =
            require_job_organization_access(&state, &principal, "job_1001", can_view_crew_route)
                .await
                .unwrap_err();
        let report_response = require_completion_report_organization_access(
            &state,
            &principal,
            "report_job_1001",
            can_review_completion_report,
        )
        .await
        .unwrap_err();

        assert_eq!(job_response.status(), StatusCode::SERVICE_UNAVAILABLE);
        assert_eq!(report_response.status(), StatusCode::SERVICE_UNAVAILABLE);
    }

    #[tokio::test]
    async fn job_organization_access_rejects_missing_membership() {
        let state = seed_state();
        let principal = AuthPrincipal {
            subject: "other-user".to_string(),
            username: "Other User".to_string(),
            verified_email: None,
            claim_roles: vec![AccessRole::CrewMember],
            roles: vec![AccessRole::CrewMember],
        };

        let response =
            require_job_organization_access(&state, &principal, "job_1001", can_view_crew_route)
                .await
                .unwrap_err();

        assert_eq!(response.status(), StatusCode::FORBIDDEN);
    }

    #[tokio::test]
    async fn job_organization_access_returns_not_found_for_unknown_seed_job() {
        let state = seed_state();
        let principal = AuthPrincipal {
            subject: "local-development-user".to_string(),
            username: "Local Developer".to_string(),
            verified_email: Some("invited@example.com".to_string()),
            claim_roles: vec![AccessRole::OrganizationOwner],
            roles: vec![AccessRole::OrganizationOwner],
        };

        let response =
            require_job_organization_access(&state, &principal, "job_unknown", can_view_crew_route)
                .await
                .unwrap_err();

        assert_eq!(response.status(), StatusCode::NOT_FOUND);
    }

    #[tokio::test]
    async fn completion_report_organization_access_uses_seed_job_boundary() {
        let state = seed_state();
        let principal = AuthPrincipal {
            subject: "local-development-user".to_string(),
            username: "Local Developer".to_string(),
            verified_email: Some("invited@example.com".to_string()),
            claim_roles: vec![AccessRole::OrganizationOwner],
            roles: vec![AccessRole::OrganizationOwner],
        };

        assert!(require_completion_report_organization_access(
            &state,
            &principal,
            "report_job_1001",
            can_review_completion_report,
        )
        .await
        .is_ok());
    }

    #[tokio::test]
    async fn health_returns_ok() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .uri("/health")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();

        assert_eq!(json["status"], "ok");
        assert_eq!(json["service"], "grover-landscaping-api");
    }

    #[tokio::test]
    async fn marketing_lead_endpoint_validates_and_accepts_public_requests() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method(Method::POST)
                    .uri("/marketing-leads")
                    .header(CONTENT_TYPE, "application/json")
                    .body(Body::from(
                        serde_json::json!({
                            "full_name": "Jordan Rivera",
                            "email": "jordan@example.com",
                            "company_name": "Rivera Landscape",
                            "persona": "landscaping_company",
                            "team_size": "6-20",
                            "intent": "demo",
                            "message": "We manage three crews.",
                            "source": "google",
                            "medium": "cpc",
                            "campaign": "phoenix_launch",
                            "landing_path": "/?utm_source=google",
                            "consent_to_contact": true,
                            "website": ""
                        })
                        .to_string(),
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::CREATED);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json["status"], "received");
        assert_eq!(json["persisted"], false);
        assert!(json["id"].as_str().unwrap().starts_with("lead_"));

        let invalid_response = seed_app()
            .oneshot(
                Request::builder()
                    .method(Method::POST)
                    .uri("/marketing-leads")
                    .header(CONTENT_TYPE, "application/json")
                    .body(Body::from(
                        serde_json::json!({
                            "full_name": "J",
                            "email": "invalid",
                            "persona": "unknown",
                            "intent": "demo",
                            "landing_path": "/",
                            "consent_to_contact": false
                        })
                        .to_string(),
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(invalid_response.status(), StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn marketing_lead_inbox_fails_closed_without_persistence() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .uri("/marketing-leads")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json["error"], "marketing_leads_unavailable");
    }

    #[tokio::test]
    async fn marketing_lead_update_fails_closed_without_persistence() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method(Method::PUT)
                    .uri("/marketing-leads/lead_missing")
                    .header(CONTENT_TYPE, "application/json")
                    .body(Body::from(
                        serde_json::json!({
                            "status": "contacted",
                            "assigned_to": "support@example.com",
                            "note": "Called the prospect."
                        })
                        .to_string(),
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json["error"], "marketing_lead_update_unavailable");
    }

    #[tokio::test]
    async fn marketing_event_endpoint_accepts_only_bounded_funnel_events() {
        let event = serde_json::json!({
            "session_id": "ms_123456789",
            "event_name": "tour_step_selected",
            "persona": "property_manager",
            "detail": "care",
            "source": "newsletter",
            "landing_path": "/for-property-managers"
        });
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method(Method::POST)
                    .uri("/marketing-events")
                    .header(CONTENT_TYPE, "application/json")
                    .body(Body::from(event.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::ACCEPTED);

        let invalid = serde_json::json!({
            "session_id": "ms_123456789",
            "event_name": "fingerprint",
            "persona": "property_manager",
            "landing_path": "/"
        });
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method(Method::POST)
                    .uri("/marketing-events")
                    .header(CONTENT_TYPE, "application/json")
                    .body(Body::from(invalid.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn marketing_dashboard_returns_an_empty_local_funnel() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method(Method::GET)
                    .uri("/marketing-dashboard")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json["window_days"], 30);
        assert_eq!(json["totals"]["page_views"], 0);
    }

    #[tokio::test]
    async fn readiness_returns_ok_without_required_database() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .uri("/health/ready")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json["persistence"], "seed-local");
    }

    #[tokio::test]
    async fn local_auth_config_and_health_remain_public() {
        let config_response = seed_app()
            .oneshot(
                Request::builder()
                    .uri("/auth/config")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(config_response.status(), StatusCode::OK);
        let body = config_response
            .into_body()
            .collect()
            .await
            .unwrap()
            .to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json["mode"], "disabled");

        let health_response = seed_app()
            .oneshot(
                Request::builder()
                    .uri("/health/ready")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(health_response.status(), StatusCode::OK);
    }

    #[tokio::test]
    async fn my_access_returns_local_development_membership() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .uri("/me/access")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();

        assert_eq!(json["user_id"], "local-development-user");
        assert_eq!(
            json["memberships"][0]["organization_id"],
            "org_demo_landscaping"
        );
        assert_eq!(
            json["memberships"][0]["organization_type"],
            "yard_care_company"
        );
    }

    #[tokio::test]
    async fn organization_bootstrap_rejects_an_existing_owner_membership() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/organizations/bootstrap")
                    .header("content-type", "application/json")
                    .body(Body::from(
                        r#"{"display_name":"Grover Landscaping","organization_type":"yard_care_company"}"#,
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::CONFLICT);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json["error"], "organization_bootstrap_not_available");
    }

    #[tokio::test]
    async fn organization_profile_endpoints_return_and_update_local_profile() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .uri("/organizations/org_demo_landscaping")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);

        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("PUT")
                    .uri("/organizations/org_demo_landscaping")
                    .header("content-type", "application/json")
                    .body(Body::from(
                        r#"{"display_name":"Grover Property Services","organization_type":"property_management_company","time_zone":"America/Phoenix","service_area_label":"Phoenix metro","default_daily_stop_capacity":12}"#,
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json["display_name"], "Grover Property Services");
        assert_eq!(json["organization_type"], "property_management_company");
        assert_eq!(json["persisted"], false);
    }

    #[tokio::test]
    async fn first_owner_setup_progress_endpoint_returns_local_milestones() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .uri("/organizations/org_demo_landscaping/setup-progress")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json["organization_id"], "org_demo_landscaping");
        assert_eq!(json["organization_profile_complete"], true);
        assert_eq!(json["team_invitation_created"], true);
        assert_eq!(json["crew_configured"], true);
        assert_eq!(json["first_route_published"], true);
        assert_eq!(json["completed_steps"], 4);
        assert_eq!(json["total_steps"], 4);
        assert_eq!(json["persisted"], false);
    }

    #[tokio::test]
    async fn organization_crew_endpoint_creates_local_crew() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/organizations/org_demo_landscaping/crews")
                    .header("content-type", "application/json")
                    .body(Body::from(r#"{"name":"South Route"}"#))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::CREATED);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json["name"], "South Route");
        assert_eq!(json["organization_id"], "org_demo_landscaping");
        assert_eq!(json["persisted"], false);
    }

    #[tokio::test]
    async fn organization_crew_endpoint_updates_local_crew_lifecycle() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("PUT")
                    .uri("/organizations/org_demo_landscaping/crews/crew_1001")
                    .header("content-type", "application/json")
                    .body(Body::from(
                        r#"{"name":"North Operations Crew","status":"inactive"}"#,
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json["name"], "North Operations Crew");
        assert_eq!(json["status"], "inactive");
        assert_eq!(json["persisted"], false);
    }

    #[tokio::test]
    async fn organization_crew_endpoint_updates_local_dispatch_hierarchy() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("PUT")
                    .uri("/organizations/org_demo_landscaping/crews/crew_1001")
                    .header("content-type", "application/json")
                    .body(Body::from(
                        r#"{
                            "name":"North Operations Crew",
                            "status":"active",
                            "branch_id":"branch_north",
                            "territory_id":"territory_north"
                        }"#,
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json["branch_id"], "branch_north");
        assert_eq!(json["territory_id"], "territory_north");
    }

    #[tokio::test]
    async fn organization_crew_endpoint_rejects_partial_dispatch_hierarchy() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("PUT")
                    .uri("/organizations/org_demo_landscaping/crews/crew_1001")
                    .header("content-type", "application/json")
                    .body(Body::from(
                        r#"{
                            "name":"North Operations Crew",
                            "status":"active",
                            "branch_id":"branch_north"
                        }"#,
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn organization_invitation_endpoint_returns_local_pending_invite() {
        let request_body = serde_json::json!({
            "invitee_email": "new.manager@example.com",
            "role": "manager",
            "scope_type": "organization",
            "scope_id": "org_demo_landscaping"
        });

        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/organizations/org_demo_landscaping/invitations")
                    .header("content-type", "application/json")
                    .body(Body::from(request_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::CREATED);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();

        assert_eq!(json["organization_id"], "org_demo_landscaping");
        assert_eq!(json["invitee_email"], "new.manager@example.com");
        assert_eq!(json["role"], "manager");
        assert_eq!(json["status"], "pending");
        assert_eq!(json["persisted"], false);
    }

    #[tokio::test]
    async fn organization_invitation_list_endpoint_returns_local_history() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri("/organizations/org_demo_landscaping/invitations")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json, serde_json::json!([]));
    }

    #[tokio::test]
    async fn organization_invitation_revoke_endpoint_requires_pending_persistence() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("DELETE")
                    .uri("/organizations/org_demo_landscaping/invitations/invitation_missing")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::NOT_FOUND);
    }

    #[tokio::test]
    async fn organization_invitation_reissue_endpoint_validates_and_requires_persistence() {
        let invalid = seed_app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/organizations/org_demo_landscaping/invitations/invitation_missing/reissue")
                    .header("content-type", "application/json")
                    .body(Body::from(r#"{"expires_at":"not-a-date"}"#))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(invalid.status(), StatusCode::BAD_REQUEST);

        let missing = seed_app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/organizations/org_demo_landscaping/invitations/invitation_missing/reissue")
                    .header("content-type", "application/json")
                    .body(Body::from(
                        r#"{"expires_at":"2099-08-01T12:00:00.000Z"}"#,
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(missing.status(), StatusCode::NOT_FOUND);
    }

    #[tokio::test]
    async fn organization_invitation_endpoint_rejects_invalid_payloads() {
        let request_body = serde_json::json!({
            "invitee_email": "not-an-email",
            "role": "manager"
        });

        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/organizations/org_demo_landscaping/invitations")
                    .header("content-type", "application/json")
                    .body(Body::from(request_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::BAD_REQUEST);

        let invalid_expiration = serde_json::json!({
            "invitee_email": "new.manager@example.com",
            "role": "manager",
            "expires_at": "2026-02-30T12:00:00.000Z"
        });
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/organizations/org_demo_landscaping/invitations")
                    .header("content-type", "application/json")
                    .body(Body::from(invalid_expiration.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn organization_invitation_endpoint_rejects_other_organizations() {
        let request_body = serde_json::json!({
            "invitee_email": "new.manager@example.com",
            "role": "manager"
        });

        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/organizations/org_other/invitations")
                    .header("content-type", "application/json")
                    .body(Body::from(request_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::FORBIDDEN);
    }

    #[tokio::test]
    async fn organization_invitation_accept_endpoint_returns_active_membership() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/organization-invitations/invite_token_org_demo_landscaping_manager/accept")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();

        assert_eq!(json["invitation"]["status"], "accepted");
        assert_eq!(
            json["membership"]["organization_id"],
            "org_demo_landscaping"
        );
        assert_eq!(json["membership"]["status"], "active");
    }

    #[tokio::test]
    async fn organization_membership_role_endpoint_guards_last_owner() {
        let request_body = serde_json::json!({
            "role": "manager"
        });

        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("PUT")
                    .uri("/organizations/org_demo_landscaping/memberships/membership_local_owner_demo/role")
                    .header("content-type", "application/json")
                    .body(Body::from(request_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::CONFLICT);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();

        assert_eq!(json["error"], "last_organization_owner");
    }

    #[tokio::test]
    async fn organization_membership_list_endpoint_returns_local_owner() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri("/organizations/org_demo_landscaping/memberships")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json[0]["id"], "membership_local_owner_demo");
        assert_eq!(json[0]["role"], "OrganizationOwner");
    }

    #[tokio::test]
    async fn organization_membership_profile_endpoint_updates_display_name() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("PUT")
                    .uri("/organizations/org_demo_landscaping/memberships/membership_local_owner_demo/profile")
                    .header("content-type", "application/json")
                    .body(Body::from(r#"{"display_name":"Jordan Grover"}"#))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json["id"], "membership_local_owner_demo");
        assert_eq!(json["display_name"], "Jordan Grover");
    }

    #[tokio::test]
    async fn organization_membership_status_endpoint_guards_last_owner() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("PUT")
                    .uri("/organizations/org_demo_landscaping/memberships/membership_local_owner_demo/status")
                    .header("content-type", "application/json")
                    .body(Body::from(r#"{"status":"suspended"}"#))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::CONFLICT);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json["error"], "last_organization_owner");
    }

    #[tokio::test]
    async fn organization_team_activity_endpoint_returns_local_history() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri("/organizations/org_demo_landscaping/team-activity")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json, serde_json::json!([]));
    }

    #[tokio::test]
    async fn organization_team_activity_endpoint_rejects_invalid_limits() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri("/organizations/org_demo_landscaping/team-activity?limit=101")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json["error"], "invalid_team_activity_filter");
    }

    #[tokio::test]
    async fn organization_team_activity_endpoint_rejects_unknown_move_scopes() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri("/organizations/org_demo_landscaping/team-activity?move_scope=interstate")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json["error"], "invalid_team_activity_filter");
    }

    #[tokio::test]
    async fn organization_team_activity_endpoint_rejects_blank_directional_searches() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri("/organizations/org_demo_landscaping/team-activity?source=%20")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json["error"], "invalid_team_activity_filter");
    }

    #[tokio::test]
    async fn organization_team_activity_endpoint_rejects_unknown_events() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri("/organizations/org_demo_landscaping/team-activity?event_kind=unknown")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn operational_activity_endpoint_returns_local_history() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri("/operational-activity")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        let status = response.status();
        let body = response.into_body().collect().await.unwrap().to_bytes();
        assert_eq!(status, StatusCode::OK, "{}", String::from_utf8_lossy(&body));
        let json: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json, serde_json::json!([]));

        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri("/operational-activity?event_kind=unknown&limit=101")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn property_portfolio_list_endpoint_returns_seeded_local_portfolios() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .uri("/accounts/acct_1001/property-portfolios")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();

        assert_eq!(json.as_array().unwrap().len(), 1);
        assert_eq!(json[0]["account_id"], "acct_1001");
        assert_eq!(json[0]["organization_id"], "org_demo_landscaping");
        assert_eq!(json[0]["property_count"], 1);
        assert_eq!(json[0]["persisted"], false);
    }

    #[tokio::test]
    async fn customer_property_portfolio_endpoint_returns_grouped_seed_properties() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .uri("/accounts/acct_1001/customer-property-portfolio")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();

        assert_eq!(json["account_id"], "acct_1001");
        assert_eq!(json["portfolios"].as_array().unwrap().len(), 1);
        assert_eq!(json["portfolios"][0]["property_count"], 1);
        assert_eq!(
            json["portfolios"][0]["properties"][0]["id"],
            "property_1001"
        );
        assert!(json["ungrouped_properties"].as_array().unwrap().is_empty());
        assert_eq!(json["persisted"], false);
    }

    #[tokio::test]
    async fn customer_property_portfolio_endpoint_returns_ungrouped_seed_properties() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .uri("/accounts/acct_1002/customer-property-portfolio")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();

        assert_eq!(json["account_id"], "acct_1002");
        assert!(json["portfolios"].as_array().unwrap().is_empty());
        assert_eq!(json["ungrouped_properties"].as_array().unwrap().len(), 1);
        assert_eq!(json["ungrouped_properties"][0]["id"], "property_1002");
        assert_eq!(
            json["ungrouped_properties"][0]["address"],
            "456 Maple Avenue"
        );
    }

    #[tokio::test]
    async fn customer_property_status_endpoint_archives_local_property() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("PUT")
                    .uri("/customer-accounts/acct_1001/properties/property_1001")
                    .header("content-type", "application/json")
                    .body(Body::from(r#"{"status":"archived"}"#))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json["property_id"], "property_1001");
        assert_eq!(json["status"], "archived");
        assert_eq!(json["persisted"], false);
    }

    #[tokio::test]
    async fn customer_property_status_endpoint_rejects_internal_statuses() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("PUT")
                    .uri("/customer-accounts/acct_1001/properties/property_1001")
                    .header("content-type", "application/json")
                    .body(Body::from(r#"{"status":"blocked"}"#))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn customer_property_activation_readiness_endpoint_returns_seed_checks() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .uri(
                        "/customer-accounts/acct_1001/properties/property_1001/activation-readiness",
                    )
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json["property_id"], "property_1001");
        assert_eq!(json["profile_ready"], true);
        assert_eq!(json["crew_ready"], true);
        assert_eq!(json["ready"], true);
        assert_eq!(json["persisted"], false);
    }

    #[tokio::test]
    async fn customer_account_onboarding_progress_endpoint_returns_seed_progress() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .uri("/customer-accounts/acct_1001/onboarding-progress")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json["account_id"], "acct_1001");
        assert_eq!(json["customer_details_ready"], true);
        assert_eq!(json["property_count"], 1);
        assert_eq!(json["service_ready_property_count"], 1);
        assert_eq!(json["active_property_count"], 1);
        assert!(json["properties_needing_attention"]
            .as_array()
            .unwrap()
            .is_empty());
        assert_eq!(json["complete"], true);
        assert_eq!(json["persisted"], false);
    }

    #[tokio::test]
    async fn customer_property_identity_endpoint_updates_local_property() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("PUT")
                    .uri("/customer-accounts/acct_1001/properties/property_1001/identity")
                    .header("content-type", "application/json")
                    .body(Body::from(
                        r#"{"display_name":"Front Yard","service_address":"123 Oak Street"}"#,
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json["display_name"], "Front Yard");
        assert_eq!(json["service_address"], "123 Oak Street");
        assert_eq!(json["persisted"], false);
    }

    #[tokio::test]
    async fn customer_property_identity_endpoint_rejects_invalid_fields() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("PUT")
                    .uri("/customer-accounts/acct_1001/properties/property_1001/identity")
                    .header("content-type", "application/json")
                    .body(Body::from(
                        r#"{"display_name":" ","service_address":"123 Oak Street"}"#,
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn property_completion_reports_endpoint_returns_empty_local_history() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .uri("/properties/property_1001/completion-reports")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();

        assert!(json.as_array().unwrap().is_empty());
    }

    #[tokio::test]
    async fn create_property_portfolio_endpoint_returns_local_response() {
        let request_body = serde_json::json!({
            "account_id": "acct_1001",
            "organization_id": "org_demo_landscaping",
            "display_name": "Sample Owner Homes",
            "portfolio_type": "individual_owner"
        });

        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/property-portfolios")
                    .header("content-type", "application/json")
                    .body(Body::from(request_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::CREATED);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();

        assert_eq!(
            json["id"],
            "portfolio_acct_1001_org_demo_landscaping_sample_owner_homes"
        );
        assert_eq!(json["property_count"], 0);
        assert_eq!(json["persisted"], false);
    }

    #[tokio::test]
    async fn create_property_portfolio_endpoint_rejects_invalid_payloads() {
        let request_body = serde_json::json!({
            "account_id": "acct_1001",
            "organization_id": "org_demo_landscaping",
            "display_name": " ",
            "portfolio_type": "individual_owner"
        });

        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/property-portfolios")
                    .header("content-type", "application/json")
                    .body(Body::from(request_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn create_property_portfolio_endpoint_rejects_other_organizations() {
        let request_body = serde_json::json!({
            "account_id": "acct_1001",
            "organization_id": "org_other",
            "display_name": "Other organization homes",
            "portfolio_type": "individual_owner"
        });

        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/property-portfolios")
                    .header("content-type", "application/json")
                    .body(Body::from(request_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::FORBIDDEN);
    }

    #[tokio::test]
    async fn add_property_to_portfolio_endpoint_returns_local_response() {
        let request_body = serde_json::json!({
            "property_id": "property_1001",
            "organization_id": "org_demo_landscaping"
        });

        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/property-portfolios/portfolio_1001/properties")
                    .header("content-type", "application/json")
                    .body(Body::from(request_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::CREATED);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();

        assert_eq!(json["portfolio_id"], "portfolio_1001");
        assert_eq!(json["property_id"], "property_1001");
        assert_eq!(json["organization_id"], "org_demo_landscaping");
        assert_eq!(json["persisted"], false);
    }

    #[tokio::test]
    async fn assign_property_crew_endpoint_returns_local_response() {
        let request_body = serde_json::json!({
            "crew_id": "crew_1001",
            "organization_id": "org_demo_landscaping",
            "assigned_at": "2026-06-15T08:00:00Z"
        });

        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/properties/property_1001/crew-assignments")
                    .header("content-type", "application/json")
                    .body(Body::from(request_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::CREATED);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();

        assert_eq!(json["property_id"], "property_1001");
        assert_eq!(json["crew_id"], "crew_1001");
        assert_eq!(json["organization_id"], "org_demo_landscaping");
        assert_eq!(json["active"], true);
        assert_eq!(json["persisted"], false);
    }

    #[tokio::test]
    async fn assign_property_crew_endpoint_rejects_invalid_payloads() {
        let request_body = serde_json::json!({
            "crew_id": " ",
            "organization_id": "org_demo_landscaping"
        });

        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/properties/property_1001/crew-assignments")
                    .header("content-type", "application/json")
                    .body(Body::from(request_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn assign_property_crew_endpoint_rejects_other_organizations() {
        let request_body = serde_json::json!({
            "crew_id": "crew_1001",
            "organization_id": "org_other"
        });

        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/properties/property_1001/crew-assignments")
                    .header("content-type", "application/json")
                    .body(Body::from(request_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::FORBIDDEN);
    }

    #[tokio::test]
    async fn property_crew_assignment_history_endpoint_returns_seeded_local_assignments() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .uri("/properties/property_1001/crew-assignments")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();

        assert_eq!(json.as_array().unwrap().len(), 1);
        assert_eq!(json[0]["property_id"], "property_1001");
        assert_eq!(json[0]["crew_id"], "crew_1001");
        assert_eq!(json[0]["persisted"], false);
    }

    #[tokio::test]
    async fn active_crew_property_assignments_endpoint_returns_seeded_local_assignments() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .uri("/crews/crew_1001/property-assignments/active")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();

        assert_eq!(json.as_array().unwrap().len(), 1);
        assert_eq!(json[0]["property_id"], "property_1001");
        assert_eq!(json[0]["active"], true);
    }

    #[tokio::test]
    async fn property_onboarding_endpoint_returns_seed_profile() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .uri("/properties/property_1001/onboarding")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();

        assert_eq!(json["property_id"], "property_1001");
        assert_eq!(json["account_id"], "acct_1001");
        assert_eq!(json["service_address"], "123 Oak Street");
        assert_eq!(json["onboarding_status"], "active");
        assert_eq!(json["persisted"], false);
    }

    #[tokio::test]
    async fn property_onboarding_endpoint_returns_local_saved_profile() {
        let request_body = serde_json::json!({
            "account_id": "acct_1001",
            "organization_id": "org_demo_landscaping",
            "service_address": "123 Oak Street",
            "access_notes": "Use side gate.",
            "billing_contact_name": "Sample Customer",
            "billing_contact_email": "billing@example.com",
            "notification_contact_name": "Sample Customer",
            "notification_email": "notify@example.com",
            "notification_phone": "+16025550123",
            "onboarding_status": "active"
        });

        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("PUT")
                    .uri("/properties/property_1001/onboarding")
                    .header("content-type", "application/json")
                    .body(Body::from(request_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::CREATED);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();

        assert_eq!(json["property_id"], "property_1001");
        assert_eq!(json["billing_contact_email"], "billing@example.com");
        assert_eq!(json["notification_phone"], "+16025550123");
        assert_eq!(json["persisted"], false);
    }

    #[tokio::test]
    async fn property_onboarding_endpoint_rejects_invalid_payloads() {
        let request_body = serde_json::json!({
            "account_id": "acct_1001",
            "organization_id": "org_demo_landscaping",
            "service_address": " ",
            "access_notes": "Use side gate.",
            "billing_contact_name": "Sample Customer",
            "billing_contact_email": "billing@example.com",
            "notification_contact_name": "Sample Customer",
            "notification_email": "notify@example.com",
            "notification_phone": "+16025550123",
            "onboarding_status": "active"
        });

        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("PUT")
                    .uri("/properties/property_1001/onboarding")
                    .header("content-type", "application/json")
                    .body(Body::from(request_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn property_onboarding_endpoint_rejects_other_organizations() {
        let request_body = serde_json::json!({
            "account_id": "acct_1001",
            "organization_id": "org_other",
            "service_address": "123 Oak Street",
            "access_notes": "Use side gate.",
            "billing_contact_name": "Sample Customer",
            "billing_contact_email": "billing@example.com",
            "notification_contact_name": "Sample Customer",
            "notification_email": "notify@example.com",
            "notification_phone": "+16025550123",
            "onboarding_status": "active"
        });

        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("PUT")
                    .uri("/properties/property_1001/onboarding")
                    .header("content-type", "application/json")
                    .body(Body::from(request_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::FORBIDDEN);
    }

    #[tokio::test]
    async fn production_router_serves_public_sign_in_frontend() {
        let frontend_dist =
            std::env::temp_dir().join(format!("grover-frontend-test-{}", std::process::id()));
        std::fs::create_dir_all(&frontend_dist).unwrap();
        std::fs::write(
            frontend_dist.join("index.html"),
            "<!doctype html><title>Grover production</title>",
        )
        .unwrap();

        let response = seed_app_with_frontend(frontend_dist.clone())
            .oneshot(Request::builder().uri("/").body(Body::empty()).unwrap())
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        assert!(String::from_utf8_lossy(&body).contains("Grover production"));

        let shared_bid_response = seed_app_with_frontend(frontend_dist.clone())
            .oneshot(
                Request::builder()
                    .uri("/bid-review/customer-token")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(shared_bid_response.status(), StatusCode::OK);
        let shared_bid_body = shared_bid_response
            .into_body()
            .collect()
            .await
            .unwrap()
            .to_bytes();
        assert!(String::from_utf8_lossy(&shared_bid_body).contains("Grover production"));

        let shared_report_response = seed_app_with_frontend(frontend_dist.clone())
            .oneshot(
                Request::builder()
                    .uri("/report-view/customer-token")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(shared_report_response.status(), StatusCode::OK);
        let shared_report_body = shared_report_response
            .into_body()
            .collect()
            .await
            .unwrap()
            .to_bytes();
        assert!(String::from_utf8_lossy(&shared_report_body).contains("Grover production"));

        std::fs::remove_dir_all(frontend_dist).unwrap();
    }

    #[tokio::test]
    async fn jobs_endpoint_returns_seed_jobs() {
        let response = seed_app()
            .oneshot(Request::builder().uri("/jobs").body(Body::empty()).unwrap())
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();

        assert!(json.as_array().unwrap().len() >= 2);
        assert_eq!(json[0]["before_photos"], 0);
    }

    #[tokio::test]
    async fn branch_and_territory_endpoints_fail_closed_without_persistence() {
        for (uri, error_code) in [
            (
                "/organization-branches",
                "organization_branches_unavailable",
            ),
            ("/service-territories", "service_territories_unavailable"),
        ] {
            let response = seed_app()
                .oneshot(Request::builder().uri(uri).body(Body::empty()).unwrap())
                .await
                .unwrap();
            let status = response.status();
            let body = response.into_body().collect().await.unwrap().to_bytes();
            assert_eq!(
                status,
                StatusCode::SERVICE_UNAVAILABLE,
                "{}",
                String::from_utf8_lossy(&body)
            );
            let json: Value = serde_json::from_slice(&body).unwrap();
            assert_eq!(json["error"], error_code);
        }
    }

    #[tokio::test]
    async fn archived_account_lifecycle_fails_closed_without_persistence() {
        let app = seed_app();
        let requests = [
            (
                "archived list",
                Request::builder()
                    .uri("/customer-accounts/archived")
                    .body(Body::empty())
                    .unwrap(),
                "archived_customer_accounts_unavailable",
            ),
            (
                "archive",
                Request::builder()
                    .method(Method::DELETE)
                    .uri("/customer-accounts/acct_1001")
                    .body(Body::empty())
                    .unwrap(),
                "customer_account_not_archived",
            ),
            (
                "reactivate",
                Request::builder()
                    .method(Method::POST)
                    .uri("/customer-accounts/acct_1001/reactivate")
                    .body(Body::empty())
                    .unwrap(),
                "customer_account_not_reactivated",
            ),
            (
                "relationship update",
                Request::builder()
                    .method(Method::PUT)
                    .uri("/customer-accounts/acct_1001/relationship")
                    .header(CONTENT_TYPE, "application/json")
                    .body(Body::from(r#"{"relationship_type":"owner"}"#))
                    .unwrap(),
                "customer_account_relationship_not_updated",
            ),
        ];

        for (case, request, error_code) in requests {
            let response = app.clone().oneshot(request).await.unwrap();
            let status = response.status();
            let body = response.into_body().collect().await.unwrap().to_bytes();
            assert_eq!(
                status,
                StatusCode::SERVICE_UNAVAILABLE,
                "{case}: {}",
                String::from_utf8_lossy(&body)
            );
            let json: Value = serde_json::from_slice(&body).unwrap();
            assert_eq!(json["error"], error_code);
        }
    }

    #[tokio::test]
    async fn dispatch_assignment_endpoint_rejects_invalid_calendar_date() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("PUT")
                    .uri("/jobs/job_1001/dispatch-assignment")
                    .header("content-type", "application/json")
                    .body(Body::from(
                        r#"{"crew_id":"crew_1001","scheduled_date":"2026-02-29","customer_notification_required":true}"#,
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let error: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(error["error"], "invalid_scheduled_date");
    }

    #[tokio::test]
    async fn dispatch_notification_endpoint_rejects_unknown_channel() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/jobs/job_1001/dispatch-customer-notification")
                    .header("content-type", "application/json")
                    .body(Body::from(r#"{"channel":"chat","note":"Sent"}"#))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let error: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(error["error"], "invalid_notification_channel");
    }

    #[tokio::test]
    async fn account_endpoint_returns_status_for_job() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .uri("/jobs/job_1002/account")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();

        assert_eq!(json["account_id"], "acct_1002");
        assert_eq!(json["payment_status"], "paid");
    }

    #[tokio::test]
    async fn job_add_ons_endpoint_returns_empty_seed_fallback() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .uri("/jobs/job_1001/add-ons")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();
        assert!(json.as_array().unwrap().is_empty());
    }

    #[tokio::test]
    async fn job_add_on_status_endpoint_rejects_unknown_status() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("PUT")
                    .uri("/jobs/job_1001/add-ons/add_on_1001/status")
                    .header("content-type", "application/json")
                    .body(Body::from(r#"{"status":"deferred"}"#))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn completion_report_endpoint_returns_job_account_and_photo_state() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .uri("/jobs/job_1001/report")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();

        assert_eq!(json["job_id"], "job_1001");
        assert_eq!(json["report_id"], "report_job_1001");
        assert_eq!(json["report_status"], "draft");
        assert_eq!(json["persisted"], false);
        assert_eq!(json["ready_for_customer"], false);
        assert_eq!(json["checklist_progress"], 0);
        assert_eq!(json["job"]["customer_name"], "Sample Customer");
        assert!(json["completed_add_ons"].as_array().unwrap().is_empty());
        assert_eq!(json["account"]["account_id"], "acct_1001");
        assert_eq!(json["photo_evidence"].as_array().unwrap().len(), 0);
    }

    #[tokio::test]
    async fn completion_report_list_endpoint_returns_current_job_reports() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .uri("/completion-reports")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();
        let reports = json.as_array().unwrap();

        assert_eq!(reports.len(), 2);
        assert_eq!(reports[0]["report_id"], "report_job_1001");
        assert_eq!(reports[0]["job"]["customer_name"], "Sample Customer");
        assert_eq!(reports[1]["report_id"], "report_job_1002");
    }

    #[test]
    fn completion_report_queue_visibility_uses_active_membership_organizations() {
        let visible_organization_ids = HashSet::from(["org_demo_landscaping"]);

        assert!(completion_report_job_is_visible_to_membership(
            "org_demo_landscaping",
            &visible_organization_ids
        ));
        assert!(!completion_report_job_is_visible_to_membership(
            "org_other_landscaping",
            &visible_organization_ids
        ));
    }

    #[tokio::test]
    async fn completion_report_list_endpoint_filters_by_status_and_readiness() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .uri("/completion-reports?status=draft&readiness=blocked")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();
        let reports = json.as_array().unwrap();

        assert_eq!(reports.len(), 2);
        assert!(reports
            .iter()
            .all(|report| report["report_status"] == "draft"));
        assert!(reports
            .iter()
            .all(|report| report["ready_for_customer"] == false));
    }

    #[tokio::test]
    async fn completion_report_list_endpoint_filters_ready_reports() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .uri("/completion-reports?readiness=ready")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();

        assert!(json.as_array().unwrap().is_empty());
    }

    #[tokio::test]
    async fn completion_report_list_endpoint_filters_by_readiness_blocker() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .uri("/completion-reports?readiness_blocker=before_photos")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();
        let reports = json.as_array().unwrap();

        assert_eq!(reports.len(), 1);
        assert_eq!(reports[0]["job_id"], "job_1001");
        assert_eq!(reports[0]["before_photos"], 0);
    }

    #[tokio::test]
    async fn completion_report_list_endpoint_filters_by_route_stop_blocker() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .uri("/completion-reports?readiness_blocker=route_stop")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let reports: Value = serde_json::from_slice(&body).unwrap();
        assert!(!reports.as_array().unwrap().is_empty());
        assert!(reports.as_array().unwrap().iter().all(|report| {
            report["readiness_blockers"]
                .as_array()
                .unwrap()
                .iter()
                .any(|blocker| blocker == "route_stop")
        }));
    }

    #[tokio::test]
    async fn completion_report_list_endpoint_filters_by_crew_id() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .uri("/completion-reports?crew_id=crew_1001")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();

        assert_eq!(json.as_array().unwrap().len(), 2);
        assert!(json
            .as_array()
            .unwrap()
            .iter()
            .all(|report| report["job"]["assigned_crew_id"] == "crew_1001"));
    }

    #[tokio::test]
    async fn completion_report_list_endpoint_filters_by_organization_and_crew() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .uri(
                        "/completion-reports?organization_id=org_demo_landscaping&crew_id=crew_1001",
                    )
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let reports: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(reports.as_array().unwrap().len(), 2);
        assert!(reports.as_array().unwrap().iter().all(|report| {
            report["job"]["organization_id"] == "org_demo_landscaping"
                && report["job"]["assigned_crew_id"] == "crew_1001"
        }));
    }

    #[tokio::test]
    async fn completion_report_list_endpoint_filters_out_other_crews() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .uri("/completion-reports?crew_id=crew_other")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();

        assert!(json.as_array().unwrap().is_empty());
    }

    #[tokio::test]
    async fn completion_report_list_endpoint_filters_by_customer_property_and_date() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .uri(
                        "/completion-reports?customer=demo&property=maple&scheduled_from=2026-06-15&scheduled_to=2026-06-15",
                    )
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();
        let reports = json.as_array().unwrap();

        assert_eq!(reports.len(), 1);
        assert_eq!(reports[0]["job"]["customer_name"], "Demo Property Owner");
        assert_eq!(reports[0]["job"]["property_address"], "456 Maple Avenue");
    }

    #[tokio::test]
    async fn completion_report_list_endpoint_rejects_invalid_date_filters() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .uri("/completion-reports?scheduled_from=2026-06-16&scheduled_to=2026-06-15")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::BAD_REQUEST);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json["error"], "invalid_completion_report_filter");
    }

    #[tokio::test]
    async fn completion_report_list_endpoint_rejects_unknown_readiness_blocker() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .uri("/completion-reports?readiness_blocker=account")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::BAD_REQUEST);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json["error"], "invalid_completion_report_filter");
    }

    #[tokio::test]
    async fn completion_report_list_endpoint_rejects_blank_crew_filters() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .uri("/completion-reports?crew_id=%20%20")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::BAD_REQUEST);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json["error"], "invalid_completion_report_filter");
    }

    #[tokio::test]
    async fn completion_report_list_endpoint_rejects_unknown_filters() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .uri("/completion-reports?status=archived")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::BAD_REQUEST);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json["error"], "invalid_completion_report_filter");
    }

    #[tokio::test]
    async fn notification_history_endpoint_fails_closed_without_persistence() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .uri(
                        "/notifications?entity_type=organization_invitation&status=resolved&limit=10",
                    )
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json["error"], "notification_history_unavailable");
    }

    #[tokio::test]
    async fn notification_history_endpoint_rejects_unknown_filters() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .uri("/notifications?entity_type=job&status=queued")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::BAD_REQUEST);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json["error"], "invalid_notification_history_filter");
    }

    #[tokio::test]
    async fn operational_exception_endpoints_validate_and_fail_closed_without_persistence() {
        let invalid_filter = seed_app()
            .oneshot(
                Request::builder()
                    .uri("/operational-exceptions?category=traffic")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        let invalid_filter_status = invalid_filter.status();
        let invalid_filter_body = invalid_filter
            .into_body()
            .collect()
            .await
            .unwrap()
            .to_bytes();
        assert_eq!(
            invalid_filter_status,
            StatusCode::BAD_REQUEST,
            "{}",
            String::from_utf8_lossy(&invalid_filter_body)
        );

        let unavailable_list = seed_app()
            .oneshot(
                Request::builder()
                    .uri("/operational-exceptions?status=open&limit=10")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(unavailable_list.status(), StatusCode::SERVICE_UNAVAILABLE);

        let invalid_create = seed_app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/operational-exceptions")
                    .header("content-type", "application/json")
                    .body(Body::from(
                        r#"{"organization_id":"org_demo_landscaping","category":"traffic","priority":"high","title":"Blocked road"}"#,
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(invalid_create.status(), StatusCode::BAD_REQUEST);

        let unavailable_create = seed_app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/operational-exceptions")
                    .header("content-type", "application/json")
                    .body(Body::from(
                        r#"{"organization_id":"org_demo_landscaping","category":"weather","priority":"high","title":"Lightning delay","affected_resource_type":"route","affected_resource_id":"day_plan_1001"}"#,
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(unavailable_create.status(), StatusCode::SERVICE_UNAVAILABLE);

        let inaccessible_create = seed_app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/operational-exceptions")
                    .header("content-type", "application/json")
                    .body(Body::from(
                        r#"{"organization_id":"org_other","category":"weather","priority":"high","title":"Lightning delay"}"#,
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(inaccessible_create.status(), StatusCode::NOT_FOUND);

        let invalid_update = seed_app()
            .oneshot(
                Request::builder()
                    .method("PUT")
                    .uri("/operational-exceptions/exception_1001")
                    .header("content-type", "application/json")
                    .body(Body::from(
                        r#"{"action":"resolve","expected_updated_at":"2026-07-21 12:00:00+00"}"#,
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(invalid_update.status(), StatusCode::BAD_REQUEST);

        let unavailable_update = seed_app()
            .oneshot(
                Request::builder()
                    .method("PUT")
                    .uri("/operational-exceptions/exception_1001")
                    .header("content-type", "application/json")
                    .body(Body::from(
                        r#"{"action":"start","expected_updated_at":"2026-07-21 12:00:00+00"}"#,
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(unavailable_update.status(), StatusCode::SERVICE_UNAVAILABLE);
    }

    #[tokio::test]
    async fn photo_processing_history_endpoint_fails_closed_without_persistence() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .uri("/photo-processing-jobs?task_type=thumbnail_generation&status=failed&limit=10")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json["error"], "photo_processing_history_unavailable");
    }

    #[tokio::test]
    async fn photo_processing_history_endpoint_rejects_unknown_filters() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .uri("/photo-processing-jobs?task_type=metadata&status=queued")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::BAD_REQUEST);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json["error"], "invalid_photo_processing_history_filter");
    }

    #[tokio::test]
    async fn photo_erasure_deletion_history_endpoint_fails_closed_without_persistence() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .uri("/photo-erasure-deletion-jobs?status=dead_letter&limit=10")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json["error"], "photo_erasure_deletion_history_unavailable");
    }

    #[tokio::test]
    async fn photo_erasure_deletion_retry_endpoint_requires_persistence() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/photo-erasure-deletion-jobs/photo_erasure_deletion_1001/retry")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json["error"], "photo_erasure_deletion_retry_unavailable");
    }

    #[tokio::test]
    async fn photo_processing_retry_endpoint_requires_persistence() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/photo-processing-jobs/photo_processing_1001/retry")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json["error"], "photo_processing_retry_unavailable");
    }

    #[tokio::test]
    async fn photo_processing_resolve_endpoint_requires_persistence() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/photo-processing-jobs/photo_processing_1001/resolve")
                    .header("content-type", "application/json")
                    .body(Body::from(r#"{}"#))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json["error"], "photo_processing_resolution_unavailable");
    }

    #[tokio::test]
    async fn customer_privacy_export_endpoint_requires_persistence() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .uri("/accounts/acct_1001/privacy-export")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json["error"], "customer_privacy_export_unavailable");
    }

    #[tokio::test]
    async fn customer_photo_erasure_endpoint_validates_reason() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/accounts/acct_1001/photo-erasure")
                    .header("content-type", "application/json")
                    .body(Body::from(r#"{"reason":"   "}"#))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::BAD_REQUEST);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json["error"], "invalid_customer_photo_erasure_reason");
    }

    #[tokio::test]
    async fn customer_photo_erasure_endpoint_requires_persistence() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/accounts/acct_1001/photo-erasure")
                    .header("content-type", "application/json")
                    .body(Body::from(
                        r#"{"reason":"Customer requested removal of retained photo evidence."}"#,
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json["error"], "customer_photo_erasure_unavailable");
    }

    #[tokio::test]
    async fn notification_retry_endpoint_requires_persistence() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/notifications/notification_1001/retry")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json["error"], "notification_retry_unavailable");
    }

    #[tokio::test]
    async fn notification_resolve_endpoint_requires_persistence() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/notifications/notification_1001/resolve")
                    .header("content-type", "application/json")
                    .body(Body::from(r#"{}"#))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json["error"], "notification_resolution_unavailable");
    }

    #[tokio::test]
    async fn notification_resolve_endpoint_rejects_large_reason() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/notifications/notification_1001/resolve")
                    .header("content-type", "application/json")
                    .body(Body::from(format!(
                        r#"{{"reason":"{}"}}"#,
                        "x".repeat(1001)
                    )))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::BAD_REQUEST);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json["error"], "invalid_notification_resolution_reason");
    }

    #[tokio::test]
    async fn shared_completion_report_endpoint_returns_not_found_without_persisted_token() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .uri("/reports/missing_share_token")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::NOT_FOUND);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();

        assert_eq!(json["error"], "shared_report_not_found");
    }

    #[tokio::test]
    async fn completion_report_review_requires_persistence() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/completion-reports/report_job_1001/review")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();

        assert_eq!(json["error"], "completion_report_persistence_unavailable");
    }

    #[tokio::test]
    async fn completion_report_request_changes_requires_persistence() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/completion-reports/report_job_1001/request-changes")
                    .header("content-type", "application/json")
                    .body(Body::from(r#"{"reason":"Need clearer after photo."}"#))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();

        assert_eq!(json["error"], "completion_report_persistence_unavailable");
    }

    #[tokio::test]
    async fn completion_report_change_reason_rejects_large_payloads() {
        let reason = "x".repeat(1001);
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/completion-reports/report_job_1001/request-changes")
                    .header("content-type", "application/json")
                    .body(Body::from(format!(r#"{{"reason":"{reason}"}}"#)))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::BAD_REQUEST);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();

        assert_eq!(json["error"], "invalid_completion_report_change_reason");
    }

    #[tokio::test]
    async fn completion_report_resubmit_requires_persistence() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/completion-reports/report_job_1001/resubmit")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();

        assert_eq!(json["error"], "completion_report_persistence_unavailable");
    }

    #[tokio::test]
    async fn completion_report_delivery_requires_persistence() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/completion-reports/report_job_1001/deliver")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();

        assert_eq!(json["error"], "completion_report_persistence_unavailable");
    }

    #[tokio::test]
    async fn completion_report_delivery_notification_validates_recipient() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/completion-reports/report_job_1001/delivery-notifications")
                    .header("content-type", "application/json")
                    .body(Body::from(
                        r#"{"channel":"sms","recipient":"not-a-phone-number"}"#,
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::BAD_REQUEST);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();

        assert_eq!(json["error"], "invalid_notification_recipient");
    }

    #[tokio::test]
    async fn completion_report_delivery_notification_requires_persistence() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/completion-reports/report_job_1001/delivery-notifications")
                    .header("content-type", "application/json")
                    .body(Body::from(
                        r#"{"channel":"email","recipient":"customer@example.com"}"#,
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();

        assert_eq!(json["error"], "completion_report_notification_unavailable");
    }

    #[tokio::test]
    async fn day_plan_endpoint_returns_seed_route() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .uri("/crews/crew_1001/day-plan/today")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();

        assert_eq!(json["crew_id"], "crew_1001");
        assert_eq!(json["stops"].as_array().unwrap().len(), 2);
        assert_eq!(json["stops"][0]["stop_status"], "pending");
    }

    #[tokio::test]
    async fn create_day_plan_endpoint_returns_local_draft_response() {
        let request_body = serde_json::json!({
            "crew_id": "crew_1001",
            "service_date": "2026-06-16"
        });

        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/day-plans")
                    .header("content-type", "application/json")
                    .body(Body::from(request_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::CREATED);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();

        assert_eq!(json["id"], "day_plan_2026_06_16_crew_1001");
        assert_eq!(json["status"], "draft");
        assert_eq!(json["route_status"], "manual");
        assert_eq!(json["time_zone"], "America/Phoenix");
        assert_eq!(json["service_area_label"], "Phoenix metro");
        assert_eq!(json["stop_capacity"], 12);
        assert_eq!(json["persisted"], false);
    }

    #[tokio::test]
    async fn publish_day_plan_endpoint_returns_local_published_response() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/day-plans/day_plan_2026_06_16_crew_1001/publish")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();

        assert_eq!(json["id"], "day_plan_2026_06_16_crew_1001");
        assert_eq!(json["crew_id"], "crew_1001");
        assert_eq!(json["service_date"], "2026-06-16");
        assert_eq!(json["status"], "published");
        assert_eq!(json["persisted"], false);
    }

    #[tokio::test]
    async fn create_amendment_endpoint_returns_local_submitted_response() {
        let request_body = serde_json::json!({
            "amendment_type": "add_service",
            "requested_by_crew_id": "crew_1001",
            "stop_id": "stop_1001",
            "service": {
                "id": "service_sprinkler_repair",
                "name": "Sprinkler repair",
                "description": "Replace a broken sprinkler head",
                "default_duration_minutes": 30,
                "default_price_cents": 8500,
                "requires_manager_approval": true
            },
            "note": "Customer requested repair while the crew was onsite."
        });

        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/day-plans/day_plan_2026_06_15_crew_1001/amendments")
                    .header("content-type", "application/json")
                    .body(Body::from(request_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::CREATED);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json["amendment_type"], "add_service");
        assert_eq!(json["status"], "submitted");
        assert_eq!(json["requires_bid"], true);
        assert_eq!(json["persisted"], false);
    }

    #[tokio::test]
    async fn create_amendment_endpoint_rejects_missing_stop_context() {
        let request_body = serde_json::json!({
            "amendment_type": "remove_stop",
            "requested_by_crew_id": "crew_1001",
            "note": "Cannot access the property."
        });

        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/day-plans/day_plan_2026_06_15_crew_1001/amendments")
                    .header("content-type", "application/json")
                    .body(Body::from(request_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn list_amendments_endpoint_returns_empty_local_fallback() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .uri("/day-plans/day_plan_2026_06_15_crew_1001/amendments")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json.as_array().unwrap().len(), 0);
    }

    #[tokio::test]
    async fn review_amendment_endpoint_returns_local_bid_review_response() {
        let request_body = serde_json::json!({
            "decision": "send_to_bid_review",
            "manager_note": "Prepare an itemized estimate."
        });

        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("PUT")
                    .uri(
                        "/day-plans/day_plan_2026_06_15_crew_1001/amendments/amendment_1001/review",
                    )
                    .header("content-type", "application/json")
                    .body(Body::from(request_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json["status"], "bid_review");
        assert_eq!(json["manager_note"], "Prepare an itemized estimate.");
        assert_eq!(json["persisted"], false);
    }

    #[tokio::test]
    async fn review_amendment_endpoint_rejects_unknown_decision() {
        let request_body = serde_json::json!({ "decision": "defer" });

        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("PUT")
                    .uri(
                        "/day-plans/day_plan_2026_06_15_crew_1001/amendments/amendment_1001/review",
                    )
                    .header("content-type", "application/json")
                    .body(Body::from(request_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn save_project_bid_endpoint_returns_local_draft() {
        let request_body = serde_json::json!({
            "customer_message": "We found additional sprinkler work during service.",
            "line_items": [{
                "service_id": "service_sprinkler_repair",
                "service_name": "Sprinkler repair",
                "quantity": 2,
                "unit_price_cents": 8500
            }]
        });

        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/day-plans/day_plan_2026_06_15_crew_1001/amendments/amendment_1001/bid")
                    .header("content-type", "application/json")
                    .body(Body::from(request_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::CREATED);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json["status"], "draft");
        assert_eq!(json["total_cents"], 17000);
        assert_eq!(json["persisted"], false);
    }

    #[tokio::test]
    async fn save_project_bid_endpoint_rejects_empty_line_items() {
        let request_body = serde_json::json!({ "line_items": [] });

        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/day-plans/day_plan_2026_06_15_crew_1001/amendments/amendment_1001/bid")
                    .header("content-type", "application/json")
                    .body(Body::from(request_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn list_project_bids_endpoint_returns_empty_local_fallback() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .uri("/day-plans/day_plan_2026_06_15_crew_1001/bids")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();
        assert!(json.as_array().unwrap().is_empty());
    }

    #[tokio::test]
    async fn customer_project_bids_endpoint_returns_empty_local_fallback() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .uri("/accounts/acct_1001/bids")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();
        assert!(json.as_array().unwrap().is_empty());
    }

    #[tokio::test]
    async fn send_project_bid_requires_persistence() {
        let request_body = serde_json::json!({
            "channel": "email",
            "recipient": "customer@example.com",
            "idempotency_key": "project-bid-send-outage-001"
        });
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/day-plans/day_plan_2026_06_15_crew_1001/bids/bid_1001/send")
                    .header("content-type", "application/json")
                    .body(Body::from(request_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);
    }

    #[tokio::test]
    async fn send_project_bid_rejects_invalid_sms_recipients() {
        let request_body = serde_json::json!({
            "channel": "sms",
            "recipient": "602-555-0123",
            "idempotency_key": "project-bid-send-invalid-001"
        });
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/day-plans/day_plan_2026_06_15_crew_1001/bids/bid_1001/send")
                    .header("content-type", "application/json")
                    .body(Body::from(request_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn revise_project_bid_requires_persistence() {
        let app = seed_app();
        let body = serde_json::json!({
            "expected_proposal_version": 1,
            "customer_message": "Revised scope",
            "line_items": [{
                "service_id": "service_1",
                "service_name": "Revised repair",
                "quantity": 1,
                "unit_price_cents": 9000
            }],
            "channel": "email",
            "recipient": "customer@example.com",
            "idempotency_key": "project-bid-revision-outage-001"
        });
        let response = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/day-plans/day_plan_2026_06_15_crew_1001/bids/bid_1001/revise")
                    .header("content-type", "application/json")
                    .body(Body::from(body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);
    }

    #[tokio::test]
    async fn revise_project_bid_rejects_a_missing_expected_version() {
        let app = seed_app();
        let body = serde_json::json!({
            "expected_proposal_version": 0,
            "customer_message": "Revised scope",
            "line_items": [{
                "service_id": "service_1",
                "service_name": "Revised repair",
                "quantity": 1,
                "unit_price_cents": 9000
            }],
            "channel": "email",
            "recipient": "customer@example.com",
            "idempotency_key": "project-bid-revision-invalid-001"
        });
        let response = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/day-plans/day_plan_2026_06_15_crew_1001/bids/bid_1001/revise")
                    .header("content-type", "application/json")
                    .body(Body::from(body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn revoke_project_bid_fails_closed_without_persistence() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/day-plans/day_plan_2026_06_15_crew_1001/bids/bid_1001/revoke")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);
    }

    #[tokio::test]
    async fn convert_project_bid_fails_closed_without_persistence() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/day-plans/day_plan_2026_06_15_crew_1001/bids/bid_1001/convert")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);
    }

    #[tokio::test]
    async fn shared_project_bid_fails_closed_without_persistence() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .uri("/shared-bids/missing-token")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);
    }

    #[tokio::test]
    async fn shared_project_bid_rejects_unknown_decisions() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/shared-bids/missing-token/decision")
                    .header("content-type", "application/json")
                    .body(Body::from(r#"{"decision":"defer"}"#))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn assign_day_plan_stop_endpoint_returns_local_response() {
        let request_body = serde_json::json!({
            "job_id": "job_1003",
            "estimated_drive_minutes": 5,
            "estimated_service_minutes": 30
        });

        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/day-plans/day_plan_2026_06_16_crew_1001/stops")
                    .header("content-type", "application/json")
                    .body(Body::from(request_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::CREATED);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();

        assert_eq!(json["day_plan_id"], "day_plan_2026_06_16_crew_1001");
        assert_eq!(
            json["stop_id"],
            "stop_day_plan_2026_06_16_crew_1001_job_1003"
        );
        assert_eq!(json["job_id"], "job_1003");
        assert_eq!(json["persisted"], false);
    }

    #[tokio::test]
    async fn remove_day_plan_stop_endpoint_returns_local_response() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("DELETE")
                    .uri("/day-plans/day_plan_2026_06_16_crew_1001/stops/stop_job_1003")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();

        assert_eq!(json["day_plan_id"], "day_plan_2026_06_16_crew_1001");
        assert_eq!(json["stop_id"], "stop_job_1003");
        assert_eq!(json["persisted"], false);
    }

    #[tokio::test]
    async fn reorder_day_plan_stops_endpoint_returns_local_response() {
        let request_body = serde_json::json!({
            "stop_ids": ["stop_job_1003", "stop_job_1001"]
        });

        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("PUT")
                    .uri("/day-plans/day_plan_2026_06_16_crew_1001/stops/order")
                    .header("content-type", "application/json")
                    .body(Body::from(request_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();

        assert_eq!(json["day_plan_id"], "day_plan_2026_06_16_crew_1001");
        assert_eq!(json["stop_ids"][0], "stop_job_1003");
        assert_eq!(json["persisted"], false);
    }

    #[tokio::test]
    async fn stop_progress_endpoint_returns_local_response() {
        let request_body = serde_json::json!({ "status": "in_progress" });

        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/day-plans/day_plan_2026_06_15_crew_1001/stops/stop_1001/status")
                    .header("content-type", "application/json")
                    .body(Body::from(request_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();

        assert_eq!(json["day_plan_id"], "day_plan_2026_06_15_crew_1001");
        assert_eq!(json["stop_id"], "stop_1001");
        assert_eq!(json["status"], "in_progress");
        assert_eq!(json["persisted"], false);
    }

    #[tokio::test]
    async fn stop_progress_endpoint_rejects_invalid_status() {
        let request_body = serde_json::json!({ "status": "done" });

        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/day-plans/day_plan_2026_06_15_crew_1001/stops/stop_1001/status")
                    .header("content-type", "application/json")
                    .body(Body::from(request_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::BAD_REQUEST);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();

        assert_eq!(json["error"], "invalid_stop_progress_status");
    }

    #[tokio::test]
    async fn photo_presign_returns_local_placeholder_upload() {
        let request_body = serde_json::json!({
            "file_name": "before.jpg",
            "content_type": "image/jpeg",
            "photo_type": "before"
        });

        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/jobs/job_1001/photos/presign")
                    .header("content-type", "application/json")
                    .body(Body::from(request_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::CREATED);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();

        assert_eq!(json["status"], "created");
        assert_eq!(json["job_id"], "job_1001");
        assert_eq!(json["photo_type"], "before");
        assert_eq!(json["file_name"], "before.jpg");
        assert_eq!(json["content_type"], "image/jpeg");
        assert_eq!(json["upload_mode"], "local-placeholder");
        assert!(json["upload_url"].as_str().unwrap().starts_with("local://"));
    }

    #[tokio::test]
    async fn photo_presign_rejects_invalid_upload_requests() {
        let unsupported_content_type = serde_json::json!({
            "file_name": "front-yard.pdf",
            "content_type": "application/pdf",
            "photo_type": "before"
        });
        let unsupported_photo_type = serde_json::json!({
            "file_name": "front-yard.jpg",
            "content_type": "image/jpeg",
            "photo_type": "receipt"
        });

        for request_body in [unsupported_content_type, unsupported_photo_type] {
            let response = seed_app()
                .oneshot(
                    Request::builder()
                        .method("POST")
                        .uri("/jobs/job_1001/photos/presign")
                        .header("content-type", "application/json")
                        .body(Body::from(request_body.to_string()))
                        .unwrap(),
                )
                .await
                .unwrap();

            assert_eq!(response.status(), StatusCode::BAD_REQUEST);

            let body = response.into_body().collect().await.unwrap().to_bytes();
            let json: Value = serde_json::from_slice(&body).unwrap();

            assert_eq!(json["error"], "invalid_photo_upload");
        }
    }

    #[tokio::test]
    async fn photo_complete_rejects_invalid_metadata() {
        let request_body = serde_json::json!({
            "photo_id": "photo_job_1001_before_1",
            "file_size_bytes": 0,
            "image_width_px": 1600,
            "image_height_px": 900
        });

        let response = seed_app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/jobs/job_1001/photos/complete")
                    .header("content-type", "application/json")
                    .body(Body::from(request_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::BAD_REQUEST);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();

        assert_eq!(json["error"], "invalid_photo_metadata");
    }

    #[tokio::test]
    async fn photo_evidence_endpoint_returns_empty_seed_list() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .uri("/jobs/job_1001/photos")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();

        assert_eq!(json.as_array().unwrap().len(), 0);
    }
}
