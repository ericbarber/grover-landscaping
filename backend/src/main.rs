use axum::{
    extract::Path,
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use tower_http::{cors::CorsLayer, trace::TraceLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[derive(Debug, Serialize)]
struct HealthResponse {
    status: &'static str,
    service: &'static str,
}

#[derive(Debug, Serialize)]
struct JobSummary {
    id: String,
    customer_name: String,
    property_address: String,
    status: String,
    scheduled_date: String,
    before_photos: u32,
    after_photos: u32,
    checklist_items: u32,
    completed_checklist_items: u32,
}

#[derive(Debug, Serialize)]
struct JobDetail {
    id: String,
    customer_name: String,
    property_address: String,
    status: String,
    scheduled_date: String,
    before_photos: u32,
    after_photos: u32,
    checklist: Vec<ChecklistItem>,
}

#[derive(Debug, Serialize)]
struct ChecklistItem {
    id: String,
    label: String,
    completed: bool,
}

#[derive(Debug, Serialize)]
struct ActionResponse {
    status: &'static str,
    message: String,
}

#[derive(Debug, Deserialize)]
struct PhotoUploadRequest {
    file_name: String,
    content_type: String,
    photo_type: String,
}

#[derive(Debug, Serialize)]
struct PhotoUploadResponse {
    status: &'static str,
    job_id: String,
    photo_id: String,
    upload_mode: &'static str,
    upload_url: String,
    object_key: String,
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
    Router::new()
        .route("/health", get(health))
        .route("/jobs", get(list_jobs))
        .route("/jobs/{id}", get(get_job))
        .route("/jobs/{id}/start", post(start_job))
        .route("/jobs/{id}/complete", post(complete_job))
        .route("/jobs/{id}/photos/presign", post(create_local_photo_upload))
        .route("/jobs/{id}/photos/complete", post(complete_photo_upload))
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http())
}

async fn health() -> impl IntoResponse {
    Json(HealthResponse {
        status: "ok",
        service: "grover-landscaping-api",
    })
}

async fn list_jobs() -> impl IntoResponse {
    Json(vec![
        JobSummary {
            id: "job_1001".to_string(),
            customer_name: "Sample Customer".to_string(),
            property_address: "123 Oak Street".to_string(),
            status: "scheduled".to_string(),
            scheduled_date: "2026-06-15".to_string(),
            before_photos: 0,
            after_photos: 0,
            checklist_items: 4,
            completed_checklist_items: 0,
        },
        JobSummary {
            id: "job_1002".to_string(),
            customer_name: "Demo Property Owner".to_string(),
            property_address: "456 Maple Avenue".to_string(),
            status: "in_progress".to_string(),
            scheduled_date: "2026-06-15".to_string(),
            before_photos: 3,
            after_photos: 1,
            checklist_items: 4,
            completed_checklist_items: 2,
        },
    ])
}

async fn get_job(Path(id): Path<String>) -> impl IntoResponse {
    Json(JobDetail {
        id,
        customer_name: "Sample Customer".to_string(),
        property_address: "123 Oak Street".to_string(),
        status: "scheduled".to_string(),
        scheduled_date: "2026-06-15".to_string(),
        before_photos: 0,
        after_photos: 0,
        checklist: vec![
            ChecklistItem {
                id: "before-photos".to_string(),
                label: "Capture before photos".to_string(),
                completed: false,
            },
            ChecklistItem {
                id: "yard-service".to_string(),
                label: "Complete yard service".to_string(),
                completed: false,
            },
            ChecklistItem {
                id: "after-photos".to_string(),
                label: "Capture after photos".to_string(),
                completed: false,
            },
            ChecklistItem {
                id: "completion-notes".to_string(),
                label: "Submit completion notes".to_string(),
                completed: false,
            },
        ],
    })
}

async fn start_job(Path(id): Path<String>) -> impl IntoResponse {
    (
        StatusCode::ACCEPTED,
        Json(ActionResponse {
            status: "accepted",
            message: format!("Job {id} has been marked as started."),
        }),
    )
}

async fn complete_job(Path(id): Path<String>) -> impl IntoResponse {
    (
        StatusCode::ACCEPTED,
        Json(ActionResponse {
            status: "accepted",
            message: format!("Job {id} has been marked as complete."),
        }),
    )
}

async fn create_local_photo_upload(
    Path(id): Path<String>,
    Json(request): Json<PhotoUploadRequest>,
) -> impl IntoResponse {
    let safe_file_name = request.file_name.replace('/', "-");
    let photo_id = format!("photo_{}_{}", id, request.photo_type);
    let object_key = format!(
        "local/jobs/{id}/{photo_type}/{safe_file_name}",
        photo_type = request.photo_type
    );

    (
        StatusCode::CREATED,
        Json(PhotoUploadResponse {
            status: "created",
            job_id: id,
            photo_id,
            upload_mode: "local-placeholder",
            upload_url: format!("local://{object_key}?content_type={}", request.content_type),
            object_key,
        }),
    )
}

async fn complete_photo_upload(
    Path(id): Path<String>,
    Json(request): Json<PhotoCompleteRequest>,
) -> impl IntoResponse {
    (
        StatusCode::ACCEPTED,
        Json(ActionResponse {
            status: "accepted",
            message: format!("Photo {} for job {id} has been marked uploaded.", request.photo_id),
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
