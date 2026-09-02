use grover_landscaping_api::organizations::{OrganizationCollectionResult, OrganizationRepository};
use sqlx::postgres::PgPoolOptions;
use uuid::Uuid;

mod common;

fn loaded<T>(result: OrganizationCollectionResult<T>, context: &str) -> Vec<T> {
    match result {
        OrganizationCollectionResult::Loaded(items) => items,
        OrganizationCollectionResult::Unavailable => panic!("{context}: unavailable"),
    }
}

#[tokio::test]
async fn repository_lists_tenant_scoped_operational_activity() {
    let Some(config) = common::database_config() else {
        return;
    };
    let pool = PgPoolOptions::new()
        .max_connections(1)
        .connect(&config.database_url)
        .await
        .expect("test pool should connect");
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("migrations should run");

    let audit_id = format!("audit_operational_{}", Uuid::new_v4().simple());
    let bid_audit_id = format!("audit_operational_bid_{}", Uuid::new_v4().simple());
    let photo_audit_id = format!("audit_operational_photo_{}", Uuid::new_v4().simple());
    let exception_id = format!("exception_operational_{}", Uuid::new_v4().simple());
    let exception_event_kinds = [
        "operational_exception_created",
        "operational_exception_assign",
        "operational_exception_start",
        "operational_exception_resolve",
        "operational_exception_reopen",
    ];
    let mut exception_audit_ids = Vec::new();
    sqlx::query(
        r#"
        INSERT INTO access_audit_events (
            id, actor_user_id, organization_id, event_kind, target_id, occurred_at
        )
        VALUES ($1, 'local-development-user', 'org_demo_landscaping',
            'report_review_started', 'report_operational_test', now())
        "#,
    )
    .bind(&audit_id)
    .execute(&pool)
    .await
    .expect("report audit fixture should be inserted");
    sqlx::query(
        r#"
        INSERT INTO access_audit_events (
            id, actor_user_id, organization_id, event_kind, target_id, occurred_at
        )
        VALUES
            ($1, 'customer_operational_test', 'org_demo_landscaping',
                'bid_approved', 'bid_operational_test', now()),
            ($2, 'manager_operational_test', 'org_demo_landscaping',
                'photo_processing_retried', 'photo_operational_test', now())
        "#,
    )
    .bind(&bid_audit_id)
    .bind(&photo_audit_id)
    .execute(&pool)
    .await
    .expect("bid and photo audit fixtures should be inserted");
    for event_kind in exception_event_kinds {
        let exception_audit_id = format!("audit_{event_kind}_{}", Uuid::new_v4().simple());
        sqlx::query(
            r#"
            INSERT INTO access_audit_events (
                id, actor_user_id, organization_id, event_kind, target_id, metadata, occurred_at
            )
            VALUES ($1, 'local-development-user', 'org_demo_landscaping', $2, $3,
                '{"title":"Blocked gate access","previous_status":"in_progress","status":"resolved","resolution_note":"Customer supplied a working code."}', now())
            "#,
        )
        .bind(&exception_audit_id)
        .bind(event_kind)
        .bind(&exception_id)
        .execute(&pool)
        .await
        .expect("operational exception audit fixture should be inserted");
        exception_audit_ids.push(exception_audit_id);
    }

    let repository = OrganizationRepository::from_pool(pool.clone());
    let activity = loaded(
        repository
            .list_operational_activity(&["org_demo_landscaping".to_string()])
            .await,
        "operational activity should load",
    );

    assert!(activity.iter().any(|item| {
        item.id == audit_id
            && item.event_kind == "report_review_started"
            && item.target_id == "report_operational_test"
            && item.actor_label == "Local Development Owner"
    }));
    assert!(activity
        .iter()
        .any(|item| item.id == bid_audit_id && item.event_kind == "bid_approved"));
    assert!(activity.iter().any(|item| {
        item.id == photo_audit_id && item.event_kind == "photo_processing_retried"
    }));
    for event_kind in exception_event_kinds {
        assert!(activity.iter().any(|item| {
            item.target_id == exception_id
                && item.event_kind == event_kind
                && item.actor_label == "Local Development Owner"
                && item.metadata["title"] == "Blocked gate access"
        }));
    }
    assert!(loaded(
        repository
            .list_operational_activity(&["org_missing".to_string()])
            .await,
        "missing organization activity should load",
    )
    .is_empty());
    let bid_page = loaded(
        repository
            .list_operational_activity_page(
                &["org_demo_landscaping".to_string()],
                Some("bid_approved"),
                None,
                1,
            )
            .await,
        "filtered operational activity should load",
    );
    assert_eq!(bid_page.len(), 1);
    assert_eq!(bid_page[0].event_kind, "bid_approved");
    let exception_page = loaded(
        repository
            .list_operational_activity_page(
                &["org_demo_landscaping".to_string()],
                Some("operational_exception_resolve"),
                None,
                1,
            )
            .await,
        "filtered exception activity should load",
    );
    assert_eq!(exception_page.len(), 1);
    assert_eq!(exception_page[0].target_id, exception_id);
    assert_eq!(
        exception_page[0].metadata["resolution_note"],
        "Customer supplied a working code."
    );
    assert!(loaded(
        repository
            .list_operational_activity_page(
                &["org_demo_landscaping".to_string()],
                None,
                Some("2000-01-01T00:00:00Z"),
                25,
            )
            .await,
        "older operational activity should load",
    )
    .is_empty());

    sqlx::query("DELETE FROM access_audit_events WHERE id = ANY($1)")
        .bind(
            [audit_id, bid_audit_id, photo_audit_id]
                .into_iter()
                .chain(exception_audit_ids)
                .collect::<Vec<_>>(),
        )
        .execute(&pool)
        .await
        .expect("report audit fixture should be removed");
}
