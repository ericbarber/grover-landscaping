use grover_landscaping_api::{
    access_control::{can_manage_schedule, AccessRole},
    db::JobRepository,
    organizations::OrganizationRepository,
};
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
    let organizations = OrganizationRepository::from_pool(pool);

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
}
