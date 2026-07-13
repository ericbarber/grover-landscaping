use grover_landscaping_api::property_crew_assignments::{
    AssignPropertyCrewRequest, PropertyCrewAssignmentRepository,
};
use sqlx::postgres::PgPoolOptions;

mod common;

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

    sqlx::query("DELETE FROM property_crew_assignments WHERE property_id = $1")
        .bind(property_id)
        .execute(&pool)
        .await
        .expect("test property assignments should reset");

    let first = repository
        .assign_crew(
            property_id,
            AssignPropertyCrewRequest {
                crew_id: crew_id.to_string(),
                organization_id: organization_id.to_string(),
                assigned_at: Some("2026-06-15T08:00:00Z".to_string()),
            },
        )
        .await
        .expect("first assignment should persist");

    assert_eq!(first.property_id, property_id);
    assert_eq!(first.crew_id, crew_id);
    assert!(first.active);
    assert!(first.persisted);

    let second = repository
        .assign_crew(
            property_id,
            AssignPropertyCrewRequest {
                crew_id: crew_id.to_string(),
                organization_id: organization_id.to_string(),
                assigned_at: Some("2026-06-16T08:00:00Z".to_string()),
            },
        )
        .await
        .expect("second assignment should persist");

    assert_ne!(first.id, second.id);
    assert!(second.active);

    let history = repository
        .list_for_property(property_id, &[organization_id.to_string()])
        .await;

    assert_eq!(history.len(), 2);
    assert_eq!(history[0].id, second.id);
    assert!(history[0].active);
    assert_eq!(history[1].id, first.id);
    assert!(!history[1].active);
    assert!(history[1].ended_at.is_some());

    let active = repository
        .list_active_for_crew(crew_id, &[organization_id.to_string()])
        .await;

    assert!(active
        .iter()
        .any(|assignment| assignment.property_id == property_id && assignment.id == second.id));
}
