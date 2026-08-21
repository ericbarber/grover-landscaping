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
  grant_id?: string;
  receipt_id?: string;
  assessment?: ApiProviderAssessment;
  customer_safe_messages?: ApiProviderAssessmentMessage[];
  private_notes?: ApiProviderAssessmentPrivateNote[];
}

interface ApiProviderAssessment {
  assessment_id: string;
  invitation_id: string;
  property_id: string;
  organization_id: string;
  disclosure_grant_id: string;
  assessment_method: 'remote' | 'on_site';
  status: ProviderAssessmentStatus;
  proposed_window_start_epoch_seconds?: number | null;
  proposed_window_end_epoch_seconds?: number | null;
  time_zone?: string | null;
  outcome_reason_code?: string | null;
  owner_visible_summary?: string | null;
  version: number;
}

interface ApiProviderAssessmentMessage {
  message_id: string;
  assessment_id: string;
  author_role: 'owner' | 'provider';
  message_kind: ProviderAssessmentMessageKind;
  customer_safe_body: string;
  assessment_version_snapshot: number;
  created_at_epoch_seconds: number;
}

interface ApiProviderAssessmentPrivateNote {
  note_id: string;
  assessment_id: string;
  organization_id: string;
  author_user_id: string;
  note_kind: ProviderAssessmentPrivateNoteKind;
  private_body: string;
  assessment_version_snapshot: number;
  created_at_epoch_seconds: number;
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
  grantId?: string;
  receiptId?: string;
  assessment?: ProviderAssessment;
  customerSafeMessages?: ProviderAssessmentMessage[];
  privateNotes?: ProviderAssessmentPrivateNote[];
}

export type ProviderAssessmentStatus = 'remote_review' | 'window_proposed'
  | 'window_change_requested' | 'owner_confirmed' | 'in_progress'
  | 'completed' | 'cannot_assess' | 'cancelled';

export interface ProviderAssessment {
  assessmentId: string;
  invitationId: string;
  propertyId: string;
  organizationId: string;
  disclosureGrantId: string;
  assessmentMethod: 'remote' | 'on_site';
  status: ProviderAssessmentStatus;
  proposedWindowStartEpochSeconds?: number;
  proposedWindowEndEpochSeconds?: number;
  timeZone?: string;
  outcomeReasonCode?: string;
  ownerVisibleSummary?: string;
  version: number;
}

export type ProviderAssessmentMessageKind = 'owner_question' | 'provider_answer'
  | 'window_change_request' | 'additional_photo_request' | 'clarification';

export interface ProviderAssessmentMessage {
  messageId: string;
  assessmentId: string;
  authorRole: 'owner' | 'provider';
  messageKind: ProviderAssessmentMessageKind;
  customerSafeBody: string;
  assessmentVersionSnapshot: number;
  createdAtEpochSeconds: number;
}

export type ProviderAssessmentPrivateNoteKind = 'scope_assumption' | 'measurement'
  | 'access_constraint' | 'safety_observation' | 'production_assumption' | 'route_fit';

export interface ProviderAssessmentPrivateNote {
  noteId: string;
  assessmentId: string;
  organizationId: string;
  authorUserId: string;
  noteKind: ProviderAssessmentPrivateNoteKind;
  privateBody: string;
  assessmentVersionSnapshot: number;
  createdAtEpochSeconds: number;
}

function mapAssessment(value: ApiProviderAssessment): ProviderAssessment {
  return {
    assessmentId: value.assessment_id,
    invitationId: value.invitation_id,
    propertyId: value.property_id,
    organizationId: value.organization_id,
    disclosureGrantId: value.disclosure_grant_id,
    assessmentMethod: value.assessment_method,
    status: value.status,
    proposedWindowStartEpochSeconds: value.proposed_window_start_epoch_seconds ?? undefined,
    proposedWindowEndEpochSeconds: value.proposed_window_end_epoch_seconds ?? undefined,
    timeZone: value.time_zone ?? undefined,
    outcomeReasonCode: value.outcome_reason_code ?? undefined,
    ownerVisibleSummary: value.owner_visible_summary ?? undefined,
    version: value.version,
  };
}

function mapMessage(value: ApiProviderAssessmentMessage): ProviderAssessmentMessage {
  return {
    messageId: value.message_id,
    assessmentId: value.assessment_id,
    authorRole: value.author_role,
    messageKind: value.message_kind,
    customerSafeBody: value.customer_safe_body,
    assessmentVersionSnapshot: value.assessment_version_snapshot,
    createdAtEpochSeconds: value.created_at_epoch_seconds,
  };
}

