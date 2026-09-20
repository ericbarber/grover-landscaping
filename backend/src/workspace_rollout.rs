use crate::access_control::AccessRole;
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, Postgres, Row, Transaction};
use std::collections::{BTreeMap, HashSet};
use uuid::Uuid;

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct WorkspaceRolloutAssignment {
    pub role: AccessRole,
    pub organization_id: String,
    pub scope_type: String,
    pub scope_id: Option<String>,
}

#[derive(Clone, Debug, Deserialize, PartialEq, Eq, Serialize)]
pub struct WorkspaceRolloutProjection {
    pub contract_version: u8,
    pub rollout_mode: String,
    pub personas: Vec<WorkspacePersonaRollout>,
}

#[derive(Clone, Debug, Deserialize, PartialEq, Eq, Serialize)]
pub struct WorkspacePersonaRollout {
    pub persona_id: String,
    pub scope: WorkspaceRolloutScope,
    pub enabled_unit: Option<String>,
    pub capabilities: BTreeMap<String, bool>,
}

#[derive(Clone, Debug, Deserialize, PartialEq, Eq, Serialize)]
pub struct WorkspaceRolloutScope {
    pub scope_type: String,
    pub scope_id: Option<String>,
    pub organization_id: Option<String>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct WorkspaceRolloutEnrollment {
    pub persona_id: String,
    pub organization_id: Option<String>,
    pub scope_type: String,
    pub scope_id: Option<String>,
    pub enabled_unit: String,
}

#[derive(Clone, Debug, Deserialize, PartialEq, Eq, Serialize)]
pub struct WorkspaceRolloutEnrollmentRecord {
    pub enrollment_id: String,
    pub membership_id: Option<String>,
    pub subject_user_id: String,
    pub persona_id: String,
    pub organization_id: String,
    pub scope_type: String,
    pub scope_id: Option<String>,
    pub enabled_unit: String,
    pub status: String,
    pub version: i64,
    pub changed_by: String,
    pub change_reason: String,
}

#[derive(Clone, Debug, Deserialize, PartialEq, Eq, Serialize)]
pub struct UpdateWorkspaceRolloutEnrollmentRequest {
    pub action: String,
    pub enabled_unit: Option<String>,
    pub expected_version: Option<i64>,
    pub mutation_id: String,
    pub reason: String,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum WorkspaceRolloutMutationResult {
    Applied(WorkspaceRolloutEnrollmentRecord),
    Replayed(WorkspaceRolloutEnrollmentRecord),
    Conflict,
    Invalid,
    NotFound,
    Unavailable,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub(crate) enum WorkspaceRolloutStoreMutationResult {
    Applied(WorkspaceRolloutEnrollmentRecord),
    Replayed(WorkspaceRolloutEnrollmentRecord),
    Conflict,
    Invalid,
    NotFound,
}

const YARD_OWNER: &[&str] = &[
    "care_visibility",
    "visit_tracking",
    "delivered_proof",
    "questions_and_decisions",
];
const PROPERTY_MANAGER: &[&str] = &[
    "portfolio_readiness",
    "property_coverage_and_proof",
    "approvals_and_questions",
    "portfolio_administration",
];
const CREW_LEAD: &[&str] = &[
    "day_plan_visibility",
    "stop_execution",
    "field_proof",
    "changes_and_recovery",
];
const CREW_MEMBER: &[&str] = &[
    "assigned_work",
    "job_execution",
    "field_evidence",
    "personal_recovery",
];
const COMPANY_OWNER: &[&str] = &[
    "company_readiness",
    "daily_operations",
    "customers_and_team",
    "reports_and_recovery",
];
const COMPANY_MANAGER: &[&str] = &[
    "operating_readiness",
    "schedule_and_field_coordination",
    "customers_and_team",
    "reports_and_operational_recovery",
];
const SUPPORT: &[&str] = &[
    "support_triage",
    "access_and_delivery_support",
    "evidence_and_exception_recovery",
    "privacy_and_erasure_recovery",
];

const YARD_OWNER_UNITS: &[&str] = &["u1", "u2", "u3", "u4"];
const PROPERTY_MANAGER_UNITS: &[&str] = &["p1", "p2", "p3", "p4"];
const CREW_LEAD_UNITS: &[&str] = &["c1", "c2", "c3", "c4"];
const CREW_MEMBER_UNITS: &[&str] = &["cm1", "cm2", "cm3", "cm4"];
const COMPANY_OWNER_UNITS: &[&str] = &["o1", "o2", "o3", "o4"];
const COMPANY_MANAGER_UNITS: &[&str] = &["m1", "m2", "m3", "m4"];
const SUPPORT_UNITS: &[&str] = &["s1", "s2", "s3", "s4"];

pub fn persona_for_role(role: &AccessRole) -> &'static str {
    match role {
        AccessRole::OrganizationOwner => "company-owner",
        AccessRole::Manager => "company-manager",
        AccessRole::CrewLead => "crew-lead",
        AccessRole::CrewMember => "crew-member",
        AccessRole::PropertyOwner => "yard-owner",
        AccessRole::PropertyManager => "property-manager",
        AccessRole::SupportAdmin => "support",
    }
}

fn persona_for_storage_role(role: &str) -> Option<&'static str> {
    match role {
        "organization_owner" => Some("company-owner"),
        "manager" => Some("company-manager"),
        "crew_lead" => Some("crew-lead"),
        "crew_member" => Some("crew-member"),
        "property_owner" => Some("yard-owner"),
        "property_manager" => Some("property-manager"),
        "support_admin" => Some("support"),
        _ => None,
    }
}

fn capability_keys(persona_id: &str) -> &'static [&'static str] {
    match persona_id {
        "yard-owner" => YARD_OWNER,
        "property-manager" => PROPERTY_MANAGER,
        "crew-lead" => CREW_LEAD,
        "crew-member" => CREW_MEMBER,
        "company-owner" => COMPANY_OWNER,
        "company-manager" => COMPANY_MANAGER,
        "support" => SUPPORT,
        "general" => &["access_resolution"],
        _ => &[],
    }
}

