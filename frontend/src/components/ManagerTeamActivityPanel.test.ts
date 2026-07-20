import { describe, expect, it } from 'vitest';
import type { TeamAdministrationActivity } from '../api/client';
import {
  filterTeamActivity,
  summarizeTeamActivity,
  sortTeamActivity,
  teamActivityCsv,
  teamActivityTimestampLabel,
  teamActivityActiveFilterCount,
  teamActivityLabel,
} from './ManagerTeamActivityPanel';

describe('team administration activity labels', () => {
  it('labels every supported audit event as a manager action', () => {
    expect(teamActivityLabel('organization_profile_updated')).toBe('Organization profile updated');
    expect(teamActivityLabel('invite_accepted')).toBe('Invitation accepted');
    expect(teamActivityLabel('invitation_revoked')).toBe('Invitation revoked');
    expect(teamActivityLabel('invitation_reissued')).toBe('Invitation reissued');
    expect(teamActivityLabel('role_changed')).toBe('Membership role changed');
    expect(teamActivityLabel('membership_suspended')).toBe('Membership suspended');
    expect(teamActivityLabel('membership_reactivated')).toBe('Membership reactivated');
    expect(teamActivityLabel('membership_profile_updated')).toBe('Member display name updated');
    expect(teamActivityLabel('branch_created')).toBe('Branch created');
    expect(teamActivityLabel('branch_status_updated')).toBe('Branch status updated');
    expect(teamActivityLabel('territory_created')).toBe('Territory created');
    expect(teamActivityLabel('territory_status_updated')).toBe('Territory status updated');
    expect(teamActivityLabel('crew_profile_updated')).toBe('Crew profile updated');
    expect(teamActivityLabel('crew_hierarchy_updated')).toBe('Crew hierarchy updated');
    expect(teamActivityLabel('crew_deactivated')).toBe('Crew deactivated');
    expect(teamActivityLabel('crew_reactivated')).toBe('Crew reactivated');
  });

  it('filters activity by readable actor, immutable identity, and event', () => {
    const activity: TeamAdministrationActivity[] = [
      {
        id: 'audit_1',
        actorUserId: 'owner-identity',
        actorLabel: 'Jordan Grover',
        organizationId: 'org_1',
        eventKind: 'role_changed',
        targetId: 'membership_1',
        targetLabel: 'Alex Rivera',
        occurredAt: '2026-07-19T12:00:00Z',
      },
      {
        id: 'audit_2',
        actorUserId: 'manager-identity',
        actorLabel: 'Sam Lee',
        organizationId: 'org_1',
        eventKind: 'crew_hierarchy_updated',
        targetId: 'crew_1',
        targetLabel: 'North Crew',
        sourceBranchLabel: 'North Branch',
        sourceTerritoryLabel: 'Desert Ridge',
        destinationBranchLabel: 'South Branch',
        destinationTerritoryLabel: 'Tempe',
        crossBranchMove: true,
        occurredAt: '2026-07-19T13:00:00Z',
      },
    ];
    expect(filterTeamActivity(activity, 'jordan', '', '', 'all')).toEqual([activity[0]]);
    expect(filterTeamActivity(activity, 'manager-identity', '', '', 'all')).toEqual([activity[1]]);
    expect(filterTeamActivity(activity, '', 'alex', '', 'all')).toEqual([activity[0]]);
    expect(filterTeamActivity(activity, '', 'crew_1', '', 'all')).toEqual([activity[1]]);
    expect(filterTeamActivity(activity, '', 'tempe', '', 'all')).toEqual([activity[1]]);
    expect(filterTeamActivity(activity, '', '', 'audit_2', 'all')).toEqual([activity[1]]);
    expect(filterTeamActivity(activity, '', '', '', 'role_changed')).toEqual([activity[0]]);
    expect(filterTeamActivity(activity, '', '', '', 'all', 'cross_branch'))
      .toEqual([activity[1]]);
    expect(filterTeamActivity(activity, '', '', '', 'all', 'within_branch')).toEqual([]);
    expect(filterTeamActivity(activity, 'sam', '', '', 'role_changed')).toEqual([]);
  });

  it('counts active activity filters', () => {
    expect(teamActivityActiveFilterCount('', '', '', 'all')).toBe(0);
    expect(teamActivityActiveFilterCount('Jordan', 'North', 'audit', 'crew_profile_updated'))
      .toBe(4);
    expect(teamActivityActiveFilterCount('', '', '', 'all', 'cross_branch')).toBe(1);
  });

  it('summarizes loaded access, crew, and organization changes', () => {
    const base: TeamAdministrationActivity = {
      id: 'audit_1',
      actorUserId: 'owner',
      actorLabel: 'Jordan Grover',
      organizationId: 'org_1',
      eventKind: 'role_changed',
      targetId: 'membership_1',
      targetLabel: 'Alex Rivera',
      occurredAt: '2026-07-19T12:00:00Z',
    };
    expect(summarizeTeamActivity([
      base,
      { ...base, id: 'audit_2', eventKind: 'crew_profile_updated' },
      { ...base, id: 'audit_3', eventKind: 'organization_profile_updated' },
      { ...base, id: 'audit_4', eventKind: 'territory_status_updated' },
      {
        ...base,
        id: 'audit_5',
        eventKind: 'crew_hierarchy_updated',
        crossBranchMove: true,
      },
      {
        ...base,
        id: 'audit_6',
        eventKind: 'crew_hierarchy_updated',
        crossBranchMove: false,
      },
    ])).toEqual({
      total: 6,
      access: 1,
      crew: 3,
      organization: 2,
      crossBranchMoves: 1,
      withinBranchMoves: 1,
    });
  });

  it('exports quoted CSV with readable and immutable audit identities', () => {
    const item: TeamAdministrationActivity = {
      id: 'audit_1',
      actorUserId: 'owner-1',
      actorLabel: 'Grover, "Jordan"',
      organizationId: 'org_1',
      eventKind: 'role_changed',
      targetId: 'membership_1',
      targetLabel: 'Alex Rivera',
      occurredAt: '2026-07-19T12:00:00Z',
    };
    expect(teamActivityCsv([item])).toContain(
      '"Grover, ""Jordan""","owner-1","Alex Rivera","membership_1"',
    );
    expect(teamActivityCsv([item])).toContain(
      '"2026-07-19T12:00:00Z","audit_1","Membership role changed"',
    );
  });

  it('exports readable source and destination hierarchy context for crew moves', () => {
    const item: TeamAdministrationActivity = {
      id: 'audit_move',
      actorUserId: 'owner-1',
      actorLabel: 'Jordan Grover',
      organizationId: 'org_1',
      eventKind: 'crew_hierarchy_updated',
      targetId: 'crew_1',
      targetLabel: 'North Crew',
      sourceBranchLabel: 'North Branch',
      sourceTerritoryLabel: 'Desert Ridge',
      destinationBranchLabel: 'South Branch',
      destinationTerritoryLabel: 'Tempe',
      crossBranchMove: true,
      occurredAt: '2026-07-19T12:00:00Z',
    };

    expect(teamActivityCsv([item])).toContain(
      '"North Branch","Desert Ridge","South Branch","Tempe"',
    );
    expect(teamActivityCsv([item])).toContain('"cross_branch"');
  });

  it('sorts a copy of loaded activity newest or oldest first', () => {
    const item = (id: string, occurredAt: string): TeamAdministrationActivity => ({
      id,
      actorUserId: 'owner',
      actorLabel: 'Jordan',
      organizationId: 'org_1',
      eventKind: 'role_changed',
      targetId: 'member',
      targetLabel: 'Alex',
      occurredAt,
    });
    const activity = [
      item('audit_1', '2026-07-18T12:00:00Z'),
      item('audit_2', '2026-07-19T12:00:00Z'),
    ];
    expect(sortTeamActivity(activity, 'newest').map((entry) => entry.id))
      .toEqual(['audit_2', 'audit_1']);
    expect(sortTeamActivity(activity, 'oldest').map((entry) => entry.id))
      .toEqual(['audit_1', 'audit_2']);
    expect(activity[0].id).toBe('audit_1');
  });

  it('formats activity with both local date and time detail', () => {
    const label = teamActivityTimestampLabel('2026-07-19T12:34:00Z');
    expect(label).toMatch(/2026/);
    expect(label).toMatch(/34/);
  });
});
