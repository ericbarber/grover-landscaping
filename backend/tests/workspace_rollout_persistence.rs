use grover_landscaping_api::{
    access_control::AccessRole,
    db::JobRepository,
    organizations::{
        BootstrapOrganizationRequest, BootstrapOrganizationResult, OrganizationRepository,
        OrganizationResourceResult,
    },
};
use sqlx::Row;
mod common;

#[tokio::test]
async fn exact_scope_rollout_is_cumulative_audited_and_suspensible() {
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
    let suffix = uuid::Uuid::new_v4().simple().to_string();
    let user_id = format!("rollout-user-{suffix}");
    let enrollment_id = format!("rollout-enrollment-{suffix}");

    let created = organizations
        .bootstrap_organization(
            &user_id,
            BootstrapOrganizationRequest {
                display_name: "Rollout Test Landscaping".to_string(),
                organization_type: "yard_care_company".to_string(),
            },
        )
        .await
        .expect("organization bootstrap should complete");
    let BootstrapOrganizationResult::Created(created) = created else {
        panic!("unique rollout test owner should create an organization");
    };

    sqlx::query(
        r#"
        INSERT INTO workspace_rollout_enrollments (
            id,
            subject_user_id,
            persona_id,
            organization_id,
            scope_type,
            scope_id,
            enabled_unit,
            status,
            version,
            changed_by,
            change_reason
        ) VALUES ($1, $2, 'company-owner', $3, $4, $5, 'o2', 'active', 1, $2, $6)
        "#,
    )
    .bind(&enrollment_id)
    .bind(&user_id)
    .bind(&created.organization_id)
    .bind(&created.membership.scope_type)
    .bind(&created.membership.scope_id)
    .bind("Controlled test cohort enablement")
    .execute(&pool)
    .await
    .expect("valid exact-scope enrollment should persist");

    let summary = match organizations
        .principal_access_summary(
            &user_id,
            &user_id,
            Some(format!("{user_id}@example.test")),
            vec![AccessRole::OrganizationOwner],
        )
        .await
    {
        OrganizationResourceResult::Found(summary) => summary,
        other => panic!("rollout-enabled access summary should load, got {other:?}"),
    };
    assert_eq!(summary.workspace_rollout.rollout_mode, "cohort");
    let owner_rollout = summary
        .workspace_rollout
        .personas
        .iter()
        .find(|persona| persona.persona_id == "company-owner")
        .expect("company owner projection should exist");
    assert_eq!(owner_rollout.enabled_unit.as_deref(), Some("o2"));
    assert!(owner_rollout.capabilities["company_readiness"]);
    assert!(owner_rollout.capabilities["daily_operations"]);
    assert!(!owner_rollout.capabilities["customers_and_team"]);

    sqlx::query(
        r#"
        UPDATE workspace_rollout_enrollments
        SET status = 'suspended',
            version = 2,
            changed_by = $2,
            change_reason = 'Controlled test suspension'
        WHERE id = $1
        "#,
    )
    .bind(&enrollment_id)
    .bind(&user_id)
    .execute(&pool)
    .await
    .expect("enrollment suspension should persist");

    let summary = match organizations
        .principal_access_summary(
            &user_id,
            &user_id,
            Some(format!("{user_id}@example.test")),
            vec![AccessRole::OrganizationOwner],
        )
        .await
    {
        OrganizationResourceResult::Found(summary) => summary,
        other => panic!("suspended access summary should load default off, got {other:?}"),
    };
    assert_eq!(summary.workspace_rollout.rollout_mode, "default_off");
    assert!(summary
        .workspace_rollout
        .personas
        .iter()
        .flat_map(|persona| persona.capabilities.values())
        .all(|enabled| !enabled));

    let downgrade = sqlx::query(
        r#"
        UPDATE workspace_rollout_enrollments
        SET enabled_unit = 'o1',
            version = 3,
            changed_by = $2,
            change_reason = 'Invalid test downgrade'
        WHERE id = $1
        "#,
    )
    .bind(&enrollment_id)
    .bind(&user_id)
    .execute(&pool)
    .await;
    assert!(
        downgrade.is_err(),
        "unit downgrade must fail; suspension is the rollback path"
    );

    sqlx::query(
        r#"
        UPDATE workspace_rollout_enrollments
        SET status = 'active',
            version = 3,
            changed_by = $2,
            change_reason = 'Controlled test resume'
        WHERE id = $1
        "#,
    )
    .bind(&enrollment_id)
    .bind(&user_id)
    .execute(&pool)
    .await
    .expect("exact-version enrollment resume should persist");

    let events = sqlx::query(
        r#"
        SELECT event_kind, version
        FROM workspace_rollout_events
        WHERE enrollment_id = $1
        ORDER BY id
        "#,
    )
    .bind(&enrollment_id)
    .fetch_all(&pool)
    .await
    .expect("rollout audit history should load");
    assert_eq!(events.len(), 3);
    assert_eq!(events[0].get::<String, _>("event_kind"), "enabled");
    assert_eq!(events[1].get::<String, _>("event_kind"), "suspended");
    assert_eq!(events[2].get::<String, _>("event_kind"), "resumed");
    assert_eq!(events[2].get::<i64, _>("version"), 3);

    let event_update = sqlx::query(
        "UPDATE workspace_rollout_events SET reason = 'rewritten' WHERE enrollment_id = $1",
    )
    .bind(&enrollment_id)
    .execute(&pool)
    .await;
    assert!(
        event_update.is_err(),
        "rollout event history must be immutable"
    );
}
