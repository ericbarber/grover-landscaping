use grover_landscaping_api::{
    accounts::CustomerAccountSummary,
    completion_reports::{
        apply_completion_report_persistence, build_completion_report, CompletionReportActionResult,
        CompletionReportDeliveryNotificationResult,
    },
    db::JobRepository,
};
use sqlx::Row;
mod common;

#[tokio::test]
async fn repository_persists_completion_report_state() {
    let Some(config) = common::database_config() else {
        return;
    };

    let repository = JobRepository::connect(&config)
        .await
        .expect("repository should connect and run migrations");
    let pool = repository
        .pool()
        .expect("repository should expose its pool");
    sqlx::query("DELETE FROM job_completion_report_status_history WHERE completion_report_id = $1")
        .bind("report_job_1001")
        .execute(&pool)
        .await
        .expect("prior completion report history should be removable");
    sqlx::query("DELETE FROM notification_outbox WHERE entity_type = 'completion_report' AND entity_id = $1")
        .bind("report_job_1001")
        .execute(&pool)
        .await
        .expect("prior completion report notifications should be removable");
    sqlx::query("DELETE FROM job_completion_reports WHERE job_id = $1")
        .bind("job_1001")
        .execute(&pool)
        .await
        .expect("prior completion report should be removable");
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
    let report = build_completion_report(job, account.clone(), Vec::new(), Vec::new());

    let persistence = repository.persist_completion_report(&report).await;
    assert!(persistence.persisted);
    assert_eq!(persistence.report_status.as_deref(), Some("draft"));
    assert_eq!(persistence.share_token, None);

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

    sqlx::query(
        r#"
        UPDATE job_completion_reports
        SET report_status = 'submitted',
            submitted_at = now(),
            ready_for_customer = true,
            checklist_progress = 100,
            before_photos = 1,
            after_photos = 1
        WHERE id = $1
        "#,
    )
    .bind("report_job_1001")
    .execute(&pool)
    .await
    .expect("report should be prepared for manager review");

    let review = repository
        .start_completion_report_review("report_job_1001", "manager_1001")
        .await;
    assert!(matches!(
        review,
        CompletionReportActionResult::Updated(ref response)
            if response.report_status == "in_review" && response.persisted
    ));

    let second_persistence = repository.persist_completion_report(&report).await;
    assert_eq!(
        second_persistence.report_status.as_deref(),
        Some("in_review")
    );
    assert_eq!(second_persistence.share_token, None);

    let request_changes = repository
        .request_completion_report_changes(
            "report_job_1001",
            "manager_1001",
            Some("Please add a clearer after photo."),
        )
        .await;
    assert!(matches!(
        request_changes,
        CompletionReportActionResult::Updated(ref response)
            if response.report_status == "changes_requested" && response.share_url.is_none()
    ));

    let change_reason: String = sqlx::query_scalar(
        "SELECT change_reason FROM job_completion_report_status_history WHERE completion_report_id = $1 AND from_status = 'in_review' AND to_status = 'changes_requested'",
    )
    .bind("report_job_1001")
    .fetch_one(&pool)
    .await
    .expect("change request reason should be queryable");
    assert_eq!(change_reason, "Please add a clearer after photo.");

    let resubmitted = repository
        .resubmit_completion_report("report_job_1001", "crew_1001")
        .await;
    assert!(matches!(
        resubmitted,
        CompletionReportActionResult::Updated(ref response)
            if response.report_status == "submitted" && response.share_url.is_none()
    ));

    let after_resubmit = repository.persist_completion_report(&report).await;
    assert_eq!(after_resubmit.report_status.as_deref(), Some("submitted"));

    let second_review = repository
        .start_completion_report_review("report_job_1001", "manager_1001")
        .await;
    assert!(matches!(
        second_review,
        CompletionReportActionResult::Updated(ref response)
            if response.report_status == "in_review" && response.persisted
    ));

    sqlx::query(
        r#"
        UPDATE job_completion_reports
        SET report_status = 'in_review',
            reviewed_at = now(),
            ready_for_customer = true,
            checklist_progress = 100,
            before_photos = 1,
            after_photos = 1
        WHERE id = $1
        "#,
    )
    .bind("report_job_1001")
    .execute(&pool)
    .await
    .expect("report should be made ready for delivery");

    let delivery = repository
        .deliver_completion_report("report_job_1001", "manager_1001")
        .await;
    assert!(matches!(
        delivery,
        CompletionReportActionResult::Updated(ref response)
            if response.report_status == "delivered" && response.share_url.is_some()
    ));

    let delivered_persistence = repository.persist_completion_report(&report).await;
    assert_eq!(
        delivered_persistence.report_status.as_deref(),
        Some("delivered")
    );
    assert!(delivered_persistence.share_token.is_some());
    let share_token = delivered_persistence.share_token.clone().unwrap();

    let mut delivered_snapshot = build_completion_report(
        repository.get_job("job_1001".to_string()).await,
        account.clone(),
        Vec::new(),
        Vec::new(),
    );
    apply_completion_report_persistence(&mut delivered_snapshot, delivered_persistence.clone());
    assert!(
        repository
            .store_delivered_completion_report_snapshot("report_job_1001", &delivered_snapshot)
            .await
    );

    sqlx::query("UPDATE service_jobs SET customer_name = 'Changed Customer' WHERE id = 'job_1001'")
        .execute(&pool)
        .await
        .expect("live job should be mutable after delivery");

    let stored_snapshot = repository
        .delivered_snapshot_for_report_share_token(&share_token)
        .await
        .expect("delivered snapshot should be readable by share token");
    assert_eq!(
        stored_snapshot["job"]["customer_name"], "Sample Customer",
        "delivered snapshot should not reflect later live job edits"
    );
    sqlx::query("UPDATE service_jobs SET customer_name = 'Sample Customer' WHERE id = 'job_1001'")
        .execute(&pool)
        .await
        .expect("seed job name should be restored after snapshot assertion");

    let notification = repository
        .queue_completion_report_delivery_notification(
            "report_job_1001",
            "email",
            "customer@example.com",
        )
        .await;
    assert!(matches!(
        notification,
        CompletionReportDeliveryNotificationResult::Queued(ref response)
            if response.channel == "email"
                && response.recipient == "customer@example.com"
                && response.share_url == format!("/report-view/{share_token}")
    ));

    let notification_row = sqlx::query(
        r#"
        SELECT template_key, status, payload->>'share_url' AS share_url
        FROM notification_outbox
        WHERE entity_type = 'completion_report'
          AND entity_id = $1
        "#,
    )
    .bind("report_job_1001")
    .fetch_one(&pool)
    .await
    .expect("completion report delivery notification should be queued");
    assert_eq!(
        notification_row.get::<String, _>("template_key"),
        "completion_report_delivery"
    );
    assert_eq!(notification_row.get::<String, _>("status"), "queued");
    assert_eq!(
        notification_row.get::<String, _>("share_url"),
        format!("/report-view/{share_token}")
    );

    let delivered_row = sqlx::query(
        "SELECT report_status, ready_for_customer, checklist_progress, before_photos, after_photos, delivered_by_user_id, delivered_at FROM job_completion_reports WHERE id = $1",
    )
    .bind("report_job_1001")
    .fetch_one(&pool)
    .await
    .expect("delivered report should be queryable");
    assert_eq!(delivered_row.get::<String, _>("report_status"), "delivered");
    assert!(delivered_row.get::<bool, _>("ready_for_customer"));
    assert_eq!(delivered_row.get::<i32, _>("checklist_progress"), 100);
    assert_eq!(delivered_row.get::<i32, _>("before_photos"), 1);
    assert_eq!(delivered_row.get::<i32, _>("after_photos"), 1);
    assert_eq!(
        delivered_row.get::<String, _>("delivered_by_user_id"),
        "manager_1001"
    );

    let history_count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM job_completion_report_status_history WHERE completion_report_id = $1 AND from_status = 'submitted' AND to_status = 'in_review'",
    )
    .bind("report_job_1001")
    .fetch_one(&pool)
    .await
    .expect("manager review history should be queryable");
    assert_eq!(history_count, 2);

    let resubmit_history_count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM job_completion_report_status_history WHERE completion_report_id = $1 AND from_status = 'changes_requested' AND to_status = 'submitted'",
    )
    .bind("report_job_1001")
    .fetch_one(&pool)
    .await
    .expect("resubmit history should be queryable");
    assert_eq!(resubmit_history_count, 1);

    let delivery_history_count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM job_completion_report_status_history WHERE completion_report_id = $1 AND from_status = 'in_review' AND to_status = 'delivered'",
    )
    .bind("report_job_1001")
    .fetch_one(&pool)
    .await
    .expect("delivery history should be queryable");
    assert_eq!(delivery_history_count, 1);
}
