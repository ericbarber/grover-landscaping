const personaByRole = {
  OrganizationOwner: 'company-owner',
  Manager: 'company-manager',
  CrewLead: 'crew-lead',
  CrewMember: 'crew-member',
  PropertyOwner: 'yard-owner',
  PropertyManager: 'property-manager',
  SupportAdmin: 'support',
} as const;

const capabilitiesByPersona = {
  'yard-owner': ['care_visibility', 'visit_tracking', 'delivered_proof', 'questions_and_decisions'],
  'property-manager': ['portfolio_readiness', 'property_coverage_and_proof', 'approvals_and_questions', 'portfolio_administration'],
  'crew-lead': ['day_plan_visibility', 'stop_execution', 'field_proof', 'changes_and_recovery'],
  'crew-member': ['assigned_work', 'job_execution', 'field_evidence', 'personal_recovery'],
  'company-owner': ['company_readiness', 'daily_operations', 'customers_and_team', 'reports_and_recovery'],
  'company-manager': ['operating_readiness', 'schedule_and_field_coordination', 'customers_and_team', 'reports_and_operational_recovery'],
  support: ['support_triage', 'access_and_delivery_support', 'evidence_and_exception_recovery', 'privacy_and_erasure_recovery'],
} as const;

type AccessRole = keyof typeof personaByRole;
type ProductPersona = (typeof personaByRole)[AccessRole];

function productPersona(
  personaId: ProductPersona,
  scopeType: string,
  scopeId: string | null,
  organizationId: string | null,
) {
  return {
    persona_id: personaId,
    scope: { scope_type: scopeType, scope_id: scopeId, organization_id: organizationId },
    enabled_unit: null,
    capabilities: Object.fromEntries(capabilitiesByPersona[personaId].map((key) => [key, false])),
  };
}

export function workspaceRolloutFixture(
  role?: AccessRole,
  scopeType?: string,
  scopeId: string | null = null,
  organizationId: string | null = null,
) {
  const personas = [];
  if (role && scopeType) {
    personas.push(productPersona(personaByRole[role], scopeType, scopeId, organizationId));
  }
  if (role === 'SupportAdmin') {
    personas.push(productPersona('support', 'platform', null, null));
  } else if (role === 'OrganizationOwner' && !scopeType) {
    personas.push(productPersona('company-owner', 'identity', null, null));
  }
  if (personas.length === 0) {
    personas.push({
      persona_id: 'general',
      scope: { scope_type: 'identity', scope_id: null, organization_id: null },
      enabled_unit: 'g1',
      capabilities: { access_resolution: true },
    });
  }
  return { contract_version: 1, rollout_mode: 'default_off', personas };
}