fn unit_ids(persona_id: &str) -> &'static [&'static str] {
    match persona_id {
        "yard-owner" => YARD_OWNER_UNITS,
        "property-manager" => PROPERTY_MANAGER_UNITS,
        "crew-lead" => CREW_LEAD_UNITS,
        "crew-member" => CREW_MEMBER_UNITS,
        "company-owner" => COMPANY_OWNER_UNITS,
        "company-manager" => COMPANY_MANAGER_UNITS,
        "support" => SUPPORT_UNITS,
        _ => &[],
    }
}

pub fn workspace_rollout_unit_is_valid(persona_id: &str, unit_id: &str) -> bool {
    unit_ids(persona_id).contains(&unit_id)
}

fn workspace_rollout_unit_rank(persona_id: &str, unit_id: &str) -> Option<usize> {
    unit_ids(persona_id)
        .iter()
        .position(|candidate| *candidate == unit_id)
}

fn default_off_persona(persona_id: &str, scope: WorkspaceRolloutScope) -> WorkspacePersonaRollout {
    WorkspacePersonaRollout {
        persona_id: persona_id.to_string(),
        scope,
        enabled_unit: None,
        capabilities: capability_keys(persona_id)
            .iter()
            .map(|capability| ((*capability).to_string(), false))
            .collect(),
    }
}

