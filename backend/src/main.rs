mod accounts;
#[allow(dead_code)]
mod completion_reports;
#[allow(dead_code)]
mod day_plans;
mod db;
mod notifications;
mod photo_storage;
mod project_bids;
mod stop_progress;

use accounts::AccountRepository;
use axum::{
    extract::{Extension, Path, Query, State},
    http::{
        header::{AUTHORIZATION, CONTENT_TYPE},
        HeaderName, HeaderValue, Method, StatusCode,
    },
    middleware,
    response::{IntoResponse, Response},
    routing::{delete, get, post, put},
    Json, Router,
};
use completion_reports::{
    apply_completion_report_persistence, attach_delivered_snapshot_metadata,
    build_completion_report, completion_report_is_active_manager_queue_status,
    is_valid_completion_report_lifecycle_status, CompletionReportActionResult,
    CompletionReportDeliveryNotificationResult, CompletionReportResponse,
};
use day_plans::{
    validate_amendment_request, validate_amendment_review, AssignDayPlanStopRequest,
    CreateDayPlanAmendmentRequest, CreateDayPlanRequest, DayPlanRepository,
    ReorderDayPlanStopsRequest, ReviewDayPlanAmendmentRequest,
};
use db::{DatabaseConfig, JobAddOnStatusUpdate, JobRepository};
use grover_landscaping_api::{
    access_control::{
        can_deliver_completion_report, can_manage_crew_assignments, can_manage_organization,
        can_manage_property_portfolios, can_manage_schedule, can_review_completion_report,
        can_submit_completion_report, can_view_crew_route, can_view_customer_property_portfolios,
        AccessRole,
    },
    auth::{require_api_auth, AuthPrincipal, AuthService},
    organizations::{
        validate_create_invitation_request, CreateOrganizationInvitationRequest,
        OrganizationRepository, UpdateOrganizationMembershipRoleRequest,
    },
    property_crew_assignments::{
        is_valid_assign_property_crew_request, AssignPropertyCrewRequest,
        PropertyCrewAssignmentRepository, PropertyCrewAssignmentResponse,
    },
    property_onboarding::{
        validate_property_onboarding_request, PropertyOnboardingRepository,
        UpsertPropertyOnboardingRequest,
    },
    property_portfolio_requests::{
        is_valid_add_property_to_portfolio_request, is_valid_create_property_portfolio_request,
        AddPropertyToPortfolioRequest, CreatePropertyPortfolioRequest,
    },
    property_portfolios::PropertyPortfolioRepository,
};
use notifications::{
    start_notification_dispatcher, validate_notification_recipient, NotificationDispatcherConfig,
    NotificationHistoryFilter, NotificationOutboxRepository, NotificationResolveResult,
    NotificationRetryResult,
};
use project_bids::{
    customer_project_bid_response, validate_project_bid_decision, validate_project_bid_request,
    validate_send_project_bid_request, CreateProjectBidRequest, ProjectBidDecisionRequest,
    ProjectBidRepository, SendProjectBidRequest,
};
use serde::{Deserialize, Serialize};
use std::{collections::HashSet, io, net::SocketAddr, path::PathBuf, sync::Arc};
use stop_progress::{
    is_valid_stop_progress_status, local_stop_progress_response, persisted_stop_progress_response,
    StopProgressRequest,
};
use tower_http::{
    cors::CorsLayer,
    services::{ServeDir, ServeFile},
    set_header::SetResponseHeaderLayer,
    trace::TraceLayer,
};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

type DynError = Box<dyn std::error::Error + Send + Sync>;

#[derive(Clone)]
struct AppState {
    jobs: JobRepository,
    accounts: AccountRepository,
    day_plans: DayPlanRepository,
    project_bids: ProjectBidRepository,
    organizations: OrganizationRepository,
    notifications: NotificationOutboxRepository,
    property_portfolios: PropertyPortfolioRepository,
    property_crew_assignments: PropertyCrewAssignmentRepository,
    property_onboarding: PropertyOnboardingRepository,
}

#[derive(Debug, Serialize)]
struct HealthResponse {
    status: &'static str,
    service: &'static str,
    persistence: &'static str,
}

