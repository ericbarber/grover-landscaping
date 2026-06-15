#[path = "postgres_day_plans.rs"]
mod postgres_day_plans;

use crate::db::DatabaseConfig;
use serde::{Deserialize, Serialize};
use sqlx::{postgres::PgPoolOptions, PgPool};

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

#[derive(Clone, Debug, Serialize)]
pub struct DayPlanMutationResponse {
    pub id: String,
    pub crew_id: String,
    pub service_date: String,
    pub status: String,
    pub route_status: String,
    pub persisted: bool,
}

#[derive(Clone, Debug, Default)]
pub struct DayPlanRepository {
    pool: Option<PgPool>,
}

impl DayPlanRepository {
    pub fn new() -> Self {
        let pool = DatabaseConfig::from_env()
            .and_then(|config| PgPoolOptions::new().max_connections(5).connect_lazy(&config.database_url).ok());

        Self { pool }
    }

    pub async fn today_for_crew(&self, crew_id: &str) -> DayPlanSummary {
        if let Some(pool) = &self.pool {
            if let Ok(Some(day_plan)) = postgres_day_plans::today_for_crew(pool, crew_id).await {
                return day_plan;
            }
        }

        seed_day_plan(crew_id)
    }
}

pub fn draft_day_plan_id(crew_id: &str, service_date: &str) -> String {
    format!("day_plan_{}_{}", service_date.replace('-', "_"), crew_id)
}

pub fn local_draft_day_plan_response(request: &CreateDayPlanRequest) -> DayPlanMutationResponse {
    DayPlanMutationResponse {
        id: draft_day_plan_id(&request.crew_id, &request.service_date),
        crew_id: request.crew_id.clone(),
        service_date: request.service_date.clone(),
        status: "draft".to_string(),
        route_status: "manual".to_string(),
        persisted: false,
    }
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
    use super::{draft_day_plan_id, local_draft_day_plan_response, seed_day_plan, CreateDayPlanRequest};

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
    fn draft_day_plan_ids_are_stable_for_crew_and_date() {
        assert_eq!(
            draft_day_plan_id("crew_1001", "2026-06-16"),
            "day_plan_2026_06_16_crew_1001"
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
}
