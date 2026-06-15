#[path = "postgres_day_plans.rs"]
mod postgres_day_plans;

use crate::db::DatabaseConfig;
use serde::Serialize;
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
