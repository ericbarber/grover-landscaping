import { describe, expect, it } from 'vitest';
import { teamActivityLabel } from './ManagerTeamActivityPanel';

describe('team administration activity labels', () => {
  it('labels every supported audit event as a manager action', () => {
    expect(teamActivityLabel('organization_profile_updated')).toBe('Organization profile updated');
    expect(teamActivityLabel('invite_accepted')).toBe('Invitation accepted');
    expect(teamActivityLabel('invitation_revoked')).toBe('Invitation revoked');
    expect(teamActivityLabel('invitation_reissued')).toBe('Invitation reissued');
    expect(teamActivityLabel('role_changed')).toBe('Membership role changed');
    expect(teamActivityLabel('membership_suspended')).toBe('Membership suspended');
    expect(teamActivityLabel('membership_reactivated')).toBe('Membership reactivated');
  });
});
