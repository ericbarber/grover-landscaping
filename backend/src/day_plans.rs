#[path = "postgres_day_plans.rs"]
mod postgres_day_plans;

use crate::db::DatabaseConfig;
use serde::{Deserialize, Serialize};
use sqlx::{postgres::PgPoolOptions, PgPool};
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Clone, Debug, Serialize)]
pub struct DayPlanStop {
    pub id: String,
    pub job_id: String,
    pub customer_name: String,
    pub property_address: String,
    pub stop_order: u32,
    pub job_status: String,
    pub stop_status: String,
    pub estimated_drive_minutes: u32,
    pub estimated_service_minutes: u32,
}

#[derive(Clone, Debug, Serialize)]
pub struct DayPlanSummary {
    pub id: String,
    pub crew_id: String,
    pub crew_name: String,
    pub service_date: String,
    pub status: String,
    pub route_status: String,
    pub stops: Vec<DayPlanStop>,
}

#[derive(Clone, Debug, Deserialize)]
pub struct CreateDayPlanRequest {
    pub crew_id: String,
    pub service_date: String,
}

#[derive(Clone, Debug, Deserialize)]
pub struct AssignDayPlanStopRequest {
    pub job_id: String,
    pub estimated_drive_minutes: Option<u32>,
    pub estimated_service_minutes: Option<u32>,
}

#[derive(Clone, Debug, Deserialize)]
pub struct ReorderDayPlanStopsRequest {
    pub stop_ids: Vec<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct AmendmentService {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub default_duration_minutes: Option<u32>,
    pub default_price_cents: Option<u32>,
    pub requires_manager_approval: bool,
}

#[derive(Clone, Debug, Deserialize)]
pub struct CreateDayPlanAmendmentRequest {
    pub amendment_type: String,
    pub requested_by_crew_id: String,
    pub stop_id: Option<String>,
    pub service: Option<AmendmentService>,
    pub note: Option<String>,
}

#[derive(Clone, Debug, Deserialize)]
pub struct ReviewDayPlanAmendmentRequest {
    pub decision: String,
    pub manager_note: Option<String>,
}

#[derive(Clone, Debug, Serialize)]
pub struct DayPlanAmendmentResponse {
    pub id: String,
    pub day_plan_id: String,
    pub amendment_type: String,
    pub status: String,
    pub requested_by_crew_id: String,
    pub stop_id: Option<String>,
    pub service: Option<AmendmentService>,
    pub note: Option<String>,
    pub requires_bid: bool,
    pub manager_note: Option<String>,
    pub persisted: bool,
}

#[derive(Clone, Debug, Serialize)]
pub struct DayPlanAmendmentReviewResponse {
    pub id: String,
    pub day_plan_id: String,
    pub status: String,
    pub manager_note: Option<String>,
    pub persisted: bool,
}

#[derive(Clone, Debug, Serialize)]
pub struct DayPlanMutationResponse {
    pub id: String,
    pub crew_id: String,
    pub service_date: String,
    pub status: String,
    pub route_status: String,
    pub persisted: bool,
}

#[derive(Clone, Debug, Serialize)]
pub struct DayPlanStopMutationResponse {
    pub day_plan_id: String,
    pub stop_id: String,
    pub job_id: String,
    pub stop_order: u32,
    pub persisted: bool,
}

#[derive(Clone, Debug, Serialize)]
pub struct DayPlanStopRemovalResponse {
    pub day_plan_id: String,
    pub stop_id: String,
    pub persisted: bool,
}

#[derive(Clone, Debug, Serialize)]
pub struct DayPlanStopReorderResponse {
    pub day_plan_id: String,
    pub stop_ids: Vec<String>,
    pub persisted: bool,
}

#[derive(Clone, Debug, Default)]
pub struct DayPlanRepository {
    pool: Option<PgPool>,
}

impl DayPlanRepository {
    #[allow(dead_code)]
    pub fn new() -> Self {
        let pool = DatabaseConfig::from_env().and_then(|config| {
            PgPoolOptions::new()
                .max_connections(5)
                .connect_lazy(&config.database_url)
                .ok()
        });

        Self { pool }
    }

    pub fn from_pool(pool: PgPool) -> Self {
        Self { pool: Some(pool) }
    }