pub fn default_workspace_rollout_projection(
    claim_roles: &[AccessRole],
    assignments: &[WorkspaceRolloutAssignment],
) -> WorkspaceRolloutProjection {
    let mut personas = Vec::new();
    let mut seen = HashSet::new();

    for assignment in assignments {
        let persona_id = persona_for_role(&assignment.role);
        let key = (
            persona_id.to_string(),
            Some(assignment.organization_id.clone()),
            assignment.scope_type.clone(),
            assignment.scope_id.clone(),
        );
        if !seen.insert(key) {
            continue;
        }
        personas.push(default_off_persona(
            persona_id,
            WorkspaceRolloutScope {
                scope_type: assignment.scope_type.clone(),
                scope_id: assignment.scope_id.clone(),
                organization_id: Some(assignment.organization_id.clone()),
            },
        ));
    }

    if claim_roles.contains(&AccessRole::SupportAdmin)
        && seen.insert(("support".to_string(), None, "platform".to_string(), None))
    {
        personas.push(default_off_persona(
            "support",
            WorkspaceRolloutScope {
                scope_type: "platform".to_string(),
                scope_id: None,
                organization_id: None,
            },
        ));
    }

    if assignments.is_empty()
        && claim_roles.contains(&AccessRole::OrganizationOwner)
        && seen.insert((
            "company-owner".to_string(),
            None,
            "identity".to_string(),
            None,
        ))
    {
        personas.push(default_off_persona(
            "company-owner",
            WorkspaceRolloutScope {
                scope_type: "identity".to_string(),
                scope_id: None,
                organization_id: None,
            },
        ));
    }

    if personas.is_empty() {
        let mut fallback = default_off_persona(
            "general",
            WorkspaceRolloutScope {
                scope_type: "identity".to_string(),
                scope_id: None,
                organization_id: None,
            },
        );
        fallback.enabled_unit = Some("g1".to_string());
        fallback
            .capabilities
            .insert("access_resolution".to_string(), true);
        personas.push(fallback);
    }

    WorkspaceRolloutProjection {
        contract_version: 1,
        rollout_mode: "default_off".to_string(),
        personas,
    }
}

pub async fn load_active_workspace_rollout_enrollments(
    pool: &PgPool,
    subject_user_id: &str,
) -> Result<Vec<WorkspaceRolloutEnrollment>, sqlx::Error> {
    let rows = sqlx::query(
        r#"
        SELECT persona_id, organization_id, scope_type, scope_id, enabled_unit
        FROM workspace_rollout_enrollments
        WHERE subject_user_id = $1
          AND status = 'active'
        ORDER BY persona_id, organization_id NULLS FIRST, scope_type, scope_id NULLS FIRST
        "#,
    )
    .bind(subject_user_id)
    .fetch_all(pool)
    .await?;

    Ok(rows
        .into_iter()
        .map(|row| WorkspaceRolloutEnrollment {
            persona_id: row.get("persona_id"),
            organization_id: row.get("organization_id"),
            scope_type: row.get("scope_type"),
            scope_id: row.get("scope_id"),
            enabled_unit: row.get("enabled_unit"),
        })
        .collect())
}

pub async fn list_organization_workspace_rollout_enrollments(
    pool: &PgPool,
    organization_id: &str,
) -> Result<Vec<WorkspaceRolloutEnrollmentRecord>, sqlx::Error> {
    let rows = sqlx::query(
        r#"
        SELECT
            enrollment.id AS enrollment_id,
            membership.id AS membership_id,
            enrollment.subject_user_id,
            enrollment.persona_id,
            enrollment.organization_id,
            enrollment.scope_type,
            enrollment.scope_id,
            enrollment.enabled_unit,
            enrollment.status,
            enrollment.version,
            enrollment.changed_by,
            enrollment.change_reason
        FROM workspace_rollout_enrollments enrollment
        LEFT JOIN organization_memberships membership
          ON membership.organization_id = enrollment.organization_id
         AND membership.user_id = enrollment.subject_user_id
         AND membership.scope_type = enrollment.scope_type
         AND membership.scope_id IS NOT DISTINCT FROM enrollment.scope_id
         AND enrollment.persona_id = CASE membership.role
             WHEN 'organization_owner' THEN 'company-owner'
             WHEN 'manager' THEN 'company-manager'
             WHEN 'crew_lead' THEN 'crew-lead'
             WHEN 'crew_member' THEN 'crew-member'
             WHEN 'property_owner' THEN 'yard-owner'
             WHEN 'property_manager' THEN 'property-manager'
             WHEN 'support_admin' THEN 'support'
             ELSE NULL
         END
        WHERE enrollment.organization_id = $1
        ORDER BY enrollment.subject_user_id, enrollment.persona_id,
                 enrollment.scope_type, enrollment.scope_id NULLS FIRST
        "#,
    )
    .bind(organization_id)
    .fetch_all(pool)
    .await?;

    Ok(rows
        .into_iter()
        .map(workspace_rollout_enrollment_record_from_row)
        .collect())
}

