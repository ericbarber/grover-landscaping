import { apiRequestError } from './apiError';
import { authenticatedFetch } from './authenticatedFetch';
import { API_BASE_URL } from './baseUrl';
import type {
  InitialServiceProposal,
  InitialServiceProposalDecision,
  InitialServiceProposalDecisionAction,
  InitialServiceProposalStatus,
} from '../domain/initialServiceProposals';

interface ApiOwnerWorkspace {
  owner_user_id: string;
  verified_email: string;
  display_name: string;
  status: string;
  persisted: boolean;
}

interface ApiOwnerProperty {
  property_id: string;
  owner_user_id: string;
  display_name: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  region: string;
  postal_code: string;
  country_code: string;
  coarse_area: string;
  address_status: 'unconfirmed' | 'owner_confirmed' | 'correction_required';
  authority_attested: boolean;
  status: string;
  version: number;
  persisted: boolean;
}

interface ApiOwnerYardBrief {
  brief_id: string;
  owner_user_id: string;
  property_id: string;
  version: number;
  status: 'draft' | 'ready';
  yard_areas: string[];
  care_goals: string[];
  cadence_preference: OwnerYardBrief['cadencePreference'];
  considerations: string;
  author_source: 'yard_owner';
  persisted: boolean;
}

interface ApiOwnerIntakeMedia {
  media_id: string;
  owner_user_id: string;
  property_id: string;
  brief_id: string;
  shot_type: OwnerIntakeMedia['shotType'];
  file_name: string;
  content_type: string;
  upload_mode: string;
  object_key: string;
  thumbnail_object_key?: string | null;
  status: OwnerIntakeMedia['status'];
  file_size_bytes?: number | null;
  image_width_px?: number | null;
  image_height_px?: number | null;
  metadata_source?: string | null;
  rejection_reason?: string | null;
  replaces_media_id?: string | null;
  replaced_by_media_id?: string | null;
  display_url?: string | null;
  thumbnail_url?: string | null;
  persisted: boolean;
}

interface ApiOwnerProviderConnectionProgress {
  invitation_id: string;
  provider_name: string;
  invitation_status: string;
  delivery_status: string;
  progress_stage: OwnerProviderConnectionProgress['progressStage'];
  status_label: string;
  owner_action_required: boolean;
  next_action: string;
  latest_response_action?: string | null;
  response_label?: string | null;
  expires_at_epoch_seconds: number;
  responded_at_epoch_seconds?: number | null;
  persisted: boolean;
}

interface ApiOwnerProviderDisclosureReview {
  review_version: string;
  invitation_id: string;
  property_name: string;
  provider_organization_name: string;
  purpose: string;
  brief_version: number;
  exact_address: string;
  yard_areas: string[];
  care_goals: string[];
  cadence_preference: string;
  access_considerations: string;
  owner_contact: string;
  available_categories: OwnerDisclosureCategory[];
  media_options: Array<{
    media_id: string;
    shot_type: string;
    file_label: string;
    thumbnail_url?: string | null;
  }>;
  consent_text_version: string;
  retention_notice_version: string;
  retention_notice: string;
  authority_boundary: string;
  expires_at_epoch_seconds: number;
}

interface ApiOwnerProviderDisclosureReceipt {
  receipt_id: string;
  grant_id: string;
  invitation_id: string;
  property_name: string;
  organization_name: string;
  purpose: string;
  approved_categories: OwnerDisclosureCategory[];
  withheld_categories: OwnerDisclosureCategory[];
  selected_photos: Array<{ media_id: string; file_label: string; shot_type: string }>;
  brief_version: number;
  grant_version: number;
  affirmed_at_epoch_seconds: number;
  status: OwnerProviderDisclosureReceipt['status'];
  expires_at_epoch_seconds: number;
  version: number;
  latest_event_kind: string;
  latest_reason_code?: string | null;
}

interface ApiOwnerProviderAssessment {
  assessment_id: string;
  invitation_id: string;
  property_id: string;
  organization_id: string;
  disclosure_grant_id: string;
  assessment_method: OwnerProviderAssessment['assessmentMethod'];
  status: OwnerProviderAssessment['status'];
  proposed_window_start_epoch_seconds?: number | null;
  proposed_window_end_epoch_seconds?: number | null;
  time_zone?: string | null;
  outcome_reason_code?: string | null;
  owner_visible_summary?: string | null;
  version: number;
  persisted: boolean;
}

