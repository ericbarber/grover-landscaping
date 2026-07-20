use grover_landscaping_api::{
    access_control::{can_manage_schedule, AccessRole},
    day_plans::{
        CreateCrewRequest, CreateOrganizationBranchRequest, CreateOrganizationBranchResult,
        CreateServiceTerritoryRequest, CreateServiceTerritoryResult, DayPlanRepository,
        PersistedMutationResult, UpdateCrewRequest, UpdateCrewResult,
    },
    db::JobRepository,
    organizations::{
        BootstrapOrganizationRequest, BootstrapOrganizationResult, MembershipProfileUpdateResult,
        OrganizationCollectionResult, OrganizationProfileUpdateResult, OrganizationRepository,
        OrganizationResourceResult, UpdateOrganizationMembershipProfileRequest,
        UpdateOrganizationProfileRequest,
    },
};
use sqlx::Row;
mod common;

fn loaded<T>(result: OrganizationCollectionResult<T>, context: &str) -> Vec<T> {
    match result {
        OrganizationCollectionResult::Loaded(items) => items,
        OrganizationCollectionResult::Unavailable => panic!("{context}: unavailable"),
    }
}

trait LoadedCollectionExt<T> {
    fn into_loaded(self) -> Vec<T>;
}

impl<T> LoadedCollectionExt<T> for OrganizationCollectionResult<T> {
    fn into_loaded(self) -> Vec<T> {
        loaded(self, "activity collection should load")
    }
}

fn found<T>(result: OrganizationResourceResult<T>, context: &str) -> T {
    match result {
        OrganizationResourceResult::Found(resource) => resource,
        OrganizationResourceResult::NotFound => panic!("{context}: not found"),
        OrganizationResourceResult::Unavailable => panic!("{context}: unavailable"),
    }
}

