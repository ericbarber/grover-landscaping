use grover_landscaping_api::{
    db::JobRepository,
    operational_exceptions::{
        CreateOperationalExceptionRequest, OperationalExceptionCreateResult,
        OperationalExceptionFilter, OperationalExceptionListResult, OperationalExceptionRepository,
        OperationalExceptionUpdateResult, UpdateOperationalExceptionRequest,
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

    let hidden_update = repository
        .update(
            &created.id,
            &["org_demo_landscaping".to_string()],
            UpdateOperationalExceptionRequest {
                action: "start".to_string(),
                assigned_user_id: None,
                resolution_note: None,
                expected_updated_at: created.updated_at.clone(),
            },
            &actor_user_id,
        )
        .await
        .unwrap();
    assert_eq!(hidden_update, OperationalExceptionUpdateResult::NotFound);

    let assigned = repository
        .update(
            &created.id,
            std::slice::from_ref(&organization_id),
            UpdateOperationalExceptionRequest {
                action: "assign".to_string(),
                assigned_user_id: Some("user_dispatch_manager".to_string()),
                resolution_note: None,
                expected_updated_at: created.updated_at.clone(),
            },
            &actor_user_id,
        )
        .await
        .unwrap();
    let OperationalExceptionUpdateResult::Updated(assigned) = assigned else {
        panic!("open exception should be assignable");
    };
    assert_eq!(
        assigned.assigned_user_id.as_deref(),
        Some("user_dispatch_manager")
    );

    let started = repository
        .update(
            &created.id,
            std::slice::from_ref(&organization_id),
            UpdateOperationalExceptionRequest {
                action: "start".to_string(),
                assigned_user_id: None,
                resolution_note: None,
                expected_updated_at: assigned.updated_at.clone(),
            },
            &actor_user_id,
        )
        .await
        .unwrap();
    let OperationalExceptionUpdateResult::Updated(started) = started else {
        panic!("open exception should start");
    };
    assert_eq!(started.status, "in_progress");

    let stale_update = repository
        .update(
            &created.id,
            std::slice::from_ref(&organization_id),
            UpdateOperationalExceptionRequest {
                action: "resolve".to_string(),
                assigned_user_id: None,
                resolution_note: Some("Replacement mower arrived.".to_string()),
                expected_updated_at: created.updated_at.clone(),
            },
            &actor_user_id,
        )
        .await
        .unwrap();
    assert_eq!(stale_update, OperationalExceptionUpdateResult::Conflict);

    let resolved = repository
        .update(
            &created.id,
            std::slice::from_ref(&organization_id),
            UpdateOperationalExceptionRequest {
                action: "resolve".to_string(),
                assigned_user_id: None,
                resolution_note: Some("Replacement mower arrived.".to_string()),
                expected_updated_at: started.updated_at.clone(),
            },
            &actor_user_id,
        )
        .await
        .unwrap();
    let OperationalExceptionUpdateResult::Updated(resolved) = resolved else {
        panic!("in-progress exception should resolve");
    };
    assert_eq!(resolved.status, "resolved");
    assert_eq!(
        resolved.resolved_by_user_id.as_deref(),
        Some(actor_user_id.as_str())
    );
    assert_eq!(
        resolved.resolution_note.as_deref(),
        Some("Replacement mower arrived.")
    );

    let reopened = repository
        .update(
            &created.id,
            std::slice::from_ref(&organization_id),
            UpdateOperationalExceptionRequest {
                action: "reopen".to_string(),
                assigned_user_id: None,
                resolution_note: None,
                expected_updated_at: resolved.updated_at.clone(),
            },
            &actor_user_id,
        )
        .await
        .unwrap();
    let OperationalExceptionUpdateResult::Updated(reopened) = reopened else {
        panic!("resolved exception should reopen");
    };
    assert_eq!(reopened.status, "open");
    assert!(reopened.resolved_at.is_none());
    assert!(reopened.resolution_note.is_none());

    let lifecycle_audits: Vec<String> = sqlx::query_scalar(
        "SELECT event_kind FROM access_audit_events WHERE target_id = $1 ORDER BY occurred_at, event_kind",
    )
    .bind(&created.id)
    .fetch_all(&pool)
    .await
    .unwrap();
    assert!(lifecycle_audits.contains(&"operational_exception_start".to_string()));
    assert!(lifecycle_audits.contains(&"operational_exception_assign".to_string()));
    assert!(lifecycle_audits.contains(&"operational_exception_resolve".to_string()));
    assert!(lifecycle_audits.contains(&"operational_exception_reopen".to_string()));

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