interface ApiOwnerProviderAssessmentMessage {
  message_id: string;
  assessment_id: string;
  author_role: OwnerProviderAssessmentMessage['authorRole'];
  message_kind: OwnerProviderAssessmentMessage['messageKind'];
  customer_safe_body: string;
  assessment_version_snapshot: number;
  created_at_epoch_seconds: number;
  persisted: boolean;
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

interface ApiInitialServiceProposalDecision {
  decision_id: string;
  proposal_id: string;
  action: InitialServiceProposalDecisionAction;
  reason_code?: string | null;
  customer_safe_note?: string | null;
  proposal_version: number;
  affirmation_text_version?: string | null;
  decided_at_epoch_seconds: number;
  acceptance_snapshot_id?: string | null;
  acceptance_snapshot_sha256?: string | null;
  persisted: boolean;
}

export interface OwnerWorkspace {
  ownerUserId: string;
  verifiedEmail: string;
  displayName: string;
  status: string;
  persisted: boolean;
}

export interface OwnerProperty {
  propertyId: string;
  ownerUserId: string;
  displayName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  region: string;
  postalCode: string;
  countryCode: string;
  coarseArea: string;
  addressStatus: ApiOwnerProperty['address_status'];
  authorityAttested: boolean;
  status: string;
  version: number;
  persisted: boolean;
}

export interface CreateOwnerPropertyInput {
  displayName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  region: string;
  postalCode: string;
  countryCode?: string;
  coarseArea?: string;
  addressConfirmed: boolean;
  authorityAttested: boolean;
}

export interface OwnerYardBrief {
  briefId: string;
  ownerUserId: string;
  propertyId: string;
  version: number;
  status: 'draft' | 'ready';
  yardAreas: string[];
  careGoals: string[];
  cadencePreference: 'provider_recommendation' | 'one_time' | 'weekly' | 'every_two_weeks' | 'monthly';
  considerations: string;
  authorSource: 'yard_owner';
  persisted: boolean;
}

export interface SaveOwnerYardBriefInput {
  status: OwnerYardBrief['status'];
  yardAreas: string[];
  careGoals: string[];
  cadencePreference: OwnerYardBrief['cadencePreference'];
  considerations: string;
}

export interface OwnerIntakeMedia {
  mediaId: string;
  ownerUserId: string;
  propertyId: string;
  briefId: string;
  shotType: 'front_yard' | 'back_yard' | 'side_access' | 'irrigation_or_concern' | 'other';
  fileName: string;
  contentType: string;
  uploadMode: string;
  objectKey: string;
  thumbnailObjectKey?: string;
  status: 'pending_upload' | 'processing' | 'ready' | 'rejected' | 'replaced' | 'deleted';
  fileSizeBytes?: number;
  imageWidthPx?: number;
  imageHeightPx?: number;
  metadataSource?: string;
  rejectionReason?: string;
  replacesMediaId?: string;
  replacedByMediaId?: string;
  displayUrl?: string;
  thumbnailUrl?: string;
  persisted: boolean;
}

export interface OwnerIntakeMediaUpload {
  media: OwnerIntakeMedia;
  uploadUrl: string;
  thumbnailUploadUrl?: string;
  thumbnailContentType?: string;
  thumbnailMaxDimensionPx?: number;
}

export interface OwnerProviderConnectionProgress {
  invitationId: string;
  providerName: string;
  invitationStatus: string;
  deliveryStatus: string;
  progressStage: 'sending' | 'delivery_failed' | 'awaiting_open' | 'provider_reviewing'
    | 'question_received' | 'disclosure_decision' | 'declined' | 'contact_closed'
    | 'withdrawn' | 'expired' | 'assessment_access_approved' | 'assessment_access_ended';
  statusLabel: string;
  ownerActionRequired: boolean;
  nextAction: string;
  latestResponseAction?: string;
  responseLabel?: string;
  expiresAtEpochSeconds: number;
  respondedAtEpochSeconds?: number;
  persisted: boolean;
}

export type OwnerDisclosureCategory = 'exact_address' | 'yard_brief' | 'selected_yard_photos'
  | 'owner_contact' | 'access_considerations';

export interface OwnerProviderDisclosureReview {
  reviewVersion: string;
  invitationId: string;
  propertyName: string;
  providerOrganizationName: string;
  purpose: string;
  briefVersion: number;
  exactAddress: string;
  yardAreas: string[];
  careGoals: string[];
  cadencePreference: string;
  accessConsiderations: string;
  ownerContact: string;
  availableCategories: OwnerDisclosureCategory[];
  mediaOptions: Array<{ mediaId: string; shotType: string; fileLabel: string; thumbnailUrl?: string }>;
  consentTextVersion: string;
  retentionNoticeVersion: string;
  retentionNotice: string;
  authorityBoundary: string;
  expiresAtEpochSeconds: number;
}

export interface OwnerProviderDisclosureReceipt {
  receiptId: string;
  grantId: string;
  invitationId: string;
  propertyName: string;
  organizationName: string;
  purpose: string;
  approvedCategories: OwnerDisclosureCategory[];
  withheldCategories: OwnerDisclosureCategory[];
  selectedPhotos: Array<{ mediaId: string; fileLabel: string; shotType: string }>;
  briefVersion: number;
  grantVersion: number;
  affirmedAtEpochSeconds: number;
  status: 'active' | 'revoked' | 'expired' | 'suspended';
  expiresAtEpochSeconds: number;
  version: number;
  latestEventKind: string;
  latestReasonCode?: string;
}

export interface OwnerProviderAssessment {
  assessmentId: string;
  invitationId: string;
  propertyId: string;
  organizationId: string;
  disclosureGrantId: string;
  assessmentMethod: 'remote' | 'on_site';
  status: 'remote_review' | 'window_proposed' | 'window_change_requested'
    | 'owner_confirmed' | 'in_progress'
    | 'completed' | 'cannot_assess' | 'cancelled';
  proposedWindowStartEpochSeconds?: number;
  proposedWindowEndEpochSeconds?: number;
  timeZone?: string;
  outcomeReasonCode?: string;
  ownerVisibleSummary?: string;
  version: number;
  persisted: boolean;
}

export interface OwnerProviderAssessmentMessage {
  messageId: string;
  assessmentId: string;
  authorRole: 'owner' | 'provider';
  messageKind: 'owner_question' | 'provider_answer' | 'window_change_request'
    | 'additional_photo_request' | 'clarification';
  customerSafeBody: string;
  assessmentVersionSnapshot: number;
  createdAtEpochSeconds: number;
  persisted: boolean;
}

function mapWorkspace(workspace: ApiOwnerWorkspace): OwnerWorkspace {
  return {
    ownerUserId: workspace.owner_user_id,
    verifiedEmail: workspace.verified_email,
    displayName: workspace.display_name,
    status: workspace.status,
    persisted: workspace.persisted,
  };
}

function mapProperty(property: ApiOwnerProperty): OwnerProperty {
  return {
    propertyId: property.property_id,
    ownerUserId: property.owner_user_id,
    displayName: property.display_name,
    addressLine1: property.address_line_1,
    addressLine2: property.address_line_2,
    city: property.city,
    region: property.region,
    postalCode: property.postal_code,
    countryCode: property.country_code,
    coarseArea: property.coarse_area,
    addressStatus: property.address_status,
    authorityAttested: property.authority_attested,
    status: property.status,
    version: property.version,
    persisted: property.persisted,
  };
}

function mapYardBrief(brief: ApiOwnerYardBrief): OwnerYardBrief {
  return {
    briefId: brief.brief_id,
    ownerUserId: brief.owner_user_id,
    propertyId: brief.property_id,
    version: brief.version,
    status: brief.status,
    yardAreas: brief.yard_areas,
    careGoals: brief.care_goals,
    cadencePreference: brief.cadence_preference,
    considerations: brief.considerations,
    authorSource: brief.author_source,
    persisted: brief.persisted,
  };
}

function mapIntakeMedia(media: ApiOwnerIntakeMedia): OwnerIntakeMedia {
  return {
    mediaId: media.media_id,
    ownerUserId: media.owner_user_id,
    propertyId: media.property_id,
    briefId: media.brief_id,
    shotType: media.shot_type,
    fileName: media.file_name,
    contentType: media.content_type,
    uploadMode: media.upload_mode,
    objectKey: media.object_key,
    thumbnailObjectKey: media.thumbnail_object_key ?? undefined,
    status: media.status,
    fileSizeBytes: media.file_size_bytes ?? undefined,
    imageWidthPx: media.image_width_px ?? undefined,
    imageHeightPx: media.image_height_px ?? undefined,
    metadataSource: media.metadata_source ?? undefined,
    rejectionReason: media.rejection_reason ?? undefined,
    replacesMediaId: media.replaces_media_id ?? undefined,
    replacedByMediaId: media.replaced_by_media_id ?? undefined,
    displayUrl: media.display_url ?? undefined,
    thumbnailUrl: media.thumbnail_url ?? undefined,
    persisted: media.persisted,
  };
}

function mapProviderConnectionProgress(
  progress: ApiOwnerProviderConnectionProgress,
): OwnerProviderConnectionProgress {
  return {
    invitationId: progress.invitation_id,
    providerName: progress.provider_name,
    invitationStatus: progress.invitation_status,
    deliveryStatus: progress.delivery_status,
    progressStage: progress.progress_stage,
    statusLabel: progress.status_label,
    ownerActionRequired: progress.owner_action_required,
    nextAction: progress.next_action,
    latestResponseAction: progress.latest_response_action ?? undefined,
    responseLabel: progress.response_label ?? undefined,
    expiresAtEpochSeconds: progress.expires_at_epoch_seconds,
    respondedAtEpochSeconds: progress.responded_at_epoch_seconds ?? undefined,
    persisted: progress.persisted,
  };
}

function mapProviderAssessment(value: ApiOwnerProviderAssessment): OwnerProviderAssessment {
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
    persisted: value.persisted,
  };
}

