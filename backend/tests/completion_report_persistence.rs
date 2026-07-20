use grover_landscaping_api::{
    accounts::CustomerAccountSummary,
    completion_reports::{
        apply_completion_report_persistence, attach_delivered_snapshot_metadata,
        build_completion_report, CompletionReportActionResult,
        CompletionReportDeliveryNotificationResult, COMPLETION_REPORT_SNAPSHOT_VERSION,
    },
    db::{JobRepository, ResourceReadResult},
};
use sqlx::postgres::PgPoolOptions;
use sqlx::Row;
use std::time::Duration;
mod common;

fn loaded<T>(result: ResourceReadResult<T>, context: &str) -> T {
    match result {
        ResourceReadResult::Loaded(value) => value,
        ResourceReadResult::NotFound => panic!("{context}: not found"),
        ResourceReadResult::Unavailable => panic!("{context}: unavailable"),
    }
}

#[tokio::test]
async fn repository_distinguishes_unavailable_completion_report_reads() {
    let pool = PgPoolOptions::new()
        .acquire_timeout(Duration::from_millis(100))
        .connect_lazy("postgres://grover:grover@127.0.0.1:1/grover_landscaping")
        .expect("unavailable test pool URL should be valid");
    let repository = JobRepository::from_pool(pool);

    assert!(matches!(
        repository
            .delivered_snapshot_for_report_share_token("share_outage")
            .await,
        ResourceReadResult::Unavailable
    ));
    assert!(matches!(
        repository
            .job_id_for_report_share_token("share_outage")
            .await,
        ResourceReadResult::Unavailable
    ));
    assert!(matches!(
        repository
            .list_delivered_completion_reports_for_property(
                "property_1001",
                &["org_demo_landscaping".to_string()],
            )
            .await,
        ResourceReadResult::Unavailable
    ));
}

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
    sqlx::query(
        "UPDATE customer_accounts SET contact_email = 'customer@example.com', email_notifications_enabled = TRUE, contact_phone = NULL, sms_notifications_enabled = FALSE, quiet_hours_start = NULL, quiet_hours_end = NULL WHERE id = 'acct_1001'",
    )
    .execute(&pool)
    .await
    .expect("customer notification fixture should reset");
    sqlx::query("DELETE FROM job_completion_report_status_history WHERE completion_report_id = $1")
        .bind("report_job_1001")
        .execute(&pool)
        .await
        .expect("prior completion report history should be removable");
    sqlx::query("DELETE FROM access_audit_events WHERE target_id = $1")
        .bind("report_job_1001")
        .execute(&pool)
        .await
        .expect("prior completion report audit events should be removable");
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
    sqlx::query("UPDATE job_checklist_items SET completed = false WHERE job_id = $1")
        .bind("job_1001")
        .execute(&pool)
        .await
        .expect("checklist fixture should reset");
    sqlx::query("UPDATE service_jobs SET completed_checklist_items = 0 WHERE id = $1")
        .bind("job_1001")
        .execute(&pool)
        .await
        .expect("job checklist summary fixture should reset");
    let ResourceReadResult::Loaded(job) = repository.get_job("job_1001".to_string()).await else {
        panic!("persisted job detail should load");
    };
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

    let property_reports = loaded(
        repository
            .list_delivered_completion_reports_for_property(
                "property_1001",
                &["org_demo_landscaping".to_string()],
            )
            .await,
        "property completion reports should load",
    );
    assert_eq!(property_reports.len(), 1);
    assert_eq!(property_reports[0].report_id, "report_job_1001");
    assert_eq!(property_reports[0].job_id, "job_1001");
    assert_eq!(property_reports[0].property_id, "property_1001");
    assert_eq!(property_reports[0].organization_id, "org_demo_landscaping");
    assert_eq!(
        property_reports[0].share_url,
        format!("/report-view/{share_token}")
    );

    let other_org_property_reports = loaded(
        repository
            .list_delivered_completion_reports_for_property(
                "property_1001",
                &["org_other".to_string()],
            )
            .await,
        "other organization property completion reports should load",
    );
    assert!(other_org_property_reports.is_empty());

    let ResourceReadResult::Loaded(delivered_job) =
        repository.get_job("job_1001".to_string()).await
    else {
        panic!("persisted delivered job detail should load");
    };
    let mut delivered_snapshot =
        build_completion_report(delivered_job, account.clone(), Vec::new(), Vec::new());
    apply_completion_report_persistence(&mut delivered_snapshot, delivered_persistence.clone());
    let delivered_snapshot = attach_delivered_snapshot_metadata(&delivered_snapshot);
    assert!(
        repository
            .store_delivered_completion_report_snapshot("report_job_1001", &delivered_snapshot)
            .await
    );

    sqlx::query("UPDATE service_jobs SET customer_name = 'Changed Customer' WHERE id = 'job_1001'")
        .execute(&pool)
        .await
        .expect("live job should be mutable after delivery");

    let stored_snapshot = loaded(
        repository
            .delivered_snapshot_for_report_share_token(&share_token)
            .await,
        "delivered snapshot should be readable by share token",
    );
    assert_eq!(
        stored_snapshot["job"]["customer_name"], "Sample Customer",
        "delivered snapshot should not reflect later live job edits"
    );
    assert_eq!(
        stored_snapshot["snapshot_metadata"]["snapshot_version"],
        COMPLETION_REPORT_SNAPSHOT_VERSION
    );
    assert_eq!(
        stored_snapshot["snapshot_metadata"]["report_id"],
        "report_job_1001"
    );
    assert_eq!(
        stored_snapshot["snapshot_metadata"]["evidence"]["before_photos"],
        1
    );
    assert_eq!(
        stored_snapshot["snapshot_metadata"]["evidence"]["after_photos"],
        1
    );
    sqlx::query("UPDATE service_jobs SET customer_name = 'Sample Customer' WHERE id = 'job_1001'")
        .execute(&pool)
        .await
        .expect("seed job name should be restored after snapshot assertion");

    let blocked_sms = repository
        .queue_completion_report_delivery_notification("report_job_1001", "sms", "+16025550123")
        .await;
    assert_eq!(
        blocked_sms,
        CompletionReportDeliveryNotificationResult::PreferenceBlocked
    );

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
        SELECT organization_id, template_key, status, payload->>'share_url' AS share_url
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
        notification_row.get::<String, _>("organization_id"),
        "org_demo_landscaping"
    );
    assert_eq!(
        notification_row.get::<String, _>("template_key"),
        "completion_report_delivery"
    );
    sqlx::query(
        r#"UPDATE customer_accounts
        SET quiet_hours_start = ((now() AT TIME ZONE 'America/Phoenix') - interval '1 minute')::time,
            quiet_hours_end = ((now() AT TIME ZONE 'America/Phoenix') + interval '1 hour')::time
        WHERE id = 'acct_1001'"#,
    )
    .execute(&pool)
    .await
    .expect("test quiet hours should cover the current local time");
    let deferred = repository
        .queue_completion_report_delivery_notification(
            "report_job_1001",
            "email",
            "CUSTOMER@EXAMPLE.COM",
        )
        .await;
    let CompletionReportDeliveryNotificationResult::Queued(deferred) = deferred else {
        panic!("enabled email delivery should queue during quiet hours");
    };
    let deferred_until: bool =
        sqlx::query_scalar("SELECT available_at > now() FROM notification_outbox WHERE id = $1")
            .bind(&deferred.notification_id)
            .fetch_one(&pool)
            .await
            .expect("quiet-hour delivery availability should be readable");
    assert!(deferred_until);
    sqlx::query(
        "UPDATE customer_accounts SET quiet_hours_start = NULL, quiet_hours_end = NULL WHERE id = 'acct_1001'",
    )
    .execute(&pool)
    .await
    .expect("test quiet hours should reset");
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

    let audit_row = sqlx::query(
        r#"
        SELECT actor_user_id, organization_id, event_kind, target_id, occurred_at::text AS occurred_at
        FROM access_audit_events
        WHERE target_id = $1
          AND event_kind = 'report_delivered'
        "#,
    )
    .bind("report_job_1001")
    .fetch_one(&pool)
    .await
    .expect("delivery audit event should be recorded");
    assert_eq!(audit_row.get::<String, _>("actor_user_id"), "manager_1001");
    assert_eq!(
        audit_row.get::<String, _>("organization_id"),
        "org_demo_landscaping"
    );
    assert_eq!(audit_row.get::<String, _>("event_kind"), "report_delivered");
    assert_eq!(audit_row.get::<String, _>("target_id"), "report_job_1001");
    assert!(audit_row.get::<String, _>("occurred_at").contains("20"));

    let report_audit_counts = sqlx::query_scalar::<_, String>(
        r#"
        SELECT string_agg(event_kind || ':' || audit_count, ',' ORDER BY event_kind)
        FROM (
            SELECT event_kind, COUNT(*)::text AS audit_count
            FROM access_audit_events
            WHERE target_id = $1
              AND event_kind IN (
                'report_review_started',
                'report_changes_requested',
                'report_resubmitted',
                'report_delivered'
              )
            GROUP BY event_kind
        ) report_audits
        "#,
    )
    .bind("report_job_1001")
    .fetch_one(&pool)
    .await
    .expect("report approval audit counts should be queryable");
    assert_eq!(
        report_audit_counts,
        "report_changes_requested:1,report_delivered:1,report_resubmitted:1,report_review_started:2"
    );

    let report_resubmit_actor = sqlx::query_scalar::<_, String>(
        r#"
        SELECT actor_user_id
        FROM access_audit_events
        WHERE target_id = $1
          AND event_kind = 'report_resubmitted'
        "#,
    )
    .bind("report_job_1001")
    .fetch_one(&pool)
    .await
    .expect("report resubmit audit actor should be queryable");
    assert_eq!(report_resubmit_actor, "crew_1001");

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