fn applied<T: std::fmt::Debug>(result: PersistedMutationResult<T>, context: &str) -> T {
    match result {
        PersistedMutationResult::Applied(value) => value,
        other => panic!("{context}, got {other:?}"),
    }
}

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
    assert_eq!(created.membership.display_name, user_id);
    assert_eq!(created.membership.role, AccessRole::OrganizationOwner);

    let renamed_member = organizations
        .update_membership_profile(
            &created.organization_id,
            &created.membership.id,
            &user_id,
            UpdateOrganizationMembershipProfileRequest {
                display_name: "Jordan Grover".to_string(),
            },
        )
        .await;
    let MembershipProfileUpdateResult::Updated(renamed_member) = renamed_member else {
        panic!("owner membership display name should be editable");
    };
    assert_eq!(renamed_member.display_name, "Jordan Grover");
    assert!(loaded(
        organizations
            .list_organization_memberships(&created.organization_id)
            .await,
        "organization memberships should load",
    )
    .iter()
    .any(|membership| {
        membership.id == created.membership.id && membership.display_name == "Jordan Grover"
    }));

    let OrganizationProfileUpdateResult::Updated(updated_profile) = organizations
        .update_organization_profile(
            &created.organization_id,
            &user_id,
            UpdateOrganizationProfileRequest {
                display_name: "First Owner Property Services".to_string(),
                organization_type: "property_management_company".to_string(),
                contact_email: Some("Office@FirstOwner.example".to_string()),
                contact_phone: Some("+1 (602) 555-0142".to_string()),
                website_url: Some("https://first-owner.example".to_string()),
                time_zone: "America/Phoenix".to_string(),
                service_area_label: Some("East Valley".to_string()),
                default_daily_stop_capacity: 16,
            },
        )
        .await
    else {
        panic!("owner should update organization profile");
    };
    assert_eq!(
        updated_profile.display_name,
        "First Owner Property Services"
    );
    assert_eq!(
        updated_profile.organization_type,
        "property_management_company"
    );
    assert_eq!(
        updated_profile.contact_email.as_deref(),
        Some("office@firstowner.example")
    );
    assert_eq!(
        updated_profile.service_area_label.as_deref(),
        Some("East Valley")
    );
    assert_eq!(updated_profile.default_daily_stop_capacity, 16);

    let setup_progress = found(
        organizations
            .first_owner_setup_progress(&created.organization_id)
            .await,
        "owner setup progress should be available",
    );
    assert!(setup_progress.organization_profile_complete);
    assert!(!setup_progress.team_invitation_created);
    assert!(!setup_progress.crew_configured);
    assert!(!setup_progress.first_route_published);
    assert_eq!(setup_progress.completed_steps, 1);
    assert_eq!(setup_progress.total_steps, 4);
    assert!(setup_progress.persisted);

    let day_plans = DayPlanRepository::from_pool(pool.clone());
    let CreateOrganizationBranchResult::Created(branch) = day_plans
        .create_organization_branch(
            &created.organization_id,
            &user_id,
            &CreateOrganizationBranchRequest {
                name: "Main Branch".to_string(),
                code: "MAIN".to_string(),
                time_zone: "America/Phoenix".to_string(),
                service_area_label: None,
            },
        )
        .await
    else {
        panic!("owner should create the default branch");
    };
    let CreateServiceTerritoryResult::Created(_) = day_plans
        .create_service_territory(
            &created.organization_id,
            &user_id,
            &CreateServiceTerritoryRequest {
                branch_id: branch.id,
                name: "Primary Territory".to_string(),
            },
        )
        .await
    else {
        panic!("owner should create the default territory");
    };
    let crew = day_plans
        .create_crew(
            &created.organization_id,
            CreateCrewRequest {
                name: "First Owner Crew".to_string(),
            },
        )
        .await
        .expect("owner should create the first crew");
    assert!(crew.persisted);
    assert_eq!(crew.organization_id, created.organization_id);
    assert!(
        found(
            organizations
                .first_owner_setup_progress(&created.organization_id)
                .await,
            "updated owner setup progress should be available",
        )
        .crew_configured
    );

    let current_service_date: String = sqlx::query_scalar("SELECT CURRENT_DATE::text")
        .fetch_one(&pool)
        .await
        .expect("current service date should be available");
    let current_draft = applied(
        day_plans
            .create_draft_day_plan(grover_landscaping_api::day_plans::CreateDayPlanRequest {
                crew_id: crew.id.clone(),
                service_date: current_service_date,
            })
            .await,
        "current draft should persist",
    );
    assert!(current_draft.persisted);
    let blocked_deactivation = day_plans
        .update_crew(
            &created.organization_id,
            &crew.id,
            &user_id,
            UpdateCrewRequest {
                name: crew.name.clone(),
                status: "inactive".to_string(),
                daily_stop_capacity: Some(12),
                lead_membership_id: Some(created.membership.id.clone()),
                branch_id: None,
                territory_id: None,
            },
        )
        .await;
    assert_eq!(blocked_deactivation, UpdateCrewResult::OperationalConflict);
    sqlx::query("DELETE FROM day_plans WHERE id = $1")
        .bind(&current_draft.id)
        .execute(&pool)
        .await
        .expect("blocking test draft should be removed");

    let renamed = day_plans
        .update_crew(
            &created.organization_id,
            &crew.id,
            &user_id,
            UpdateCrewRequest {
                name: "First Owner Operations".to_string(),
                status: "inactive".to_string(),
                daily_stop_capacity: Some(12),
                lead_membership_id: Some(created.membership.id.clone()),
                branch_id: None,
                territory_id: None,
            },
        )
        .await;
    let UpdateCrewResult::Updated(renamed) = renamed else {
        panic!("unassigned crew should be editable and deactivatable");
    };
    assert_eq!(renamed.name, "First Owner Operations");
    assert_eq!(renamed.status, "inactive");
    assert_eq!(renamed.daily_stop_capacity, 12);
    assert_eq!(
        renamed.lead_membership_id.as_deref(),
        Some(created.membership.id.as_str())
    );
    assert!(
        !found(
            organizations
                .first_owner_setup_progress(&created.organization_id)
                .await,
            "inactive crew progress should be available",
        )
        .crew_configured
    );

    let reactivated = day_plans
        .update_crew(
            &created.organization_id,
            &crew.id,
            &user_id,
            UpdateCrewRequest {
                name: renamed.name,
                status: "active".to_string(),
                daily_stop_capacity: Some(12),
                lead_membership_id: Some(created.membership.id.clone()),
                branch_id: None,
                territory_id: None,
            },
        )
        .await;
    assert!(matches!(reactivated, UpdateCrewResult::Updated(_)));
    let crew_audit_count: i64 = sqlx::query_scalar(
        r#"
        SELECT COUNT(*)
        FROM access_audit_events
        WHERE organization_id = $1
          AND target_id = $2
          AND event_kind IN ('crew_deactivated', 'crew_reactivated')
        "#,
    )
    .bind(&created.organization_id)
    .bind(&crew.id)
    .fetch_one(&pool)
    .await
    .expect("crew lifecycle audit should be countable");
    assert_eq!(crew_audit_count, 2);
    let owner_activity = loaded(
        organizations
            .list_team_administration_activity(&created.organization_id)
            .await,
        "owner activity should load",
    );
    assert!(owner_activity
        .iter()
        .any(|item| { item.target_id == crew.id && item.event_kind == "crew_deactivated" }));
    assert!(owner_activity
        .iter()
        .any(|item| { item.target_id == crew.id && item.event_kind == "crew_reactivated" }));
    assert_eq!(
        found(
            organizations
                .organization_profile(&created.organization_id)
                .await,
            "organization profile should be available",
        ),
        updated_profile
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
    let membership_profile_audit_count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM access_audit_events WHERE actor_user_id = $1 AND event_kind = 'membership_profile_updated'",
    )
    .bind(&user_id)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(membership_profile_audit_count, 1);
    let team_activity = loaded(
        organizations
            .list_team_administration_activity(&created.organization_id)
            .await,
        "team activity should load",
    );
    assert!(team_activity.iter().any(|item| {
        item.target_id == created.membership.id && item.event_kind == "membership_profile_updated"
    }));
    let profile_activity = team_activity
        .iter()
        .find(|item| item.event_kind == "membership_profile_updated")
        .expect("member profile activity should be readable");
    assert_eq!(profile_activity.actor_label, "Jordan Grover");
    assert_eq!(profile_activity.target_label, "Jordan Grover");
    assert_eq!(
        loaded(
            organizations
                .list_team_administration_activity_page(
                    &created.organization_id,
                    None,
                    None,
                    None,
                    None,
                    None,
                    None,
                    None,
                    None,
                    1,
                )
                .await,
            "team activity page should load",
        )
        .len(),
        1
    );
    assert!(organizations
        .list_team_administration_activity_page(
            &created.organization_id,
            Some("membership_profile_updated"),
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            25,
        )
        .await
        .into_loaded()
        .iter()
        .all(|item| item.event_kind == "membership_profile_updated"));
    assert!(organizations
        .list_team_administration_activity_page(
            &created.organization_id,
            None,
            None,
            Some("jordan"),
            None,
            None,
            None,
            None,
            None,
            25,
        )
        .await
        .into_loaded()
        .iter()
        .all(|item| item.actor_label == "Jordan Grover"));
    assert!(organizations
        .list_team_administration_activity_page(
            &created.organization_id,
            None,
            None,
            None,
            Some("jordan"),
            None,
            None,
            None,
            None,
            25,
        )
        .await
        .into_loaded()
        .iter()
        .all(|item| item.target_label == "Jordan Grover"));
    assert!(organizations
        .list_team_administration_activity_page(
            &created.organization_id,
            None,
            None,
            None,
            None,
            None,
            None,
            Some(&profile_activity.id),
            None,
            25,
        )
        .await
        .into_loaded()
        .iter()
        .all(|item| item.id == profile_activity.id));
}
