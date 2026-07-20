use grover_landscaping_api::property_crew_assignments::{
    AssignPropertyCrewRequest, PropertyCrewAssignmentListResult,
    PropertyCrewAssignmentMutationResult, PropertyCrewAssignmentRepository,
};
use sqlx::postgres::PgPoolOptions;
use std::time::Duration;

mod common;

#[tokio::test]
async fn repository_distinguishes_unavailable_assignment_lists_from_empty_results() {
    let pool = PgPoolOptions::new()
        .acquire_timeout(Duration::from_millis(100))
        .connect_lazy("postgres://grover:grover@127.0.0.1:1/grover_landscaping")
        .expect("unavailable test pool URL should be valid");
    let repository = PropertyCrewAssignmentRepository::from_pool(pool);

    assert!(matches!(
        repository
            .list_for_property("property_1001", &["org_demo_landscaping".to_string()])
            .await,
        PropertyCrewAssignmentListResult::Unavailable
    ));
    assert!(matches!(
        repository
            .list_active_for_crew("crew_1001", &["org_demo_landscaping".to_string()])
            .await,
        PropertyCrewAssignmentListResult::Unavailable
    ));
    assert!(matches!(
        repository
            .assign_crew(
                "property_1001",
                AssignPropertyCrewRequest {
                    crew_id: "crew_1001".to_string(),
                    organization_id: "org_demo_landscaping".to_string(),
                    assigned_at: None,
                },
                "manager_test",
            )
            .await,
        PropertyCrewAssignmentMutationResult::Unavailable
    ));
}

#[tokio::test]
async fn repository_persists_reassigns_and_lists_property_crew_assignments() {
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

    let repository = PropertyCrewAssignmentRepository::from_pool(pool.clone());
    let property_id = "property_assignment_test";
    let organization_id = "org_demo_landscaping";
    let crew_id = "crew_1001";
    let actor_user_id = "user_property_assignment_audit";

    sqlx::query("DELETE FROM property_crew_assignments WHERE property_id = $1")
        .bind(property_id)
        .execute(&pool)
        .await
        .expect("test property assignments should reset");
    sqlx::query("DELETE FROM access_audit_events WHERE actor_user_id = $1")
        .bind(actor_user_id)
        .execute(&pool)
        .await
        .expect("test audit rows should reset");
    sqlx::query("DELETE FROM customer_properties WHERE id = $1")
        .bind(property_id)
        .execute(&pool)
        .await
        .expect("test property should reset");
    sqlx::query(
        r#"INSERT INTO customer_properties (
            id, organization_id, account_id, display_name, service_address
        ) VALUES ($1, $2, 'acct_1001', 'Crew Assignment Test', '900 Crew Test Road')"#,
    )
    .bind(property_id)
    .bind(organization_id)
    .execute(&pool)
    .await
    .expect("test property should exist");

    let PropertyCrewAssignmentMutationResult::Assigned(first) = repository
        .assign_crew(
            property_id,
            AssignPropertyCrewRequest {
                crew_id: crew_id.to_string(),
                organization_id: organization_id.to_string(),
                assigned_at: Some("2026-06-15T08:00:00Z".to_string()),
            },
            actor_user_id,
        )
        .await
    else {
        panic!("first assignment should persist");
    };

    assert_eq!(first.property_id, property_id);
    assert_eq!(first.crew_id, crew_id);
    assert!(first.active);
    assert!(first.persisted);

    let PropertyCrewAssignmentMutationResult::Assigned(second) = repository
        .assign_crew(
            property_id,
            AssignPropertyCrewRequest {
                crew_id: crew_id.to_string(),
                organization_id: organization_id.to_string(),
                assigned_at: Some("2026-06-16T08:00:00Z".to_string()),
            },
            actor_user_id,
        )
        .await
    else {
        panic!("second assignment should persist");
    };

    assert_ne!(first.id, second.id);
    assert!(second.active);

    let PropertyCrewAssignmentListResult::Loaded(history) = repository
        .list_for_property(property_id, &[organization_id.to_string()])
        .await
    else {
        panic!("persisted property assignment history should load");
    };

    assert_eq!(history.len(), 2);
    assert_eq!(history[0].id, second.id);
    assert!(history[0].active);
    assert_eq!(history[1].id, first.id);
    assert!(!history[1].active);
    assert!(history[1].ended_at.is_some());

    let PropertyCrewAssignmentListResult::Loaded(active) = repository
        .list_active_for_crew(crew_id, &[organization_id.to_string()])
        .await
    else {
        panic!("persisted active crew assignments should load");
    };

    assert!(active
        .iter()
        .any(|assignment| assignment.property_id == property_id && assignment.id == second.id));

    let audit_count = sqlx::query_scalar::<_, i64>(
        r#"
        SELECT COUNT(*)
        FROM access_audit_events
        WHERE actor_user_id = $1
          AND organization_id = $2
          AND event_kind = 'crew_assignment_changed'
          AND target_id = ANY($3)
        "#,
    )
    .bind(actor_user_id)
    .bind(organization_id)
    .bind(vec![first.id, second.id])
    .fetch_one(&pool)
    .await
    .expect("crew assignment audit count should be available");
    assert_eq!(audit_count, 2);

    assert!(matches!(
        repository
            .assign_crew(
                "property_missing",
                AssignPropertyCrewRequest {
                    crew_id: crew_id.to_string(),
                    organization_id: organization_id.to_string(),
                    assigned_at: Some("2026-06-17T08:00:00Z".to_string()),
                },
                actor_user_id,
            )
            .await,
        PropertyCrewAssignmentMutationResult::Conflict
    ));

    sqlx::query("DELETE FROM customer_properties WHERE id = $1")
        .bind(property_id)
        .execute(&pool)
        .await
        .expect("test property should be cleaned up");
}