function mapProviderAssessmentMessage(
  value: ApiOwnerProviderAssessmentMessage,
): OwnerProviderAssessmentMessage {
  return {
    messageId: value.message_id,
    assessmentId: value.assessment_id,
    authorRole: value.author_role,
    messageKind: value.message_kind,
    customerSafeBody: value.customer_safe_body,
    assessmentVersionSnapshot: value.assessment_version_snapshot,
    createdAtEpochSeconds: value.created_at_epoch_seconds,
    persisted: value.persisted,
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

function mapInitialServiceProposalDecision(
  value: ApiInitialServiceProposalDecision,
): InitialServiceProposalDecision {
  return {
    decisionId: value.decision_id,
    proposalId: value.proposal_id,
    action: value.action,
    reasonCode: value.reason_code ?? undefined,
    customerSafeNote: value.customer_safe_note ?? undefined,
    proposalVersion: value.proposal_version,
    affirmationTextVersion: value.affirmation_text_version ?? undefined,
    decidedAtEpochSeconds: value.decided_at_epoch_seconds,
    acceptanceSnapshotId: value.acceptance_snapshot_id ?? undefined,
    acceptanceSnapshotSha256: value.acceptance_snapshot_sha256 ?? undefined,
    persisted: value.persisted,
  };
}

async function ownerRequest(path: string, init?: RequestInit): Promise<Response> {
  const response = await authenticatedFetch(`${API_BASE_URL}${path}`, init);
  if (!response.ok) {
    throw await apiRequestError(
      response,
      `Yard Owner request failed with status ${response.status}.`,
    );
  }
  return response;
}

export async function fetchOwnerWorkspace(): Promise<OwnerWorkspace> {
  const response = await ownerRequest('/owner-workspace');
  return mapWorkspace(await response.json() as ApiOwnerWorkspace);
}

export async function saveOwnerWorkspace(displayName: string): Promise<OwnerWorkspace> {
  const response = await ownerRequest('/owner-workspace', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ display_name: displayName }),
  });
  return mapWorkspace(await response.json() as ApiOwnerWorkspace);
}

