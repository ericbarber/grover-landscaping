use grover_landscaping_api::{
    db::JobRepository,
    notifications::NotificationResolveResult,
    notifications::NotificationRetryResult,
    notifications::{NotificationHistoryFilter, NotificationOutboxRepository},
};
use sqlx::Row;
use std::time::{SystemTime, UNIX_EPOCH};
mod common;

fn unique_id(prefix: &str) -> String {
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_nanos())
        .unwrap_or(0);
    format!("{prefix}_{nonce}")
}

#[tokio::test]
async fn dispatcher_claims_retries_dead_letters_and_records_receipts() {
    let Some(config) = common::database_config() else {
        return;
    };
    let jobs = JobRepository::connect(&config)
        .await
        .expect("repository should connect and run migrations");
    let pool = jobs.pool().expect("database pool should be available");
    let repository = NotificationOutboxRepository::from_pool(pool.clone());
    let organization_ids = vec!["org_demo_landscaping".to_string()];
    let manager_actor_user_id = "user_notification_recovery_audit";
    sqlx::query("DELETE FROM access_audit_events WHERE actor_user_id = $1")
        .bind(manager_actor_user_id)
        .execute(&pool)
        .await
        .expect("notification recovery audit rows should reset");

    let failed_id = unique_id("notification_retry_test");
    sqlx::query(
        r#"
        INSERT INTO notification_outbox (
            id, entity_type, entity_id, channel, recipient, template_key, payload, available_at
        )
        VALUES ($1, 'test', $1, 'email', 'test@example.com', 'test_template', '{}', '2000-01-01')
        "#,
    )
    .bind(&failed_id)
    .execute(&pool)
    .await
    .unwrap();

    let first_claim = repository.claim_batch(1, 2).await.unwrap();
    assert_eq!(first_claim[0].id, failed_id);
    assert_eq!(first_claim[0].attempt_count, 1);
    repository
        .mark_failed(&failed_id, 1, 2, "provider unavailable", Some(503))
        .await
        .unwrap();

    sqlx::query("UPDATE notification_outbox SET available_at = '2000-01-01' WHERE id = $1")
        .bind(&failed_id)
        .execute(&pool)
        .await
        .unwrap();
    let second_claim = repository.claim_batch(1, 2).await.unwrap();
    assert_eq!(second_claim[0].id, failed_id);
    assert_eq!(second_claim[0].attempt_count, 2);
    repository
        .mark_failed(&failed_id, 2, 2, "provider still unavailable", Some(503))
        .await
        .unwrap();

    let failed = sqlx::query(
        "SELECT status, attempt_count, provider_response_code, last_error FROM notification_outbox WHERE id = $1",
    )
    .bind(&failed_id)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(failed.get::<String, _>("status"), "dead_letter");
    assert_eq!(failed.get::<i32, _>("attempt_count"), 2);
    assert_eq!(
        failed.get::<Option<i32>, _>("provider_response_code"),
        Some(503)
    );

    let sent_id = unique_id("notification_receipt_test");
    sqlx::query(
        r#"
        INSERT INTO notification_outbox (
            id, entity_type, entity_id, channel, recipient, template_key, payload, available_at
        )
        VALUES ($1, 'test', $1, 'sms', '+16025550123', 'test_template', '{}', '1999-01-01')
        "#,
    )
    .bind(&sent_id)
    .execute(&pool)
    .await
    .unwrap();

    let sent_claim = repository.claim_batch(1, 2).await.unwrap();
    assert_eq!(sent_claim[0].id, sent_id);
    repository
        .mark_sent(&sent_id, 202, Some("provider-message-1001"))
        .await
        .unwrap();

    let sent = sqlx::query(
        "SELECT status, sent_at::text AS sent_at, provider_response_code, provider_message_id FROM notification_outbox WHERE id = $1",
    )
    .bind(&sent_id)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(sent.get::<String, _>("status"), "sent");
    assert!(sent.get::<Option<String>, _>("sent_at").is_some());
    assert_eq!(
        sent.get::<Option<i32>, _>("provider_response_code"),
        Some(202)
    );
    assert_eq!(
        sent.get::<Option<String>, _>("provider_message_id")
            .as_deref(),
        Some("provider-message-1001")
    );

    let sent_history = repository
        .list_history(NotificationHistoryFilter {
            organization_ids: organization_ids.clone(),
            entity_type: Some("test".to_string()),
            status: Some("sent".to_string()),
            limit: 10,
        })
        .await
        .unwrap();
    assert!(sent_history.iter().any(|item| {
        item.id == sent_id
            && item.status == "sent"
            && item.provider_response_code == Some(202)
            && item.provider_message_id.as_deref() == Some("provider-message-1001")
    }));

    let dead_letter_history = repository
        .list_history(NotificationHistoryFilter {
            organization_ids: organization_ids.clone(),
            entity_type: Some("test".to_string()),
            status: Some("dead_letter".to_string()),
            limit: 10,
        })
        .await
        .unwrap();
    assert!(dead_letter_history.iter().any(|item| {
        item.id == failed_id
            && item.status == "dead_letter"
            && item.attempt_count == 2
            && item.last_error.as_deref() == Some("provider still unavailable")
    }));

    let retry = repository
        .retry_failed(&failed_id, &organization_ids, manager_actor_user_id)
        .await
        .unwrap();
    assert!(matches!(
        retry,
        NotificationRetryResult::Retried(ref item)
            if item.id == failed_id && item.status == "queued" && item.attempt_count == 0
    ));

    let retried = sqlx::query(
        "SELECT status, attempt_count, last_error, provider_response_code FROM notification_outbox WHERE id = $1",
    )
    .bind(&failed_id)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(retried.get::<String, _>("status"), "queued");
    assert_eq!(retried.get::<i32, _>("attempt_count"), 0);
    assert!(retried.get::<Option<String>, _>("last_error").is_none());
    assert!(retried
        .get::<Option<i32>, _>("provider_response_code")
        .is_none());

    assert!(matches!(
        repository
            .retry_failed(&sent_id, &organization_ids, manager_actor_user_id)
            .await
            .unwrap(),
        NotificationRetryResult::InvalidStatus
    ));

    let other_org_id = unique_id("notification_other_org_retry_test");
    sqlx::query(
        r#"
        INSERT INTO notification_outbox (
            id, organization_id, entity_type, entity_id, channel, recipient, template_key, payload, status, attempt_count, last_error
        )
        VALUES ($1, 'org_other_landscaping', 'test', $1, 'email', 'other@example.com', 'test_template', '{}', 'dead_letter', 5, 'operator reviewed')
        "#,
    )
    .bind(&other_org_id)
    .execute(&pool)
    .await
    .unwrap();

    let other_org_history = repository
        .list_history(NotificationHistoryFilter {
            organization_ids: organization_ids.clone(),
            entity_type: Some("test".to_string()),
            status: Some("dead_letter".to_string()),
            limit: 100,
        })
        .await
        .unwrap();
    assert!(!other_org_history.iter().any(|item| item.id == other_org_id));
    assert!(matches!(
        repository
            .retry_failed(&other_org_id, &organization_ids, manager_actor_user_id)
            .await
            .unwrap(),
        NotificationRetryResult::NotFound
    ));

    let resolve_id = unique_id("notification_resolve_test");
    sqlx::query(
        r#"
        INSERT INTO notification_outbox (
            id, entity_type, entity_id, channel, recipient, template_key, payload, status, attempt_count, last_error
        )
        VALUES ($1, 'test', $1, 'email', 'resolve@example.com', 'test_template', '{}', 'dead_letter', 5, 'operator reviewed')
        "#,
    )
    .bind(&resolve_id)
    .execute(&pool)
    .await
    .unwrap();

    let resolution = repository
        .resolve_failed(
            &resolve_id,
            &organization_ids,
            manager_actor_user_id,
            Some("Customer confirmed by phone"),
        )
        .await
        .unwrap();
    assert!(matches!(
        resolution,
        NotificationResolveResult::Resolved(ref item)
            if item.id == resolve_id
                && item.status == "resolved"
                && item.last_error.as_deref() == Some("Customer confirmed by phone")
    ));

    let resolved_history = repository
        .list_history(NotificationHistoryFilter {
            organization_ids: organization_ids.clone(),
            entity_type: Some("test".to_string()),
            status: Some("resolved".to_string()),
            limit: 10,
        })
        .await
        .unwrap();
    assert!(resolved_history.iter().any(|item| {
        item.id == resolve_id
            && item.status == "resolved"
            && item.last_error.as_deref() == Some("Customer confirmed by phone")
    }));

    assert!(matches!(
        repository
            .resolve_failed(&sent_id, &organization_ids, manager_actor_user_id, None)
            .await
            .unwrap(),
        NotificationResolveResult::InvalidStatus
    ));
    assert!(matches!(
        repository
            .resolve_failed(
                &other_org_id,
                &organization_ids,
                manager_actor_user_id,
                None
            )
            .await
            .unwrap(),
        NotificationResolveResult::NotFound
    ));

    let audit_rows = sqlx::query(
        r#"
        SELECT actor_user_id, event_kind, target_id
        FROM access_audit_events
        WHERE actor_user_id = $1
          AND event_kind IN ('notification_retried', 'notification_resolved')
        ORDER BY event_kind, target_id
        "#,
    )
    .bind(manager_actor_user_id)
    .fetch_all(&pool)
    .await
    .expect("notification recovery audit rows should be available");
    assert!(audit_rows.iter().any(|row| {
        row.get::<String, _>("event_kind") == "notification_retried"
            && row.get::<String, _>("target_id") == failed_id
    }));
    assert!(audit_rows.iter().any(|row| {
        row.get::<String, _>("event_kind") == "notification_resolved"
            && row.get::<String, _>("target_id") == resolve_id
    }));
    assert!(audit_rows
        .iter()
        .all(|row| row.get::<String, _>("actor_user_id") == manager_actor_user_id));
}
