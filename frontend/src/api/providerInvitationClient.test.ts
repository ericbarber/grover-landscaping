import { afterEach, describe, expect, it, vi } from 'vitest';
import { configureApiAuthentication } from './authenticatedFetch';
import { fetchProviderInvitationProgress } from './providerInvitationClient';

afterEach(() => {
  configureApiAuthentication(false, async () => null);
  vi.unstubAllGlobals();
});

describe('provider invitation progress client', () => {
  it('keeps the bearer token in the protected request body and maps safe progress', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      invitation_id: 'invitation_1', progress_stage: 'response_recorded',
      status_label: 'Interest recorded; waiting for the owner’s next decision',
      next_action: 'wait_for_owner', recipient_email_checked: true,
      organization_relationship_checked: true, opportunity_response_capability: true,
      response_action: 'express_interest', response_label: 'Interest recorded',
      responded_at_epoch_seconds: 1_799_000_000, closed: false,
    }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchProviderInvitationProgress('owner_provider_secret')).resolves.toEqual(
      expect.objectContaining({
        invitationId: 'invitation_1',
        progressStage: 'response_recorded',
        responseAction: 'express_interest',
        closed: false,
      }),
    );
    expect(fetchMock.mock.calls[0][0]).toContain('/provider-invitations/progress');
    expect(fetchMock.mock.calls[0][0]).not.toContain('owner_provider_secret');
    expect(JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)).toEqual({
      token: 'owner_provider_secret',
    });
  });
});
