use grover_landscaping_api::db::{JobRepository, StopProgressWriteResult};
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
        .update_stop_progress(
            "day_plan_2026_06_15_crew_1001",
            "stop_1001",
            "finished",
            None,
            "integration_user",
        )
        .await;

    assert_eq!(persisted, StopProgressWriteResult::Persisted);
}

#[tokio::test]
async fn repository_deduplicates_offline_stop_progress_mutations() {
    let Some(config) = common::database_config() else {
        return;
    };
    let repository = JobRepository::connect(&config)
        .await
        .expect("repository should connect and run migrations");
    let mutation_id = uuid::Uuid::new_v4().to_string();

    let first = repository
        .update_stop_progress(
            "day_plan_2026_06_15_crew_1001",
            "stop_1001",
            "in_progress",
            Some(&mutation_id),
            "integration_user",
        )
        .await;
    let replay = repository
        .update_stop_progress(
            "day_plan_2026_06_15_crew_1001",
            "stop_1001",
            "in_progress",
            Some(&mutation_id),
            "integration_user",
        )
        .await;
    let conflicting_reuse = repository
        .update_stop_progress(
            "day_plan_2026_06_15_crew_1001",
            "stop_1001",
            "finished",
            Some(&mutation_id),
            "integration_user",
        )
        .await;

    assert_eq!(first, StopProgressWriteResult::Persisted);
    assert_eq!(replay, StopProgressWriteResult::Replayed);
    assert_eq!(
        conflicting_reuse,
        StopProgressWriteResult::IdempotencyConflict
    );
}