#[derive(Clone, Debug, Serialize)]
pub struct JobSummary {
    pub id: String,
    pub organization_id: String,
    pub assigned_crew_id: Option<String>,
    pub customer_name: String,
    pub property_address: String,
    pub status: String,
    pub scheduled_date: String,
    pub before_photos: u32,
    pub after_photos: u32,
    pub checklist_items: u32,
    pub completed_checklist_items: u32,
}

#[derive(Clone, Debug, Serialize)]
pub struct JobDetail {
    pub id: String,
    pub organization_id: String,
    pub assigned_crew_id: Option<String>,
    pub customer_name: String,
    pub property_address: String,
    pub status: String,
    pub scheduled_date: String,
    pub before_photos: u32,
    pub after_photos: u32,
    pub checklist_items: u32,
    pub completed_checklist_items: u32,
    pub checklist: Vec<ChecklistItem>,
}

#[derive(Clone, Debug, Serialize)]
pub struct ChecklistItem {
    pub id: String,
    pub label: String,
    pub completed: bool,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
pub struct JobAddOn {
    pub id: String,
    pub job_id: String,
    pub service_name: String,
    pub service_description: Option<String>,
    pub quantity: u32,
    pub unit_price_cents: u32,
    pub note: Option<String>,
    pub status: String,
}

#[derive(Debug, Deserialize)]
struct JobAddOnStatusRequest {
    status: String,
}

#[derive(Debug, Serialize)]
struct ActionResponse {
    status: &'static str,
    message: String,
}

#[derive(Debug, Serialize)]
struct ErrorResponse {
    error: &'static str,
    message: String,
}

#[derive(Debug, Deserialize)]
struct CompletionReportChangeRequest {
    reason: Option<String>,
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
struct NotificationResolveRequest {
    reason: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct PhotoUploadRequest {
    pub file_name: String,
    pub content_type: String,
    pub photo_type: String,
}

#[derive(Clone, Debug, Serialize)]
pub struct PhotoUploadResponse {
    pub status: &'static str,
    pub job_id: String,
    pub photo_id: String,
    pub photo_type: String,
    pub file_name: String,
    pub content_type: String,
    pub upload_mode: &'static str,
    pub upload_url: String,
    pub object_key: String,
    pub thumbnail_upload_url: Option<String>,
    pub thumbnail_object_key: Option<String>,
}

#[derive(Clone, Debug, Serialize)]
pub struct PhotoEvidence {
    pub id: String,
    pub job_id: String,
    pub photo_type: String,
    pub file_name: String,
    pub content_type: String,
    pub object_key: String,
    pub status: String,
    pub upload_mode: &'static str,
    pub display_url: String,
    pub thumbnail_url: Option<String>,
}

#[derive(Debug, Deserialize)]
struct PhotoCompleteRequest {
    photo_id: String,
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
    photo_storage::PhotoStorageConfig::try_from_env().map_err(configuration_error)?;

    let (
        jobs,
        day_plans,
        project_bids,
        organizations,
        notifications,
        property_portfolios,
        property_crew_assignments,
        property_onboarding,
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
            let property_portfolios = PropertyPortfolioRepository::from_pool(pool.clone());
            let property_crew_assignments =
                PropertyCrewAssignmentRepository::from_pool(pool.clone());
            let property_onboarding = PropertyOnboardingRepository::from_pool(pool);
            (
                jobs,
                day_plans,
                project_bids,
                organizations,
                notifications,
                property_portfolios,
                property_crew_assignments,
                property_onboarding,
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
            PropertyPortfolioRepository::default(),
            PropertyCrewAssignmentRepository::default(),
            PropertyOnboardingRepository::default(),
            "seed-local",
        ),
    };

    let notification_config =
        NotificationDispatcherConfig::from_env(production).map_err(configuration_error)?;
    start_notification_dispatcher(notifications.clone(), notification_config)
        .map_err(configuration_error)?;

