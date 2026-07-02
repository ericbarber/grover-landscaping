use grover_landscaping_api::db::JobRepository;
mod common;

#[tokio::test]
async fn repository_persists_stop_progress_to_postgres() {
    let Some(config) = common::database_config() else {
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
