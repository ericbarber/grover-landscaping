use grover_landscaping_api::db::{ChecklistWriteResult, JobRepository};
mod common;

#[tokio::test]
async fn repository_persists_checklist_item_state_and_summary_count() {
    let Some(config) = common::database_config() else {
        return;
    };
    let repository = JobRepository::connect(&config)
        .await
        .expect("repository should connect and run migrations");

    assert_eq!(
        repository
            .update_checklist_item(
                "job_1001",
                "job_1001_yard_service",
                false,
                None,
                "integration_user",
            )
            .await,
        ChecklistWriteResult::Persisted,
    );
    let unchecked = repository.get_job("job_1001".to_string()).await;
    assert!(
        !unchecked
            .checklist
            .iter()
            .find(|item| item.id == "job_1001_yard_service")
            .expect("seeded checklist item should exist")
            .completed
    );
    assert_eq!(
        unchecked.completed_checklist_items,
        unchecked
            .checklist
            .iter()
            .filter(|item| item.completed)
            .count() as u32
    );

    assert_eq!(
        repository
            .update_checklist_item(
                "job_1001",
                "job_1001_yard_service",
                true,
                None,
                "integration_user",
            )
            .await,
        ChecklistWriteResult::Persisted,
    );
}

#[tokio::test]
async fn repository_deduplicates_offline_checklist_mutations() {
    let Some(config) = common::database_config() else {
        return;
    };
    let repository = JobRepository::connect(&config)
        .await
        .expect("repository should connect and run migrations");
    let mutation_id = uuid::Uuid::new_v4().to_string();

    let first = repository
        .update_checklist_item(
            "job_1001",
            "job_1001_yard_service",
            true,
            Some(&mutation_id),
            "integration_user",
        )
        .await;
    let replay = repository
        .update_checklist_item(
            "job_1001",
            "job_1001_yard_service",
            true,
            Some(&mutation_id),
            "integration_user",
        )
        .await;
    let conflict = repository
        .update_checklist_item(
            "job_1001",
            "job_1001_yard_service",
            false,
            Some(&mutation_id),
            "integration_user",
        )
        .await;

    assert_eq!(first, ChecklistWriteResult::Persisted);
    assert_eq!(replay, ChecklistWriteResult::Replayed);
    assert_eq!(conflict, ChecklistWriteResult::IdempotencyConflict);
}
