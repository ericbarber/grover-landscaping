use grover_landscaping_api::{
    access_control::AccessRole,
    db::JobRepository,
    organizations::{
        BootstrapOrganizationRequest, BootstrapOrganizationResult, OrganizationRepository,
        OrganizationResourceResult,
    },
    workspace_rollout::{UpdateWorkspaceRolloutEnrollmentRequest, WorkspaceRolloutMutationResult},
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

fn rollout_request(
    action: &str,
    enabled_unit: Option<&str>,
    expected_version: Option<i64>,
    mutation_id: &str,
) -> UpdateWorkspaceRolloutEnrollmentRequest {
    UpdateWorkspaceRolloutEnrollmentRequest {
        action: action.to_string(),
        enabled_unit: enabled_unit.map(str::to_string),
        expected_version,
        mutation_id: mutation_id.to_string(),
        reason: format!("Integration test {action}"),
    }
}

#[tokio::test]
async fn membership_derived_rollout_mutations_are_retry_safe_and_versioned() {
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
    let suffix = uuid::Uuid::new_v4().simple().to_string();
    let user_id = format!("rollout-operator-{suffix}");

    let created = organizations
        .bootstrap_organization(
            &user_id,
            BootstrapOrganizationRequest {
                display_name: "Rollout Operator Landscaping".to_string(),
                organization_type: "yard_care_company".to_string(),
            },
        )
        .await
        .expect("organization bootstrap should complete");
    let BootstrapOrganizationResult::Created(created) = created else {
        panic!("unique rollout operator should create an organization");
    };
    let organization_id = &created.organization_id;
    let membership_id = &created.membership.id;

    let enable = rollout_request("enable", Some("o1"), None, &format!("enable-{suffix}"));
    let enabled = organizations
        .update_workspace_rollout_enrollment(
            organization_id,
            membership_id,
            &user_id,
            enable.clone(),
        )
        .await;
    let WorkspaceRolloutMutationResult::Applied(enabled) = enabled else {
        panic!("first exact-scope enable should apply, got {enabled:?}");
    };
    assert_eq!(enabled.persona_id, "company-owner");
    assert_eq!(enabled.enabled_unit, "o1");
    assert_eq!(enabled.version, 1);

    let replay = organizations
        .update_workspace_rollout_enrollment(organization_id, membership_id, &user_id, enable)
        .await;
    assert!(matches!(
        replay,
        WorkspaceRolloutMutationResult::Replayed(ref record)
            if record.enrollment_id == enabled.enrollment_id && record.version == 1
    ));
    let reused_key = organizations
        .update_workspace_rollout_enrollment(
            organization_id,
            membership_id,
            &user_id,
            UpdateWorkspaceRolloutEnrollmentRequest {
                reason: "Changed payload must not replay".to_string(),
                ..rollout_request("enable", Some("o1"), None, &format!("enable-{suffix}"))
            },
        )
        .await;
    assert_eq!(reused_key, WorkspaceRolloutMutationResult::Conflict);

    let stale_advance = organizations
        .update_workspace_rollout_enrollment(
            organization_id,
            membership_id,
            &user_id,
            rollout_request("advance", Some("o2"), Some(9), &format!("stale-{suffix}")),
        )
        .await;
    assert_eq!(stale_advance, WorkspaceRolloutMutationResult::Conflict);

    let advanced = organizations
        .update_workspace_rollout_enrollment(
            organization_id,
            membership_id,
            &user_id,
            rollout_request("advance", Some("o2"), Some(1), &format!("advance-{suffix}")),
        )
        .await;
    assert!(matches!(
        advanced,
        WorkspaceRolloutMutationResult::Applied(ref record)
            if record.enabled_unit == "o2" && record.version == 2
    ));

    let suspended = organizations
        .update_workspace_rollout_enrollment(
            organization_id,
            membership_id,
            &user_id,
            rollout_request("suspend", None, Some(2), &format!("suspend-{suffix}")),
        )
        .await;
    assert!(matches!(
        suspended,
        WorkspaceRolloutMutationResult::Applied(ref record)
            if record.status == "suspended" && record.version == 3
    ));

    let resumed = organizations
        .update_workspace_rollout_enrollment(
            organization_id,
            membership_id,
            &user_id,
            rollout_request("resume", None, Some(3), &format!("resume-{suffix}")),
        )
        .await;
    assert!(matches!(
        resumed,
        WorkspaceRolloutMutationResult::Applied(ref record)
            if record.status == "active" && record.version == 4
    ));

    let enrollments = organizations
        .list_workspace_rollout_enrollments(organization_id)
        .await;
    let grover_landscaping_api::organizations::OrganizationCollectionResult::Loaded(enrollments) =
        enrollments
    else {
        panic!("rollout enrollment list should load");
    };
    assert!(enrollments.iter().any(|record| {
        record.enrollment_id == enabled.enrollment_id
            && record.membership_id.as_deref() == Some(membership_id)
            && record.version == 4
            && record.status == "active"
    }));

    let mismatched_membership = organizations
        .update_workspace_rollout_enrollment(
            "org-not-the-target",
            membership_id,
            &user_id,
            rollout_request("suspend", None, Some(4), &format!("wrong-org-{suffix}")),
        )
        .await;
    assert_eq!(
        mismatched_membership,
        WorkspaceRolloutMutationResult::NotFound
    );
}
