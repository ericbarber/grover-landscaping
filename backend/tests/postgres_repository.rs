use grover_landscaping_api::db::{JobRepository, ResourceReadResult};
use sqlx::postgres::PgPoolOptions;
use sqlx::Row;
use std::time::Duration;
mod common;

#[tokio::test]
async fn repository_reads_migrated_seed_jobs_from_postgres() {
    let Some(config) = common::database_config() else {
        return;
    };

    let repository = JobRepository::connect(&config)
        .await
        .expect("repository should connect and run migrations");

    assert!(repository.is_database_ready());

    let ResourceReadResult::Loaded(jobs) = repository.list_jobs().await else {
        panic!("persisted jobs should load");
    };

    assert!(jobs.iter().any(|job| job.id == "job_1001"));
    assert!(jobs.iter().any(|job| job.id == "job_1002"));
}

#[tokio::test]
async fn repository_audits_account_views_for_persisted_jobs() {
    let Some(config) = common::database_config() else {
        return;
    };

    let repository = JobRepository::connect(&config)
        .await
        .expect("repository should connect and run migrations");
    let pool = repository
        .pool()
        .expect("database pool should be available");
    let actor_user_id = "user_account_view_audit";

    sqlx::query("DELETE FROM access_audit_events WHERE actor_user_id = $1")
        .bind(actor_user_id)
        .execute(&pool)
        .await
        .expect("account view audit rows should reset");

    assert_eq!(
        repository
            .record_account_view("job_1001", actor_user_id)
            .await,
        ResourceReadResult::Loaded(true)
    );
    assert_eq!(
        repository
            .record_account_view("job_missing_for_audit", actor_user_id)
            .await,
        ResourceReadResult::NotFound
    );

    let audit_row = sqlx::query(
        r#"
        SELECT actor_user_id, organization_id, event_kind, target_id
        FROM access_audit_events
        WHERE actor_user_id = $1
          AND event_kind = 'account_viewed'
        "#,
    )
    .bind(actor_user_id)
    .fetch_one(&pool)
    .await
    .expect("account view audit row should be available");

    assert_eq!(audit_row.get::<String, _>("actor_user_id"), actor_user_id);
    assert_eq!(
        audit_row.get::<String, _>("organization_id"),
        "org_demo_landscaping"
    );
    assert_eq!(audit_row.get::<String, _>("event_kind"), "account_viewed");
    assert_eq!(audit_row.get::<String, _>("target_id"), "job_1001");
}

#[tokio::test]
async fn repository_distinguishes_unavailable_account_view_auditing() {
    let pool = PgPoolOptions::new()
        .acquire_timeout(Duration::from_millis(100))
        .connect_lazy("postgres://grover:grover@127.0.0.1:1/grover_landscaping")
        .expect("unavailable test pool URL should be valid");
    let repository = JobRepository::from_pool(pool);

    assert_eq!(
        repository
            .record_account_view("job_1001", "user_account_view_outage")
            .await,
        ResourceReadResult::Unavailable
    );
}
