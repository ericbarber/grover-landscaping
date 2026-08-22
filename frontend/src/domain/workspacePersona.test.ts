import { describe, expect, it } from 'vitest';
import {
  workspacePersonasForRoles,
  workspaceSurfacesForPersona,
} from './workspacePersona';

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
});
