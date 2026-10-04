import { afterEach, describe, expect, it, vi } from 'vitest';
import { configureApiAuthentication } from './authenticatedFetch';
import {
  acceptRecipientPropertyManagerInvitation,
  createOwnerPropertyManagerInvitation,
  fetchRecipientPropertyManagerInvitations,
  revokeOwnerPropertyManagerInvitation,
} from './customerPropertyManagerAccessClient';

afterEach(() => {
  configureApiAuthentication(false, async () => null);
  vi.unstubAllGlobals();
});

const ownerRecord = {
  invitation_id: 'invite_1', activation_id: 'activation_1', owner_property_id: 'owner_property_1',
  organization_id: 'org_1', account_id: 'account_1', property_id: 'property_1',
  owner_user_id: 'owner_1', recipient_email: 'manager@example.com', status: 'pending',
  accepted_user_id: null, created_at_epoch_seconds: 100, expires_at_epoch_seconds: 200,
  accepted_at_epoch_seconds: null, revoked_at_epoch_seconds: null, persisted: true,
};

describe('customer property manager access client', () => {
  it('creates an exact relationship invitation with the caller retry key', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(ownerRecord), { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(createOwnerPropertyManagerInvitation(
      'owner property/1', 'activation/1', 'manager@example.com', 'manager-invite-001',
    )).resolves.toMatchObject({
      invitationId: 'invite_1', recipientEmail: 'manager@example.com', status: 'pending', persisted: true,
    });
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain(
      '/owner-properties/owner%20property%2F1/provider-relationships/activation%2F1/manager-invitations',
    );
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      recipient_email: 'manager@example.com', idempotency_key: 'manager-invite-001',
    });
  });

  it('maps the recipient inbox without accepting property or owner details', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify([{
      invitation_id: 'invite_1', status: 'pending', expires_at_epoch_seconds: 200,
    }]), { status: 200 })));

    const invitations = await fetchRecipientPropertyManagerInvitations();
    expect(invitations).toEqual([{
      invitationId: 'invite_1', status: 'pending', expiresAtEpochSeconds: 200,
    }]);
    expect(invitations[0]).not.toHaveProperty('propertyId');
    expect(invitations[0]).not.toHaveProperty('ownerUserId');
    expect(invitations[0]).not.toHaveProperty('recipientEmail');
  });

  it('uses explicit accept and revoke actions', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ ...ownerRecord, status: 'accepted' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ...ownerRecord, status: 'revoked' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await acceptRecipientPropertyManagerInvitation('invite/1');
    await revokeOwnerPropertyManagerInvitation('property/1', 'activation/1', 'invite/1');

    expect(String(fetchMock.mock.calls[0]?.[0])).toContain(
      '/customer-property-manager-invitations/invite%2F1/accept',
    );
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain(
      '/manager-invitations/invite%2F1/revoke',
    );
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: 'POST' });
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({ method: 'POST' });
  });

  it('preserves fail-closed server conflicts', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      error: 'customer_property_manager_invitation_not_active',
      message: 'This invitation is no longer active.',
    }), { status: 409 })));

    await expect(acceptRecipientPropertyManagerInvitation('invite_1')).rejects.toMatchObject({
      status: 409,
      code: 'customer_property_manager_invitation_not_active',
    });
  });
});
