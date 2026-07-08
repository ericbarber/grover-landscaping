mod accounts;
#[allow(dead_code)]
mod completion_reports;
#[allow(dead_code)]
mod day_plans;
mod db;
mod notifications;
mod project_bids;
mod stop_progress;

use accounts::AccountRepository;
use axum::{
    extract::{Extension, Path, State},
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
    apply_completion_report_persistence, build_completion_report, CompletionReportActionResult,
};
use day_plans::{
    validate_amendment_request, validate_amendment_review, AssignDayPlanStopRequest,
    CreateDayPlanAmendmentRequest, CreateDayPlanRequest, DayPlanRepository,
    ReorderDayPlanStopsRequest, ReviewDayPlanAmendmentRequest,
};
use db::{DatabaseConfig, JobAddOnStatusUpdate, JobRepository};
use grover_landscaping_api::auth::{require_api_auth, AuthPrincipal, AuthService};
use notifications::{
    start_notification_dispatcher, NotificationDispatcherConfig, NotificationOutboxRepository,
};
use project_bids::{
    customer_project_bid_response, validate_project_bid_decision, validate_project_bid_request,
    validate_send_project_bid_request, CreateProjectBidRequest, ProjectBidDecisionRequest,
    ProjectBidRepository, SendProjectBidRequest,
};
use serde::{Deserialize, Serialize};
use std::{io, net::SocketAddr, path::PathBuf, sync::Arc};
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

    let (jobs, day_plans, project_bids, notifications, persistence) =
        match DatabaseConfig::from_env() {
            Some(config) => {
                tracing::info!("connecting to PostgreSQL and applying migrations");
                let jobs = JobRepository::connect(&config).await?;
                let pool = jobs.pool().ok_or_else(|| {
                    configuration_error("PostgreSQL connected without an available connection pool")
                })?;
                let day_plans = DayPlanRepository::from_pool(pool.clone());
                let project_bids = ProjectBidRepository::from_pool(pool.clone());
                let notifications = NotificationOutboxRepository::from_pool(pool);
                (jobs, day_plans, project_bids, notifications, "postgres")
            }
            None if production => {
                return Err(configuration_error(
                    "DATABASE_URL is required when APP_ENV=production",
                )
                .into());
            }
            None => (
                JobRepository::default(),
                DayPlanRepository::default(),
                ProjectBidRepository::default(),
                NotificationOutboxRepository::default(),
                "seed-local",
            ),
        };

    let notification_config =
        NotificationDispatcherConfig::from_env(production).map_err(configuration_error)?;
    start_notification_dispatcher(notifications, notification_config)
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
        .route("/jobs", get(list_jobs))
        .route("/jobs/{id}", get(get_job))
        .route("/jobs/{id}/account", get(get_account_for_job))
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

async fn list_jobs(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    Json(state.jobs.list_jobs().await)
}

async fn get_job(State(state): State<Arc<AppState>>, Path(id): Path<String>) -> impl IntoResponse {
    Json(state.jobs.get_job(id).await)
}

async fn get_account_for_job(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    Json(state.accounts.get_account_for_job(&id).await)
}

async fn get_completion_report(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    Json(build_and_persist_completion_report(&state, &id).await)
}

async fn start_completion_report_review(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(report_id): Path<String>,
) -> Response {
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
    match state
        .jobs
        .deliver_completion_report(&report_id, &principal.subject)
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

async fn resubmit_completion_report(
    State(state): State<Arc<AppState>>,
    Extension(principal): Extension<AuthPrincipal>,
    Path(report_id): Path<String>,
) -> Response {
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
    Path(id): Path<String>,
) -> impl IntoResponse {
    Json(state.jobs.list_job_add_ons(&id).await)
}

async fn update_job_add_on_status(
    State(state): State<Arc<AppState>>,
    Path((job_id, add_on_id)): Path<(String, String)>,
    Json(request): Json<JobAddOnStatusRequest>,
) -> impl IntoResponse {
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
    Path(crew_id): Path<String>,
) -> impl IntoResponse {
    Json(state.day_plans.today_for_crew(&crew_id).await)
}

async fn create_draft_day_plan(
    State(state): State<Arc<AppState>>,
    Json(request): Json<CreateDayPlanRequest>,
) -> impl IntoResponse {
    (
        StatusCode::CREATED,
        Json(state.day_plans.create_draft_day_plan(request).await),
    )
}

async fn publish_day_plan(
    State(state): State<Arc<AppState>>,
    Path(day_plan_id): Path<String>,
) -> impl IntoResponse {
    Json(state.day_plans.publish_day_plan(&day_plan_id).await)
}

async fn create_day_plan_amendment(
    State(state): State<Arc<AppState>>,
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
    Path(day_plan_id): Path<String>,
) -> impl IntoResponse {
    Json(state.day_plans.list_amendments(&day_plan_id).await)
}

async fn review_day_plan_amendment(
    State(state): State<Arc<AppState>>,
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
    Path(day_plan_id): Path<String>,
) -> impl IntoResponse {
    Json(state.project_bids.list_for_day_plan(&day_plan_id).await)
}

async fn send_project_bid(
    State(state): State<Arc<AppState>>,
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
    Path((day_plan_id, bid_id)): Path<(String, String)>,
) -> Response {
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
    Path((day_plan_id, bid_id)): Path<(String, String)>,
) -> Response {
    let Some(bid) = state
        .project_bids
        .convert_to_job_add_ons(&day_plan_id, &bid_id)
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
    Path(day_plan_id): Path<String>,
    Json(request): Json<AssignDayPlanStopRequest>,
) -> impl IntoResponse {
    (
        StatusCode::CREATED,
        Json(state.day_plans.assign_stop(&day_plan_id, request).await),
    )
}

async fn remove_day_plan_stop(
    State(state): State<Arc<AppState>>,
    Path((day_plan_id, stop_id)): Path<(String, String)>,
) -> impl IntoResponse {
    Json(state.day_plans.remove_stop(&day_plan_id, &stop_id).await)
}

async fn reorder_day_plan_stops(
    State(state): State<Arc<AppState>>,
    Path(day_plan_id): Path<String>,
    Json(request): Json<ReorderDayPlanStopsRequest>,
) -> impl IntoResponse {
    Json(state.day_plans.reorder_stops(&day_plan_id, request).await)
}

async fn update_stop_progress(
    State(state): State<Arc<AppState>>,
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
    Path(id): Path<String>,
) -> impl IntoResponse {
    let message = state.jobs.start_job(&id).await;

    (
        StatusCode::ACCEPTED,
        Json(ActionResponse {
            status: "accepted",
            message,
        }),
    )
}

async fn complete_job(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let message = state.jobs.complete_job(&id).await;

    (
        StatusCode::ACCEPTED,
        Json(ActionResponse {
            status: "accepted",
            message,
        }),
    )
}

async fn create_local_photo_upload(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(request): Json<PhotoUploadRequest>,
) -> impl IntoResponse {
    let ticket = state.jobs.create_photo_upload(id, request).await;

    (StatusCode::CREATED, Json(ticket))
}

async fn list_job_photos(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    Json(state.jobs.list_photo_evidence(&id).await)
}

async fn complete_photo_upload(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(request): Json<PhotoCompleteRequest>,
) -> impl IntoResponse {
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
