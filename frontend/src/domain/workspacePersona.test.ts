import { describe, expect, it } from 'vitest';
import { workspacePersonasForRoles } from './workspacePersona';

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
      .toEqual(['customer']);
    expect(workspacePersonasForRoles(['CrewMember'])[0].navigation.map(({ view }) => view))
      .toEqual(['route', 'jobs', 'job']);
  });
});
