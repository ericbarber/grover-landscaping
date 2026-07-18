import { describe, expect, it } from 'vitest';
import { workspaceGuidanceForRoles } from './workspaceAccess';

describe('role-aware workspace guidance', () => {
  it('shows administration only for manager-capable roles', () => {
    expect(workspaceGuidanceForRoles(['OrganizationOwner']).managerTools).toBe(true);
    expect(workspaceGuidanceForRoles(['Manager']).managerTools).toBe(true);
    expect(workspaceGuidanceForRoles(['PropertyManager']).managerTools).toBe(true);
    expect(workspaceGuidanceForRoles(['CrewMember']).managerTools).toBe(false);
    expect(workspaceGuidanceForRoles(['PropertyOwner']).managerTools).toBe(false);
  });

  it('guides accepted crew and customer roles to distinct workspaces', () => {
    expect(workspaceGuidanceForRoles(['CrewLead']).label).toBe('Crew workspace');
    expect(workspaceGuidanceForRoles(['PropertyOwner']).label).toBe('Customer access');
    expect(workspaceGuidanceForRoles([]).label).toBe('Access refreshing');
  });
});