    pub async fn create_draft_day_plan(
        &self,
        request: CreateDayPlanRequest,
    ) -> DayPlanMutationResponse {
        let id = draft_day_plan_id(&request.crew_id, &request.service_date);

        if let Some(pool) = &self.pool {
            if let Ok(true) = postgres_day_plans::create_draft_day_plan(
                pool,
                &id,
                &request.crew_id,
                &request.service_date,
            )
            .await
            {
                return draft_day_plan_response(&request, true);
            }
        }

        draft_day_plan_response(&request, false)
    }

    pub async fn publish_day_plan(&self, id: &str) -> DayPlanMutationResponse {
        if let Some(pool) = &self.pool {
            if let Ok(Some(day_plan)) = postgres_day_plans::publish_day_plan(pool, id).await {
                return day_plan;
            }
        }

        local_published_day_plan_response(id)
    }

    pub async fn assign_stop(
        &self,
        day_plan_id: &str,
        request: AssignDayPlanStopRequest,
    ) -> DayPlanStopMutationResponse {
        let stop_id = draft_stop_id(day_plan_id, &request.job_id);

        if let Some(pool) = &self.pool {
            if let Ok(Some(response)) =
                postgres_day_plans::assign_stop(pool, day_plan_id, &stop_id, &request).await
            {
                return response;
            }
        }

        DayPlanStopMutationResponse {
            day_plan_id: day_plan_id.to_string(),
            stop_id,
            job_id: request.job_id,
            stop_order: 0,
            persisted: false,
        }
    }

    pub async fn remove_stop(
        &self,
        day_plan_id: &str,
        stop_id: &str,
    ) -> DayPlanStopRemovalResponse {
        if let Some(pool) = &self.pool {
            if let Ok(true) = postgres_day_plans::remove_stop(pool, day_plan_id, stop_id).await {
                return DayPlanStopRemovalResponse {
                    day_plan_id: day_plan_id.to_string(),
                    stop_id: stop_id.to_string(),
                    persisted: true,
                };
            }
        }

        DayPlanStopRemovalResponse {
            day_plan_id: day_plan_id.to_string(),
            stop_id: stop_id.to_string(),
            persisted: false,
        }
    }

    pub async fn reorder_stops(
        &self,
        day_plan_id: &str,
        request: ReorderDayPlanStopsRequest,
    ) -> DayPlanStopReorderResponse {
        if let Some(pool) = &self.pool {
            if let Ok(true) =
                postgres_day_plans::reorder_stops(pool, day_plan_id, &request.stop_ids).await
            {
                return DayPlanStopReorderResponse {
                    day_plan_id: day_plan_id.to_string(),
                    stop_ids: request.stop_ids,
                    persisted: true,
                };
            }
        }

        DayPlanStopReorderResponse {
            day_plan_id: day_plan_id.to_string(),
            stop_ids: request.stop_ids,
            persisted: false,
        }
    }

    pub async fn today_for_crew(&self, crew_id: &str) -> DayPlanSummary {
        if let Some(pool) = &self.pool {
            if let Ok(Some(day_plan)) = postgres_day_plans::today_for_crew(pool, crew_id).await {
                return day_plan;
            }
        }

        seed_day_plan(crew_id)
    }

    pub async fn create_amendment(
        &self,
        day_plan_id: &str,
        request: CreateDayPlanAmendmentRequest,
    ) -> DayPlanAmendmentResponse {
        let response = local_amendment_response(day_plan_id, request);

        if let Some(pool) = &self.pool {
            if let Ok(Some(persisted)) = postgres_day_plans::create_amendment(pool, &response).await
            {
                return persisted;
            }
        }

        response
    }

    pub async fn list_amendments(&self, day_plan_id: &str) -> Vec<DayPlanAmendmentResponse> {
        if let Some(pool) = &self.pool {
            if let Ok(amendments) = postgres_day_plans::list_amendments(pool, day_plan_id).await {
                return amendments;
            }
        }

        Vec::new()
    }

