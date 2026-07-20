use grover_landscaping_api::{
    accounts::{
        AccountRepository, CustomerAccountListResult, CustomerAccountSummaryResult,
        CustomerPropertyListResult,
    },
    db::JobRepository,
};
use sqlx::postgres::PgPoolOptions;
use std::time::Duration;
mod common;

#[tokio::test]
async fn repository_reads_persisted_job_account_summary() {
    let Some(config) = common::database_config() else {
        return;
    };
    let jobs = JobRepository::connect(&config)
        .await
        .expect("repository should connect and run migrations");
    let repository =
        AccountRepository::from_pool(jobs.pool().expect("database pool should be available"));

    let CustomerAccountSummaryResult::Loaded(summary) =
        repository.get_account_for_job("job_1001").await
    else {
        panic!("persisted job-account summary should load");
    };

    assert_eq!(summary.account_id, "acct_1001");
    assert_eq!(summary.customer_name, "Sample Customer");
    assert_eq!(summary.billing_model, "per_job");
    assert_eq!(summary.service_approval_status, "approved");
    assert!(matches!(
        repository.get_account_for_job("job_missing").await,
        CustomerAccountSummaryResult::NotFound
    ));
}

#[tokio::test]
async fn repository_distinguishes_unavailable_and_demo_job_account_summaries() {
    let unavailable_pool = PgPoolOptions::new()
        .acquire_timeout(Duration::from_millis(100))
        .connect_lazy("postgres://grover:grover@127.0.0.1:1/grover_landscaping")
        .expect("unavailable test pool URL should be valid");
    let unavailable_repository = AccountRepository::from_pool(unavailable_pool);
    assert!(matches!(
        unavailable_repository.get_account_for_job("job_1001").await,
        CustomerAccountSummaryResult::Unavailable
    ));

    let demo_repository = AccountRepository::default();
    let CustomerAccountSummaryResult::Loaded(summary) =
        demo_repository.get_account_for_job("job_1001").await
    else {
        panic!("no-database demo account summary should remain available");
    };
    assert_eq!(summary.account_id, "acct_1001");
}

#[tokio::test]
async fn repository_distinguishes_unavailable_and_demo_customer_account_lists() {
    let unavailable_pool = PgPoolOptions::new()
        .acquire_timeout(Duration::from_millis(100))
        .connect_lazy("postgres://grover:grover@127.0.0.1:1/grover_landscaping")
        .expect("unavailable test pool URL should be valid");
    let unavailable_repository = AccountRepository::from_pool(unavailable_pool);
    assert!(matches!(
        unavailable_repository
            .list(&["org_demo_landscaping".to_string()])
            .await,
        CustomerAccountListResult::Unavailable
    ));
    assert!(matches!(
        unavailable_repository
            .list_archived(&["org_demo_landscaping".to_string()])
            .await,
        CustomerAccountListResult::Unavailable
    ));
    assert!(matches!(
        unavailable_repository
            .list_properties("acct_1001", &["org_demo_landscaping".to_string()],)
            .await,
        CustomerPropertyListResult::Unavailable
    ));

    let demo_repository = AccountRepository::default();
    let CustomerAccountListResult::Loaded(accounts) = demo_repository
        .list(&["org_demo_landscaping".to_string()])
        .await
    else {
        panic!("no-database demo account list should remain available");
    };
    assert!(!accounts.is_empty());
}