pub(crate) async fn mutate_membership_workspace_rollout(
    pool: &PgPool,
    organization_id: &str,
    membership_id: &str,
    actor_user_id: &str,
    request: &UpdateWorkspaceRolloutEnrollmentRequest,
) -> Result<WorkspaceRolloutStoreMutationResult, sqlx::Error> {
    let action = request.action.trim();
    let mutation_id = request.mutation_id.trim();
    let reason = request.reason.trim();
    let requested_unit = request.enabled_unit.as_deref().map(str::trim);
    if !matches!(action, "enable" | "advance" | "suspend" | "resume")
        || !(8..=120).contains(&mutation_id.chars().count())
        || !(4..=500).contains(&reason.chars().count())
        || request.expected_version.is_some_and(|version| version <= 0)
    {
        return Ok(WorkspaceRolloutStoreMutationResult::Invalid);
    }

    let mut transaction = pool.begin().await?;
    let advisory_key = format!("workspace-rollout:{actor_user_id}:{mutation_id}");
    sqlx::query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))")
        .bind(advisory_key)
        .execute(&mut *transaction)
        .await?;

    let membership = sqlx::query(
        r#"
        SELECT user_id, role, status, scope_type, scope_id
        FROM organization_memberships
        WHERE id = $1 AND organization_id = $2
        FOR UPDATE
        "#,
    )
    .bind(membership_id)
    .bind(organization_id)
    .fetch_optional(&mut *transaction)
    .await?;
    let Some(membership) = membership else {
        transaction.rollback().await?;
        return Ok(WorkspaceRolloutStoreMutationResult::NotFound);
    };
    let subject_user_id: String = membership.get("user_id");
    let storage_role: String = membership.get("role");
    let membership_status: String = membership.get("status");
    let scope_type: String = membership.get("scope_type");
    let scope_id: Option<String> = membership.get("scope_id");
    let Some(persona_id) = persona_for_storage_role(&storage_role) else {
        transaction.rollback().await?;
        return Ok(WorkspaceRolloutStoreMutationResult::Invalid);
    };
    let request_shape_is_valid = match action {
        "enable" => {
            request.expected_version.is_none()
                && requested_unit
                    .is_some_and(|unit| workspace_rollout_unit_is_valid(persona_id, unit))
        }
        "advance" => {
            request.expected_version.is_some()
                && requested_unit
                    .is_some_and(|unit| workspace_rollout_unit_is_valid(persona_id, unit))
        }
        "suspend" | "resume" => request.expected_version.is_some() && requested_unit.is_none(),
        _ => false,
    };
    if !request_shape_is_valid {
        transaction.rollback().await?;
        return Ok(WorkspaceRolloutStoreMutationResult::Invalid);
    }

    if let Some(replay) = load_workspace_rollout_mutation_replay(
        &mut transaction,
        membership_id,
        actor_user_id,
        mutation_id,
    )
    .await?
    {
        let expected_event = match action {
            "enable" => "enabled",
            "advance" => "advanced",
            "suspend" => "suspended",
            "resume" => "resumed",
            _ => unreachable!(),
        };
        let expected_result_version = match action {
            "enable" => request.expected_version.is_none().then_some(1),
            _ => request
                .expected_version
                .and_then(|version| version.checked_add(1)),
        };
        let unit_matches = match action {
            "enable" | "advance" => requested_unit == Some(replay.record.enabled_unit.as_str()),
            "suspend" | "resume" => requested_unit.is_none(),
            _ => false,
        };
        if replay.event_kind == expected_event
            && replay.record.persona_id == persona_id
            && replay.record.subject_user_id == subject_user_id
            && replay.record.organization_id == organization_id
            && replay.record.scope_type == scope_type
            && replay.record.scope_id == scope_id
            && replay.record.change_reason == reason
            && expected_result_version == Some(replay.record.version)
            && unit_matches
        {
            transaction.commit().await?;
            return Ok(WorkspaceRolloutStoreMutationResult::Replayed(replay.record));
        }
        transaction.rollback().await?;
        return Ok(WorkspaceRolloutStoreMutationResult::Conflict);
    }

    let current = load_exact_workspace_rollout_enrollment(
        &mut transaction,
        organization_id,
        membership_id,
        &subject_user_id,
        persona_id,
        &scope_type,
        scope_id.as_deref(),
        true,
    )
    .await?;

    let next = match action {
        "enable" => {
            let Some(unit) = requested_unit else {
                transaction.rollback().await?;
                return Ok(WorkspaceRolloutStoreMutationResult::Invalid);
            };
            if membership_status != "active" || current.is_some() {
                transaction.rollback().await?;
                return Ok(WorkspaceRolloutStoreMutationResult::Conflict);
            }
            let enrollment_id = format!("rollout_{}", Uuid::new_v4().simple());
            sqlx::query(
                r#"
                INSERT INTO workspace_rollout_enrollments (
                    id, subject_user_id, persona_id, organization_id, scope_type,
                    scope_id, enabled_unit, status, version, changed_by,
                    change_reason, last_mutation_id
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', 1, $8, $9, $10)
                "#,
            )
            .bind(&enrollment_id)
            .bind(&subject_user_id)
            .bind(persona_id)
            .bind(organization_id)
            .bind(&scope_type)
            .bind(&scope_id)
            .bind(unit)
            .bind(actor_user_id)
            .bind(reason)
            .bind(mutation_id)
            .execute(&mut *transaction)
            .await?;
            enrollment_id
        }
        "advance" => {
            let Some(current) = current else {
                transaction.rollback().await?;
                return Ok(WorkspaceRolloutStoreMutationResult::NotFound);
            };
            let Some(unit) = requested_unit else {
                transaction.rollback().await?;
                return Ok(WorkspaceRolloutStoreMutationResult::Invalid);
            };
            let advances = workspace_rollout_unit_rank(persona_id, unit)
                .zip(workspace_rollout_unit_rank(
                    persona_id,
                    &current.enabled_unit,
                ))
                .is_some_and(|(next, previous)| next > previous);
            if membership_status != "active"
                || current.status != "active"
                || request.expected_version != Some(current.version)
                || !advances
            {
                transaction.rollback().await?;
                return Ok(WorkspaceRolloutStoreMutationResult::Conflict);
            }
            update_workspace_rollout_enrollment(
                &mut transaction,
                &current.enrollment_id,
                Some(unit),
                None,
                current.version + 1,
                actor_user_id,
                reason,
                mutation_id,
            )
            .await?;
            current.enrollment_id
        }
        "suspend" => {
            let Some(current) = current else {
                transaction.rollback().await?;
                return Ok(WorkspaceRolloutStoreMutationResult::NotFound);
            };
            if requested_unit.is_some()
                || current.status != "active"
                || request.expected_version != Some(current.version)
            {
                transaction.rollback().await?;
                return Ok(WorkspaceRolloutStoreMutationResult::Conflict);
            }
            update_workspace_rollout_enrollment(
                &mut transaction,
                &current.enrollment_id,
                None,
                Some("suspended"),
                current.version + 1,
                actor_user_id,
                reason,
                mutation_id,
            )
            .await?;
            current.enrollment_id
        }
        "resume" => {
            let Some(current) = current else {
                transaction.rollback().await?;
                return Ok(WorkspaceRolloutStoreMutationResult::NotFound);
            };
            if membership_status != "active"
                || requested_unit.is_some()
                || current.status != "suspended"
                || request.expected_version != Some(current.version)
            {
                transaction.rollback().await?;
                return Ok(WorkspaceRolloutStoreMutationResult::Conflict);
            }
            update_workspace_rollout_enrollment(
                &mut transaction,
                &current.enrollment_id,
                None,
                Some("active"),
                current.version + 1,
                actor_user_id,
                reason,
                mutation_id,
            )
            .await?;
            current.enrollment_id
        }
        _ => unreachable!(),
    };

    let record =
        load_workspace_rollout_enrollment_by_id(&mut transaction, &next, Some(membership_id))
            .await?
            .expect("rollout mutation must return its persisted enrollment");
    transaction.commit().await?;
    Ok(WorkspaceRolloutStoreMutationResult::Applied(record))
}