    let auth = AuthService::from_env(production).await?;
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
            accounts: AccountRepository::new(),
            day_plans,
            project_bids,
            organizations,
            notifications,
            property_portfolios,
            property_crew_assignments,
            property_onboarding,
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
        .route("/me/access", get(get_my_access))
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
            "/notifications/{id}/retry",
            post(retry_notification_delivery),
        )
        .route(
            "/notifications/{id}/resolve",
            post(resolve_notification_delivery),
        )
        .route("/jobs", get(list_jobs))
        .route("/jobs/{id}", get(get_job))
        .route("/jobs/{id}/account", get(get_account_for_job))
        .route(
            "/organizations/{organization_id}/invitations",
            post(create_organization_invitation),
        )
        .route(
            "/organization-invitations/{token}/accept",
            post(accept_organization_invitation),
        )
        .route(
            "/organizations/{organization_id}/memberships/{membership_id}/role",
            put(update_organization_membership_role),
        )
        .route(
            "/accounts/{account_id}/property-portfolios",
            get(list_property_portfolios_for_account),
        )
        .route(
            "/accounts/{account_id}/customer-property-portfolio",
            get(get_customer_property_portfolio),
        )
        .route("/property-portfolios", post(create_property_portfolio))
        .route(
            "/property-portfolios/{portfolio_id}/properties",
            post(add_property_to_portfolio),
        )
        .route(
            "/properties/{property_id}/crew-assignments",
            get(list_property_crew_assignments).post(assign_property_crew),
        )
        .route(
            "/properties/{property_id}/onboarding",
            get(get_property_onboarding).put(upsert_property_onboarding),
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
) -> impl IntoResponse {
    Json(
        state
            .organizations
            .principal_access_summary(
                &principal.subject,
                &principal.username,
                principal.roles.clone(),
            )
            .await,
    )
}

fn cors_layer(production: bool) -> Result<Option<CorsLayer>, DynError> {
    match std::env::var("CORS_ALLOWED_ORIGIN") {
        Ok(origin) if !origin.trim().is_empty() => {
            let origin = HeaderValue::from_str(origin.trim())?;
            Ok(Some(
                CorsLayer::new()
                    .allow_origin(origin)
                    .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE])
                    .allow_headers([CONTENT_TYPE, AUTHORIZATION])
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
    let organization_ids = principal_active_organization_ids(&state, &principal).await;
    let visible_organization_ids: HashSet<&str> =
        organization_ids.iter().map(String::as_str).collect();
    if visible_organization_ids.is_empty() {
        return Json(Vec::<JobSummary>::new()).into_response();
    }

    let jobs: Vec<JobSummary> = state
        .jobs
        .list_jobs()
        .await
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

    Json(state.jobs.get_job(id).await).into_response()
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

    Json(state.accounts.get_account_for_job(&id).await).into_response()
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

    let Some(invitation) = state
        .organizations
        .create_invitation(&organization_id, &principal.subject, request)
        .await
    else {
        return (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "organization_invitation_not_created",
                message: "The organization invitation could not be created.".to_string(),
            }),
        )
            .into_response();
    };

    (StatusCode::CREATED, Json(invitation)).into_response()
}

async fn accept_organization_invitation(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(token): Path<String>,
) -> Response {
    let Some(accepted) = state
        .organizations
        .accept_invitation(&token, &principal.subject)
        .await
    else {
        return resource_not_found_response(
            "organization_invitation_not_found",
            "The organization invitation was not found or is no longer pending.",
        );
    };

    Json(accepted).into_response()
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

    let Some(membership) = state
        .organizations
        .update_membership_role(
            &organization_id,
            &membership_id,
            &principal.subject,
            request,
        )
        .await
    else {
        return resource_not_found_response(
            "organization_membership_not_found",
            "The organization membership was not found.",
        );
    };

    Json(membership).into_response()
}

async fn list_property_portfolios_for_account(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(account_id): Path<String>,
) -> Response {
    let organization_ids = principal_active_organization_ids_for_role(
        &state,
        &principal,
        can_manage_property_portfolios,
    )
    .await;
    let portfolios = state
        .property_portfolios
        .list_for_account(&account_id, &organization_ids)
        .await;

    Json(portfolios).into_response()
}

async fn get_customer_property_portfolio(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(account_id): Path<String>,
) -> Response {
    let organization_ids = principal_active_organization_ids_for_role(
        &state,
        &principal,
        can_view_customer_property_portfolios,
    )
    .await;
    let response = state
        .property_portfolios
        .customer_portfolio_read(&account_id, &organization_ids)
        .await;

    Json(response).into_response()
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

    let Some(portfolio) = state
        .property_portfolios
        .create_portfolio(request, &principal.subject)
        .await
    else {
        return (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "property_portfolio_not_created",
                message: "The property portfolio could not be created.".to_string(),
            }),
        )
            .into_response();
    };

