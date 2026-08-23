import { apiRequestError } from './apiError';
import { authenticatedFetch } from './authenticatedFetch';
import { API_BASE_URL } from './baseUrl';
import type {
  InitialServiceProposal,
  InitialServiceProposalMessage,
  InitialServiceProposalStatus,
  OwnerProviderFirstVisit,
  PublishInitialServiceProposalInput,
} from '../domain/initialServiceProposals';

interface ApiProviderInvitationProgress {
  invitation_id: string;
  activation_id?: string | null;
  organization_claim_id?: string | null;
  organization_claim_status?: string | null;
  organization_claim_version?: number | null;
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

interface ApiOwnerProviderFirstVisit {
  activation_id: string; owner_property_id: string; invitation_id: string;
  organization_id: string; organization_name: string; customer_account_id: string;
  customer_property_id: string; status: OwnerProviderFirstVisit['status'];
  current_version: number; proposal_id?: string | null;
  window_start_epoch_seconds?: number | null; window_end_epoch_seconds?: number | null;
  time_zone?: string | null; customer_safe_arrival_note?: string | null;
  owner_decision?: OwnerProviderFirstVisit['ownerDecision'] | null;
  owner_customer_safe_note?: string | null; proposed_at_epoch_seconds?: number | null;
  decided_at_epoch_seconds?: number | null; persisted: boolean;
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
  initial_service_proposal?: ApiInitialServiceProposal;
  initial_service_proposal_messages?: ApiInitialServiceProposalMessage[];
}

interface ApiInitialServiceProposal {
  proposal_id: string;
  assessment_id: string;
  invitation_id: string;
  property_id: string;
  organization_id: string;
  disclosure_grant_id: string;
  proposal_version: number;
  status: InitialServiceProposalStatus;
  title: string;
  customer_summary: string;
  included_scope: string[];
  exclusions: string[];
  cadence_code: InitialServiceProposal['cadenceCode'];
  cadence_detail: string;
  arrival_policy: string;
  weather_policy: string;
  cancellation_policy: string;
  proof_expectation: string;
  price_amount_minor: number;
  price_basis: InitialServiceProposal['priceBasis'];
  currency_code: string;
  annualized_monthly_minor?: number | null;
  revision_note?: string | null;
  issued_at_epoch_seconds: number;
  expires_at_epoch_seconds: number;
  persisted: boolean;
}

interface ApiInitialServiceProposalMessage {
  message_id: string;
  proposal_id: string;
  assessment_id: string;
  author_role: InitialServiceProposalMessage['authorRole'];
  message_kind: InitialServiceProposalMessage['messageKind'];
  customer_safe_body: string;
  proposal_version_snapshot: number;
  series_version_snapshot: number;
  in_reply_to_message_id?: string | null;
  related_proposal_id?: string | null;
  created_at_epoch_seconds: number;
  persisted: boolean;
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
  activationId?: string;
  organizationClaimId?: string;
  organizationClaimStatus?: string;
  organizationClaimVersion?: number;
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

interface ApiProviderInvitationRecipientEntry {
  invitation_id: string;
  status: string;
  can_review_limited_request: boolean;
  provider_name?: string | null;
  owner_name?: string | null;
  coarse_area?: string | null;
  care_goals: string[];
  cadence?: string | null;
  recipient_email_hint?: string | null;
  still_private_categories: string[];
  recipient_email_checked: boolean;
  organization_relationship_checked: boolean;
  opportunity_response_capability: boolean;
}

export interface ProviderInvitationRecipientEntry {
  invitationId: string;
  status: string;
  canReviewLimitedRequest: boolean;
  providerName?: string;
  ownerName?: string;
  coarseArea?: string;
  careGoals: string[];
  cadence?: string;
  recipientEmailHint?: string;
  stillPrivateCategories: string[];
  recipientEmailChecked: boolean;
  organizationRelationshipChecked: boolean;
  opportunityResponseCapability: boolean;
}

export interface ProviderOrganizationOption {
  organizationId: string;
  displayName: string;
  membershipRole: string;
  relationshipChecked: boolean;
}

export interface ProviderOrganizationClaim {
  claimId: string;
  invitationId: string;
  claimKind: 'existing_relationship' | 'new_organization';
  proposedDisplayName: string;
  organizationId?: string;
  status: string;
  assignedFunction?: string;
  version: number;
  organizationRelationshipChecked: boolean;
  opportunityResponseCapability: boolean;
  persisted: boolean;
}

export interface ProviderResponseCapability {
  capabilityId: string;
  invitationId: string;
  claimId: string;
  organizationId: string;
  briefVersion: number;
  purpose: string;
  allowedActions: string[];
  withheldCategories: string[];
  status: string;
  expiresAtEpochSeconds: number;
  version: number;
  opportunityResponseCapability: boolean;
  persisted: boolean;
}

export interface ProviderInvitationInbox {
  invitationId: string;
  status: string;
  canReviewLimitedRequest: boolean;
  capabilityId?: string;
  capabilityVersion?: number;
  organizationId?: string;
  organizationName?: string;
  providerName?: string;
  ownerName?: string;
  coarseArea?: string;
  careGoals: string[];
  cadence?: string;
  allowedActions: string[];
  withheldCategories: string[];
  opportunityResponseCapability: boolean;
  recoveryAction?: string;
}

export interface ProviderOpportunityResponse {
  responseId: string;
  capabilityId: string;
  invitationId: string;
  organizationId: string;
  action: string;
  responseCode: string;
  status: string;
  capabilityStatus: string;
  capabilityVersion: number;
  opportunityResponseCapability: boolean;
  persisted: boolean;
}

function mapRecipientEntry(value: ApiProviderInvitationRecipientEntry): ProviderInvitationRecipientEntry {
  return {
    invitationId: value.invitation_id, status: value.status,
    canReviewLimitedRequest: value.can_review_limited_request,
    providerName: value.provider_name ?? undefined, ownerName: value.owner_name ?? undefined,
    coarseArea: value.coarse_area ?? undefined, careGoals: value.care_goals,
    cadence: value.cadence ?? undefined, recipientEmailHint: value.recipient_email_hint ?? undefined,
    stillPrivateCategories: value.still_private_categories,
    recipientEmailChecked: value.recipient_email_checked,
    organizationRelationshipChecked: value.organization_relationship_checked,
    opportunityResponseCapability: value.opportunity_response_capability,
  };
}

function mapFirstVisit(value: ApiOwnerProviderFirstVisit): OwnerProviderFirstVisit {
  return {
    activationId: value.activation_id, ownerPropertyId: value.owner_property_id,
    invitationId: value.invitation_id, organizationId: value.organization_id,
    organizationName: value.organization_name, customerAccountId: value.customer_account_id,
    customerPropertyId: value.customer_property_id, status: value.status,
    currentVersion: value.current_version, proposalId: value.proposal_id ?? undefined,
    windowStartEpochSeconds: value.window_start_epoch_seconds ?? undefined,
    windowEndEpochSeconds: value.window_end_epoch_seconds ?? undefined,
    timeZone: value.time_zone ?? undefined,
    customerSafeArrivalNote: value.customer_safe_arrival_note ?? undefined,
    ownerDecision: value.owner_decision ?? undefined,
    ownerCustomerSafeNote: value.owner_customer_safe_note ?? undefined,
    proposedAtEpochSeconds: value.proposed_at_epoch_seconds ?? undefined,
    decidedAtEpochSeconds: value.decided_at_epoch_seconds ?? undefined,
    persisted: value.persisted,
  };
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
  currentInitialServiceProposal?: InitialServiceProposal;
  initialServiceProposalMessages?: InitialServiceProposalMessage[];
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

function mapInitialServiceProposal(value: ApiInitialServiceProposal): InitialServiceProposal {
  return {
    proposalId: value.proposal_id,
    assessmentId: value.assessment_id,
    invitationId: value.invitation_id,
    propertyId: value.property_id,
    organizationId: value.organization_id,
    disclosureGrantId: value.disclosure_grant_id,
    proposalVersion: value.proposal_version,
    status: value.status,
    title: value.title,
    customerSummary: value.customer_summary,
    includedScope: value.included_scope,
    exclusions: value.exclusions,
    cadenceCode: value.cadence_code,
    cadenceDetail: value.cadence_detail,
    arrivalPolicy: value.arrival_policy,
    weatherPolicy: value.weather_policy,
    cancellationPolicy: value.cancellation_policy,
    proofExpectation: value.proof_expectation,
    priceAmountMinor: value.price_amount_minor,
    priceBasis: value.price_basis,
    currencyCode: value.currency_code,
    annualizedMonthlyMinor: value.annualized_monthly_minor ?? undefined,
    revisionNote: value.revision_note ?? undefined,
    issuedAtEpochSeconds: value.issued_at_epoch_seconds,
    expiresAtEpochSeconds: value.expires_at_epoch_seconds,
    persisted: value.persisted,
  };
}

function mapInitialServiceProposalMessage(
  value: ApiInitialServiceProposalMessage,
): InitialServiceProposalMessage {
  return {
    messageId: value.message_id,
    proposalId: value.proposal_id,
    assessmentId: value.assessment_id,
    authorRole: value.author_role,
    messageKind: value.message_kind,
    customerSafeBody: value.customer_safe_body,
    proposalVersionSnapshot: value.proposal_version_snapshot,
    seriesVersionSnapshot: value.series_version_snapshot,
    inReplyToMessageId: value.in_reply_to_message_id ?? undefined,
    relatedProposalId: value.related_proposal_id ?? undefined,
    createdAtEpochSeconds: value.created_at_epoch_seconds,
    persisted: value.persisted,
  };
}

export async function previewProviderInvitation(token: string): Promise<ProviderInvitationRecipientEntry> {
  const response = await authenticatedFetch(`${API_BASE_URL}/provider-invitations/preview`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  if (!response.ok && response.status !== 410) {
    throw await apiRequestError(response, `Provider invitation preview failed with status ${response.status}.`);
  }
  return mapRecipientEntry(await response.json() as ApiProviderInvitationRecipientEntry);
}

export async function verifyProviderInvitationRecipient(token: string): Promise<ProviderInvitationRecipientEntry> {
  const response = await authenticatedFetch(`${API_BASE_URL}/provider-invitations/verify-recipient`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  if (!response.ok) {
    throw await apiRequestError(response, `Provider recipient verification failed with status ${response.status}.`);
  }
  return mapRecipientEntry(await response.json() as ApiProviderInvitationRecipientEntry);
}

export async function fetchProviderOrganizationOptions(token: string): Promise<ProviderOrganizationOption[]> {
  const response = await authenticatedFetch(`${API_BASE_URL}/provider-invitations/organization-options`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  if (!response.ok) {
    throw await apiRequestError(response, `Provider organization options failed with status ${response.status}.`);
  }
  const values = await response.json() as Array<{
    organization_id: string; display_name: string; membership_role: string;
    relationship_checked: boolean;
  }>;
  return values.map((value) => ({
    organizationId: value.organization_id, displayName: value.display_name,
    membershipRole: value.membership_role, relationshipChecked: value.relationship_checked,
  }));
}

function mapOrganizationClaim(value: {
  claim_id: string; invitation_id: string; claim_kind: 'existing_relationship' | 'new_organization';
  proposed_display_name: string; organization_id?: string | null; status: string;
  assigned_function?: string | null; version: number; organization_relationship_checked: boolean;
  opportunity_response_capability: boolean; persisted: boolean;
}): ProviderOrganizationClaim {
  return {
    claimId: value.claim_id, invitationId: value.invitation_id, claimKind: value.claim_kind,
    proposedDisplayName: value.proposed_display_name,
    organizationId: value.organization_id ?? undefined, status: value.status,
    assignedFunction: value.assigned_function ?? undefined, version: value.version,
    organizationRelationshipChecked: value.organization_relationship_checked,
    opportunityResponseCapability: value.opportunity_response_capability,
    persisted: value.persisted,
  };
}

export async function createProviderOrganizationClaim(
  token: string,
  input: { organizationId: string } | { providerDisplayName: string },
  idempotencyKey: string,
): Promise<ProviderOrganizationClaim> {
  const existing = 'organizationId' in input;
  const response = await authenticatedFetch(`${API_BASE_URL}/provider-invitations/organization-claims`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      token, claim_kind: existing ? 'existing_relationship' : 'new_organization',
      organization_id: existing ? input.organizationId : undefined,
      provider_display_name: existing ? undefined : input.providerDisplayName,
      authority_attested: !existing, idempotency_key: idempotencyKey,
    }),
  });
  if (!response.ok) {
    throw await apiRequestError(response, `Provider organization claim failed with status ${response.status}.`);
  }
  return mapOrganizationClaim(await response.json());
}

export async function bootstrapProviderOrganizationClaim(
  token: string, claimId: string, expectedVersion: number, idempotencyKey: string,
): Promise<ProviderOrganizationClaim> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/provider-invitation-organization-claims/${encodeURIComponent(claimId)}/bootstrap`,
    { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
      token, expected_version: expectedVersion, idempotency_key: idempotencyKey,
    }) },
  );
  if (!response.ok) {
    throw await apiRequestError(response, `Provider organization setup failed with status ${response.status}.`);
  }
  return mapOrganizationClaim(await response.json());
}

function mapResponseCapability(value: {
  capability_id: string; invitation_id: string; claim_id: string; organization_id: string;
  brief_version: number; purpose: string; allowed_actions: string[]; withheld_categories: string[];
  status: string; expires_at_epoch_seconds: number; version: number;
  opportunity_response_capability: boolean; persisted: boolean;
}): ProviderResponseCapability {
  return {
    capabilityId: value.capability_id, invitationId: value.invitation_id,
    claimId: value.claim_id, organizationId: value.organization_id,
    briefVersion: value.brief_version, purpose: value.purpose,
    allowedActions: value.allowed_actions, withheldCategories: value.withheld_categories,
    status: value.status, expiresAtEpochSeconds: value.expires_at_epoch_seconds,
    version: value.version, opportunityResponseCapability: value.opportunity_response_capability,
    persisted: value.persisted,
  };
}

export async function issueProviderResponseCapability(
  token: string, claimId: string, idempotencyKey: string,
): Promise<ProviderResponseCapability> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/provider-invitation-organization-claims/${encodeURIComponent(claimId)}/response-capabilities`,
    { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
      token, withheld_categories_acknowledged: true, idempotency_key: idempotencyKey,
    }) },
  );
  if (!response.ok) {
    throw await apiRequestError(response, `Provider response authorization failed with status ${response.status}.`);
  }
  return mapResponseCapability(await response.json());
}