struct WorkspaceRolloutMutationReplay {
    event_kind: String,
    record: WorkspaceRolloutEnrollmentRecord,
}

async fn load_workspace_rollout_mutation_replay(
    transaction: &mut Transaction<'_, Postgres>,
    membership_id: &str,
    actor_user_id: &str,
    mutation_id: &str,
) -> Result<Option<WorkspaceRolloutMutationReplay>, sqlx::Error> {
    let row = sqlx::query(
        r#"
        SELECT
            enrollment.id AS enrollment_id,
            $1::text AS membership_id,
            enrollment.subject_user_id,
            enrollment.persona_id,
            enrollment.organization_id,
            enrollment.scope_type,
            enrollment.scope_id,
            event.enabled_unit,
            event.status,
            event.version,
            event.actor_user_id AS changed_by,
            event.reason AS change_reason,
            event.event_kind
        FROM workspace_rollout_events event
        JOIN workspace_rollout_enrollments enrollment ON enrollment.id = event.enrollment_id
        WHERE event.actor_user_id = $2 AND event.mutation_id = $3
        "#,
    )
    .bind(membership_id)
    .bind(actor_user_id)
    .bind(mutation_id)
    .fetch_optional(&mut **transaction)
    .await?;

    Ok(row.map(|row| WorkspaceRolloutMutationReplay {
        event_kind: row.get("event_kind"),
        record: workspace_rollout_enrollment_record_from_row(row),
    }))
}

