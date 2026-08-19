import { describe, expect, it } from 'vitest';
import {
  isProviderInvitationPath,
  PROVIDER_INVITATION_PATH,
  providerInvitationTokenFromFragment,
} from './providerInvitationRoute';

describe('provider invitation route', () => {
  it('recognizes only the authenticated provider invitation entry', () => {
    expect(PROVIDER_INVITATION_PATH).toBe('/app/provider-invitation');
    expect(isProviderInvitationPath('/app/provider-invitation/')).toBe(true);
    expect(isProviderInvitationPath('/app/yard-owner')).toBe(false);
  });

  it('reads an invitation from a fragment without accepting unrelated or oversized values', () => {
    expect(providerInvitationTokenFromFragment('#invitation=owner_provider_123')).toBe('owner_provider_123');
    expect(providerInvitationTokenFromFragment('#other=value')).toBeNull();
    expect(providerInvitationTokenFromFragment(`#invitation=${'a'.repeat(513)}`)).toBeNull();
  });
});
