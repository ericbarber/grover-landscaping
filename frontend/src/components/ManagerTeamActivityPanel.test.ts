import { describe, expect, it } from 'vitest';
import type { TeamAdministrationActivity } from '../api/client';
import {
  filterTeamActivity,
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
    expect(teamActivityLabel('crew_profile_updated')).toBe('Crew profile updated');
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
        eventKind: 'crew_profile_updated',
        targetId: 'crew_1',
        targetLabel: 'North Crew',
        occurredAt: '2026-07-19T13:00:00Z',
      },
    ];
    expect(filterTeamActivity(activity, 'jordan', '', 'all')).toEqual([activity[0]]);
    expect(filterTeamActivity(activity, 'manager-identity', '', 'all')).toEqual([activity[1]]);
    expect(filterTeamActivity(activity, '', 'alex', 'all')).toEqual([activity[0]]);
    expect(filterTeamActivity(activity, '', 'crew_1', 'all')).toEqual([activity[1]]);
    expect(filterTeamActivity(activity, '', '', 'role_changed')).toEqual([activity[0]]);
    expect(filterTeamActivity(activity, 'sam', '', 'role_changed')).toEqual([]);
  });

  it('counts active activity filters', () => {
    expect(teamActivityActiveFilterCount('', '', 'all')).toBe(0);
    expect(teamActivityActiveFilterCount('Jordan', 'North', 'crew_profile_updated')).toBe(3);
  });
});