#[allow(clippy::too_many_arguments)]
async fn load_exact_workspace_rollout_enrollment(
    transaction: &mut Transaction<'_, Postgres>,
    organization_id: &str,
    membership_id: &str,
    subject_user_id: &str,
    persona_id: &str,
    scope_type: &str,
    scope_id: Option<&str>,
    for_update: bool,
) -> Result<Option<WorkspaceRolloutEnrollmentRecord>, sqlx::Error> {
    let lock = if for_update { " FOR UPDATE" } else { "" };
    let statement = format!(
        r#"
        SELECT
            enrollment.id AS enrollment_id,
            $6::text AS membership_id,
            enrollment.subject_user_id,
            enrollment.persona_id,
            enrollment.organization_id,
            enrollment.scope_type,
            enrollment.scope_id,
            enrollment.enabled_unit,
            enrollment.status,
            enrollment.version,
            enrollment.changed_by,
            enrollment.change_reason
        FROM workspace_rollout_enrollments enrollment
        WHERE enrollment.organization_id = $1
          AND enrollment.subject_user_id = $2
          AND enrollment.persona_id = $3
          AND enrollment.scope_type = $4
          AND enrollment.scope_id IS NOT DISTINCT FROM $5
        {lock}
        "#
    );
    let row = sqlx::query(&statement)
        .bind(organization_id)
        .bind(subject_user_id)
        .bind(persona_id)
        .bind(scope_type)
        .bind(scope_id)
        .bind(membership_id)
        .fetch_optional(&mut **transaction)
        .await?;
    Ok(row.map(workspace_rollout_enrollment_record_from_row))
}

async fn load_workspace_rollout_enrollment_by_id(
    transaction: &mut Transaction<'_, Postgres>,
    enrollment_id: &str,
    membership_id: Option<&str>,
) -> Result<Option<WorkspaceRolloutEnrollmentRecord>, sqlx::Error> {
    let row = sqlx::query(
        r#"
        SELECT
            id AS enrollment_id,
            $2::text AS membership_id,
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
        FROM workspace_rollout_enrollments
        WHERE id = $1
        "#,
    )
    .bind(enrollment_id)
    .bind(membership_id)
    .fetch_optional(&mut **transaction)
    .await?;
    Ok(row.map(workspace_rollout_enrollment_record_from_row))
}