export async function fetchOwnerProperties(): Promise<OwnerProperty[]> {
  const response = await ownerRequest('/owner-properties');
  return ((await response.json()) as ApiOwnerProperty[]).map(mapProperty);
}

export async function createOwnerProperty(
  input: CreateOwnerPropertyInput,
): Promise<OwnerProperty> {
  const response = await ownerRequest('/owner-properties', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      display_name: input.displayName,
      address_line_1: input.addressLine1,
      address_line_2: input.addressLine2 || null,
      city: input.city,
      region: input.region,
      postal_code: input.postalCode,
      country_code: input.countryCode || 'US',
      coarse_area: input.coarseArea || null,
      address_status: input.addressConfirmed ? 'owner_confirmed' : 'unconfirmed',
      authority_attested: input.authorityAttested,
    }),
  });
  return mapProperty(await response.json() as ApiOwnerProperty);
}

export async function fetchOwnerYardBrief(propertyId: string): Promise<OwnerYardBrief> {
  const response = await ownerRequest(`/owner-properties/${encodeURIComponent(propertyId)}/yard-brief`);
  return mapYardBrief(await response.json() as ApiOwnerYardBrief);
}

export async function saveOwnerYardBrief(
  propertyId: string,
  input: SaveOwnerYardBriefInput,
): Promise<OwnerYardBrief> {
  const response = await ownerRequest(`/owner-properties/${encodeURIComponent(propertyId)}/yard-brief`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      status: input.status,
      yard_areas: input.yardAreas,
      care_goals: input.careGoals,
      cadence_preference: input.cadencePreference,
      considerations: input.considerations,
    }),
  });
  return mapYardBrief(await response.json() as ApiOwnerYardBrief);
}