export async function fetchProviderInvitationInbox(token: string): Promise<ProviderInvitationInbox> {
  const response = await authenticatedFetch(`${API_BASE_URL}/provider-invitations/inbox`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token }),
  });
  if (!response.ok && response.status !== 410) {
    throw await apiRequestError(response, `Provider invitation inbox failed with status ${response.status}.`);
  }
  const value = await response.json() as {
    invitation_id: string; status: string; can_review_limited_request: boolean;
    capability_id?: string | null; capability_version?: number | null;
    organization_id?: string | null; organization_name?: string | null;
    provider_name?: string | null; owner_name?: string | null; coarse_area?: string | null;
    care_goals: string[]; cadence?: string | null; allowed_actions: string[];
    withheld_categories: string[]; opportunity_response_capability: boolean;
    recovery_action?: string | null;
  };
  return {
    invitationId: value.invitation_id, status: value.status,
    canReviewLimitedRequest: value.can_review_limited_request,
    capabilityId: value.capability_id ?? undefined,
    capabilityVersion: value.capability_version ?? undefined,
    organizationId: value.organization_id ?? undefined,
    organizationName: value.organization_name ?? undefined,
    providerName: value.provider_name ?? undefined, ownerName: value.owner_name ?? undefined,
    coarseArea: value.coarse_area ?? undefined, careGoals: value.care_goals,
    cadence: value.cadence ?? undefined, allowedActions: value.allowed_actions,
    withheldCategories: value.withheld_categories,
    opportunityResponseCapability: value.opportunity_response_capability,
    recoveryAction: value.recovery_action ?? undefined,
  };
}

