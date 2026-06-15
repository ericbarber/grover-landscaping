use grover_landscaping_api::{
    day_plans::DayPlanRepository,
    db::{DatabaseConfig, JobRepository},
};

#[tokio::test]
async fn day_plan_repository_reads_persisted_stop_status() {
    let Some(config) = DatabaseConfig::from_env() else {
        return;
    };

    let jobs = JobRepository::connect(&config)
        .await
        .expect("job repository should connect and run migrations");

    assert!(
        jobs.update_stop_progress(
            "day_plan_2026_06_15_crew_1001",
            "stop_1001",
            "finished",
        )
        .await
    );

    let day_plans = DayPlanRepository::new();
    let day_plan = day_plans.today_for_crew("crew_1001").await;

    let stop = day_plan
        .stops
        .iter()
        .find(|stop| stop.id == "stop_1001")
        .expect("seeded stop should be present");

    assert_eq!(stop.stop_status, "finished");
}
