mod accounts;
mod db;
mod stop_progress;

use accounts::AccountRepository;
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use db::{DatabaseConfig, JobRepository};
use serde::{Deserialize, Serialize};
use std::{net::SocketAddr, sync::Arc};
use stop_progress::{local_stop_progress_response, StopProgressRequest};
use tower_http::{cors::CorsLayer, trace::TraceLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[derive(Clone)]
struct AppState {
    jobs: JobRepository,
    accounts: AccountRepository,
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

#[derive(Debug, Serialize)]
struct ActionResponse {
    status: &'static str,
    message: String,
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
    pub upload_mode: &'static str,
    pub upload_url: String,
    pub object_key: String,
}

#[derive(Debug, Deserialize)]
struct PhotoCompleteRequest {
    photo_id: String,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG")
                .unwrap_or_else(|_| "grover_landscaping_api=debug,tower_http=debug".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    let app = app();
    let addr = SocketAddr::from(([0, 0, 0, 0], 8080));

    tracing::info!(%addr, "starting Grover Landscaping API");

    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .expect("failed to bind API listener");

    axum::serve(listener, app)
        .await
        .expect("API server failed");
}

fn app() -> Router {
    let persistence = DatabaseConfig::from_env()
        .map(|config| {
            tracing::info!(database_url_configured = !config.database_url.is_empty(), "database URL detected");
            "database-configured"
        })
        .unwrap_or("seed-local");

    app_with_state(
        Arc::new(AppState {
            jobs: JobRepository::new(),
            accounts: AccountRepository::new(),
        }),
        persistence,
    )
}

fn app_with_state(state: Arc<AppState>, persistence: &'static str) -> Router {
    Router::new()
        .route("/health", get(move || health(persistence)))
        .route("/jobs", get(list_jobs))
        .route("/jobs/{id}", get(get_job))
        .route("/jobs/{id}/account", get(get_account_for_job))
        .route("/jobs/{id}/start", post(start_job))
        .route("/jobs/{id}/complete", post(complete_job))
        .route("/jobs/{id}/photos/presign", post(create_local_photo_upload))
        .route("/jobs/{id}/photos/complete", post(complete_photo_upload))
        .route("/day-plans/{day_plan_id}/stops/{stop_id}/status", post(update_stop_progress))
        .with_state(state)
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http())
}

async fn health(persistence: &'static str) -> impl IntoResponse {
    Json(HealthResponse {
        status: "ok",
        service: "grover-landscaping-api",
        persistence,
    })
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

async fn update_stop_progress(
    Path((day_plan_id, stop_id)): Path<(String, String)>,
    Json(request): Json<StopProgressRequest>,
) -> impl IntoResponse {
    Json(local_stop_progress_response(
        &day_plan_id,
        &stop_id,
        &request.status,
    ))
}

async fn start_job(State(state): State<Arc<AppState>>, Path(id): Path<String>) -> impl IntoResponse {
    let message = state.jobs.start_job(&id).await;

    (
        StatusCode::ACCEPTED,
        Json(ActionResponse {
            status: "accepted",
            message,
        }),
    )
}

async fn complete_job(State(state): State<Arc<AppState>>, Path(id): Path<String>) -> impl IntoResponse {
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

    #[tokio::test]
    async fn health_returns_ok() {
        let response = app()
            .oneshot(Request::builder().uri("/health").body(Body::empty()).unwrap())
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: Value = serde_json::from_slice(&body).unwrap();

        assert_eq!(json["status"], "ok");
        assert_eq!(json["service"], "grover-landscaping-api");
    }

    #[tokio::test]
    async fn jobs_endpoint_returns_seed_jobs() {
        let response = app()
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
        let response = app()
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
    async fn stop_progress_endpoint_returns_local_response() {
        let request_body = serde_json::json!({ "status": "in_progress" });

        let response = app()
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
    async fn photo_presign_returns_local_placeholder_upload() {
        let request_body = serde_json::json!({
            "file_name": "before.jpg",
            "content_type": "image/jpeg",
            "photo_type": "before"
        });

        let response = app()
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

        assert_eq!(json["upload_mode"], "local-placeholder");
        assert_eq!(json["job_id"], "job_1001");
    }
}