    (StatusCode::CREATED, Json(portfolio)).into_response()
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

    let Some(link) = state
        .property_portfolios
        .add_property(&portfolio_id, request, &principal.subject)
        .await
    else {
        return (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "portfolio_property_not_linkable",
                message: "The property could not be linked to that portfolio.".to_string(),
            }),
        )
            .into_response();
    };

    (StatusCode::CREATED, Json(link)).into_response()
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

    let Some(assignment) = state
        .property_crew_assignments
        .assign_crew(&property_id, request, &principal.subject)
        .await
    else {
        return (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "property_crew_not_assignable",
                message: "The crew could not be assigned to that property.".to_string(),
            }),
        )
            .into_response();
    };

    (StatusCode::CREATED, Json(assignment)).into_response()
}

async fn list_property_crew_assignments(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(property_id): Path<String>,
) -> Response {
    let organization_ids =
        principal_active_organization_ids_for_role(&state, &principal, can_manage_crew_assignments)
            .await;
    let assignments = state
        .property_crew_assignments
        .list_for_property(&property_id, &organization_ids)
        .await;

    Json(assignments).into_response()
}

async fn list_active_crew_property_assignments(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(crew_id): Path<String>,
) -> Response {
    let organization_ids =
        principal_active_organization_ids_for_role(&state, &principal, can_manage_crew_assignments)
            .await;
    if organization_ids.is_empty() {
        return Json(Vec::<PropertyCrewAssignmentResponse>::new()).into_response();
    }

    let Some(crew_organization_id) = state.day_plans.organization_id_for_crew(&crew_id).await
    else {
        return resource_not_found_response("crew_not_found", "Crew was not found.");
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

    let assignments = state
        .property_crew_assignments
        .list_active_for_crew(&crew_id, &organization_ids)
        .await;

    Json(assignments).into_response()
}

async fn get_property_onboarding(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(property_id): Path<String>,
) -> Response {
    let organization_ids = principal_active_organization_ids_for_role(
        &state,
        &principal,
        can_view_customer_property_portfolios,
    )
    .await;
    let Some(profile) = state
        .property_onboarding
        .get(&property_id, &organization_ids)
        .await
    else {
        return resource_not_found_response(
            "property_onboarding_not_found",
            "The requested property onboarding profile was not found.",
        );
    };

    Json(profile).into_response()
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

    let Some(profile) = state
        .property_onboarding
        .upsert(&property_id, request)
        .await
    else {
        return (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "property_onboarding_not_saved",
                message: "The property onboarding profile could not be saved.".to_string(),
            }),
        )
            .into_response();
    };

    (StatusCode::CREATED, Json(profile)).into_response()
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

    Json(build_and_persist_completion_report(&state, &id).await).into_response()
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

    let organization_ids = principal_active_organization_ids(&state, &principal).await;
    let visible_organization_ids: HashSet<&str> =
        organization_ids.iter().map(String::as_str).collect();
    if visible_organization_ids.is_empty() {
        return Json(Vec::<CompletionReportResponse>::new()).into_response();
    }

    let jobs = state.jobs.list_jobs().await;
    let mut reports = Vec::with_capacity(jobs.len());

    for job in jobs {
        if !completion_report_job_is_visible_to_membership(
            &job.organization_id,
            &visible_organization_ids,
        ) {
            continue;
        }
        let report = build_and_persist_completion_report(&state, &job.id).await;
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
            "all" | "any" | "checklist" | "before_photos" | "after_photos"
        ) {
            return Err(
                "readiness_blocker must be all, any, checklist, before_photos, or after_photos"
                    .to_string(),
            );
        }
    }

    validate_completion_report_text_filter(query.crew_id.as_deref(), "crew_id")?;
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
            filter.organization_ids = principal_active_organization_ids(&state, &principal).await;
            match state.notifications.list_history(filter).await {
                Ok(items) => Json(items).into_response(),
                Err(_) => (
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
            "queued" | "sending" | "sent" | "failed" | "skipped" | "dead_letter"
        ) {
            return Err(
                "status must be queued, sending, sent, failed, skipped, or dead_letter".to_string(),
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

async fn retry_notification_delivery(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(id): Path<String>,
) -> Response {
    let organization_ids = principal_active_organization_ids(&state, &principal).await;
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

    let organization_ids = principal_active_organization_ids(&state, &principal).await;
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
) -> Vec<String> {
    principal_active_organization_ids_for_role(state, principal, |_| true).await
}

async fn principal_active_organization_ids_for_role(
    state: &AppState,
    principal: &AuthPrincipal,
    required_role: fn(&AccessRole) -> bool,
) -> Vec<String> {
    let mut seen = HashSet::new();
    state
        .organizations
        .list_active_memberships(&principal.subject)
        .await
        .into_iter()
        .filter(|membership| required_role(&membership.role))
        .filter_map(|membership| {
            if seen.insert(membership.organization_id.clone()) {
                Some(membership.organization_id)
            } else {
                None
            }
        })
        .collect()
}

async fn require_crew_organization_access(
    state: &AppState,
    principal: &AuthPrincipal,
    crew_id: &str,
    required_role: fn(&AccessRole) -> bool,
) -> Result<(), Response> {
    let Some(organization_id) = state.day_plans.organization_id_for_crew(crew_id).await else {
        return Err(resource_not_found_response(
            "crew_not_found",
            "Crew was not found.",
        ));
    };

    require_organization_membership(state, principal, &organization_id, required_role).await
}

async fn require_day_plan_organization_access(
    state: &AppState,
    principal: &AuthPrincipal,
    day_plan_id: &str,
    required_role: fn(&AccessRole) -> bool,
) -> Result<(), Response> {
    let Some(organization_id) = state
        .day_plans
        .organization_id_for_day_plan(day_plan_id)
        .await
    else {
        return Err(resource_not_found_response(
            "day_plan_not_found",
            "Day plan was not found.",
        ));
    };

    require_organization_membership(state, principal, &organization_id, required_role).await
}

async fn require_job_organization_access(
    state: &AppState,
    principal: &AuthPrincipal,
    job_id: &str,
    required_role: fn(&AccessRole) -> bool,
) -> Result<(), Response> {
    let Some(organization_id) = state.jobs.organization_id_for_job(job_id).await else {
        return Err(resource_not_found_response(
            "job_not_found",
            "Job was not found.",
        ));
    };

    require_organization_membership(state, principal, &organization_id, required_role).await
}

async fn require_completion_report_organization_access(
    state: &AppState,
    principal: &AuthPrincipal,
    report_id: &str,
    required_role: fn(&AccessRole) -> bool,
) -> Result<(), Response> {
    let Some(organization_id) = state
        .jobs
        .organization_id_for_completion_report(report_id)
        .await
    else {
        return Err(resource_not_found_response(
            "completion_report_not_found",
            "The requested completion report was not found.",
        ));
    };

    require_organization_membership(state, principal, &organization_id, required_role).await
}

async fn require_organization_membership(
    state: &AppState,
    principal: &AuthPrincipal,
    organization_id: &str,
    required_role: fn(&AccessRole) -> bool,
) -> Result<(), Response> {
    if state
        .organizations
        .user_has_active_membership(&principal.subject, organization_id, required_role)
        .await
    {
        return Ok(());
    }

    Err((
        StatusCode::FORBIDDEN,
        Json(ErrorResponse {
            error: "organization_access_denied",
            message: "Active organization membership is required for this resource.".to_string(),
        }),
    )
        .into_response())
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

    match state
        .jobs
        .deliver_completion_report(&report_id, &principal.subject)
        .await
    {
        CompletionReportActionResult::Updated(report) => {
            let delivered_snapshot =
                build_and_persist_completion_report(&state, &report.job_id).await;
            let delivered_snapshot = attach_delivered_snapshot_metadata(&delivered_snapshot);
            if !state
                .jobs
                .store_delivered_completion_report_snapshot(&report.report_id, &delivered_snapshot)
                .await
            {
                tracing::warn!(
                    report_id = report.report_id,
                    "delivered completion report snapshot was not stored"
                );
            }

            Json(report).into_response()
        }
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

    Json(state.jobs.list_job_add_ons(&id).await).into_response()
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
    if let Some(snapshot) = state
        .jobs
        .delivered_snapshot_for_report_share_token(&share_token)
        .await
    {
        return Json(snapshot).into_response();
    }

    let Some(job_id) = state.jobs.job_id_for_report_share_token(&share_token).await else {
        return (
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                error: "shared_report_not_found",
                message: "Shared report link was not found.".to_string(),
            }),
        )
            .into_response();
    };

    Json(build_and_persist_completion_report(&state, &job_id).await).into_response()
}

async fn build_and_persist_completion_report(
    state: &AppState,
    id: &str,
) -> completion_reports::CompletionReportResponse {
    let job = state.jobs.get_job(id.to_string()).await;
    let account = state.accounts.get_account_for_job(id).await;
    let photo_evidence = state.jobs.list_photo_evidence(id).await;
    let add_ons = state.jobs.list_job_add_ons(id).await;
    let mut report = build_completion_report(job, account, photo_evidence, add_ons);
    let persistence = state.jobs.persist_completion_report(&report).await;
    apply_completion_report_persistence(&mut report, persistence);

    report
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

    Json(state.day_plans.today_for_crew(&crew_id).await).into_response()
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

    (
        StatusCode::CREATED,
        Json(state.day_plans.create_draft_day_plan(request).await),
    )
        .into_response()
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

    Json(state.day_plans.publish_day_plan(&day_plan_id).await).into_response()
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

    (
        StatusCode::CREATED,
        Json(
            state
                .day_plans
                .create_amendment(&day_plan_id, request)
                .await,
        ),
    )
        .into_response()
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

    Json(state.day_plans.list_amendments(&day_plan_id).await).into_response()
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

    Json(
        state
            .day_plans
            .review_amendment(&day_plan_id, &amendment_id, request)
            .await,
    )
    .into_response()
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

    (
        StatusCode::CREATED,
        Json(
            state
                .project_bids
                .save_draft(&day_plan_id, &amendment_id, request)
                .await,
        ),
    )
        .into_response()
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

    Json(state.project_bids.list_for_day_plan(&day_plan_id).await).into_response()
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

    let Some(bid) = state
        .project_bids
        .send(&day_plan_id, &bid_id, &request)
        .await
    else {
        return (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "project_bid_not_sendable",
                message: "Only a persisted draft bid can be sent.".to_string(),
            }),
        )
            .into_response();
    };

    Json(bid).into_response()
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

    let Some(bid) = state.project_bids.revoke(&day_plan_id, &bid_id).await else {
        return (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "project_bid_not_revocable",
                message: "Only an unanswered active bid link can be revoked.".to_string(),
            }),
        )
            .into_response();
    };

    Json(bid).into_response()
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

    let Some(bid) = state
        .project_bids
        .convert_to_job_add_ons(&day_plan_id, &bid_id, &principal.subject)
        .await
    else {
        return (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "project_bid_not_convertible",
                message: "Only an approved persisted bid can be converted to work.".to_string(),
            }),
        )
            .into_response();
    };

    Json(bid).into_response()
}