export async function fetchOwnerIntakeMedia(propertyId: string): Promise<OwnerIntakeMedia[]> {
  const response = await ownerRequest(`/owner-properties/${encodeURIComponent(propertyId)}/intake-media`);
  return ((await response.json()) as ApiOwnerIntakeMedia[]).map(mapIntakeMedia);
}

export async function fetchOwnerProviderConnectionProgress(
  propertyId: string,
): Promise<OwnerProviderConnectionProgress[]> {
  const response = await ownerRequest(
    `/owner-properties/${encodeURIComponent(propertyId)}/provider-connection-progress`,
  );
  return ((await response.json()) as ApiOwnerProviderConnectionProgress[])
    .map(mapProviderConnectionProgress);
}

export async function fetchOwnerProviderAssessments(
  propertyId: string,
): Promise<OwnerProviderAssessment[]> {
  const response = await ownerRequest(
    `/owner-properties/${encodeURIComponent(propertyId)}/provider-assessments`,
  );
  return ((await response.json()) as ApiOwnerProviderAssessment[]).map(mapProviderAssessment);
}

export async function fetchOwnerProviderAssessmentMessages(
  propertyId: string,
  assessmentId: string,
): Promise<OwnerProviderAssessmentMessage[]> {
  const response = await ownerRequest(
    `/owner-properties/${encodeURIComponent(propertyId)}/provider-assessments/${encodeURIComponent(assessmentId)}/messages`,
  );
  return ((await response.json()) as ApiOwnerProviderAssessmentMessage[])
    .map(mapProviderAssessmentMessage);
}

export async function decideOwnerProviderAssessmentWindow(
  propertyId: string,
  assessment: OwnerProviderAssessment,
  action: 'confirm' | 'request_change',
  idempotencyKey: string,
): Promise<OwnerProviderAssessment> {
  const response = await ownerRequest(
    `/owner-properties/${encodeURIComponent(propertyId)}/provider-assessments/${encodeURIComponent(assessment.assessmentId)}/window-decision`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        action,
        expected_version: assessment.version,
        idempotency_key: idempotencyKey,
      }),
    },
  );
  return mapProviderAssessment(await response.json() as ApiOwnerProviderAssessment);
}

export async function createOwnerProviderAssessmentMessage(
  propertyId: string,
  assessment: OwnerProviderAssessment,
  messageKind: 'owner_question' | 'window_change_request' | 'clarification',
  customerSafeBody: string,
  idempotencyKey: string,
): Promise<OwnerProviderAssessmentMessage> {
  const response = await ownerRequest(
    `/owner-properties/${encodeURIComponent(propertyId)}/provider-assessments/${encodeURIComponent(assessment.assessmentId)}/messages`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        message_kind: messageKind,
        customer_safe_body: customerSafeBody,
        expected_assessment_version: assessment.version,
        idempotency_key: idempotencyKey,
      }),
    },
  );
  return mapProviderAssessmentMessage(
    await response.json() as ApiOwnerProviderAssessmentMessage,
  );
}

