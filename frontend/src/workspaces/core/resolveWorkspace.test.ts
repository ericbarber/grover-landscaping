import { describe, expect, it } from 'vitest';
import type { WorkspaceRolloutProjection } from '../../api/client';
import { resolveWorkspace, workspacePersonasForRoles } from './resolveWorkspace';

function managedRollout(
  personaId: WorkspaceRolloutProjection['personas'][number]['personaId'],
  enabledUnit: string | null,
  capabilities: Record<string, boolean>,
): WorkspaceRolloutProjection {
  return {
    contractVersion: 2,
    enforcementMode: 'managed',
    rolloutMode: enabledUnit ? 'cohort' : 'default_off',
    personas: [{
      personaId,
      enabledUnit,
      capabilities,
      scope: {
        scopeType: 'crew',
        scopeId: 'crew-1',
        organizationId: 'organization-1',
      },
    }],
  };
}

describe('workspace resolver', () => {
  it('keeps persona presentation separate from eligible access roles', () => {
    const personas = workspacePersonasForRoles(['Manager', 'CrewLead']);
    expect(personas.map(({ id }) => id)).toEqual(['company-manager', 'crew-lead']);
    expect(personas[0].home.headline).toBe('Run today with confidence.');
  });

  it('uses server capabilities to compose managed navigation', () => {
    const resolved = resolveWorkspace('crew-lead', managedRollout('crew-lead', 'c3', {
      day_plan_visibility: true,
      stop_execution: false,
      field_proof: true,
      changes_and_recovery: false,
    }));

    expect(resolved.persona.navigation.map(({ view }) => view)).toEqual(['home', 'route']);
    expect(resolved.capabilities).toEqual(new Set(['day_plan_visibility', 'field_proof']));
    expect(resolved.fieldControls.jobDetails).toBe(false);
    expect(resolved.fieldControls.fieldEvidence).toBe(true);
    expect(resolved.rolloutScope?.scopeId).toBe('crew-1');
  });

  it('fails closed for a suspended managed workspace', () => {
    const resolved = resolveWorkspace('company-owner', managedRollout(
      'company-owner',
      null,
      {
        company_readiness: false,
        daily_operations: false,
        customers_and_team: false,
        reports_and_recovery: false,
      },
    ));

    expect(resolved.persona.navigation.map(({ view }) => view)).toEqual(['home']);
    expect(resolved.capabilities.size).toBe(0);
    expect(resolved.rolloutUnit).toBeNull();
  });

  it('does not restore unit capabilities when an explicit projection is all false', () => {
    const resolved = resolveWorkspace('crew-member', managedRollout('crew-member', 'cm3', {
      assigned_work: false,
      job_execution: false,
      field_evidence: false,
      personal_recovery: false,
    }));

    expect(resolved.persona.navigation.map(({ view }) => view)).toEqual(['home']);
    expect(resolved.capabilities.size).toBe(0);
  });

  it('marks design-only personas explicitly', () => {
    expect(resolveWorkspace('dispatcher', null).manifest.status).toBe('proposed');
    expect(resolveWorkspace('billing-admin', null).manifest.status).toBe('proposed');
    expect(resolveWorkspace('support', null).manifest.status).toBe('authoritative');
  });
});
