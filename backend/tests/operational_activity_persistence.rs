use grover_landscaping_api::organizations::OrganizationRepository;
use sqlx::postgres::PgPoolOptions;
use uuid::Uuid;

mod common;

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
    sqlx::query(
        r#"
        INSERT INTO access_audit_events (
            id, actor_user_id, organization_id, event_kind, target_id, occurred_at
        )
        VALUES ($1, 'manager_operational_test', 'org_demo_landscaping',
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

    let repository = OrganizationRepository::from_pool(pool.clone());
    let activity = repository
        .list_operational_activity(&["org_demo_landscaping".to_string()])
        .await;

    assert!(activity.iter().any(|item| {
        item.id == audit_id
            && item.event_kind == "report_review_started"
            && item.target_id == "report_operational_test"
    }));
    assert!(activity.iter().any(|item| {
        item.event_kind == "route_published"
            && item.target_id == "day_plan_2026_06_15_crew_1001"
            && item.metadata["crew_id"] == "crew_1001"
    }));
    assert!(activity
        .iter()
        .any(|item| item.id == bid_audit_id && item.event_kind == "bid_approved"));
    assert!(activity.iter().any(|item| {
        item.id == photo_audit_id && item.event_kind == "photo_processing_retried"
    }));
    assert!(repository
        .list_operational_activity(&["org_missing".to_string()])
        .await
        .is_empty());
    let bid_page = repository
        .list_operational_activity_page(
            &["org_demo_landscaping".to_string()],
            Some("bid_approved"),
            None,
            1,
        )
        .await;
    assert_eq!(bid_page.len(), 1);
    assert_eq!(bid_page[0].event_kind, "bid_approved");
    assert!(repository
        .list_operational_activity_page(
            &["org_demo_landscaping".to_string()],
            None,
            Some("2000-01-01T00:00:00Z"),
            25,
        )
        .await
        .is_empty());

    sqlx::query("DELETE FROM access_audit_events WHERE id = ANY($1)")
        .bind(vec![audit_id, bid_audit_id, photo_audit_id])
        .execute(&pool)
        .await
        .expect("report audit fixture should be removed");
}