async fn get_shared_project_bid(
    State(state): State<Arc<AppState>>,
    Path(share_token): Path<String>,
) -> Response {
    let Some(bid) = state.project_bids.shared_for_token(&share_token).await else {
        return (
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                error: "shared_bid_not_found",
                message: "Shared bid link was not found.".to_string(),
            }),
        )
            .into_response();
    };

    Json(customer_project_bid_response(&bid)).into_response()
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

    let Some(current) = state.project_bids.shared_for_token(&share_token).await else {
        return (
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                error: "shared_bid_not_found",
                message: "Shared bid link was not found.".to_string(),
            }),
        )
            .into_response();
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

    let Some(bid) = state
        .project_bids
        .decide_shared(&share_token, &request.decision)
        .await
    else {
        return (
            StatusCode::CONFLICT,
            Json(ErrorResponse {
                error: "project_bid_decision_conflict",
                message: "The bid changed before this response was recorded.".to_string(),
            }),
        )
            .into_response();
    };

    Json(customer_project_bid_response(&bid)).into_response()
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

    (
        StatusCode::CREATED,
        Json(state.day_plans.assign_stop(&day_plan_id, request).await),
    )
        .into_response()
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

    Json(state.day_plans.remove_stop(&day_plan_id, &stop_id).await).into_response()
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

    Json(state.day_plans.reorder_stops(&day_plan_id, request).await).into_response()
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

    if let Err(response) =
        require_day_plan_organization_access(&state, &principal, &day_plan_id, can_view_crew_route)
            .await
    {
        return response;
    }

    let persisted = state
        .jobs
        .update_stop_progress(&day_plan_id, &stop_id, &request.status)
        .await;

    if persisted {
        Json(persisted_stop_progress_response(
            &day_plan_id,
            &stop_id,
            &request.status,
        ))
        .into_response()
    } else {
        Json(local_stop_progress_response(
            &day_plan_id,
            &stop_id,
            &request.status,
        ))
        .into_response()
    }
}

