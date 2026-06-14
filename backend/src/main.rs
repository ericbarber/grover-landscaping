use axum::{
    extract::Path,
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use serde::Serialize;
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
}

#[derive(Debug, Serialize)]
struct JobDetail {
    id: String,
    customer_name: String,
    property_address: String,
    status: String,
    scheduled_date: String,
    checklist: Vec<String>,
}

#[derive(Debug, Serialize)]
struct ActionResponse {
    status: &'static str,
    message: String,
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
        },
        JobSummary {
            id: "job_1002".to_string(),
            customer_name: "Demo Property Owner".to_string(),
            property_address: "456 Maple Avenue".to_string(),
            status: "in_progress".to_string(),
            scheduled_date: "2026-06-15".to_string(),
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
        checklist: vec![
            "Capture before photos".to_string(),
            "Complete yard service".to_string(),
            "Capture after photos".to_string(),
            "Submit completion notes".to_string(),
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
    }
}