export async function fetchOwnerInitialServiceProposals(
  propertyId: string,
): Promise<InitialServiceProposal[]> {
  const response = await ownerRequest(
    `/owner-properties/${encodeURIComponent(propertyId)}/initial-service-proposals`,
  );
  return ((await response.json()) as ApiInitialServiceProposal[]).map(mapInitialServiceProposal);
}

export async function decideOwnerInitialServiceProposal(
  propertyId: string,
  proposal: InitialServiceProposal,
  action: InitialServiceProposalDecisionAction,
  options: {
    reasonCode?: string;
    customerSafeNote?: string;
    affirmationTextVersion?: string;
  },
  idempotencyKey: string,
): Promise<InitialServiceProposalDecision> {
  const response = await ownerRequest(
    `/owner-properties/${encodeURIComponent(propertyId)}/initial-service-proposals/${encodeURIComponent(proposal.proposalId)}/decision`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        action,
        expected_proposal_version: proposal.proposalVersion,
        reason_code: options.reasonCode,
        customer_safe_note: options.customerSafeNote,
        affirmation_text_version: options.affirmationTextVersion,
        idempotency_key: idempotencyKey,
      }),
    },
  );
  return mapInitialServiceProposalDecision(
    await response.json() as ApiInitialServiceProposalDecision,
  );
}

export async function fetchOwnerProviderDisclosureReview(
  propertyId: string,
  invitationId: string,
): Promise<OwnerProviderDisclosureReview> {
  const response = await ownerRequest(
    `/owner-properties/${encodeURIComponent(propertyId)}/provider-invitations/${encodeURIComponent(invitationId)}/disclosure-review`,
  );
  const value = await response.json() as ApiOwnerProviderDisclosureReview;
  return {
    reviewVersion: value.review_version,
    invitationId: value.invitation_id,
    propertyName: value.property_name,
    providerOrganizationName: value.provider_organization_name,
    purpose: value.purpose,
    briefVersion: value.brief_version,
    exactAddress: value.exact_address,
    yardAreas: value.yard_areas,
    careGoals: value.care_goals,
    cadencePreference: value.cadence_preference,
    accessConsiderations: value.access_considerations,
    ownerContact: value.owner_contact,
    availableCategories: value.available_categories,
    mediaOptions: value.media_options.map((media) => ({
      mediaId: media.media_id,
      shotType: media.shot_type,
      fileLabel: media.file_label,
      thumbnailUrl: media.thumbnail_url ?? undefined,
    })),
    consentTextVersion: value.consent_text_version,
    retentionNoticeVersion: value.retention_notice_version,
    retentionNotice: value.retention_notice,
    authorityBoundary: value.authority_boundary,
    expiresAtEpochSeconds: value.expires_at_epoch_seconds,
  };
}

export async function approveOwnerProviderDisclosure(
  propertyId: string,
  invitationId: string,
  review: OwnerProviderDisclosureReview,
  approvedCategories: OwnerDisclosureCategory[],
  selectedMediaIds: string[],
  idempotencyKey: string,
): Promise<void> {
  await ownerRequest(
    `/owner-properties/${encodeURIComponent(propertyId)}/provider-invitations/${encodeURIComponent(invitationId)}/disclosure-grants`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        expected_review_version: review.reviewVersion,
        purpose: review.purpose,
        approved_categories: approvedCategories,
        selected_media_ids: selectedMediaIds,
        consent_text_version: review.consentTextVersion,
        retention_notice_version: review.retentionNoticeVersion,
        owner_affirmed: true,
        idempotency_key: idempotencyKey,
      }),
    },
  );
}