export async function createProviderOpportunityResponse(
  token: string, inbox: ProviderInvitationInbox,
  input: { action: string; responseCode: string; blockFutureInvitations?: boolean },
  idempotencyKey: string,
): Promise<ProviderOpportunityResponse> {
  if (!inbox.capabilityId || inbox.capabilityVersion === undefined) {
    throw new Error('Reload the authorized limited request before responding.');
  }
  const response = await authenticatedFetch(`${API_BASE_URL}/provider-opportunity-responses`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
      token, capability_id: inbox.capabilityId,
      expected_capability_version: inbox.capabilityVersion,
      action: input.action, response_code: input.responseCode,
      block_future_invitations: input.blockFutureInvitations ?? false,
      idempotency_key: idempotencyKey,
    }),
  });
  if (!response.ok) {
    throw await apiRequestError(response, `Provider invitation response failed with status ${response.status}.`);
  }
  const value = await response.json() as {
    response_id: string; capability_id: string; invitation_id: string; organization_id: string;
    action: string; response_code: string; status: string; capability_status: string;
    capability_version: number; opportunity_response_capability: boolean; persisted: boolean;
  };
  return {
    responseId: value.response_id, capabilityId: value.capability_id,
    invitationId: value.invitation_id, organizationId: value.organization_id,
    action: value.action, responseCode: value.response_code, status: value.status,
    capabilityStatus: value.capability_status, capabilityVersion: value.capability_version,
    opportunityResponseCapability: value.opportunity_response_capability,
    persisted: value.persisted,
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
    activationId: progress.activation_id ?? undefined,
    organizationClaimId: progress.organization_claim_id ?? undefined,
    organizationClaimStatus: progress.organization_claim_status ?? undefined,
    organizationClaimVersion: progress.organization_claim_version ?? undefined,
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

export async function fetchProviderFirstVisit(
  token: string,
  activationId: string,
): Promise<OwnerProviderFirstVisit> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/provider-relationships/${encodeURIComponent(activationId)}/first-visit/status`,
    {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token }),
    },
  );
  if (!response.ok) {
    throw await apiRequestError(response, `First-visit status failed with status ${response.status}.`);
  }
  return mapFirstVisit(await response.json() as ApiOwnerProviderFirstVisit);
}

export async function proposeProviderFirstVisit(
  token: string,
  firstVisit: OwnerProviderFirstVisit,
  window: { startEpochSeconds: number; endEpochSeconds: number; timeZone: string;
    customerSafeArrivalNote?: string },
  idempotencyKey: string,
): Promise<OwnerProviderFirstVisit> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/provider-relationships/${encodeURIComponent(firstVisit.activationId)}/first-visit/proposal`,
    {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        token,
        expected_series_version: firstVisit.currentVersion,
        window_start_epoch_seconds: window.startEpochSeconds,
        window_end_epoch_seconds: window.endEpochSeconds,
        time_zone: window.timeZone,
        customer_safe_arrival_note: window.customerSafeArrivalNote,
        idempotency_key: idempotencyKey,
      }),
    },
  );
  if (!response.ok) {
    throw await apiRequestError(response, `First-visit proposal failed with status ${response.status}.`);
  }
  return mapFirstVisit(await response.json() as ApiOwnerProviderFirstVisit);
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
    currentInitialServiceProposal: value.initial_service_proposal
      ? mapInitialServiceProposal(value.initial_service_proposal) : undefined,
    initialServiceProposalMessages: value.initial_service_proposal_messages
      ?.map(mapInitialServiceProposalMessage),
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

