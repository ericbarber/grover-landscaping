import { describe, expect, it } from 'vitest';
import type { OrganizationMembership } from '../api/client';
import {
  canChangeMembershipRole,
  canSuspendMembership,
  filterTeamMemberships,
  teamMembershipActiveFilterCount,
  summarizeTeamMemberships,
} from './ManagerTeamMembershipsPanel';

const membership = (
  role: OrganizationMembership['role'],
  status = 'active',
): OrganizationMembership => ({
  id: 'membership_1',
  organizationId: 'org_1',
  organizationName: 'Test',
  organizationType: 'yard_care_company',
  userId: 'user_1',
  role,
  status,
  scopeType: 'organization',
  scopeId: 'org_1',
});

describe('team membership role controls', () => {
  it('guards the last active organization owner', () => {
    expect(canChangeMembershipRole(membership('OrganizationOwner'), 1)).toBe(false);
    expect(canChangeMembershipRole(membership('OrganizationOwner'), 2)).toBe(true);
  });

  it('allows active non-owner roles and excludes suspended memberships', () => {
    expect(canChangeMembershipRole(membership('Manager'), 1)).toBe(true);
    expect(canChangeMembershipRole(membership('Manager', 'suspended'), 1)).toBe(false);
  });

  it('guards last-owner suspension and allows reactivation separately', () => {
    expect(canSuspendMembership(membership('OrganizationOwner'), 1)).toBe(false);
    expect(canSuspendMembership(membership('OrganizationOwner'), 2)).toBe(true);
    expect(canSuspendMembership(membership('Manager'), 1)).toBe(true);
    expect(canSuspendMembership(membership('Manager', 'suspended'), 1)).toBe(false);
  });

  it('filters members by readable name, immutable identity, role, and status', () => {
    const members = [
      { ...membership('CrewLead'), displayName: 'Jordan Grover' },
      {
        ...membership('Manager', 'suspended'),
        id: 'membership_2',
        userId: 'manager-identity-2',
        displayName: 'Alex Rivera',
      },
    ];
    expect(filterTeamMemberships(members, 'jordan', 'all', 'all')).toEqual([members[0]]);
    expect(filterTeamMemberships(members, 'identity-2', 'all', 'all')).toEqual([members[1]]);
    expect(filterTeamMemberships(members, '', 'Manager', 'suspended')).toEqual([members[1]]);
    expect(filterTeamMemberships(members, '', 'CrewLead', 'suspended')).toEqual([]);
  });

  it('counts active team member filters', () => {
    expect(teamMembershipActiveFilterCount('', 'all', 'all')).toBe(0);
    expect(teamMembershipActiveFilterCount('Jordan', 'CrewLead', 'active')).toBe(3);
  });

  it('summarizes team lifecycle and operating roles', () => {
    const members = [
      membership('OrganizationOwner'),
      { ...membership('Manager', 'suspended'), id: 'membership_2' },
      { ...membership('CrewLead'), id: 'membership_3' },
      { ...membership('CrewMember'), id: 'membership_4' },
    ];
    expect(summarizeTeamMemberships(members)).toEqual({
      active: 3,
      suspended: 1,
      owners: 1,
      managers: 1,
      fieldTeam: 2,
    });
  });
});
