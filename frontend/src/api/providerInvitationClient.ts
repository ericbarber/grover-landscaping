import { apiRequestError } from './apiError';
import { authenticatedFetch } from './authenticatedFetch';
import { API_BASE_URL } from './baseUrl';

interface ApiProviderInvitationProgress {
  invitation_id: string;
  progress_stage: string;
  status_label: string;
  next_action: string;
  recipient_email_checked: boolean;
  organization_relationship_checked: boolean;
  opportunity_response_capability: boolean;
  response_action?: string | null;
  response_label?: string | null;
  responded_at_epoch_seconds?: number | null;
  closed: boolean;
}

export interface ProviderInvitationProgress {
  invitationId: string;
  progressStage: string;
  statusLabel: string;
  nextAction: string;
  recipientEmailChecked: boolean;
  organizationRelationshipChecked: boolean;
  opportunityResponseCapability: boolean;
  responseAction?: string;
  responseLabel?: string;
  respondedAtEpochSeconds?: number;
  closed: boolean;
}

export async function fetchProviderInvitationProgress(
  token: string,
): Promise<ProviderInvitationProgress> {
  const response = await authenticatedFetch(`${API_BASE_URL}/provider-invitations/progress`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  if (!response.ok) {
    throw await apiRequestError(
      response,
      `Provider invitation progress failed with status ${response.status}.`,
    );
  }
  const progress = await response.json() as ApiProviderInvitationProgress;
  return {
    invitationId: progress.invitation_id,
    progressStage: progress.progress_stage,
    statusLabel: progress.status_label,
    nextAction: progress.next_action,
    recipientEmailChecked: progress.recipient_email_checked,
    organizationRelationshipChecked: progress.organization_relationship_checked,
    opportunityResponseCapability: progress.opportunity_response_capability,
    responseAction: progress.response_action ?? undefined,
    responseLabel: progress.response_label ?? undefined,
    respondedAtEpochSeconds: progress.responded_at_epoch_seconds ?? undefined,
    closed: progress.closed,
  };
}
