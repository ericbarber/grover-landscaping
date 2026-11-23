import { apiRequestError } from './apiError';
import { authenticatedFetch } from './authenticatedFetch';
import { API_BASE_URL } from './baseUrl';

interface ApiOwnerPropertyManagerInvitation {
  invitation_id: string;
  activation_id: string;
  owner_property_id: string;
  organization_id: string;
  account_id: string;
  property_id: string;
  owner_user_id: string;
  recipient_email: string;
  status: OwnerPropertyManagerInvitation['status'];
  accepted_user_id?: string | null;
  created_at_epoch_seconds: number;
  expires_at_epoch_seconds: number;
  accepted_at_epoch_seconds?: number | null;
  revoked_at_epoch_seconds?: number | null;
  persisted: boolean;
}

interface ApiRecipientPropertyManagerInvitation {
  invitation_id: string;
  status: RecipientPropertyManagerInvitation['status'];
  expires_at_epoch_seconds: number;
}

export interface OwnerPropertyManagerInvitation {
  invitationId: string;
  activationId: string;
  ownerPropertyId: string;
  recipientEmail: string;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  createdAtEpochSeconds: number;
  expiresAtEpochSeconds: number;
  acceptedAtEpochSeconds?: number;
  revokedAtEpochSeconds?: number;
  persisted: boolean;
}

export interface RecipientPropertyManagerInvitation {
  invitationId: string;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  expiresAtEpochSeconds: number;
}

function ownerInvitation(record: ApiOwnerPropertyManagerInvitation): OwnerPropertyManagerInvitation {
  return {
    invitationId: record.invitation_id,
    activationId: record.activation_id,
    ownerPropertyId: record.owner_property_id,
    recipientEmail: record.recipient_email,
    status: record.status,
    createdAtEpochSeconds: record.created_at_epoch_seconds,
    expiresAtEpochSeconds: record.expires_at_epoch_seconds,
    acceptedAtEpochSeconds: record.accepted_at_epoch_seconds ?? undefined,
    revokedAtEpochSeconds: record.revoked_at_epoch_seconds ?? undefined,
    persisted: record.persisted,
  };
}

function recipientInvitation(
  record: ApiRecipientPropertyManagerInvitation,
): RecipientPropertyManagerInvitation {
  return {
    invitationId: record.invitation_id,
    status: record.status,
    expiresAtEpochSeconds: record.expires_at_epoch_seconds,
  };
}

async function responseJson<T>(response: Response, fallback: string): Promise<T> {
  if (!response.ok) throw await apiRequestError(response, fallback);
  return response.json() as Promise<T>;
}

function ownerCollectionPath(propertyId: string, activationId: string): string {
  return `${API_BASE_URL}/owner-properties/${encodeURIComponent(propertyId)}/provider-relationships/${encodeURIComponent(activationId)}/manager-invitations`;
}

export async function fetchOwnerPropertyManagerInvitations(
  propertyId: string,
  activationId: string,
): Promise<OwnerPropertyManagerInvitation[]> {
  const records = await responseJson<ApiOwnerPropertyManagerInvitation[]>(
    await authenticatedFetch(ownerCollectionPath(propertyId, activationId)),
    'Property manager access could not be loaded.',
  );
  return records.map(ownerInvitation);
}

export async function createOwnerPropertyManagerInvitation(
  propertyId: string,
  activationId: string,
  recipientEmail: string,
  idempotencyKey: string,
): Promise<OwnerPropertyManagerInvitation> {
  const record = await responseJson<ApiOwnerPropertyManagerInvitation>(
    await authenticatedFetch(ownerCollectionPath(propertyId, activationId), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        recipient_email: recipientEmail,
        idempotency_key: idempotencyKey,
      }),
    }),
    'The property manager invitation could not be confirmed.',
  );
  return ownerInvitation(record);
}

export async function revokeOwnerPropertyManagerInvitation(
  propertyId: string,
  activationId: string,
  invitationId: string,
): Promise<OwnerPropertyManagerInvitation> {
  const response = await authenticatedFetch(
    `${ownerCollectionPath(propertyId, activationId)}/${encodeURIComponent(invitationId)}/revoke`,
    { method: 'POST' },
  );
  return ownerInvitation(await responseJson<ApiOwnerPropertyManagerInvitation>(
    response,
    'Property manager access could not be revoked.',
  ));
}

export async function fetchRecipientPropertyManagerInvitations(): Promise<
  RecipientPropertyManagerInvitation[]
> {
  const records = await responseJson<ApiRecipientPropertyManagerInvitation[]>(
    await authenticatedFetch(`${API_BASE_URL}/customer-property-manager-invitations`),
    'Property manager invitations could not be loaded.',
  );
  return records.map(recipientInvitation);
}

export async function acceptRecipientPropertyManagerInvitation(
  invitationId: string,
): Promise<void> {
  await responseJson<ApiOwnerPropertyManagerInvitation>(
    await authenticatedFetch(
      `${API_BASE_URL}/customer-property-manager-invitations/${encodeURIComponent(invitationId)}/accept`,
      { method: 'POST' },
    ),
    'The property manager invitation could not be accepted.',
  );
}
