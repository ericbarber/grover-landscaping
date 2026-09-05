import { describe, expect, it } from 'vitest';
import {
  workspaceFieldControlsForPersona,
  workspacePersonasForRoles,
  workspacePersonaForRollout,
  workspaceSurfacesForPersona,
} from './workspacePersona';
import type { WorkspaceRolloutProjection } from '../api/client';

function rollout(
  personaId: WorkspaceRolloutProjection['personas'][number]['personaId'],
  enabledUnit: string | null,
  enforcementMode: WorkspaceRolloutProjection['enforcementMode'] = 'managed',
): WorkspaceRolloutProjection {
  return {
    contractVersion: 2,
    enforcementMode,
    rolloutMode: enabledUnit ? 'cohort' : 'default_off',
    personas: [{
      personaId,
      scope: {
        scopeType: 'organization',
        scopeId: 'scope-1',
        organizationId: 'organization-1',
      },
      enabledUnit,
      capabilities: {},
    }],
  };
}

describe('persona workspaces', () => {
  it('maps current product roles to distinct workspaces', () => {
    expect(workspacePersonasForRoles(['PropertyOwner'])[0].id).toBe('yard-owner');
    expect(workspacePersonasForRoles(['PropertyManager'])[0].id).toBe('property-manager');
    expect(workspacePersonasForRoles(['CrewLead'])[0].id).toBe('crew-lead');
    expect(workspacePersonasForRoles(['CrewMember'])[0].id).toBe('crew-member');
    expect(workspacePersonasForRoles(['OrganizationOwner'])[0].id).toBe('company-owner');
    expect(workspacePersonasForRoles(['Manager'])[0].id).toBe('company-manager');
  });

  it('supports future operations, billing, and support personas', () => {
    expect(
      workspacePersonasForRoles(['Dispatcher', 'BillingAdmin', 'SupportAdmin'])
        .map((persona) => persona.id),
    ).toEqual(['dispatcher', 'billing-admin', 'support']);
  });

  it('keeps all available personas for multi-role users without duplicates', () => {
    expect(
      workspacePersonasForRoles(['CrewLead', 'Manager', 'CrewLead', 'PropertyManager'])
        .map((persona) => persona.id),
    ).toEqual(['company-manager', 'property-manager', 'crew-lead']);
  });

  it('limits customer and crew navigation to relevant work', () => {
    expect(workspacePersonasForRoles(['PropertyOwner'])[0].navigation.map(({ view }) => view))
      .toEqual(['home', 'customer']);
    expect(workspacePersonasForRoles(['CrewMember'])[0].navigation.map(({ view }) => view))
      .toEqual(['home', 'route', 'jobs', 'job']);
  });

  it('uses the shared outlined icon family for every navigation item', () => {
    const allowedIcons = new Set([
      'home',
      'route',
      'jobs',
      'job',
      'manage',
      'customer',
    ]);

    for (const persona of workspacePersonasForRoles([
      'PropertyOwner',
      'PropertyManager',
      'CrewLead',
      'CrewMember',
      'OrganizationOwner',
      'Manager',
      'Dispatcher',
      'BillingAdmin',
      'SupportAdmin',
    ])) {
      for (const item of persona.navigation) {
        expect(allowedIcons.has(item.icon)).toBe(true);
        expect(item).not.toHaveProperty('symbol');
      }
    }
  });

  it('keeps desktop surfaces aligned with the selected persona', () => {
    expect(workspaceSurfacesForPersona('yard-owner')).toEqual({
      fieldOperations: false,
      customerCare: true,
      management: false,
    });
    expect(workspaceSurfacesForPersona('crew-lead')).toEqual({
      fieldOperations: true,
      customerCare: false,
      management: false,
    });
    expect(workspaceSurfacesForPersona('company-owner')).toEqual({
      fieldOperations: true,
      customerCare: false,
      management: true,
    });
    expect(workspaceSurfacesForPersona('support')).toEqual({
      fieldOperations: false,
      customerCare: false,
      management: true,
    });
  });

  it('preserves current navigation until a subject enters managed rollout', () => {
    const crewLead = workspacePersonasForRoles(['CrewLead'])[0];
    expect(workspacePersonaForRollout(crewLead, null).navigation.map(({ view }) => view))
      .toEqual(['home', 'route', 'jobs', 'job']);
    expect(
      workspacePersonaForRollout(crewLead, rollout('crew-lead', null, 'legacy'))
        .navigation.map(({ view }) => view),
    ).toEqual(['home', 'route', 'jobs', 'job']);
  });

  it('adds field destinations only with their cumulative unit', () => {
    const crewLead = workspacePersonasForRoles(['CrewLead'])[0];
    expect(
      workspacePersonaForRollout(crewLead, rollout('crew-lead', 'c1'))
        .navigation.map(({ view }) => view),
    ).toEqual(['home', 'route']);
    expect(
      workspacePersonaForRollout(crewLead, rollout('crew-lead', 'c2'))
        .navigation.map(({ view }) => view),
    ).toEqual(['home', 'route', 'jobs', 'job']);
  });

  it('keeps suspended managed personas at safe Home instead of restoring legacy links', () => {
    const companyOwner = workspacePersonasForRoles(['OrganizationOwner'])[0];
    expect(
      workspacePersonaForRollout(companyOwner, rollout('company-owner', null))
        .navigation.map(({ view }) => view),
    ).toEqual(['home']);
    expect(
      workspacePersonaForRollout(companyOwner, rollout('company-owner', 'unknown-unit'))
        .navigation.map(({ view }) => view),
    ).toEqual(['home']);
  });

  it('matches customer and company destination boundaries from the rollout map', () => {
    const yardOwner = workspacePersonasForRoles(['PropertyOwner'])[0];
    const propertyManager = workspacePersonasForRoles(['PropertyManager'])[0];
    const companyManager = workspacePersonasForRoles(['Manager'])[0];
    expect(
      workspacePersonaForRollout(yardOwner, rollout('yard-owner', 'u1'))
        .navigation.map(({ view }) => view),
    ).toEqual(['home']);
    expect(
      workspacePersonaForRollout(yardOwner, rollout('yard-owner', 'u2'))
        .navigation.map(({ view }) => view),
    ).toEqual(['home', 'customer']);
    expect(
      workspacePersonaForRollout(propertyManager, rollout('property-manager', 'p1'))
        .navigation.map(({ view }) => view),
    ).toEqual(['home', 'customer']);
    expect(
      workspacePersonaForRollout(propertyManager, rollout('property-manager', 'p4'))
        .navigation.map(({ view }) => view),
    ).toEqual(['home', 'customer', 'manager']);
    expect(
      workspacePersonaForRollout(companyManager, rollout('company-manager', 'm1'))
        .navigation.map(({ view }) => view),
    ).toEqual(['home', 'manager']);
    expect(
      workspacePersonaForRollout(companyManager, rollout('company-manager', 'm2'))
        .navigation.map(({ view }) => view),
    ).toEqual(['home', 'manager', 'route', 'jobs', 'job']);
  });

  it('keeps field minimums read only and adds controls cumulatively', () => {
    expect(workspaceFieldControlsForPersona('crew-lead', 'c1')).toEqual({
      jobDetails: false,
      stopProgress: false,
      routeChanges: false,
      fieldEvidence: false,
      report: false,
    });
    expect(workspaceFieldControlsForPersona('crew-lead', 'c2')).toEqual({
      jobDetails: true,
      stopProgress: true,
      routeChanges: false,
      fieldEvidence: false,
      report: false,
    });
    expect(workspaceFieldControlsForPersona('crew-lead', 'c4')).toEqual({
      jobDetails: true,
      stopProgress: true,
      routeChanges: true,
      fieldEvidence: true,
      report: true,
    });
    expect(workspaceFieldControlsForPersona('crew-member', 'cm4').routeChanges).toBe(false);
    expect(workspaceFieldControlsForPersona('company-manager', 'm2')).toMatchObject({
      jobDetails: true,
      stopProgress: false,
      routeChanges: false,
    });
    expect(workspaceFieldControlsForPersona('crew-lead', null).jobDetails).toBe(false);
  });
});
