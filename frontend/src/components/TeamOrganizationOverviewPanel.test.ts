import { describe, expect, it } from 'vitest';
import type {
  CrewRecord,
  OrganizationInvitationSummary,
  OrganizationMembership,
  ServiceTerritoryRecord,
} from '../api/client';
import { summarizeTeamOrganization } from './TeamOrganizationOverviewPanel';

describe('team organization overview', () => {
  it('summarizes active access and operating-structure gaps', () => {
    const memberships = [
      { id: 'member_owner', status: 'active' },
      { id: 'member_lead', status: 'active' },
      { id: 'member_paused', status: 'suspended' },
    ] as OrganizationMembership[];
    const invitations = [
      { id: 'invite_pending', status: 'pending' },
      { id: 'invite_accepted', status: 'accepted' },
    ] as OrganizationInvitationSummary[];
    const crews = [
      { id: 'crew_north', status: 'active', territoryId: 'territory_north', leadMembershipId: 'member_lead' },
      { id: 'crew_south', status: 'active', territoryId: 'territory_south', leadMembershipId: null },
      { id: 'crew_inactive', status: 'inactive', territoryId: 'territory_east', leadMembershipId: null },
    ] as CrewRecord[];
    const territories = [
      { id: 'territory_north', organizationId: 'org_demo', status: 'active' },
      { id: 'territory_south', organizationId: 'org_demo', status: 'active' },
      { id: 'territory_east', organizationId: 'org_demo', status: 'active' },
      { id: 'territory_retired', organizationId: 'org_demo', status: 'inactive' },
    ] as ServiceTerritoryRecord[];

    expect(summarizeTeamOrganization(
      memberships,
      invitations,
      crews,
      territories,
    )).toEqual({
      activeMembers: 2,
      pendingInvitations: 1,
      activeCrews: 2,
      unstaffedTerritories: 1,
      crewsWithoutLead: 1,
    });
  });

  it('preserves available counts without inferring unavailable staffing data', () => {
    const territories = [
      { id: 'territory_north', organizationId: 'org_demo', status: 'active' },
    ] as ServiceTerritoryRecord[];
    expect(summarizeTeamOrganization(
      [{ id: 'member_owner', status: 'active' }] as OrganizationMembership[],
      null,
      null,
      territories,
    )).toEqual({
      activeMembers: 1,
      pendingInvitations: null,
      activeCrews: null,
      unstaffedTerritories: null,
      crewsWithoutLead: null,
    });
  });
});
