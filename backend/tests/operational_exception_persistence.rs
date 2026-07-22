use grover_landscaping_api::{
    db::JobRepository,
    operational_exceptions::{
        CreateOperationalExceptionRequest, OperationalExceptionCreateResult,
        OperationalExceptionFilter, OperationalExceptionListResult, OperationalExceptionRepository,
    },
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
async fn creates_filters_and_tenant_scopes_operational_exceptions_with_audit() {
    let Some(config) = common::database_config() else {
        return;
    };
    let jobs = JobRepository::connect(&config)
        .await
        .expect("repository should connect and run migrations");
    let pool = jobs.pool().expect("database pool should be available");
    let repository = OperationalExceptionRepository::from_pool(pool.clone());
    let organization_id = unique_id("org_exception_test");
    let actor_user_id = unique_id("user_exception_manager");

    sqlx::query(
        "INSERT INTO organizations (id, display_name, organization_type, status) VALUES ($1, 'Exception Test', 'yard_care_company', 'active')",
    )
    .bind(&organization_id)
    .execute(&pool)
    .await
    .unwrap();

    let created = repository
        .create(
            CreateOperationalExceptionRequest {
                organization_id: organization_id.clone(),
                category: "equipment".to_string(),
                priority: "critical".to_string(),
                title: "Mower hydraulic failure".to_string(),
                description: Some("Crew stopped work and isolated the equipment.".to_string()),
                affected_resource_type: Some("crew".to_string()),
                affected_resource_id: Some("crew_1001".to_string()),
                assigned_user_id: Some("user_operations_manager".to_string()),
            },
            &actor_user_id,
        )
        .await
        .unwrap();
    let OperationalExceptionCreateResult::Created(created) = created else {
        panic!("persistent repository should create the exception");
    };
    assert_eq!(created.organization_id, organization_id);
    assert_eq!(created.status, "open");
    assert_eq!(created.reported_by_user_id, actor_user_id);

    let visible = repository
        .list(OperationalExceptionFilter {
            organization_ids: vec![organization_id.clone()],
            organization_id: Some(organization_id.clone()),
            category: Some("equipment".to_string()),
            priority: Some("critical".to_string()),
            status: Some("open".to_string()),
            limit: 10,
        })
        .await
        .unwrap();
    assert!(matches!(
        visible,
        OperationalExceptionListResult::Loaded(ref items)
            if items.len() == 1 && items[0].id == created.id
    ));

    let hidden = repository
        .list(OperationalExceptionFilter {
            organization_ids: vec!["org_demo_landscaping".to_string()],
            limit: 10,
            ..OperationalExceptionFilter::default()
        })
        .await
        .unwrap();
    assert!(matches!(
        hidden,
        OperationalExceptionListResult::Loaded(ref items) if items.is_empty()
    ));

    let audit = sqlx::query(
        "SELECT actor_user_id, organization_id, event_kind, target_id, metadata FROM access_audit_events WHERE target_id = $1",
    )
    .bind(&created.id)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(audit.get::<String, _>("actor_user_id"), actor_user_id);
    assert_eq!(audit.get::<String, _>("organization_id"), organization_id);
    assert_eq!(
        audit.get::<String, _>("event_kind"),
        "operational_exception_created"
    );
    assert_eq!(audit.get::<String, _>("target_id"), created.id);
    assert_eq!(
        audit.get::<serde_json::Value, _>("metadata")["category"],
        "equipment"
    );

    sqlx::query("DELETE FROM access_audit_events WHERE target_id = $1")
        .bind(&created.id)
        .execute(&pool)
        .await
        .unwrap();
    sqlx::query("DELETE FROM organizations WHERE id = $1")
        .bind(&organization_id)
        .execute(&pool)
        .await
        .unwrap();
}