export async function publishProviderInitialServiceProposal(
  token: string,
  assessmentId: string,
  input: PublishInitialServiceProposalInput,
  idempotencyKey: string,
): Promise<InitialServiceProposal> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/provider-assessments/${encodeURIComponent(assessmentId)}/initial-service-proposals`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        token,
        expected_proposal_version: input.expectedProposalVersion,
        title: input.title,
        customer_summary: input.customerSummary,
        included_scope: input.includedScope,
        exclusions: input.exclusions,
        cadence_code: input.cadenceCode,
        cadence_detail: input.cadenceDetail,
        arrival_policy: input.arrivalPolicy,
        weather_policy: input.weatherPolicy,
        cancellation_policy: input.cancellationPolicy,
        proof_expectation: input.proofExpectation,
        price_amount_minor: input.priceAmountMinor,
        price_basis: input.priceBasis,
        currency_code: input.currencyCode,
        revision_note: input.revisionNote,
        expires_at_epoch_seconds: input.expiresAtEpochSeconds,
        idempotency_key: idempotencyKey,
      }),
    },
  );
  if (!response.ok) {
    throw await apiRequestError(
      response,
      `Initial service proposal publication failed with status ${response.status}.`,
    );
  }
  return mapInitialServiceProposal(await response.json() as ApiInitialServiceProposal);
}

export async function createProviderInitialServiceProposalResponse(
  token: string,
  assessmentId: string,
  currentProposal: InitialServiceProposal,
  inReplyTo: InitialServiceProposalMessage,
  customerSafeBody: string,
  idempotencyKey: string,
): Promise<InitialServiceProposalMessage> {
  const relatedProposalId = inReplyTo.proposalId === currentProposal.proposalId
    ? undefined : currentProposal.proposalId;
  const response = await authenticatedFetch(
    `${API_BASE_URL}/provider-assessments/${encodeURIComponent(assessmentId)}/initial-service-proposal-responses`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        token,
        in_reply_to_message_id: inReplyTo.messageId,
        customer_safe_body: customerSafeBody,
        expected_proposal_version: currentProposal.proposalVersion,
        related_proposal_id: relatedProposalId,
        idempotency_key: idempotencyKey,
      }),
    },
  );
  if (!response.ok) {
    throw await apiRequestError(
      response,
      `Initial service proposal response failed with status ${response.status}.`,
    );
  }
  return mapInitialServiceProposalMessage(
    await response.json() as ApiInitialServiceProposalMessage,
  );
}
