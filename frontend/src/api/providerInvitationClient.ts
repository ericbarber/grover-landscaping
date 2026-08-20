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

interface ApiProviderDisclosureAccess {
  invitation_id: string;
  status: string;
  can_access: boolean;
  recovery_action?: string;
  organization_name?: string;
  property_name?: string;
  purpose?: string;
  approved_categories?: string[];
  withheld_categories?: string[];
  brief_version?: number;
  expires_at_epoch_seconds?: number;
  exact_address?: string;
  yard_brief?: { yard_areas: string[]; care_goals: string[]; cadence_preference: string };
  selected_yard_photos?: Array<{
    media_id: string;
    shot_type: string;
    file_label: string;
    display_url: string;
    thumbnail_url?: string;
    authorization_expires_at_epoch_seconds: number;
  }>;
  owner_contact?: string;
  access_considerations?: string;
  authority_boundary?: string;
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

export interface ProviderDisclosureAccess {
  invitationId: string;
  status: string;
  canAccess: boolean;
  recoveryAction?: string;
  organizationName?: string;
  propertyName?: string;
  purpose?: string;
  approvedCategories?: string[];
  withheldCategories?: string[];
  briefVersion?: number;
  expiresAtEpochSeconds?: number;
  exactAddress?: string;
  yardBrief?: { yardAreas: string[]; careGoals: string[]; cadencePreference: string };
  selectedYardPhotos?: Array<{
    mediaId: string; shotType: string; fileLabel: string; displayUrl: string;
    thumbnailUrl?: string; authorizationExpiresAtEpochSeconds: number;
  }>;
  ownerContact?: string;
  accessConsiderations?: string;
  authorityBoundary?: string;
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

export async function fetchProviderDisclosureAccess(token: string): Promise<ProviderDisclosureAccess> {
  const response = await authenticatedFetch(`${API_BASE_URL}/provider-disclosures/access`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  if (!response.ok && response.status !== 410) {
    throw await apiRequestError(response, `Provider assessment access failed with status ${response.status}.`);
  }
  const value = await response.json() as ApiProviderDisclosureAccess;
  return {
    invitationId: value.invitation_id,
    status: value.status,
    canAccess: value.can_access,
    recoveryAction: value.recovery_action,
    organizationName: value.organization_name,
    propertyName: value.property_name,
    purpose: value.purpose,
    approvedCategories: value.approved_categories,
    withheldCategories: value.withheld_categories,
    briefVersion: value.brief_version,
    expiresAtEpochSeconds: value.expires_at_epoch_seconds,
    exactAddress: value.exact_address,
    yardBrief: value.yard_brief ? {
      yardAreas: value.yard_brief.yard_areas,
      careGoals: value.yard_brief.care_goals,
      cadencePreference: value.yard_brief.cadence_preference,
    } : undefined,
    selectedYardPhotos: value.selected_yard_photos?.map((photo) => ({
      mediaId: photo.media_id,
      shotType: photo.shot_type,
      fileLabel: photo.file_label,
      displayUrl: photo.display_url,
      thumbnailUrl: photo.thumbnail_url,
      authorizationExpiresAtEpochSeconds: photo.authorization_expires_at_epoch_seconds,
    })),
    ownerContact: value.owner_contact,
    accessConsiderations: value.access_considerations,
    authorityBoundary: value.authority_boundary,
  };
}