#[allow(clippy::too_many_arguments)]
async fn update_workspace_rollout_enrollment(
    transaction: &mut Transaction<'_, Postgres>,
    enrollment_id: &str,
    enabled_unit: Option<&str>,
    status: Option<&str>,
    version: i64,
    actor_user_id: &str,
    reason: &str,
    mutation_id: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        UPDATE workspace_rollout_enrollments
        SET enabled_unit = COALESCE($2, enabled_unit),
            status = COALESCE($3, status),
            version = $4,
            changed_by = $5,
            change_reason = $6,
            last_mutation_id = $7
        WHERE id = $1
        "#,
    )
    .bind(enrollment_id)
    .bind(enabled_unit)
    .bind(status)
    .bind(version)
    .bind(actor_user_id)
    .bind(reason)
    .bind(mutation_id)
    .execute(&mut **transaction)
    .await?;
    Ok(())
}

fn workspace_rollout_enrollment_record_from_row(
    row: sqlx::postgres::PgRow,
) -> WorkspaceRolloutEnrollmentRecord {
    WorkspaceRolloutEnrollmentRecord {
        enrollment_id: row.get("enrollment_id"),
        membership_id: row.get("membership_id"),
        subject_user_id: row.get("subject_user_id"),
        persona_id: row.get("persona_id"),
        organization_id: row.get("organization_id"),
        scope_type: row.get("scope_type"),
        scope_id: row.get("scope_id"),
        enabled_unit: row.get("enabled_unit"),
        status: row.get("status"),
        version: row.get("version"),
        changed_by: row.get("changed_by"),
        change_reason: row.get("change_reason"),
    }
}

