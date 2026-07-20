use grover_landscaping_api::db::{JobRepository, ResourceOwnershipResult};
use sqlx::postgres::PgPoolOptions;
use std::time::Duration;
mod common;

#[tokio::test]
async fn repository_fails_persisted_job_and_report_ownership_lookups_closed() {
    let Some(config) = common::database_config() else {
        return;
    };
    let repository = JobRepository::connect(&config)
        .await
        .expect("repository should connect and run migrations");

    assert_eq!(
        repository.organization_id_for_job("job_1001").await,
        ResourceOwnershipResult::Loaded(Some("org_demo_landscaping".to_string()))
    );
    assert_eq!(
        repository.organization_id_for_job("job_missing").await,
        ResourceOwnershipResult::Loaded(None)
    );
    assert_eq!(
        repository
            .organization_id_for_completion_report("report_missing")
            .await,
        ResourceOwnershipResult::Loaded(None)
    );

    let unavailable_pool = PgPoolOptions::new()
        .acquire_timeout(Duration::from_millis(100))
        .connect_lazy("postgres://grover:grover@127.0.0.1:1/grover_landscaping")
        .expect("unavailable test pool URL should be valid");
    let unavailable_repository = JobRepository::from_pool(unavailable_pool);

    assert_eq!(
        unavailable_repository
            .organization_id_for_job("job_1001")
            .await,
        ResourceOwnershipResult::Unavailable
    );
    assert_eq!(
        unavailable_repository
            .organization_id_for_completion_report("report_job_1001")
            .await,
        ResourceOwnershipResult::Unavailable
    );
}

#[tokio::test]
async fn repository_retains_demo_job_and_report_ownership_without_database_pool() {
    let repository = JobRepository::default();

    assert_eq!(
        repository.organization_id_for_job("job_1001").await,
        ResourceOwnershipResult::Loaded(Some("org_demo_landscaping".to_string()))
    );
    assert_eq!(
        repository
            .organization_id_for_completion_report("report_job_1001")
            .await,
        ResourceOwnershipResult::Loaded(Some("org_demo_landscaping".to_string()))
    );
}
