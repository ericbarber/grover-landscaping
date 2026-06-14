use grover_landscaping_api::db::{DatabaseConfig, JobRepository};

#[tokio::test]
async fn repository_reads_migrated_seed_jobs_from_postgres() {
    let Some(config) = DatabaseConfig::from_env() else {
        return;
    };

    let repository = JobRepository::connect(&config)
        .await
        .expect("repository should connect and run migrations");

    assert!(repository.is_database_ready());

    let jobs = repository.list_jobs().await;

    assert!(jobs.iter().any(|job| job.id == "job_1001"));
    assert!(jobs.iter().any(|job| job.id == "job_1002"));
}
