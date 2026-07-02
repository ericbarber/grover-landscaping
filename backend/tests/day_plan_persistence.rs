use grover_landscaping_api::{
    day_plans::{
        draft_day_plan_id, AssignDayPlanStopRequest, CreateDayPlanRequest, DayPlanRepository,
    },
    db::JobRepository,
};
use sqlx::postgres::PgPoolOptions;
mod common;

#[tokio::test]
async fn day_plan_repository_reads_persisted_stop_status() {
    let Some(config) = common::database_config() else {
        return;
    };

    let jobs = JobRepository::connect(&config)
        .await
        .expect("job repository should connect and run migrations");

    let pool = PgPoolOptions::new()
        .max_connections(1)
        .connect(&config.database_url)
        .await
        .expect("test pool should connect");
    let crew_id = "crew_stop_status_test";
    let service_date: String = sqlx::query_scalar("SELECT CURRENT_DATE::text")
        .fetch_one(&pool)
        .await
        .expect("database current date should be readable");
    let day_plan_id = draft_day_plan_id(crew_id, &service_date);

    sqlx::query("INSERT INTO crews (id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING")
        .bind(crew_id)
        .bind("Stop Status Test Crew")
        .execute(&pool)
        .await
        .expect("test crew should be present");
    sqlx::query("DELETE FROM day_plan_stops WHERE day_plan_id = $1")
        .bind(&day_plan_id)
        .execute(&pool)
        .await
        .expect("test day plan stops should reset");
    sqlx::query("DELETE FROM day_plans WHERE id = $1")
        .bind(&day_plan_id)
        .execute(&pool)
        .await
        .expect("test day plan should reset");

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
                estimated_drive_minutes: Some(12),
                estimated_service_minutes: Some(45),
            },
        )
        .await;

    assert!(assigned_stop.persisted);

    day_plans.publish_day_plan(&draft.id).await;

    assert!(
        jobs.update_stop_progress(&draft.id, &assigned_stop.stop_id, "finished",)
            .await
    );

    let day_plan = day_plans.today_for_crew(crew_id).await;

    let stop = day_plan
        .stops
        .iter()
        .find(|stop| stop.id == assigned_stop.stop_id)
        .expect("assigned stop should be present");

    assert_eq!(stop.stop_status, "finished");
}
