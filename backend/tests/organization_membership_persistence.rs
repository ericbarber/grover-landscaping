use grover_landscaping_api::{
    access_control::{can_manage_schedule, AccessRole},
    db::JobRepository,
    organizations::{
        BootstrapOrganizationRequest, BootstrapOrganizationResult, OrganizationRepository,
        UpdateOrganizationProfileRequest,
    },
};
use sqlx::Row;
mod common;

#[tokio::test]
async fn repository_reads_seeded_local_owner_membership_from_postgres() {
    let Some(config) = common::database_config() else {
        return;
    };

    let jobs = JobRepository::connect(&config)
        .await
        .expect("repository should connect and run migrations");
    let pool = jobs
        .pool()
        .expect("connected repository should expose its PostgreSQL pool");
    let organizations = OrganizationRepository::from_pool(pool.clone());
    let login_audit_actor = "local-development-user";

    sqlx::query(
        "DELETE FROM access_audit_events WHERE actor_user_id = $1 AND event_kind = 'login'",
    )
    .bind(login_audit_actor)
    .execute(&pool)
    .await
    .expect("login audit rows should reset");

    let memberships = organizations
        .list_active_memberships("local-development-user")
        .await;

    assert!(memberships.iter().any(|membership| {
        membership.organization_id == "org_demo_landscaping"
            && membership.role == AccessRole::OrganizationOwner
            && membership.organization_type == "yard_care_company"
    }));
    assert!(
        organizations
            .user_has_active_membership(
                "local-development-user",
                "org_demo_landscaping",
                can_manage_schedule,
            )
            .await
    );

    let summary = organizations
        .principal_access_summary(
            "local-development-user",
            "local.development@example.com",
            Some("local.development@example.com".to_string()),
            vec![AccessRole::OrganizationOwner],
        )
        .await;
    assert_eq!(
        summary.verified_email.as_deref(),
        Some("local.development@example.com")
    );
    assert!(summary.memberships.iter().any(|membership| {
        membership.organization_id == "org_demo_landscaping"
            && membership.role == AccessRole::OrganizationOwner
    }));

    let login_audit = sqlx::query(
        r#"
        SELECT actor_user_id, organization_id, event_kind, target_id
        FROM access_audit_events
        WHERE actor_user_id = $1
          AND event_kind = 'login'
        "#,
    )
    .bind(login_audit_actor)
    .fetch_one(&pool)
    .await
    .expect("login audit row should be available");
    assert_eq!(
        login_audit.get::<String, _>("actor_user_id"),
        login_audit_actor
    );
    assert_eq!(
        login_audit.get::<String, _>("organization_id"),
        "org_demo_landscaping"
    );
    assert_eq!(login_audit.get::<String, _>("event_kind"), "login");
    assert_eq!(login_audit.get::<String, _>("target_id"), login_audit_actor);
}

#[tokio::test]
async fn repository_bootstraps_first_owner_once() {
    let Some(config) = common::database_config() else {
        return;
    };
    let jobs = JobRepository::connect(&config)
        .await
        .expect("repository should connect and run migrations");
    let pool = jobs
        .pool()
        .expect("connected repository should expose its PostgreSQL pool");
    let organizations = OrganizationRepository::from_pool(pool.clone());
    let user_id = format!("first-owner-{}", uuid::Uuid::new_v4().simple());

    let created = organizations
        .bootstrap_organization(
            &user_id,
            BootstrapOrganizationRequest {
                display_name: "First Owner Landscaping".to_string(),
                organization_type: "yard_care_company".to_string(),
            },
        )
        .await
        .unwrap();
    let BootstrapOrganizationResult::Created(created) = created else {
        panic!("first owner should create an organization");
    };
    assert!(created.persisted);
    assert_eq!(created.membership.user_id, user_id);
    assert_eq!(created.membership.role, AccessRole::OrganizationOwner);

    let updated_profile = organizations
        .update_organization_profile(
            &created.organization_id,
            &user_id,
            UpdateOrganizationProfileRequest {
                display_name: "First Owner Property Services".to_string(),
                organization_type: "property_management_company".to_string(),
            },
        )
        .await
        .expect("owner should update organization profile");
    assert_eq!(
        updated_profile.display_name,
        "First Owner Property Services"
    );
    assert_eq!(
        updated_profile.organization_type,
        "property_management_company"
    );
    assert_eq!(
        organizations
            .organization_profile(&created.organization_id)
            .await,
        Some(updated_profile)
    );

    let duplicate = organizations
        .bootstrap_organization(
            &user_id,
            BootstrapOrganizationRequest {
                display_name: "Second Organization".to_string(),
                organization_type: "yard_care_company".to_string(),
            },
        )
        .await
        .unwrap();
    assert_eq!(duplicate, BootstrapOrganizationResult::AlreadyMember);

    let audit_count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM access_audit_events WHERE actor_user_id = $1 AND event_kind = 'organization_bootstrapped'",
    )
    .bind(&user_id)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(audit_count, 1);
    let profile_audit_count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM access_audit_events WHERE actor_user_id = $1 AND event_kind = 'organization_profile_updated'",
    )
    .bind(&user_id)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(profile_audit_count, 1);
}
