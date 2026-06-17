use grover_landscaping_api::db::{DatabaseConfig, JobRepository};

#[tokio::test]
async fn repository_persists_stop_progress_to_postgres() {
    let Some(config) = DatabaseConfig::from_env() else {
        return;
    };

    let repository = JobRepository::connect(&config)
        .await
        .expect("repository should connect and run migrations");

    let persisted = repository
        .update_stop_progress("day_plan_2026_06_15_crew_1001", "stop_1001", "finished")
        .await;

    assert!(persisted);
}