pub fn apply_workspace_rollout_enrollments(
    projection: &mut WorkspaceRolloutProjection,
    enrollments: &[WorkspaceRolloutEnrollment],
) {
    let mut applied = false;
    for persona in &mut projection.personas {
        let Some(enrollment) = enrollments.iter().find(|enrollment| {
            enrollment.persona_id == persona.persona_id
                && enrollment.organization_id == persona.scope.organization_id
                && enrollment.scope_type == persona.scope.scope_type
                && enrollment.scope_id == persona.scope.scope_id
        }) else {
            continue;
        };
        let Some(enabled_index) = unit_ids(&persona.persona_id)
            .iter()
            .position(|unit_id| *unit_id == enrollment.enabled_unit)
        else {
            continue;
        };

        for capability in capability_keys(&persona.persona_id)
            .iter()
            .take(enabled_index + 1)
        {
            persona.capabilities.insert((*capability).to_string(), true);
        }
        persona.enabled_unit = Some(enrollment.enabled_unit.clone());
        applied = true;
    }
    if applied {
        projection.rollout_mode = "cohort".to_string();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn assignment(
        role: AccessRole,
        scope_type: &str,
        scope_id: Option<&str>,
    ) -> WorkspaceRolloutAssignment {
        WorkspaceRolloutAssignment {
            role,
            organization_id: "org-1".to_string(),
            scope_type: scope_type.to_string(),
            scope_id: scope_id.map(str::to_string),
        }
    }

    #[test]
    fn projects_every_current_membership_role_with_all_product_capabilities_off() {
        let assignments = vec![
            assignment(AccessRole::OrganizationOwner, "organization", None),
            assignment(AccessRole::Manager, "organization", None),
            assignment(AccessRole::CrewLead, "crew", Some("crew-1")),
            assignment(AccessRole::CrewMember, "crew", Some("crew-1")),
            assignment(AccessRole::PropertyOwner, "property", Some("property-1")),
            assignment(
                AccessRole::PropertyManager,
                "portfolio",
                Some("portfolio-1"),
            ),
        ];

        let projection = default_workspace_rollout_projection(&[], &assignments);
        assert_eq!(projection.contract_version, 1);
        assert_eq!(projection.rollout_mode, "default_off");
        assert_eq!(projection.personas.len(), 6);
        assert_eq!(
            projection
                .personas
                .iter()
                .map(|persona| persona.persona_id.as_str())
                .collect::<Vec<_>>(),
            vec![
                "company-owner",
                "company-manager",
                "crew-lead",
                "crew-member",
                "yard-owner",
                "property-manager",
            ]
        );
        assert!(projection.personas.iter().all(|persona| {
            persona.enabled_unit.is_none()
                && !persona.capabilities.is_empty()
                && persona.capabilities.values().all(|enabled| !enabled)
        }));
    }

    #[test]
    fn support_claim_gets_one_platform_scoped_projection() {
        let projection = default_workspace_rollout_projection(
            &[AccessRole::SupportAdmin],
            &[assignment(AccessRole::SupportAdmin, "organization", None)],
        );

        assert_eq!(projection.personas.len(), 2);
        assert_eq!(
            projection.personas[0].scope.organization_id.as_deref(),
            Some("org-1")
        );
        assert_eq!(projection.personas[1].scope.scope_type, "platform");
        assert_eq!(projection.personas[1].scope.organization_id, None);
    }

    #[test]
    fn no_role_fallback_enables_only_non_data_access_resolution() {
        let projection = default_workspace_rollout_projection(&[], &[]);

        assert_eq!(projection.personas.len(), 1);
        assert_eq!(projection.personas[0].persona_id, "general");
        assert_eq!(projection.personas[0].enabled_unit.as_deref(), Some("g1"));
        assert_eq!(
            projection.personas[0].capabilities,
            BTreeMap::from([("access_resolution".to_string(), true)])
        );
    }

    #[test]
    fn duplicate_role_scope_assignments_do_not_duplicate_personas() {
        let assignment = assignment(AccessRole::CrewMember, "crew", Some("crew-1"));
        let projection =
            default_workspace_rollout_projection(&[], &[assignment.clone(), assignment]);
        assert_eq!(projection.personas.len(), 1);
    }

    #[test]
    fn claim_only_company_owner_stays_identity_scoped_and_default_off() {
        let projection =
            default_workspace_rollout_projection(&[AccessRole::OrganizationOwner], &[]);
        assert_eq!(projection.personas[0].persona_id, "company-owner");
        assert_eq!(projection.personas[0].scope.scope_type, "identity");
        assert!(projection.personas[0]
            .capabilities
            .values()
            .all(|enabled| !enabled));
    }

    #[test]
    fn exact_scope_enrollment_enables_cumulative_capabilities_only() {
        let assignments = [assignment(AccessRole::CrewMember, "crew", Some("crew-1"))];
        let mut projection = default_workspace_rollout_projection(&[], &assignments);

        apply_workspace_rollout_enrollments(
            &mut projection,
            &[WorkspaceRolloutEnrollment {
                persona_id: "crew-member".to_string(),
                organization_id: Some("org-1".to_string()),
                scope_type: "crew".to_string(),
                scope_id: Some("crew-1".to_string()),
                enabled_unit: "cm3".to_string(),
            }],
        );

        assert_eq!(projection.rollout_mode, "cohort");
        assert_eq!(projection.personas[0].enabled_unit.as_deref(), Some("cm3"));
        assert!(projection.personas[0].capabilities["assigned_work"]);
        assert!(projection.personas[0].capabilities["job_execution"]);
        assert!(projection.personas[0].capabilities["field_evidence"]);
        assert!(!projection.personas[0].capabilities["personal_recovery"]);
    }

    #[test]
    fn mismatched_scope_or_unknown_unit_never_enables_a_projection() {
        let assignments = [assignment(
            AccessRole::PropertyOwner,
            "property",
            Some("property-1"),
        )];
        let mut projection = default_workspace_rollout_projection(&[], &assignments);
        let enrollments = [
            WorkspaceRolloutEnrollment {
                persona_id: "yard-owner".to_string(),
                organization_id: Some("org-1".to_string()),
                scope_type: "property".to_string(),
                scope_id: Some("property-2".to_string()),
                enabled_unit: "u4".to_string(),
            },
            WorkspaceRolloutEnrollment {
                persona_id: "yard-owner".to_string(),
                organization_id: Some("org-1".to_string()),
                scope_type: "property".to_string(),
                scope_id: Some("property-1".to_string()),
                enabled_unit: "not-a-unit".to_string(),
            },
        ];

        apply_workspace_rollout_enrollments(&mut projection, &enrollments);

        assert_eq!(projection.rollout_mode, "default_off");
        assert_eq!(projection.personas[0].enabled_unit, None);
        assert!(projection.personas[0]
            .capabilities
            .values()
            .all(|enabled| !enabled));
    }
}
