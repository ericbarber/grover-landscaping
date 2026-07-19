use grover_landscaping_api::{
    day_plans::{
        draft_day_plan_id, AssignDayPlanStopRequest, CreateDayPlanRequest, DayPlanRepository,
        ReorderDayPlanStopsRequest,
    },
    db::JobRepository,
};
use sqlx::{postgres::PgPoolOptions, PgPool, Row};
mod common;

async fn reset_day_plan_fixture(pool: &PgPool, day_plan_id: &str) {
    sqlx::query("DELETE FROM day_plan_amendment_requests WHERE day_plan_id = $1")
        .bind(day_plan_id)
        .execute(pool)
        .await
        .expect("test day plan amendments should reset");
    sqlx::query("DELETE FROM day_plan_stops WHERE day_plan_id = $1")
        .bind(day_plan_id)
        .execute(pool)
        .await
        .expect("test day plan stops should reset");
    sqlx::query("DELETE FROM day_plans WHERE id = $1")
        .bind(day_plan_id)
        .execute(pool)
        .await
        .expect("test day plan should reset");
}

#[tokio::test]
async fn repository_creates_draft_day_plan() {
    let Some(config) = common::database_config() else {
        return;
    };

    let _jobs = JobRepository::connect(&config)
        .await
        .expect("repository should connect and run migrations");

    let day_plans = DayPlanRepository::new();
    let response = day_plans
        .create_draft_day_plan(CreateDayPlanRequest {
            crew_id: "crew_1001".to_string(),
            service_date: "2026-06-16".to_string(),
        })
        .await;

    assert_eq!(response.id, "day_plan_2026_06_16_crew_1001");
    assert_eq!(response.status, "draft");
    assert_eq!(response.time_zone, "America/Phoenix");
    assert_eq!(
        response.service_area_label.as_deref(),
        Some("Phoenix metro")
    );
    assert_eq!(response.stop_capacity, 12);
    assert!(response.persisted);
}

#[tokio::test]
async fn repository_publishes_draft_day_plan() {
    let Some(config) = common::database_config() else {
        return;
    };

    let _jobs = JobRepository::connect(&config)
        .await
        .expect("repository should connect and run migrations");

    let pool = PgPoolOptions::new()
        .max_connections(1)
        .connect(&config.database_url)
        .await
        .expect("test pool should connect");
    reset_day_plan_fixture(&pool, "day_plan_2026_06_18_crew_1001").await;

    let day_plans = DayPlanRepository::new();
    let draft = day_plans
        .create_draft_day_plan(CreateDayPlanRequest {
            crew_id: "crew_1001".to_string(),
            service_date: "2026-06-18".to_string(),
        })
        .await;
    let assigned_stop = day_plans
        .assign_stop(
            &draft.id,
            AssignDayPlanStopRequest {
                job_id: "job_1001".to_string(),
                estimated_drive_minutes: Some(10),
                estimated_service_minutes: Some(45),
            },
        )
        .await;

    assert!(assigned_stop.persisted);

    let response = day_plans.publish_day_plan(&draft.id).await;

    assert_eq!(response.id, "day_plan_2026_06_18_crew_1001");
    assert_eq!(response.status, "published");
    assert_eq!(response.route_status, "manual");
    assert!(response.persisted);
}

#[tokio::test]
async fn repository_exposes_published_day_plan_to_crew_route() {
    let Some(config) = common::database_config() else {
        return;
    };

    let _jobs = JobRepository::connect(&config)
        .await
        .expect("repository should connect and run migrations");

    let pool = PgPoolOptions::new()
        .max_connections(1)
        .connect(&config.database_url)
        .await
        .expect("test pool should connect");
    let service_date: String = sqlx::query_scalar("SELECT CURRENT_DATE::text")
        .fetch_one(&pool)
        .await
        .expect("database current date should be readable");
    let crew_id = "crew_publish_route_test";
    let day_plan_id = draft_day_plan_id(crew_id, &service_date);

    sqlx::query("INSERT INTO crews (id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING")
        .bind(crew_id)
        .bind("Publish Route Test Crew")
        .execute(&pool)
        .await
        .expect("test crew should be present");
    reset_day_plan_fixture(&pool, &day_plan_id).await;

    let day_plans = DayPlanRepository::new();
    let draft = day_plans
        .create_draft_day_plan(CreateDayPlanRequest {
            crew_id: crew_id.to_string(),
            service_date,
        })
        .await;
    let assigned_stop = day_plans
        .assign_stop(
            &draft.id,
            AssignDayPlanStopRequest {
                job_id: "job_1001".to_string(),
                estimated_drive_minutes: Some(10),
                estimated_service_minutes: Some(45),
            },
        )
        .await;

    assert!(assigned_stop.persisted);

    let before_publish = day_plans.today_for_crew(crew_id).await;
    assert_ne!(before_publish.id, draft.id);

    let published = day_plans.publish_day_plan(&draft.id).await;
    assert!(published.persisted);

    let crew_route = day_plans.today_for_crew(crew_id).await;

    assert_eq!(crew_route.id, draft.id);
    assert_eq!(crew_route.status, "published");
    assert_eq!(crew_route.stops.len(), 1);
    assert_eq!(crew_route.stops[0].id, assigned_stop.stop_id);
}

#[tokio::test]
async fn repository_assigns_reorders_and_removes_day_plan_stops() {
    let Some(config) = common::database_config() else {
        return;
    };

    let _jobs = JobRepository::connect(&config)
        .await
        .expect("repository should connect and run migrations");

    let pool = PgPoolOptions::new()
        .max_connections(1)
        .connect(&config.database_url)
        .await
        .expect("test pool should connect");
    reset_day_plan_fixture(&pool, "day_plan_2026_06_20_crew_1001").await;

    let day_plans = DayPlanRepository::new();
    let draft = day_plans
        .create_draft_day_plan(CreateDayPlanRequest {
            crew_id: "crew_1001".to_string(),
            service_date: "2026-06-20".to_string(),
        })
        .await;

    let first_stop = day_plans
        .assign_stop(
            &draft.id,
            AssignDayPlanStopRequest {
                job_id: "job_1001".to_string(),
                estimated_drive_minutes: Some(10),
                estimated_service_minutes: Some(45),
            },
        )
        .await;
    let second_stop = day_plans
        .assign_stop(
            &draft.id,
            AssignDayPlanStopRequest {
                job_id: "job_1002".to_string(),
                estimated_drive_minutes: Some(8),
                estimated_service_minutes: Some(60),
            },
        )
        .await;

    assert!(first_stop.persisted);
    assert!(second_stop.persisted);
    assert_eq!(first_stop.stop_order, 1);
    assert_eq!(second_stop.stop_order, 2);

    let reorder = day_plans
        .reorder_stops(
            &draft.id,
            ReorderDayPlanStopsRequest {
                stop_ids: vec![second_stop.stop_id.clone(), first_stop.stop_id.clone()],
            },
        )
        .await;

    assert!(reorder.persisted);

    let removal = day_plans.remove_stop(&draft.id, &second_stop.stop_id).await;

    assert!(removal.persisted);

    let remaining_stop =
        sqlx::query("SELECT stop_order FROM day_plan_stops WHERE day_plan_id = $1 AND id = $2")
            .bind(&draft.id)
            .bind(&first_stop.stop_id)
            .fetch_one(&pool)
            .await
            .expect("remaining assigned stop should be present");

    assert_eq!(remaining_stop.get::<i32, _>("stop_order"), 1);

    let final_removal = day_plans.remove_stop(&draft.id, &first_stop.stop_id).await;
    assert!(final_removal.persisted);
}