async fn start_job(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(id): Path<String>,
) -> Response {
    if let Err(response) =
        require_job_organization_access(&state, &principal, &id, can_view_crew_route).await
    {
        return response;
    }

    let message = state.jobs.start_job(&id).await;

    (
        StatusCode::ACCEPTED,
        Json(ActionResponse {
            status: "accepted",
            message,
        }),
    )
        .into_response()
}

async fn complete_job(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(id): Path<String>,
) -> Response {
    if let Err(response) =
        require_job_organization_access(&state, &principal, &id, can_view_crew_route).await
    {
        return response;
    }

    let message = state.jobs.complete_job(&id).await;

    (
        StatusCode::ACCEPTED,
        Json(ActionResponse {
            status: "accepted",
            message,
        }),
    )
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

    let ticket = state.jobs.create_photo_upload(id, request).await;

    (StatusCode::CREATED, Json(ticket)).into_response()
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

    Json(state.jobs.list_photo_evidence(&id).await).into_response()
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

    let message = state
        .jobs
        .complete_photo_upload(&id, &request.photo_id)
        .await;

    (
        StatusCode::ACCEPTED,
        Json(ActionResponse {
            status: "accepted",
            message,
        }),
    )
        .into_response()
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::Body;
    use axum::http::{Request, StatusCode};
    use http_body_util::BodyExt;
    use serde_json::Value;
    use tower::ServiceExt;

    fn seed_state() -> Arc<AppState> {
        Arc::new(AppState {
            jobs: JobRepository::default(),
            accounts: AccountRepository::new(),
            day_plans: DayPlanRepository::default(),
            project_bids: ProjectBidRepository::default(),
            organizations: OrganizationRepository::default(),
            notifications: NotificationOutboxRepository::default(),
            property_portfolios: PropertyPortfolioRepository::default(),
            property_crew_assignments: PropertyCrewAssignmentRepository::default(),
            property_onboarding: PropertyOnboardingRepository::default(),
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
    async fn day_plan_organization_access_allows_seed_owner_membership() {
        let state = seed_state();
        let principal = AuthPrincipal {
            subject: "local-development-user".to_string(),
            username: "Local Developer".to_string(),
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
    async fn job_organization_access_rejects_missing_membership() {
        let state = seed_state();
        let principal = AuthPrincipal {
            subject: "other-user".to_string(),
            username: "Other User".to_string(),
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
    async fn organization_membership_role_endpoint_returns_updated_role() {
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

        assert_eq!(response.status(), StatusCode::OK);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();

        assert_eq!(json["id"], "membership_local_owner_demo");
        assert_eq!(json["role"], "Manager");
        assert_eq!(json["status"], "active");
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
    async fn notification_history_endpoint_returns_empty_local_history() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .uri(
                        "/notifications?entity_type=organization_invitation&status=queued&limit=10",
                    )
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
    async fn send_project_bid_requires_a_persisted_draft() {
        let request_body = serde_json::json!({
            "channel": "email",
            "recipient": "customer@example.com"
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

        assert_eq!(response.status(), StatusCode::CONFLICT);
    }

    #[tokio::test]
    async fn send_project_bid_rejects_invalid_sms_recipients() {
        let request_body = serde_json::json!({
            "channel": "sms",
            "recipient": "602-555-0123"
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
    async fn revoke_project_bid_requires_an_active_persisted_link() {
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

        assert_eq!(response.status(), StatusCode::CONFLICT);
    }

    #[tokio::test]
    async fn convert_project_bid_requires_an_approved_persisted_bid() {
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

        assert_eq!(response.status(), StatusCode::CONFLICT);
    }

    #[tokio::test]
    async fn shared_project_bid_returns_not_found_without_persistence() {
        let response = seed_app()
            .oneshot(
                Request::builder()
                    .uri("/shared-bids/missing-token")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::NOT_FOUND);
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