    pub async fn review_amendment(
        &self,
        day_plan_id: &str,
        amendment_id: &str,
        request: ReviewDayPlanAmendmentRequest,
    ) -> DayPlanAmendmentReviewResponse {
        let status = amendment_review_status(&request.decision)
            .expect("review request must be validated before repository use")
            .to_string();

        if let Some(pool) = &self.pool {
            if let Ok(Some(response)) = postgres_day_plans::review_amendment(
                pool,
                day_plan_id,
                amendment_id,
                &status,
                request.manager_note.as_deref(),
            )
            .await
            {
                return response;
            }
        }

        DayPlanAmendmentReviewResponse {
            id: amendment_id.to_string(),
            day_plan_id: day_plan_id.to_string(),
            status,
            manager_note: request.manager_note,
            persisted: false,
        }
    }
}

pub fn validate_amendment_review(request: &ReviewDayPlanAmendmentRequest) -> Result<(), String> {
    if amendment_review_status(&request.decision).is_none() {
        return Err(format!(
            "unsupported amendment decision: {}",
            request.decision
        ));
    }

    if request
        .manager_note
        .as_deref()
        .is_some_and(|note| note.trim().is_empty())
    {
        return Err("manager_note cannot be blank".to_string());
    }

    Ok(())
}

fn amendment_review_status(decision: &str) -> Option<&'static str> {
    match decision {
        "approve" => Some("approved"),
        "reject" => Some("rejected"),
        "send_to_bid_review" => Some("bid_review"),
        _ => None,
    }
}

pub fn validate_amendment_request(request: &CreateDayPlanAmendmentRequest) -> Result<(), String> {
    if request.requested_by_crew_id.trim().is_empty() {
        return Err("requested_by_crew_id is required".to_string());
    }

    if request
        .note
        .as_deref()
        .is_some_and(|note| note.trim().is_empty())
    {
        return Err("note cannot be blank".to_string());
    }

    match request.amendment_type.as_str() {
        "add_stop" if request.stop_id.is_none() && request.service.is_none() => Ok(()),
        "remove_stop" if request.stop_id.is_some() && request.service.is_none() => Ok(()),
        "add_service" if request.stop_id.is_some() && request.service.is_some() => {
            let service = request.service.as_ref().expect("service checked above");
            if service.id.trim().is_empty() || service.name.trim().is_empty() {
                Err("service id and name are required".to_string())
            } else {
                Ok(())
            }
        }
        "add_stop" | "remove_stop" | "add_service" => Err(format!(
            "amendment fields do not match amendment_type {}",
            request.amendment_type
        )),
        _ => Err(format!(
            "unsupported amendment_type: {}",
            request.amendment_type
        )),
    }
}

fn local_amendment_response(
    day_plan_id: &str,
    request: CreateDayPlanAmendmentRequest,
) -> DayPlanAmendmentResponse {
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_nanos())
        .unwrap_or(0);
    let requires_bid = request.amendment_type == "add_service"
        && request
            .service
            .as_ref()
            .is_some_and(|service| service.requires_manager_approval);

    DayPlanAmendmentResponse {
        id: format!(
            "amendment_{}_{}_{}",
            day_plan_id.replace(|character: char| !character.is_ascii_alphanumeric(), "_"),
            request.amendment_type,
            nonce
        ),
        day_plan_id: day_plan_id.to_string(),
        amendment_type: request.amendment_type,
        status: "submitted".to_string(),
        requested_by_crew_id: request.requested_by_crew_id,
        stop_id: request.stop_id,
        service: request.service,
        note: request.note,
        requires_bid,
        manager_note: None,
        persisted: false,
    }
}

pub fn draft_day_plan_id(crew_id: &str, service_date: &str) -> String {
    format!("day_plan_{}_{}", service_date.replace('-', "_"), crew_id)
}

pub fn draft_stop_id(day_plan_id: &str, job_id: &str) -> String {
    format!("stop_{day_plan_id}_{job_id}")
}

#[cfg(test)]
pub fn local_draft_day_plan_response(request: &CreateDayPlanRequest) -> DayPlanMutationResponse {
    draft_day_plan_response(request, false)
}

pub fn local_published_day_plan_response(id: &str) -> DayPlanMutationResponse {
    let (service_date, crew_id) = day_plan_parts_from_id(id).unwrap_or_default();

    DayPlanMutationResponse {
        id: id.to_string(),
        crew_id,
        service_date,
        status: "published".to_string(),
        route_status: "manual".to_string(),
        persisted: false,
    }
}

