import { describe, expect, it } from 'vitest';
import { workspaceGuidanceForRoles, workspaceRolesForAccess } from './workspaceAccess';

describe('role-aware workspace guidance', () => {
  it('uses active membership roles instead of unscoped group claims', () => {
    expect(workspaceRolesForAccess(
      ['CrewMember', 'Manager'],
      [{ role: 'CrewMember', status: 'active' }],
    )).toEqual(['CrewMember']);
    expect(workspaceRolesForAccess(['CrewMember'], [])).toEqual([]);
    expect(workspaceRolesForAccess(
      ['CrewMember'],
      [{ role: 'CrewMember', status: 'suspended' }],
    )).toEqual([]);
  });

  it('preserves support access and first-owner bootstrap without a membership', () => {
    expect(workspaceRolesForAccess(['SupportAdmin'], [])).toEqual(['SupportAdmin']);
    expect(workspaceRolesForAccess(['OrganizationOwner'], [])).toEqual(['OrganizationOwner']);
  });

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
    expect(workspaceGuidanceForRoles(['SupportAdmin']).label).toBe('Platform support');
    expect(workspaceGuidanceForRoles([]).label).toBe('No active workspace role');
  });
});