function mapDisclosureReceipt(value: ApiOwnerProviderDisclosureReceipt): OwnerProviderDisclosureReceipt {
  return {
    receiptId: value.receipt_id,
    grantId: value.grant_id,
    invitationId: value.invitation_id,
    propertyName: value.property_name,
    organizationName: value.organization_name,
    purpose: value.purpose,
    approvedCategories: value.approved_categories,
    withheldCategories: value.withheld_categories,
    selectedPhotos: value.selected_photos.map((photo) => ({
      mediaId: photo.media_id,
      fileLabel: photo.file_label,
      shotType: photo.shot_type,
    })),
    briefVersion: value.brief_version,
    grantVersion: value.grant_version,
    affirmedAtEpochSeconds: value.affirmed_at_epoch_seconds,
    status: value.status,
    expiresAtEpochSeconds: value.expires_at_epoch_seconds,
    version: value.version,
    latestEventKind: value.latest_event_kind,
    latestReasonCode: value.latest_reason_code ?? undefined,
  };
}

export async function fetchOwnerProviderDisclosureReceipts(
  propertyId: string,
): Promise<OwnerProviderDisclosureReceipt[]> {
  const response = await ownerRequest(
    `/owner-properties/${encodeURIComponent(propertyId)}/provider-disclosure-receipts`,
  );
  return ((await response.json()) as ApiOwnerProviderDisclosureReceipt[]).map(mapDisclosureReceipt);
}

export async function revokeOwnerProviderDisclosure(
  propertyId: string,
  receipt: OwnerProviderDisclosureReceipt,
  reasonCode: string,
  idempotencyKey: string,
): Promise<OwnerProviderDisclosureReceipt> {
  const response = await ownerRequest(
    `/owner-properties/${encodeURIComponent(propertyId)}/provider-disclosure-grants/${encodeURIComponent(receipt.grantId)}/revoke`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        expected_version: receipt.version,
        reason_code: reasonCode,
        owner_confirmed: true,
        idempotency_key: idempotencyKey,
      }),
    },
  );
  return mapDisclosureReceipt(await response.json() as ApiOwnerProviderDisclosureReceipt);
}

export async function createOwnerIntakeMediaUpload(
  propertyId: string,
  file: File,
  shotType: OwnerIntakeMedia['shotType'],
  replacesMediaId?: string,
): Promise<OwnerIntakeMediaUpload> {
  const response = await ownerRequest(`/owner-properties/${encodeURIComponent(propertyId)}/intake-media`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      file_name: file.name,
      content_type: file.type || 'application/octet-stream',
      shot_type: shotType,
      replaces_media_id: replacesMediaId || null,
    }),
  });
  const upload = await response.json() as {
    media: ApiOwnerIntakeMedia;
    upload_url: string;
    thumbnail_upload_url?: string | null;
    thumbnail_content_type?: string | null;
    thumbnail_max_dimension_px?: number | null;
  };
  return {
    media: mapIntakeMedia(upload.media),
    uploadUrl: upload.upload_url,
    thumbnailUploadUrl: upload.thumbnail_upload_url ?? undefined,
    thumbnailContentType: upload.thumbnail_content_type ?? undefined,
    thumbnailMaxDimensionPx: upload.thumbnail_max_dimension_px ?? undefined,
  };
}

export async function uploadOwnerIntakeMediaFile(
  upload: OwnerIntakeMediaUpload,
  file: File,
): Promise<void> {
  if (upload.media.uploadMode === 'local-placeholder') return;
  const response = await fetch(upload.uploadUrl, {
    method: 'PUT',
    headers: { 'content-type': file.type || upload.media.contentType },
    body: file,
  });
  if (!response.ok) throw new Error(`Private photo upload failed with status ${response.status}.`);
}

export async function completeOwnerIntakeMediaUpload(
  propertyId: string,
  mediaId: string,
  file?: File,
): Promise<OwnerIntakeMedia> {
  const response = await ownerRequest(`/owner-properties/${encodeURIComponent(propertyId)}/intake-media/${encodeURIComponent(mediaId)}/complete`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ file_size_bytes: file && file.size > 0 ? file.size : undefined }),
  });
  return mapIntakeMedia(await response.json() as ApiOwnerIntakeMedia);
}

export async function deleteOwnerIntakeMedia(
  propertyId: string,
  mediaId: string,
): Promise<OwnerIntakeMedia> {
  const response = await ownerRequest(`/owner-properties/${encodeURIComponent(propertyId)}/intake-media/${encodeURIComponent(mediaId)}`, {
    method: 'DELETE',
  });
  return mapIntakeMedia(await response.json() as ApiOwnerIntakeMedia);
}
