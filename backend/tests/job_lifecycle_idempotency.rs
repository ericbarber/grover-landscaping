use grover_landscaping_api::db::{JobLifecycleWriteResult, JobRepository};
mod common;

#[tokio::test]
async fn repository_deduplicates_offline_job_lifecycle_mutations() {
    let Some(config) = common::database_config() else {
        return;
    };
    let repository = JobRepository::connect(&config)
        .await
        .expect("repository should connect and run migrations");
    let start_mutation_id = uuid::Uuid::new_v4().to_string();

    let first = repository
        .start_job(
            "job_1001",
            Some(&start_mutation_id),
            "integration_user",
        )
        .await;
    let replay = repository
        .start_job(
            "job_1001",
            Some(&start_mutation_id),
            "integration_user",
        )
        .await;
    let conflicting_reuse = repository
        .complete_job(
            "job_1001",
            Some(&start_mutation_id),
            "integration_user",
        )
        .await;
    let completion_mutation_id = uuid::Uuid::new_v4().to_string();
    let completion = repository
        .complete_job(
            "job_1001",
            Some(&completion_mutation_id),
            "integration_user",
        )
        .await;

    assert_eq!(first, JobLifecycleWriteResult::Persisted);
    assert_eq!(replay, JobLifecycleWriteResult::Replayed);
    assert_eq!(
        conflicting_reuse,
        JobLifecycleWriteResult::IdempotencyConflict
    );
    assert_eq!(completion, JobLifecycleWriteResult::Persisted);
}
