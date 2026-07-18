import { describe, expect, it } from 'vitest';
import { organizationInvitationTokenFromPath } from './organizationInvitationRoute';

describe('organization invitation route', () => {
  it('reads encoded invitation tokens', () => {
    expect(organizationInvitationTokenFromPath('/organization-invitations/invite%2F1001')).toBe(
      'invite/1001',
    );
  });

  it('rejects unrelated, empty, malformed, and nested routes', () => {
    expect(organizationInvitationTokenFromPath('/')).toBeNull();
    expect(organizationInvitationTokenFromPath('/organization-invitations/')).toBeNull();
    expect(organizationInvitationTokenFromPath('/organization-invitations/%E0%A4%A')).toBeNull();
    expect(organizationInvitationTokenFromPath('/organization-invitations/token/extra')).toBeNull();
  });
});
