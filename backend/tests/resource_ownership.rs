use grover_landscaping_api::db::{JobRepository, ResourceOwnershipResult, ResourceReadResult};
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
    assert!(matches!(
        repository.list_jobs().await,
        ResourceReadResult::Loaded(jobs) if jobs.iter().any(|job| job.id == "job_1001")
    ));
    assert!(matches!(
        repository.get_job("job_1001".to_string()).await,
        ResourceReadResult::Loaded(job) if job.id == "job_1001"
    ));
    assert!(matches!(
        repository.list_job_add_ons("job_1001").await,
        ResourceReadResult::Loaded(_)
    ));
    assert!(matches!(
        repository.get_job("job_missing".to_string()).await,
        ResourceReadResult::NotFound
    ));

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
    assert!(matches!(
        unavailable_repository.list_jobs().await,
        ResourceReadResult::Unavailable
    ));
    assert!(matches!(
        unavailable_repository.get_job("job_1001".to_string()).await,
        ResourceReadResult::Unavailable
    ));
    assert!(matches!(
        unavailable_repository.list_job_add_ons("job_1001").await,
        ResourceReadResult::Unavailable
    ));
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
    assert!(matches!(
        repository.list_jobs().await,
        ResourceReadResult::Loaded(jobs) if !jobs.is_empty()
    ));
    assert!(matches!(
        repository.get_job("job_1001".to_string()).await,
        ResourceReadResult::Loaded(job) if job.id == "job_1001"
    ));
    assert!(matches!(
        repository.list_job_add_ons("job_1001").await,
        ResourceReadResult::Loaded(add_ons) if add_ons.is_empty()
    ));
}