fn draft_day_plan_response(
    request: &CreateDayPlanRequest,
    persisted: bool,
) -> DayPlanMutationResponse {
    DayPlanMutationResponse {
        id: draft_day_plan_id(&request.crew_id, &request.service_date),
        crew_id: request.crew_id.clone(),
        service_date: request.service_date.clone(),
        status: "draft".to_string(),
        route_status: "manual".to_string(),
        persisted,
    }
}

fn day_plan_parts_from_id(id: &str) -> Option<(String, String)> {
    let parts: Vec<&str> = id.strip_prefix("day_plan_")?.split('_').collect();
    if parts.len() < 4 {
        return None;
    }

    let service_date = format!("{}-{}-{}", parts[0], parts[1], parts[2]);
    let crew_id = parts[3..].join("_");

    Some((service_date, crew_id))
}

fn seed_day_plan(crew_id: &str) -> DayPlanSummary {
    DayPlanSummary {
        id: "day_plan_2026_06_15_crew_1001".to_string(),
        crew_id: crew_id.to_string(),
        crew_name: "North Route Crew".to_string(),
        service_date: "2026-06-15".to_string(),
        status: "published".to_string(),
        route_status: "manual".to_string(),
        stops: vec![
            DayPlanStop {
                id: "stop_1001".to_string(),
                job_id: "job_1001".to_string(),
                customer_name: "Sample Customer".to_string(),
                property_address: "123 Oak Street".to_string(),
                stop_order: 1,
                job_status: "scheduled".to_string(),
                stop_status: "pending".to_string(),
                estimated_drive_minutes: 12,
                estimated_service_minutes: 45,
            },
            DayPlanStop {
                id: "stop_1002".to_string(),
                job_id: "job_1002".to_string(),
                customer_name: "Demo Property Owner".to_string(),
                property_address: "456 Maple Avenue".to_string(),
                stop_order: 2,
                job_status: "in_progress".to_string(),
                stop_status: "pending".to_string(),
                estimated_drive_minutes: 8,
                estimated_service_minutes: 60,
            },
        ],
    }
}

#[cfg(test)]
mod tests {
    use super::{
        draft_day_plan_id, draft_stop_id, local_draft_day_plan_response,
        local_published_day_plan_response, seed_day_plan, validate_amendment_request,
        validate_amendment_review, AmendmentService, AssignDayPlanStopRequest,
        CreateDayPlanAmendmentRequest, CreateDayPlanRequest, DayPlanRepository,
        ReorderDayPlanStopsRequest, ReviewDayPlanAmendmentRequest,
    };

    #[test]
    fn seeded_day_plan_keeps_ordered_stops() {
        let day_plan = seed_day_plan("crew_1001");

        assert_eq!(day_plan.stops.len(), 2);
        assert_eq!(day_plan.stops[0].stop_order, 1);
        assert_eq!(day_plan.stops[1].stop_order, 2);
    }

    #[test]
    fn seeded_day_plan_includes_stop_status() {
        let day_plan = seed_day_plan("crew_1001");

        assert_eq!(day_plan.stops[0].stop_status, "pending");
        assert_eq!(day_plan.stops[1].stop_status, "pending");
    }

    #[test]
    fn amendment_validation_requires_stop_context_for_remove_requests() {
        let request = CreateDayPlanAmendmentRequest {
            amendment_type: "remove_stop".to_string(),
            requested_by_crew_id: "crew_1001".to_string(),
            stop_id: None,
            service: None,
            note: Some("Skip inaccessible property".to_string()),
        };

        assert!(validate_amendment_request(&request).is_err());
    }

    #[test]
    fn amendment_review_validation_accepts_bid_routing() {
        let request = ReviewDayPlanAmendmentRequest {
            decision: "send_to_bid_review".to_string(),
            manager_note: Some("Prepare a customer estimate.".to_string()),
        };

        assert!(validate_amendment_review(&request).is_ok());
    }

    #[test]
    fn amendment_review_validation_rejects_unknown_decisions() {
        let request = ReviewDayPlanAmendmentRequest {
            decision: "defer".to_string(),
            manager_note: None,
        };

        assert!(validate_amendment_review(&request).is_err());
    }

