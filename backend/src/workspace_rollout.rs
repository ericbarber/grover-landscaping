use crate::access_control::AccessRole;
use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, HashSet};

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

fn persona_for_role(role: &AccessRole) -> &'static str {
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
}