function mapPrivateNote(value: ApiProviderAssessmentPrivateNote): ProviderAssessmentPrivateNote {
  return {
    noteId: value.note_id,
    assessmentId: value.assessment_id,
    organizationId: value.organization_id,
    authorUserId: value.author_user_id,
    noteKind: value.note_kind,
    privateBody: value.private_body,
    assessmentVersionSnapshot: value.assessment_version_snapshot,
    createdAtEpochSeconds: value.created_at_epoch_seconds,
  };
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
    grantId: value.grant_id,
    receiptId: value.receipt_id,
    assessment: value.assessment ? mapAssessment(value.assessment) : undefined,
    customerSafeMessages: value.customer_safe_messages?.map(mapMessage),
    privateNotes: value.private_notes?.map(mapPrivateNote),
  };
}

async function assessmentResponse(response: Response, fallback: string): Promise<ProviderAssessment> {
  if (!response.ok) throw await apiRequestError(response, fallback);
  return mapAssessment(await response.json() as ApiProviderAssessment);
}

export function startProviderAssessment(
  token: string,
  disclosureGrantId: string,
  assessmentMethod: 'remote' | 'on_site',
  window: { startEpochSeconds?: number; endEpochSeconds?: number; timeZone?: string },
  idempotencyKey: string,
): Promise<ProviderAssessment> {
  return authenticatedFetch(`${API_BASE_URL}/provider-assessments`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      token, disclosure_grant_id: disclosureGrantId, assessment_method: assessmentMethod,
      proposed_window_start_epoch_seconds: window.startEpochSeconds,
      proposed_window_end_epoch_seconds: window.endEpochSeconds,
      time_zone: window.timeZone, idempotency_key: idempotencyKey,
    }),
  }).then((response) => assessmentResponse(response, `Provider assessment start failed with status ${response.status}.`));
}

export function transitionProviderAssessment(
  token: string,
  assessment: ProviderAssessment,
  action: 'begin' | 'complete' | 'cannot_assess' | 'cancel',
  outcome: { reasonCode?: string; ownerVisibleSummary?: string },
  idempotencyKey: string,
): Promise<ProviderAssessment> {
  return authenticatedFetch(`${API_BASE_URL}/provider-assessments/${encodeURIComponent(assessment.assessmentId)}/transitions`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      token, action, expected_version: assessment.version,
      reason_code: outcome.reasonCode, owner_visible_summary: outcome.ownerVisibleSummary,
      idempotency_key: idempotencyKey,
    }),
  }).then((response) => assessmentResponse(response, `Provider assessment update failed with status ${response.status}.`));
}

export function proposeProviderAssessmentWindow(
  token: string,
  assessment: ProviderAssessment,
  window: { startEpochSeconds: number; endEpochSeconds: number; timeZone: string },
  idempotencyKey: string,
): Promise<ProviderAssessment> {
  return authenticatedFetch(`${API_BASE_URL}/provider-assessments/${encodeURIComponent(assessment.assessmentId)}/window-proposal`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      token,
      proposed_window_start_epoch_seconds: window.startEpochSeconds,
      proposed_window_end_epoch_seconds: window.endEpochSeconds,
      time_zone: window.timeZone,
      expected_version: assessment.version,
      idempotency_key: idempotencyKey,
    }),
  }).then((response) => assessmentResponse(response, `Provider assessment window proposal failed with status ${response.status}.`));
}

export async function createProviderAssessmentMessage(
  token: string,
  assessment: ProviderAssessment,
  messageKind: 'provider_answer' | 'window_change_request' | 'additional_photo_request' | 'clarification',
  customerSafeBody: string,
  idempotencyKey: string,
): Promise<ProviderAssessmentMessage> {
  const response = await authenticatedFetch(`${API_BASE_URL}/provider-assessments/${encodeURIComponent(assessment.assessmentId)}/messages`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      token, message_kind: messageKind, customer_safe_body: customerSafeBody,
      expected_assessment_version: assessment.version, idempotency_key: idempotencyKey,
    }),
  });
  if (!response.ok) throw await apiRequestError(response, `Provider assessment message failed with status ${response.status}.`);
  return mapMessage(await response.json() as ApiProviderAssessmentMessage);
}

export async function createProviderAssessmentPrivateNote(
  token: string,
  assessment: ProviderAssessment,
  noteKind: ProviderAssessmentPrivateNoteKind,
  privateBody: string,
  idempotencyKey: string,
): Promise<ProviderAssessmentPrivateNote> {
  const response = await authenticatedFetch(`${API_BASE_URL}/provider-assessments/${encodeURIComponent(assessment.assessmentId)}/private-notes`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      token, note_kind: noteKind, private_body: privateBody,
      expected_assessment_version: assessment.version, idempotency_key: idempotencyKey,
    }),
  });
  if (!response.ok) throw await apiRequestError(response, `Provider private note failed with status ${response.status}.`);
  return mapPrivateNote(await response.json() as ApiProviderAssessmentPrivateNote);
}
