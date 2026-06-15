use grover_landscaping_api::{
    day_plans::{CreateDayPlanRequest, DayPlanRepository},
    db::{DatabaseConfig, JobRepository},
};

#[tokio::test]
async fn repository_creates_draft_day_plan() {
    let Some(config) = DatabaseConfig::from_env() else {
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
    assert!(response.persisted);
}