    #[test]
    fn amendment_validation_accepts_complete_extra_service_requests() {
        let request = CreateDayPlanAmendmentRequest {
            amendment_type: "add_service".to_string(),
            requested_by_crew_id: "crew_1001".to_string(),
            stop_id: Some("stop_1001".to_string()),
            service: Some(AmendmentService {
                id: "service_sprinkler_repair".to_string(),
                name: "Sprinkler repair".to_string(),
                description: None,
                default_duration_minutes: Some(30),
                default_price_cents: Some(8500),
                requires_manager_approval: true,
            }),
            note: Some("Broken sprinkler head".to_string()),
        };

        assert!(validate_amendment_request(&request).is_ok());
    }

    #[test]
    fn draft_day_plan_ids_are_stable_for_crew_and_date() {
        assert_eq!(
            draft_day_plan_id("crew_1001", "2026-06-16"),
            "day_plan_2026_06_16_crew_1001"
        );
    }

    #[test]
    fn draft_stop_ids_are_stable_for_day_plan_and_job() {
        assert_eq!(
            draft_stop_id("day_plan_2026_06_16_crew_1001", "job_1002"),
            "stop_day_plan_2026_06_16_crew_1001_job_1002"
        );
    }

    #[test]
    fn local_draft_day_plan_responses_are_manual_drafts() {
        let request = CreateDayPlanRequest {
            crew_id: "crew_1001".to_string(),
            service_date: "2026-06-16".to_string(),
        };

        let response = local_draft_day_plan_response(&request);

        assert_eq!(response.status, "draft");
        assert_eq!(response.route_status, "manual");
        assert!(!response.persisted);
    }

    #[test]
    fn local_published_day_plan_responses_parse_stable_ids() {
        let response = local_published_day_plan_response("day_plan_2026_06_16_crew_1001");

        assert_eq!(response.id, "day_plan_2026_06_16_crew_1001");
        assert_eq!(response.crew_id, "crew_1001");
        assert_eq!(response.service_date, "2026-06-16");
        assert_eq!(response.status, "published");
        assert_eq!(response.route_status, "manual");
        assert!(!response.persisted);
    }

    #[tokio::test]
    async fn repository_returns_seed_day_plan_without_database_pool() {
        let repository = DayPlanRepository::default();

        let day_plan = repository.today_for_crew("crew_2001").await;

        assert_eq!(day_plan.crew_id, "crew_2001");
        assert_eq!(day_plan.status, "published");
        assert_eq!(day_plan.stops.len(), 2);
        assert_eq!(day_plan.stops[0].stop_status, "pending");
    }

    #[tokio::test]
    async fn repository_assign_stop_falls_back_without_database_pool() {
        let repository = DayPlanRepository::default();
        let request = AssignDayPlanStopRequest {
            job_id: "job_2001".to_string(),
            estimated_drive_minutes: Some(14),
            estimated_service_minutes: Some(45),
        };

        let response = repository
            .assign_stop("day_plan_2026_06_16_crew_1001", request)
            .await;

        assert_eq!(response.day_plan_id, "day_plan_2026_06_16_crew_1001");
        assert_eq!(
            response.stop_id,
            "stop_day_plan_2026_06_16_crew_1001_job_2001"
        );
        assert_eq!(response.job_id, "job_2001");
        assert_eq!(response.stop_order, 0);
        assert!(!response.persisted);
    }

    #[tokio::test]
    async fn repository_remove_stop_falls_back_without_database_pool() {
        let repository = DayPlanRepository::default();

        let response = repository
            .remove_stop("day_plan_2026_06_16_crew_1001", "stop_1001")
            .await;

        assert_eq!(response.day_plan_id, "day_plan_2026_06_16_crew_1001");
        assert_eq!(response.stop_id, "stop_1001");
        assert!(!response.persisted);
    }

    #[tokio::test]
    async fn repository_reorder_stops_falls_back_without_database_pool() {
        let repository = DayPlanRepository::default();
        let request = ReorderDayPlanStopsRequest {
            stop_ids: vec!["stop_1002".to_string(), "stop_1001".to_string()],
        };

        let response = repository
            .reorder_stops("day_plan_2026_06_16_crew_1001", request)
            .await;

        assert_eq!(response.day_plan_id, "day_plan_2026_06_16_crew_1001");
        assert_eq!(
            response.stop_ids,
            vec!["stop_1002".to_string(), "stop_1001".to_string()]
        );
        assert!(!response.persisted);
    }
}
