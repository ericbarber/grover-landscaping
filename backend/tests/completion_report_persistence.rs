use grover_landscaping_api::{
    accounts::CustomerAccountSummary, completion_reports::build_completion_report,
    db::JobRepository,
};
use sqlx::{postgres::PgPoolOptions, Row};
mod common;

#[tokio::test]
async fn repository_persists_completion_report_state() {
    let Some(config) = common::database_config() else {
        return;
    };

    let repository = JobRepository::connect(&config)
        .await
        .expect("repository should connect and run migrations");
    let job = repository.get_job("job_1001".to_string()).await;
    let account = CustomerAccountSummary {
        job_id: "job_1001".to_string(),
        account_id: "acct_1001".to_string(),
        customer_name: "Sample Customer".to_string(),
        billing_model: "per_job".to_string(),
        payment_status: "pending".to_string(),
        service_approval_status: "approved".to_string(),
        contracted_services_per_period: 1,
        completed_services_this_period: 0,
        billing_notes: "Payment can be marked complete after service.".to_string(),
    };
    let report = build_completion_report(job, account, Vec::new(), Vec::new());

    let persistence = repository.persist_completion_report(&report).await;
    assert!(persistence.persisted);
    let share_token = persistence
        .share_token
        .expect("persisted report should receive a share token");

    let pool = PgPoolOptions::new()
        .max_connections(1)
        .connect(&config.database_url)
        .await
        .expect("test pool should connect");
    let row = sqlx::query(
        "SELECT id, report_status, ready_for_customer, checklist_progress FROM job_completion_reports WHERE job_id = $1",
    )
    .bind("job_1001")
    .fetch_one(&pool)
    .await
    .expect("completion report should be persisted");

    assert_eq!(row.get::<String, _>("id"), "report_job_1001");
    assert_eq!(row.get::<String, _>("report_status"), "draft");
    assert!(!row.get::<bool, _>("ready_for_customer"));
    assert_eq!(row.get::<i32, _>("checklist_progress"), 0);

    let shared_job_id = repository
        .job_id_for_report_share_token(&share_token)
        .await
        .expect("share token should resolve a job id");
    assert_eq!(shared_job_id, "job_1001");

    let second_persistence = repository.persist_completion_report(&report).await;
    assert_eq!(
        second_persistence.share_token.as_deref(),
        Some(share_token.as_str())
    );
}
