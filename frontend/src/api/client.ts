import type {
  BillingModel,
  CustomerAccountSummary,
  PaymentStatus,
  ServiceApprovalStatus,
} from '../domain/accounts';
import type { YardCareJob } from '../domain/jobs';
import { API_BASE_URL, toBrowserUrl } from './baseUrl';
import { authenticatedFetch } from './authenticatedFetch';
import { apiRequestError } from './apiError';

interface ApiJobSummary {
  id: string;
  organization_id?: string;
  assigned_crew_id?: string | null;
  customer_name: string;
  property_address: string;
  status: YardCareJob['status'];
  scheduled_date: string;
  before_photos: number;
  after_photos: number;
  checklist_items: number;
  completed_checklist_items: number;
}

export interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
}

export interface ApiJobDetail extends ApiJobSummary {
  checklist: ChecklistItem[];
}

export interface JobDetail extends YardCareJob {
  checklist: ChecklistItem[];
}

export interface ApiJobAddOn {
  id: string;
  job_id: string;
  service_name: string;
  service_description?: string | null;
  quantity: number;
  unit_price_cents: number;
  note?: string | null;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

export interface JobAddOn {
  id: string;
  jobId: string;
  serviceName: string;
  serviceDescription?: string;
  quantity: number;
  unitPriceCents: number;
  note?: string;
  status: ApiJobAddOn['status'];
}

export interface AccountStatus extends CustomerAccountSummary {
  accountId?: string;
  customerName?: string;
}

export interface ApiAccountStatus {
  job_id: string;
  account_id: string;
  customer_name: string;
  billing_model: BillingModel;
  payment_status: PaymentStatus;
  service_approval_status: ServiceApprovalStatus;
  contracted_services_per_period: number;
  completed_services_this_period: number;
  billing_notes: string;
}

export interface PhotoUploadTicket {
  status: string;
  jobId: string;
  photoId: string;
  photoType: 'before' | 'after' | 'issue' | 'extra';
  fileName: string;
  contentType: string;
  uploadMode: string;
  uploadUrl: string;
  objectKey: string;
  thumbnailUploadUrl?: string;
  thumbnailObjectKey?: string;
  thumbnailContentType?: string;
  thumbnailMaxDimensionPx?: number;
  thumbnailUrl?: string;
  fileSizeBytes?: number;
  imageWidthPx?: number;
  imageHeightPx?: number;
  metadataSource?: string;
}

export interface ApiPhotoEvidence {
  id: string;
  job_id: string;
  photo_type: 'before' | 'after' | 'issue' | 'extra';
  file_name: string;
  content_type: string;
  object_key: string;
  status: string;
  upload_mode: string;
  display_url: string;
  thumbnail_url?: string | null;
  file_size_bytes?: number | null;
  image_width_px?: number | null;
  image_height_px?: number | null;
  metadata_source?: string | null;
}

export type CompletionReportStatus =
  | 'draft'
  | 'submitted'
  | 'in_review'
  | 'changes_requested'
  | 'delivered';

export type CompletionReportListStatusFilter = CompletionReportStatus | 'active' | 'all';
export type CompletionReportListReadinessFilter = 'all' | 'ready' | 'blocked' | 'local_only';
export type CompletionReportListReadinessBlockerFilter =
  | 'all'
  | 'any'
  | 'checklist'
  | 'before_photos'
  | 'after_photos';

export interface FetchCompletionReportsOptions {
  status?: CompletionReportListStatusFilter;
  readiness?: CompletionReportListReadinessFilter;
  readinessBlocker?: CompletionReportListReadinessBlockerFilter;
  crewId?: string;
  customer?: string;
  property?: string;
  scheduledFrom?: string;
  scheduledTo?: string;
}

export interface ApiCompletionReport {
  report_id: string;
  job_id: string;
  report_status: CompletionReportStatus;
  persisted: boolean;
  ready_for_customer: boolean;
  checklist_progress: number;
  before_photos: number;
  after_photos: number;
  issue_photos: number;
  share_url: string | null;
  job: ApiJobDetail;
  account: ApiAccountStatus;
  photo_evidence: ApiPhotoEvidence[];
  completed_add_ons: ApiJobAddOn[];
  snapshot_metadata?: ApiCompletionReportSnapshotMetadata;
}

export interface ApiCompletionReportSnapshotMetadata {
  snapshot_version: number;
  report_id: string;
  job_id: string;
  captured_at_epoch_seconds: number;
  evidence: {
    before_photos: number;
    after_photos: number;
    issue_photos: number;
    total_photo_evidence: number;
    completed_add_ons: number;
  };
}

export interface CompletionReportSnapshot {
  reportId: string;
  jobId: string;
  reportStatus: CompletionReportStatus;
  persisted: boolean;
  readyForCustomer: boolean;
  checklistProgress: number;
  beforePhotos: number;
  afterPhotos: number;
  issuePhotos: number;
  shareUrl: string | null;
  job: JobDetail;
  account: AccountStatus;
  photoEvidence: PhotoUploadTicket[];
  completedAddOns: JobAddOn[];
  snapshotMetadata?: CompletionReportSnapshotMetadata;
}

export interface CompletionReportSnapshotMetadata {
  snapshotVersion: number;
  reportId: string;
  jobId: string;
  capturedAtEpochSeconds: number;
  evidence: {
    beforePhotos: number;
    afterPhotos: number;
    issuePhotos: number;
    totalPhotoEvidence: number;
    completedAddOns: number;
  };
}

export interface ApiCompletionReportAction {
  report_id: string;
  job_id: string;
  report_status: CompletionReportStatus;
  persisted: boolean;
  share_url: string | null;
}

export interface ApiCompletionReportDeliveryNotification {
  report_id: string;
  notification_id: string;
  channel: 'email' | 'sms';
  recipient: string;
  delivery_status: string;
  share_url: string;
}

export interface CompletionReportAction {
  reportId: string;
  jobId: string;
  reportStatus: CompletionReportStatus;
  persisted: boolean;
  shareUrl: string | null;
}

export interface CompletionReportDeliveryNotification {
  reportId: string;
  notificationId: string;
  channel: 'email' | 'sms';
  recipient: string;
  deliveryStatus: string;
  shareUrl: string;
}

export interface ApiPropertyCompletionReportSummary {
  report_id: string;
  job_id: string;
  property_id: string;
  organization_id: string;
  customer_name: string;
  property_address: string;
  delivered_at: string;
  share_url: string;
}

export interface PropertyCompletionReportSummary {
  reportId: string;
  jobId: string;
  propertyId: string;
  organizationId: string;
  customerName: string;
  propertyAddress: string;
  deliveredAt: string;
  shareUrl: string;
}

export type NotificationHistoryEntityType = 'project_bid' | 'completion_report';
export type NotificationHistoryStatus =
  | 'queued'
  | 'sending'
  | 'sent'
  | 'failed'
  | 'skipped'
  | 'dead_letter';

export interface ApiNotificationHistoryItem {
  id: string;
  organization_id?: string;
  entity_type: NotificationHistoryEntityType;
  entity_id: string;
  channel: 'email' | 'sms';
  recipient: string;
  template_key: string;
  status: NotificationHistoryStatus;
  attempt_count: number;
  available_at: string;
  last_attempt_at?: string | null;
  sent_at?: string | null;
  last_error?: string | null;
  provider_response_code?: number | null;
  provider_message_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationHistoryItem {
  id: string;
  entityType: NotificationHistoryEntityType;
  entityId: string;
  channel: 'email' | 'sms';
  recipient: string;
  templateKey: string;
  status: NotificationHistoryStatus;
  attemptCount: number;
  availableAt: string;
  lastAttemptAt: string | null;
  sentAt: string | null;
  lastError: string | null;
  providerResponseCode: number | null;
  providerMessageId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FetchNotificationHistoryOptions {
  entityType?: NotificationHistoryEntityType;
  status?: NotificationHistoryStatus;
  limit?: number;
}

export type PhotoProcessingTaskType = 'thumbnail_generation';
export type PhotoProcessingStatus =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'dead_letter'
  | 'resolved';

export interface ApiPhotoProcessingHistoryItem {
  id: string;
  photo_id: string;
  job_id: string;
  organization_id: string;
  photo_type: PhotoUploadTicket['photoType'];
  file_name: string;
  task_type: PhotoProcessingTaskType;
  status: PhotoProcessingStatus;
  attempt_count: number;
  available_at: string;
  last_attempt_at?: string | null;
  completed_at?: string | null;
  resolved_at?: string | null;
  last_error?: string | null;
  failure_reason?: string | null;
  resolution_note?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PhotoProcessingHistoryItem {
  id: string;
  photoId: string;
  jobId: string;
  organizationId: string;
  photoType: PhotoUploadTicket['photoType'];
  fileName: string;
  taskType: PhotoProcessingTaskType;
  status: PhotoProcessingStatus;
  attemptCount: number;
  availableAt: string;
  lastAttemptAt: string | null;
  completedAt: string | null;
  resolvedAt: string | null;
  lastError: string | null;
  failureReason: string | null;
  resolutionNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FetchPhotoProcessingHistoryOptions {
  taskType?: PhotoProcessingTaskType;
  status?: PhotoProcessingStatus;
  limit?: number;
}

export interface ApiPhotoErasureDeletionHistoryItem {
  id: string;
  account_id: string;
  organization_id: string;
  object_key: string;
  status: PhotoProcessingStatus;
  attempt_count: number;
  available_at: string;
  last_attempt_at?: string | null;
  completed_at?: string | null;
  resolved_at?: string | null;
  last_error?: string | null;
  resolution_note?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PhotoErasureDeletionHistoryItem {
  id: string;
  accountId: string;
  organizationId: string;
  objectKey: string;
  status: PhotoProcessingStatus;
  attemptCount: number;
  availableAt: string;
  lastAttemptAt: string | null;
  completedAt: string | null;
  resolvedAt: string | null;
  lastError: string | null;
  resolutionNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PropertyOnboardingStatus = 'incomplete' | 'active' | 'blocked' | 'archived';
export type AccessRole =
  | 'OrganizationOwner'
  | 'Manager'
  | 'CrewLead'
  | 'CrewMember'
  | 'PropertyOwner'
  | 'PropertyManager'
  | 'SupportAdmin';

export interface OrganizationMembership {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationType: string;
  userId: string;
  displayName?: string;
  role: AccessRole;
  status: string;
  scopeType: string;
  scopeId: string | null;
}

export type TeamAdministrationEventKind =
  | 'organization_profile_updated'
  | 'invite_accepted'
  | 'invitation_revoked'
  | 'invitation_reissued'
  | 'role_changed'
  | 'membership_suspended'
  | 'membership_reactivated'
  | 'membership_profile_updated'
  | 'crew_profile_updated'
  | 'crew_deactivated'
  | 'crew_reactivated';

interface ApiTeamAdministrationActivity {
  id: string;
  actor_user_id: string;
  actor_label: string;
  organization_id: string;
  event_kind: TeamAdministrationEventKind;
  target_id: string;
  target_label: string;
  occurred_at: string;
}

export interface TeamAdministrationActivity {
  id: string;
  actorUserId: string;
  actorLabel: string;
  organizationId: string;
  eventKind: TeamAdministrationEventKind;
  targetId: string;
  targetLabel: string;
  occurredAt: string;
}

export type OperationalActivityEventKind =
  | 'route_draft_saved'
  | 'route_published'
  | 'route_completed'
  | 'route_stop_assigned'
  | 'route_stop_removed'
  | 'route_stops_reordered'
  | 'report_review_started'
  | 'report_changes_requested'
  | 'report_resubmitted'
  | 'report_delivered'
  | 'bid_approved'
  | 'bid_rejected'
  | 'bid_converted'
  | 'photo_processing_retried'
  | 'photo_processing_resolved'
  | 'customer_photo_evidence_erased';

interface ApiOperationalActivity {
  id: string;
  organization_id: string;
  event_kind: OperationalActivityEventKind;
  target_id: string;
  actor_user_id: string;
  actor_label?: string;
  occurred_at: string;
  metadata?: Record<string, unknown>;
}

export interface OperationalActivity {
  id: string;
  organizationId: string;
  eventKind: OperationalActivityEventKind;
  targetId: string;
  actorUserId: string;
  actorLabel?: string;
  occurredAt: string;
  metadata?: Record<string, unknown>;
}

export interface FetchOperationalActivityOptions {
  eventKind?: OperationalActivityEventKind;
  before?: string;
  limit?: number;
}

interface ApiOrganizationMembership {
  id: string;
  organization_id: string;
  organization_name: string;
  organization_type: string;
  user_id: string;
  display_name?: string;
  role: AccessRole;
  status: string;
  scope_type: string;
  scope_id?: string | null;
}

interface ApiPrincipalAccessSummary {
  user_id: string;
  username: string;
  verified_email?: string | null;
  claim_roles: AccessRole[];
  memberships: ApiOrganizationMembership[];
}

export interface PrincipalAccessSummary {
  userId: string;
  username: string;
  verifiedEmail: string | null;
  claimRoles: AccessRole[];
  memberships: OrganizationMembership[];
}

interface ApiBootstrapOrganizationResponse {
  organization_id: string;
  display_name: string;
  organization_type: string;
  membership: ApiOrganizationMembership;
  persisted: boolean;
}

export interface BootstrapOrganizationResponse {
  organizationId: string;
  displayName: string;
  organizationType: string;
  membership: OrganizationMembership;
  persisted: boolean;
}

interface ApiOrganizationProfile {
  id: string;
  display_name: string;
  organization_type: 'yard_care_company' | 'property_management_company';
  contact_email?: string | null;
  contact_phone?: string | null;
  website_url?: string | null;
  time_zone: string;
  service_area_label?: string | null;
  default_daily_stop_capacity: number;
  status: string;
  persisted: boolean;
}

export interface OrganizationProfile {
  id: string;
  displayName: string;
  organizationType: ApiOrganizationProfile['organization_type'];
  contactEmail: string;
  contactPhone: string;
  websiteUrl: string;
  timeZone: string;
  serviceAreaLabel: string;
  defaultDailyStopCapacity: number;
  status: string;
  persisted: boolean;
}

export interface FirstOwnerSetupProgress {
  organizationId: string;
  organizationProfileComplete: boolean;
  teamInvitationCreated: boolean;
  crewConfigured: boolean;
  firstRoutePublished: boolean;
  completedSteps: number;
  totalSteps: number;
  persisted: boolean;
}

export type OrganizationInvitationRole =
  | 'organization_owner'
  | 'manager'
  | 'crew_lead'
  | 'crew_member'
  | 'property_owner'
  | 'property_manager';

interface ApiOrganizationInvitation {
  id: string;
  organization_id: string;
  invitee_email: string;
  role: OrganizationInvitationRole;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  scope_type: string;
  scope_id?: string | null;
  token: string;
  membership_id: string;
  invited_by_user_id: string;
  accepted_by_user_id?: string | null;
  expires_at?: string | null;
  persisted: boolean;
}

export interface OrganizationInvitation {
  id: string;
  organizationId: string;
  inviteeEmail: string;
  role: OrganizationInvitationRole;
  status: ApiOrganizationInvitation['status'];
  scopeType: string;
  scopeId: string | null;
  token: string;
  membershipId: string;
  expiresAt: string | null;
  persisted: boolean;
}

interface ApiOrganizationInvitationAcceptance {
  invitation: ApiOrganizationInvitation;
  membership: ApiOrganizationMembership;
}

export interface OrganizationInvitationAcceptance {
  invitation: OrganizationInvitation;
  membership: OrganizationMembership;
}

interface ApiOrganizationInvitationSummary {
  id: string;
  organization_id: string;
  invitee_email: string;
  role: OrganizationInvitationRole;
  status: ApiOrganizationInvitation['status'];
  scope_type: string;
  scope_id?: string | null;
  membership_id: string;
  expires_at?: string | null;
  delivery_notification_id?: string | null;
  delivery_status?: string | null;
  delivery_attempt_count?: number;
  persisted: boolean;
}

export type OrganizationInvitationSummary = Omit<OrganizationInvitation, 'token'> & {
  deliveryNotificationId: string | null;
  deliveryStatus: string | null;
  deliveryAttemptCount: number;
};

export interface CustomerAccountRecord {
  accountId: string;
  organizationId: string;
  customerName: string;
  billingModel: 'per_job' | 'monthly_plan' | 'prepaid_package' | 'manual_account';
  paymentStatus: 'not_required' | 'pending' | 'paid' | 'past_due' | 'waived' | 'manager_review';
  serviceApprovalStatus: 'approved' | 'blocked' | 'manager_review';
  contractedServicesPerPeriod: number;
  completedServicesThisPeriod: number;
  billingNotes: string;
  primaryContactName: string;
  contactEmail: string;
  contactPhone: string;
  emailNotificationsEnabled: boolean;
  smsNotificationsEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  persisted: boolean;
}

export interface CustomerAccountOnboardingProgress {
  accountId: string;
  customerDetailsReady: boolean;
  propertyCount: number;
  serviceReadyPropertyCount: number;
  activePropertyCount: number;
  propertiesNeedingAttention: CustomerPropertyOnboardingAttention[];
  complete: boolean;
  persisted: boolean;
}

export type CustomerPropertyAttentionReason =
  | 'operational_profile_incomplete'
  | 'crew_unassigned'
  | 'property_blocked'
  | 'activation_pending';

export interface CustomerPropertyOnboardingAttention {
  propertyId: string;
  displayName: string;
  status: CustomerPropertyRecord['status'];
  reasons: CustomerPropertyAttentionReason[];
}

export interface CustomerPropertyRecord {
  propertyId: string;
  accountId: string;
  organizationId: string;
  displayName: string;
  serviceAddress: string;
  status: 'onboarding' | 'active' | 'blocked' | 'archived';
  persisted: boolean;
}

export interface CustomerPropertyActivationReadiness {
  propertyId: string;
  profileReady: boolean;
  crewReady: boolean;
  ready: boolean;
  persisted: boolean;
}

export interface CrewRecord {
  id: string;
  name: string;
  organizationId: string;
  status: 'active' | 'inactive';
  dailyStopCapacity: number;
  leadMembershipId: string | null;
  persisted: boolean;
}

export interface PropertyPortfolioRecord {
  id: string;
  accountId: string;
  organizationId: string;
  displayName: string;
  portfolioType: 'individual_owner' | 'property_management_company' | 'hoa' | 'commercial_client';
  propertyCount: number;
  persisted: boolean;
}

export interface PortfolioPropertyRecord {
  id: string;
  accountId: string;
  organizationId: string;
  displayName: string;
  address: string;
  lastServiceDate: string | null;
  persisted: boolean;
}

export interface CustomerPropertyPortfolioRecord {
  accountId: string;
  organizationIds: string[];
  portfolios: Array<PropertyPortfolioRecord & { properties: PortfolioPropertyRecord[] }>;
  ungroupedProperties: PortfolioPropertyRecord[];
  persisted: boolean;
}

export interface PropertyCrewAssignmentRecord {
  id: string;
  propertyId: string;
  crewId: string;
  organizationId: string;
  active: boolean;
  assignedAt: string;
  endedAt: string | null;
  persisted: boolean;
}

export interface ApiPropertyOnboardingProfile {
  property_id: string;
  account_id: string;
  organization_id: string;
  service_address: string;
  access_notes?: string | null;
  billing_contact_name: string;
  billing_contact_email: string;
  notification_contact_name: string;
  notification_email?: string | null;
  notification_phone?: string | null;
  onboarding_status: PropertyOnboardingStatus;
  persisted: boolean;
}

export interface PropertyOnboardingProfile {
  propertyId: string;
  accountId: string;
  organizationId: string;
  serviceAddress: string;
  accessNotes: string;
  billingContactName: string;
  billingContactEmail: string;
  notificationContactName: string;
  notificationEmail: string;
  notificationPhone: string;
  onboardingStatus: PropertyOnboardingStatus;
  persisted: boolean;
}

export type SavePropertyOnboardingRequest = Omit<
  PropertyOnboardingProfile,
  'propertyId' | 'persisted'
>;

export interface ApiCustomerPrivacyAccount {
  account_id: string;
  customer_name: string;
  billing_model: BillingModel;
  payment_status: PaymentStatus;
  service_approval_status: ServiceApprovalStatus;
  contracted_services_per_period: number;
  completed_services_this_period: number;
  period_start?: string | null;
  period_end?: string | null;
  billing_notes?: string | null;
  organization_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface ApiCustomerPrivacyJob {
  job_id: string;
  organization_id: string;
  customer_name: string;
  property_address: string;
  status: YardCareJob['status'];
  scheduled_date: string;
  before_photos: number;
  after_photos: number;
  created_at: string;
  updated_at: string;
}

export interface ApiCustomerPrivacyPhotoEvidence {
  photo_id: string;
  job_id: string;
  organization_id: string;
  photo_type: PhotoUploadTicket['photoType'];
  file_name?: string | null;
  content_type?: string | null;
  object_key?: string | null;
  thumbnail_object_key?: string | null;
  status: string;
  upload_mode: string;
  file_size_bytes?: number | null;
  image_width_px?: number | null;
  image_height_px?: number | null;
  metadata_source?: string | null;
  uploaded_at?: string | null;
  erased_at?: string | null;
  erasure_reason?: string | null;
}

export interface ApiCustomerPrivacyCompletionReport {
  report_id: string;
  job_id: string;
  report_status: CompletionReportStatus;
  ready_for_customer: boolean;
  sent_at?: string | null;
  delivered_at?: string | null;
  delivered_snapshot_at?: string | null;
  delivered_snapshot_photo_count: number;
  created_at: string;
  updated_at: string;
}

export interface ApiCustomerPrivacyExport {
  account: ApiCustomerPrivacyAccount;
  jobs: ApiCustomerPrivacyJob[];
  photo_evidence: ApiCustomerPrivacyPhotoEvidence[];
  completion_reports: ApiCustomerPrivacyCompletionReport[];
  generated_at: string;
}

export interface CustomerPrivacyExport {
  account: {
    accountId: string;
    customerName: string;
    billingModel: BillingModel;
    paymentStatus: PaymentStatus;
    serviceApprovalStatus: ServiceApprovalStatus;
    contractedServicesPerPeriod: number;
    completedServicesThisPeriod: number;
    periodStart: string | null;
    periodEnd: string | null;
    billingNotes: string | null;
    organizationIds: string[];
    createdAt: string;
    updatedAt: string;
  };
  jobs: Array<{
    jobId: string;
    organizationId: string;
    customerName: string;
    propertyAddress: string;
    status: YardCareJob['status'];
    scheduledDate: string;
    beforePhotos: number;
    afterPhotos: number;
    createdAt: string;
    updatedAt: string;
  }>;
  photoEvidence: Array<{
    photoId: string;
    jobId: string;
    organizationId: string;
    photoType: PhotoUploadTicket['photoType'];
    fileName: string | null;
    contentType: string | null;
    objectKey: string | null;
    thumbnailObjectKey: string | null;
    status: string;
    uploadMode: string;
    fileSizeBytes: number | null;
    imageWidthPx: number | null;
    imageHeightPx: number | null;
    metadataSource: string | null;
    uploadedAt: string | null;
    erasedAt: string | null;
    erasureReason: string | null;
  }>;
  completionReports: Array<{
    reportId: string;
    jobId: string;
    reportStatus: CompletionReportStatus;
    readyForCustomer: boolean;
    sentAt: string | null;
    deliveredAt: string | null;
    deliveredSnapshotAt: string | null;
    deliveredSnapshotPhotoCount: number;
    createdAt: string;
    updatedAt: string;
  }>;
  generatedAt: string;
}

export interface ApiCustomerPhotoErasureSummary {
  account_id: string;
  status: 'erased';
  erased_photo_count: number;
  affected_job_count: number;
  redacted_completion_report_count: number;
  deleted_object_key_count: number;
  failed_object_key_count: number;
  object_keys_pending_deletion: string[];
}

export interface CustomerPhotoErasureSummary {
  accountId: string;
  status: 'erased';
  erasedPhotoCount: number;
  affectedJobCount: number;
  redactedCompletionReportCount: number;
  deletedObjectKeyCount: number;
  failedObjectKeyCount: number;
  objectKeysPendingDeletion: string[];
}

function toJob(apiJob: ApiJobSummary): YardCareJob {
  return {
    id: apiJob.id,
    customerName: apiJob.customer_name,
    propertyAddress: apiJob.property_address,
    scheduledDate: apiJob.scheduled_date,
    status: apiJob.status,
    beforePhotos: apiJob.before_photos,
    afterPhotos: apiJob.after_photos,
    checklistItems: apiJob.checklist_items,
    completedChecklistItems: apiJob.completed_checklist_items,
  };
}

function toJobDetail(apiJob: ApiJobDetail): JobDetail {
  return {
    ...toJob(apiJob),
    checklist: apiJob.checklist,
  };
}

export function toJobAddOn(addOn: ApiJobAddOn): JobAddOn {
  return {
    id: addOn.id,
    jobId: addOn.job_id,
    serviceName: addOn.service_name,
    serviceDescription: addOn.service_description ?? undefined,
    quantity: addOn.quantity,
    unitPriceCents: addOn.unit_price_cents,
    note: addOn.note ?? undefined,
    status: addOn.status,
  };
}

function toAccountStatus(apiAccount: ApiAccountStatus): AccountStatus {
  return {
    jobId: apiAccount.job_id,
    accountId: apiAccount.account_id,
    customerName: apiAccount.customer_name,
    billingModel: apiAccount.billing_model,
    paymentStatus: apiAccount.payment_status,
    serviceApprovalStatus: apiAccount.service_approval_status,
    contractedServicesPerPeriod: apiAccount.contracted_services_per_period,
    completedServicesThisPeriod: apiAccount.completed_services_this_period,
    billingNotes: apiAccount.billing_notes,
  };
}

function toPhotoEvidence(photo: ApiPhotoEvidence): PhotoUploadTicket {
  return {
    status: photo.status,
    jobId: photo.job_id,
    photoId: photo.id,
    photoType: photo.photo_type,
    fileName: photo.file_name,
    contentType: photo.content_type,
    uploadMode: photo.upload_mode,
    uploadUrl: photo.display_url,
    objectKey: photo.object_key,
    thumbnailUrl: photo.thumbnail_url ?? undefined,
    fileSizeBytes: photo.file_size_bytes ?? undefined,
    imageWidthPx: photo.image_width_px ?? undefined,
    imageHeightPx: photo.image_height_px ?? undefined,
    metadataSource: photo.metadata_source ?? undefined,
  };
}

export function toCompletionReport(apiReport: ApiCompletionReport): CompletionReportSnapshot {
  return {
    reportId: apiReport.report_id,
    jobId: apiReport.job_id,
    reportStatus: apiReport.report_status,
    persisted: apiReport.persisted,
    readyForCustomer: apiReport.ready_for_customer,
    checklistProgress: apiReport.checklist_progress,
    beforePhotos: apiReport.before_photos,
    afterPhotos: apiReport.after_photos,
    issuePhotos: apiReport.issue_photos,
    shareUrl: apiReport.share_url ? toBrowserUrl(apiReport.share_url) : null,
    job: toJobDetail(apiReport.job),
    account: toAccountStatus(apiReport.account),
    photoEvidence: apiReport.photo_evidence.map(toPhotoEvidence),
    completedAddOns: apiReport.completed_add_ons.map(toJobAddOn),
    snapshotMetadata: apiReport.snapshot_metadata
      ? {
          snapshotVersion: apiReport.snapshot_metadata.snapshot_version,
          reportId: apiReport.snapshot_metadata.report_id,
          jobId: apiReport.snapshot_metadata.job_id,
          capturedAtEpochSeconds: apiReport.snapshot_metadata.captured_at_epoch_seconds,
          evidence: {
            beforePhotos: apiReport.snapshot_metadata.evidence.before_photos,
            afterPhotos: apiReport.snapshot_metadata.evidence.after_photos,
            issuePhotos: apiReport.snapshot_metadata.evidence.issue_photos,
            totalPhotoEvidence: apiReport.snapshot_metadata.evidence.total_photo_evidence,
            completedAddOns: apiReport.snapshot_metadata.evidence.completed_add_ons,
          },
        }
      : undefined,
  };
}

export function toCompletionReportAction(apiAction: ApiCompletionReportAction): CompletionReportAction {
  return {
    reportId: apiAction.report_id,
    jobId: apiAction.job_id,
    reportStatus: apiAction.report_status,
    persisted: apiAction.persisted,
    shareUrl: apiAction.share_url ? toBrowserUrl(apiAction.share_url) : null,
  };
}

export function toCompletionReportDeliveryNotification(
  apiNotification: ApiCompletionReportDeliveryNotification,
): CompletionReportDeliveryNotification {
  return {
    reportId: apiNotification.report_id,
    notificationId: apiNotification.notification_id,
    channel: apiNotification.channel,
    recipient: apiNotification.recipient,
    deliveryStatus: apiNotification.delivery_status,
    shareUrl: toBrowserUrl(apiNotification.share_url),
  };
}

export function toPropertyCompletionReportSummary(
  apiReport: ApiPropertyCompletionReportSummary,
): PropertyCompletionReportSummary {
  return {
    reportId: apiReport.report_id,
    jobId: apiReport.job_id,
    propertyId: apiReport.property_id,
    organizationId: apiReport.organization_id,
    customerName: apiReport.customer_name,
    propertyAddress: apiReport.property_address,
    deliveredAt: apiReport.delivered_at,
    shareUrl: toBrowserUrl(apiReport.share_url),
  };
}

export function toNotificationHistoryItem(apiItem: ApiNotificationHistoryItem): NotificationHistoryItem {
  return {
    id: apiItem.id,
    entityType: apiItem.entity_type,
    entityId: apiItem.entity_id,
    channel: apiItem.channel,
    recipient: apiItem.recipient,
    templateKey: apiItem.template_key,
    status: apiItem.status,
    attemptCount: apiItem.attempt_count,
    availableAt: apiItem.available_at,
    lastAttemptAt: apiItem.last_attempt_at ?? null,
    sentAt: apiItem.sent_at ?? null,
    lastError: apiItem.last_error ?? null,
    providerResponseCode: apiItem.provider_response_code ?? null,
    providerMessageId: apiItem.provider_message_id ?? null,
    createdAt: apiItem.created_at,
    updatedAt: apiItem.updated_at,
  };
}

export function toPhotoProcessingHistoryItem(apiItem: ApiPhotoProcessingHistoryItem): PhotoProcessingHistoryItem {
  return {
    id: apiItem.id,
    photoId: apiItem.photo_id,
    jobId: apiItem.job_id,
    organizationId: apiItem.organization_id,
    photoType: apiItem.photo_type,
    fileName: apiItem.file_name,
    taskType: apiItem.task_type,
    status: apiItem.status,
    attemptCount: apiItem.attempt_count,
    availableAt: apiItem.available_at,
    lastAttemptAt: apiItem.last_attempt_at ?? null,
    completedAt: apiItem.completed_at ?? null,
    resolvedAt: apiItem.resolved_at ?? null,
    lastError: apiItem.last_error ?? null,
    failureReason: apiItem.failure_reason ?? null,
    resolutionNote: apiItem.resolution_note ?? null,
    createdAt: apiItem.created_at,
    updatedAt: apiItem.updated_at,
  };
}

export function toPhotoErasureDeletionHistoryItem(
  item: ApiPhotoErasureDeletionHistoryItem,
): PhotoErasureDeletionHistoryItem {
  return {
    id: item.id,
    accountId: item.account_id,
    organizationId: item.organization_id,
    objectKey: item.object_key,
    status: item.status,
    attemptCount: item.attempt_count,
    availableAt: item.available_at,
    lastAttemptAt: item.last_attempt_at ?? null,
    completedAt: item.completed_at ?? null,
    resolvedAt: item.resolved_at ?? null,
    lastError: item.last_error ?? null,
    resolutionNote: item.resolution_note ?? null,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}

export function toPropertyOnboardingProfile(
  profile: ApiPropertyOnboardingProfile,
): PropertyOnboardingProfile {
  return {
    propertyId: profile.property_id,
    accountId: profile.account_id,
    organizationId: profile.organization_id,
    serviceAddress: profile.service_address,
    accessNotes: profile.access_notes ?? '',
    billingContactName: profile.billing_contact_name,
    billingContactEmail: profile.billing_contact_email,
    notificationContactName: profile.notification_contact_name,
    notificationEmail: profile.notification_email ?? '',
    notificationPhone: profile.notification_phone ?? '',
    onboardingStatus: profile.onboarding_status,
    persisted: profile.persisted,
  };
}

function toOrganizationMembership(
  membership: ApiOrganizationMembership,
): OrganizationMembership {
  return {
    id: membership.id,
    organizationId: membership.organization_id,
    organizationName: membership.organization_name,
    organizationType: membership.organization_type,
    userId: membership.user_id,
    displayName: membership.display_name || membership.user_id,
    role: membership.role,
    status: membership.status,
    scopeType: membership.scope_type,
    scopeId: membership.scope_id ?? null,
  };
}

export function toPrincipalAccessSummary(
  summary: ApiPrincipalAccessSummary,
): PrincipalAccessSummary {
  return {
    userId: summary.user_id,
    username: summary.username,
    verifiedEmail: summary.verified_email ?? null,
    claimRoles: summary.claim_roles,
    memberships: summary.memberships.map(toOrganizationMembership),
  };
}

export function toCustomerPrivacyExport(apiExport: ApiCustomerPrivacyExport): CustomerPrivacyExport {
  return {
    account: {
      accountId: apiExport.account.account_id,
      customerName: apiExport.account.customer_name,
      billingModel: apiExport.account.billing_model,
      paymentStatus: apiExport.account.payment_status,
      serviceApprovalStatus: apiExport.account.service_approval_status,
      contractedServicesPerPeriod: apiExport.account.contracted_services_per_period,
      completedServicesThisPeriod: apiExport.account.completed_services_this_period,
      periodStart: apiExport.account.period_start ?? null,
      periodEnd: apiExport.account.period_end ?? null,
      billingNotes: apiExport.account.billing_notes ?? null,
      organizationIds: apiExport.account.organization_ids,
      createdAt: apiExport.account.created_at,
      updatedAt: apiExport.account.updated_at,
    },
    jobs: apiExport.jobs.map((job) => ({
      jobId: job.job_id,
      organizationId: job.organization_id,
      customerName: job.customer_name,
      propertyAddress: job.property_address,
      status: job.status,
      scheduledDate: job.scheduled_date,
      beforePhotos: job.before_photos,
      afterPhotos: job.after_photos,
      createdAt: job.created_at,
      updatedAt: job.updated_at,
    })),
    photoEvidence: apiExport.photo_evidence.map((photo) => ({
      photoId: photo.photo_id,
      jobId: photo.job_id,
      organizationId: photo.organization_id,
      photoType: photo.photo_type,
      fileName: photo.file_name ?? null,
      contentType: photo.content_type ?? null,
      objectKey: photo.object_key ?? null,
      thumbnailObjectKey: photo.thumbnail_object_key ?? null,
      status: photo.status,
      uploadMode: photo.upload_mode,
      fileSizeBytes: photo.file_size_bytes ?? null,
      imageWidthPx: photo.image_width_px ?? null,
      imageHeightPx: photo.image_height_px ?? null,
      metadataSource: photo.metadata_source ?? null,
      uploadedAt: photo.uploaded_at ?? null,
      erasedAt: photo.erased_at ?? null,
      erasureReason: photo.erasure_reason ?? null,
    })),
    completionReports: apiExport.completion_reports.map((report) => ({
      reportId: report.report_id,
      jobId: report.job_id,
      reportStatus: report.report_status,
      readyForCustomer: report.ready_for_customer,
      sentAt: report.sent_at ?? null,
      deliveredAt: report.delivered_at ?? null,
      deliveredSnapshotAt: report.delivered_snapshot_at ?? null,
      deliveredSnapshotPhotoCount: report.delivered_snapshot_photo_count,
      createdAt: report.created_at,
      updatedAt: report.updated_at,
    })),
    generatedAt: apiExport.generated_at,
  };
}

export function toCustomerPhotoErasureSummary(
  apiSummary: ApiCustomerPhotoErasureSummary,
): CustomerPhotoErasureSummary {
  return {
    accountId: apiSummary.account_id,
    status: apiSummary.status,
    erasedPhotoCount: apiSummary.erased_photo_count,
    affectedJobCount: apiSummary.affected_job_count,
    redactedCompletionReportCount: apiSummary.redacted_completion_report_count,
    deletedObjectKeyCount: apiSummary.deleted_object_key_count,
    failedObjectKeyCount: apiSummary.failed_object_key_count,
    objectKeysPendingDeletion: apiSummary.object_keys_pending_deletion,
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await authenticatedFetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw await apiRequestError(response);
  }

  return response.json() as Promise<T>;
}

export async function fetchJobs(): Promise<YardCareJob[]> {
  const jobs = await request<ApiJobSummary[]>('/jobs');
  return jobs.map(toJob);
}

export async function fetchJobAddOns(jobId: string): Promise<JobAddOn[]> {
  const addOns = await request<ApiJobAddOn[]>(`/jobs/${jobId}/add-ons`);
  return addOns.map(toJobAddOn);
}

export async function updateJobAddOnStatus(
  jobId: string,
  addOnId: string,
  status: ApiJobAddOn['status'],
): Promise<JobAddOn> {
  const addOn = await request<ApiJobAddOn>(`/jobs/${jobId}/add-ons/${addOnId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
  return toJobAddOn(addOn);
}

export async function fetchJobDetail(jobId: string): Promise<JobDetail> {
  const job = await request<ApiJobDetail>(`/jobs/${jobId}`);
  return toJobDetail(job);
}

export async function fetchAccountStatus(jobId: string): Promise<AccountStatus> {
  const account = await request<ApiAccountStatus>(`/jobs/${jobId}/account`);
  return toAccountStatus(account);
}

export async function fetchCompletionReport(jobId: string): Promise<CompletionReportSnapshot> {
  const report = await request<ApiCompletionReport>(`/jobs/${jobId}/report`);
  return toCompletionReport(report);
}

export function completionReportsPath(options: FetchCompletionReportsOptions = {}): string {
  const query = new URLSearchParams();

  if (options.status && options.status !== 'all') {
    query.set('status', options.status);
  }

  if (options.readiness && options.readiness !== 'all') {
    query.set('readiness', options.readiness);
  }

  if (options.readinessBlocker && options.readinessBlocker !== 'all') {
    query.set('readiness_blocker', options.readinessBlocker);
  }

  if (options.crewId) {
    query.set('crew_id', options.crewId);
  }

  if (options.customer) {
    query.set('customer', options.customer);
  }

  if (options.property) {
    query.set('property', options.property);
  }

  if (options.scheduledFrom) {
    query.set('scheduled_from', options.scheduledFrom);
  }

  if (options.scheduledTo) {
    query.set('scheduled_to', options.scheduledTo);
  }

  const queryString = query.toString();
  return queryString ? `/completion-reports?${queryString}` : '/completion-reports';
}

export async function fetchCompletionReports(
  options: FetchCompletionReportsOptions = {},
): Promise<CompletionReportSnapshot[]> {
  const reports = await request<ApiCompletionReport[]>(completionReportsPath(options));
  return reports.map(toCompletionReport);
}

export function propertyCompletionReportsPath(propertyId: string): string {
  return `/properties/${encodeURIComponent(propertyId)}/completion-reports`;
}

export async function fetchPropertyCompletionReports(
  propertyId: string,
): Promise<PropertyCompletionReportSummary[]> {
  const reports = await request<ApiPropertyCompletionReportSummary[]>(propertyCompletionReportsPath(propertyId));
  return reports.map(toPropertyCompletionReportSummary);
}

export function notificationHistoryPath(options: FetchNotificationHistoryOptions = {}): string {
  const query = new URLSearchParams();

  if (options.entityType) {
    query.set('entity_type', options.entityType);
  }

  if (options.status) {
    query.set('status', options.status);
  }

  if (options.limit) {
    query.set('limit', String(options.limit));
  }

  const queryString = query.toString();
  return queryString ? `/notifications?${queryString}` : '/notifications';
}

export async function fetchNotificationHistory(
  options: FetchNotificationHistoryOptions = {},
): Promise<NotificationHistoryItem[]> {
  const notifications = await request<ApiNotificationHistoryItem[]>(notificationHistoryPath(options));
  return notifications.map(toNotificationHistoryItem);
}

export function notificationRetryPath(notificationId: string): string {
  return `/notifications/${encodeURIComponent(notificationId)}/retry`;
}

export function notificationResolvePath(notificationId: string): string {
  return `/notifications/${encodeURIComponent(notificationId)}/resolve`;
}

export async function retryNotificationDelivery(notificationId: string): Promise<NotificationHistoryItem> {
  const notification = await request<ApiNotificationHistoryItem>(
    notificationRetryPath(notificationId),
    {
      method: 'POST',
    },
  );
  return toNotificationHistoryItem(notification);
}

export async function resolveNotificationDelivery(notificationId: string): Promise<NotificationHistoryItem> {
  const notification = await request<ApiNotificationHistoryItem>(
    notificationResolvePath(notificationId),
    {
      method: 'POST',
      body: JSON.stringify({ reason: 'Manually resolved from manager dashboard' }),
    },
  );
  return toNotificationHistoryItem(notification);
}

export function photoProcessingHistoryPath(options: FetchPhotoProcessingHistoryOptions = {}): string {
  const query = new URLSearchParams();

  if (options.taskType) {
    query.set('task_type', options.taskType);
  }

  if (options.status) {
    query.set('status', options.status);
  }

  if (options.limit) {
    query.set('limit', String(options.limit));
  }

  const queryString = query.toString();
  return queryString ? `/photo-processing-jobs?${queryString}` : '/photo-processing-jobs';
}

export async function fetchPhotoProcessingHistory(
  options: FetchPhotoProcessingHistoryOptions = {},
): Promise<PhotoProcessingHistoryItem[]> {
  const jobs = await request<ApiPhotoProcessingHistoryItem[]>(photoProcessingHistoryPath(options));
  return jobs.map(toPhotoProcessingHistoryItem);
}

export function photoProcessingRetryPath(photoProcessingJobId: string): string {
  return `/photo-processing-jobs/${encodeURIComponent(photoProcessingJobId)}/retry`;
}

export function photoProcessingResolvePath(photoProcessingJobId: string): string {
  return `/photo-processing-jobs/${encodeURIComponent(photoProcessingJobId)}/resolve`;
}

export async function retryPhotoProcessingJob(photoProcessingJobId: string): Promise<PhotoProcessingHistoryItem> {
  const job = await request<ApiPhotoProcessingHistoryItem>(
    photoProcessingRetryPath(photoProcessingJobId),
    {
      method: 'POST',
    },
  );
  return toPhotoProcessingHistoryItem(job);
}

export async function resolvePhotoProcessingJob(photoProcessingJobId: string): Promise<PhotoProcessingHistoryItem> {
  const job = await request<ApiPhotoProcessingHistoryItem>(
    photoProcessingResolvePath(photoProcessingJobId),
    {
      method: 'POST',
      body: JSON.stringify({ reason: 'Manually resolved from manager dashboard' }),
    },
  );
  return toPhotoProcessingHistoryItem(job);
}

export function photoErasureDeletionHistoryPath(status?: PhotoProcessingStatus): string {
  return status
    ? `/photo-erasure-deletion-jobs?status=${encodeURIComponent(status)}&limit=25`
    : '/photo-erasure-deletion-jobs?limit=25';
}

export async function fetchPhotoErasureDeletionHistory(
  status?: PhotoProcessingStatus,
): Promise<PhotoErasureDeletionHistoryItem[]> {
  const items = await request<ApiPhotoErasureDeletionHistoryItem[]>(
    photoErasureDeletionHistoryPath(status),
  );
  return items.map(toPhotoErasureDeletionHistoryItem);
}

export async function retryPhotoErasureDeletionJob(id: string): Promise<PhotoErasureDeletionHistoryItem> {
  const item = await request<ApiPhotoErasureDeletionHistoryItem>(
    `/photo-erasure-deletion-jobs/${encodeURIComponent(id)}/retry`,
    { method: 'POST' },
  );
  return toPhotoErasureDeletionHistoryItem(item);
}

export async function resolvePhotoErasureDeletionJob(id: string): Promise<PhotoErasureDeletionHistoryItem> {
  const item = await request<ApiPhotoErasureDeletionHistoryItem>(
    `/photo-erasure-deletion-jobs/${encodeURIComponent(id)}/resolve`,
    {
      method: 'POST',
      body: JSON.stringify({ reason: 'Manually resolved from manager dashboard' }),
    },
  );
  return toPhotoErasureDeletionHistoryItem(item);
}

export function propertyOnboardingPath(propertyId: string): string {
  return `/properties/${encodeURIComponent(propertyId)}/onboarding`;
}

export async function fetchPropertyOnboarding(
  propertyId: string,
): Promise<PropertyOnboardingProfile> {
  const profile = await request<ApiPropertyOnboardingProfile>(
    propertyOnboardingPath(propertyId),
  );
  return toPropertyOnboardingProfile(profile);
}

export async function savePropertyOnboarding(
  propertyId: string,
  input: SavePropertyOnboardingRequest,
): Promise<PropertyOnboardingProfile> {
  const profile = await request<ApiPropertyOnboardingProfile>(
    propertyOnboardingPath(propertyId),
    {
      method: 'PUT',
      body: JSON.stringify({
        account_id: input.accountId,
        organization_id: input.organizationId,
        service_address: input.serviceAddress,
        access_notes: input.accessNotes || null,
        billing_contact_name: input.billingContactName,
        billing_contact_email: input.billingContactEmail,
        notification_contact_name: input.notificationContactName,
        notification_email: input.notificationEmail || null,
        notification_phone: input.notificationPhone || null,
        onboarding_status: input.onboardingStatus,
      }),
    },
  );
  return toPropertyOnboardingProfile(profile);
}

export async function fetchPrincipalAccessSummary(): Promise<PrincipalAccessSummary> {
  return toPrincipalAccessSummary(await request<ApiPrincipalAccessSummary>('/me/access'));
}

export function organizationMembershipsPath(organizationId: string): string {
  return `/organizations/${encodeURIComponent(organizationId)}/memberships`;
}

export function organizationTeamActivityPath(
  organizationId: string,
  options: { before?: string; limit?: number } = {},
): string {
  const path = `/organizations/${encodeURIComponent(organizationId)}/team-activity`;
  const params = new URLSearchParams();
  if (options.before) params.set('before', options.before);
  if (options.limit !== undefined) params.set('limit', String(options.limit));
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export function organizationMembershipRolePath(
  organizationId: string,
  membershipId: string,
): string {
  return `${organizationMembershipsPath(organizationId)}/${encodeURIComponent(membershipId)}/role`;
}

export function organizationMembershipStatusPath(
  organizationId: string,
  membershipId: string,
): string {
  return `${organizationMembershipsPath(organizationId)}/${encodeURIComponent(membershipId)}/status`;
}

export function organizationMembershipProfilePath(
  organizationId: string,
  membershipId: string,
): string {
  return `${organizationMembershipsPath(organizationId)}/${encodeURIComponent(membershipId)}/profile`;
}

export async function fetchOrganizationMemberships(
  organizationId: string,
): Promise<OrganizationMembership[]> {
  const memberships = await request<ApiOrganizationMembership[]>(
    organizationMembershipsPath(organizationId),
  );
  return memberships.map(toOrganizationMembership);
}

export function toTeamAdministrationActivity(
  item: ApiTeamAdministrationActivity,
): TeamAdministrationActivity {
  return {
    id: item.id,
    actorUserId: item.actor_user_id,
    actorLabel: item.actor_label,
    organizationId: item.organization_id,
    eventKind: item.event_kind,
    targetId: item.target_id,
    targetLabel: item.target_label,
    occurredAt: item.occurred_at,
  };
}

export async function fetchTeamAdministrationActivity(
  organizationId: string,
  options: { before?: string; limit?: number } = {},
): Promise<TeamAdministrationActivity[]> {
  const activity = await request<ApiTeamAdministrationActivity[]>(
    organizationTeamActivityPath(organizationId, options),
  );
  return activity.map(toTeamAdministrationActivity);
}

export function operationalActivityPath(options: FetchOperationalActivityOptions = {}): string {
  const params = new URLSearchParams();
  if (options.eventKind) params.set('event_kind', options.eventKind);
  if (options.before) params.set('before', options.before);
  if (options.limit !== undefined) params.set('limit', String(options.limit));
  const query = params.toString();
  return query ? `/operational-activity?${query}` : '/operational-activity';
}

export async function fetchOperationalActivity(
  options: FetchOperationalActivityOptions = {},
): Promise<OperationalActivity[]> {
  const activity = await request<ApiOperationalActivity[]>(operationalActivityPath(options));
  return activity.map((item) => ({
    id: item.id,
    organizationId: item.organization_id,
    eventKind: item.event_kind,
    targetId: item.target_id,
    actorUserId: item.actor_user_id,
    actorLabel: item.actor_label ?? item.actor_user_id,
    occurredAt: item.occurred_at,
    metadata: item.metadata ?? {},
  }));
}

const membershipRoleStorage: Record<AccessRole, string> = {
  OrganizationOwner: 'organization_owner',
  Manager: 'manager',
  CrewLead: 'crew_lead',
  CrewMember: 'crew_member',
  PropertyOwner: 'property_owner',
  PropertyManager: 'property_manager',
  SupportAdmin: 'support_admin',
};

export async function updateOrganizationMembershipRole(
  organizationId: string,
  membershipId: string,
  role: AccessRole,
): Promise<OrganizationMembership> {
  return toOrganizationMembership(
    await request<ApiOrganizationMembership>(
      organizationMembershipRolePath(organizationId, membershipId),
      {
        method: 'PUT',
        body: JSON.stringify({ role: membershipRoleStorage[role] }),
      },
    ),
  );
}

export async function updateOrganizationMembershipProfile(
  organizationId: string,
  membershipId: string,
  displayName: string,
): Promise<OrganizationMembership> {
  return toOrganizationMembership(
    await request<ApiOrganizationMembership>(
      organizationMembershipProfilePath(organizationId, membershipId),
      {
        method: 'PUT',
        body: JSON.stringify({ display_name: displayName.trim() }),
      },
    ),
  );
}

export async function updateOrganizationMembershipStatus(
  organizationId: string,
  membershipId: string,
  status: 'active' | 'suspended',
): Promise<OrganizationMembership> {
  return toOrganizationMembership(
    await request<ApiOrganizationMembership>(
      organizationMembershipStatusPath(organizationId, membershipId),
      {
        method: 'PUT',
        body: JSON.stringify({ status }),
      },
    ),
  );
}

export async function bootstrapOrganization(
  displayName: string,
  organizationType: 'yard_care_company' | 'property_management_company',
): Promise<BootstrapOrganizationResponse> {
  const response = await request<ApiBootstrapOrganizationResponse>('/organizations/bootstrap', {
    method: 'POST',
    body: JSON.stringify({
      display_name: displayName,
      organization_type: organizationType,
    }),
  });
  return {
    organizationId: response.organization_id,
    displayName: response.display_name,
    organizationType: response.organization_type,
    membership: toOrganizationMembership(response.membership),
    persisted: response.persisted,
  };
}

export function toOrganizationProfile(profile: ApiOrganizationProfile): OrganizationProfile {
  return {
    id: profile.id,
    displayName: profile.display_name,
    organizationType: profile.organization_type,
    contactEmail: profile.contact_email ?? '',
    contactPhone: profile.contact_phone ?? '',
    websiteUrl: profile.website_url ?? '',
    timeZone: profile.time_zone,
    serviceAreaLabel: profile.service_area_label ?? '',
    defaultDailyStopCapacity: profile.default_daily_stop_capacity,
    status: profile.status,
    persisted: profile.persisted,
  };
}

export async function fetchOrganizationProfile(
  organizationId: string,
): Promise<OrganizationProfile> {
  return toOrganizationProfile(await request<ApiOrganizationProfile>(
    `/organizations/${encodeURIComponent(organizationId)}`,
  ));
}

export async function fetchFirstOwnerSetupProgress(
  organizationId: string,
): Promise<FirstOwnerSetupProgress> {
  const progress = await request<{
    organization_id: string;
    organization_profile_complete: boolean;
    team_invitation_created: boolean;
    crew_configured: boolean;
    first_route_published: boolean;
    completed_steps: number;
    total_steps: number;
    persisted: boolean;
  }>(`/organizations/${encodeURIComponent(organizationId)}/setup-progress`);
  return {
    organizationId: progress.organization_id,
    organizationProfileComplete: progress.organization_profile_complete,
    teamInvitationCreated: progress.team_invitation_created,
    crewConfigured: progress.crew_configured,
    firstRoutePublished: progress.first_route_published,
    completedSteps: progress.completed_steps,
    totalSteps: progress.total_steps,
    persisted: progress.persisted,
  };
}

export async function updateOrganizationProfile(
  organizationId: string,
  displayName: string,
  organizationType: OrganizationProfile['organizationType'],
  contactEmail: string,
  contactPhone: string,
  websiteUrl: string,
  timeZone: string,
  serviceAreaLabel: string,
  defaultDailyStopCapacity: number,
): Promise<OrganizationProfile> {
  return toOrganizationProfile(await request<ApiOrganizationProfile>(
    `/organizations/${encodeURIComponent(organizationId)}`,
    {
      method: 'PUT',
      body: JSON.stringify({
        display_name: displayName,
        organization_type: organizationType,
        contact_email: contactEmail || null,
        contact_phone: contactPhone || null,
        website_url: websiteUrl || null,
        time_zone: timeZone,
        service_area_label: serviceAreaLabel || null,
        default_daily_stop_capacity: defaultDailyStopCapacity,
      }),
    },
  ));
}

export function organizationInvitationsPath(organizationId: string): string {
  return `/organizations/${encodeURIComponent(organizationId)}/invitations`;
}

export function organizationInvitationPath(
  organizationId: string,
  invitationId: string,
): string {
  return `${organizationInvitationsPath(organizationId)}/${encodeURIComponent(invitationId)}`;
}

export function organizationInvitationAcceptancePath(token: string): string {
  return `/organization-invitations/${encodeURIComponent(token)}/accept`;
}

export function toOrganizationInvitation(
  invitation: ApiOrganizationInvitation,
): OrganizationInvitation {
  return {
    id: invitation.id,
    organizationId: invitation.organization_id,
    inviteeEmail: invitation.invitee_email,
    role: invitation.role,
    status: invitation.status,
    scopeType: invitation.scope_type,
    scopeId: invitation.scope_id ?? null,
    token: invitation.token,
    membershipId: invitation.membership_id,
    expiresAt: invitation.expires_at ?? null,
    persisted: invitation.persisted,
  };
}

export async function createOrganizationInvitation(
  organizationId: string,
  inviteeEmail: string,
  role: OrganizationInvitationRole,
  expiresAt: string,
): Promise<OrganizationInvitation> {
  const invitation = await request<ApiOrganizationInvitation>(
    organizationInvitationsPath(organizationId),
    {
      method: 'POST',
      body: JSON.stringify({
        invitee_email: inviteeEmail,
        role,
        scope_type: 'organization',
        scope_id: organizationId,
        expires_at: expiresAt,
      }),
    },
  );
  return toOrganizationInvitation(invitation);
}

export function toOrganizationInvitationSummary(
  invitation: ApiOrganizationInvitationSummary,
): OrganizationInvitationSummary {
  return {
    id: invitation.id,
    organizationId: invitation.organization_id,
    inviteeEmail: invitation.invitee_email,
    role: invitation.role,
    status: invitation.status,
    scopeType: invitation.scope_type,
    scopeId: invitation.scope_id ?? null,
    membershipId: invitation.membership_id,
    expiresAt: invitation.expires_at ?? null,
    deliveryNotificationId: invitation.delivery_notification_id ?? null,
    deliveryStatus: invitation.delivery_status ?? null,
    deliveryAttemptCount: invitation.delivery_attempt_count ?? 0,
    persisted: invitation.persisted,
  };
}

export async function fetchOrganizationInvitations(
  organizationId: string,
): Promise<OrganizationInvitationSummary[]> {
  const invitations = await request<ApiOrganizationInvitationSummary[]>(
    organizationInvitationsPath(organizationId),
  );
  return invitations.map(toOrganizationInvitationSummary);
}

export async function revokeOrganizationInvitation(
  organizationId: string,
  invitationId: string,
): Promise<OrganizationInvitationSummary> {
  return toOrganizationInvitationSummary(
    await request<ApiOrganizationInvitationSummary>(
      organizationInvitationPath(organizationId, invitationId),
      { method: 'DELETE' },
    ),
  );
}

export async function reissueOrganizationInvitation(
  organizationId: string,
  invitationId: string,
  expiresAt: string,
): Promise<OrganizationInvitation> {
  return toOrganizationInvitation(
    await request<ApiOrganizationInvitation>(
      `${organizationInvitationPath(organizationId, invitationId)}/reissue`,
      {
        method: 'POST',
        body: JSON.stringify({ expires_at: expiresAt }),
      },
    ),
  );
}

export async function acceptOrganizationInvitation(
  token: string,
): Promise<OrganizationInvitationAcceptance> {
  const accepted = await request<ApiOrganizationInvitationAcceptance>(
    organizationInvitationAcceptancePath(token),
    { method: 'POST' },
  );
  return {
    invitation: toOrganizationInvitation(accepted.invitation),
    membership: toOrganizationMembership(accepted.membership),
  };
}

function toCustomerAccountRecord(item: {
  account_id: string; organization_id: string; customer_name: string;
  billing_model: CustomerAccountRecord['billingModel'];
  payment_status: CustomerAccountRecord['paymentStatus'];
  service_approval_status: CustomerAccountRecord['serviceApprovalStatus'];
  contracted_services_per_period: number; completed_services_this_period: number;
  billing_notes: string; primary_contact_name: string; contact_email: string;
  contact_phone: string; email_notifications_enabled: boolean;
  sms_notifications_enabled: boolean; quiet_hours_start: string;
  quiet_hours_end: string; persisted: boolean;
}): CustomerAccountRecord {
  return {
    accountId: item.account_id,
    organizationId: item.organization_id,
    customerName: item.customer_name,
    billingModel: item.billing_model,
    paymentStatus: item.payment_status,
    serviceApprovalStatus: item.service_approval_status,
    contractedServicesPerPeriod: item.contracted_services_per_period,
    completedServicesThisPeriod: item.completed_services_this_period,
    billingNotes: item.billing_notes,
    primaryContactName: item.primary_contact_name,
    contactEmail: item.contact_email,
    contactPhone: item.contact_phone,
    emailNotificationsEnabled: item.email_notifications_enabled,
    smsNotificationsEnabled: item.sms_notifications_enabled,
    quietHoursStart: item.quiet_hours_start,
    quietHoursEnd: item.quiet_hours_end,
    persisted: item.persisted,
  };
}

export async function fetchCustomerAccounts(): Promise<CustomerAccountRecord[]> {
  const items = await request<Parameters<typeof toCustomerAccountRecord>[0][]>('/customer-accounts');
  return items.map(toCustomerAccountRecord);
}

export function toCustomerAccountOnboardingProgress(item: {
  account_id: string;
  customer_details_ready: boolean;
  property_count: number;
  service_ready_property_count: number;
  active_property_count: number;
  properties_needing_attention: Array<{
    property_id: string;
    display_name: string;
    status: CustomerPropertyRecord['status'];
    reasons: CustomerPropertyAttentionReason[];
  }>;
  complete: boolean;
  persisted: boolean;
}): CustomerAccountOnboardingProgress {
  return {
    accountId: item.account_id,
    customerDetailsReady: item.customer_details_ready,
    propertyCount: item.property_count,
    serviceReadyPropertyCount: item.service_ready_property_count,
    activePropertyCount: item.active_property_count,
    propertiesNeedingAttention: item.properties_needing_attention.map((property) => ({
      propertyId: property.property_id,
      displayName: property.display_name,
      status: property.status,
      reasons: property.reasons,
    })),
    complete: item.complete,
    persisted: item.persisted,
  };
}

export async function fetchCustomerAccountOnboardingProgress(
  accountId: string,
): Promise<CustomerAccountOnboardingProgress> {
  const item = await request<Parameters<typeof toCustomerAccountOnboardingProgress>[0]>(
    `${customerAccountPath(accountId)}/onboarding-progress`,
  );
  return toCustomerAccountOnboardingProgress(item);
}

export async function createCustomerAccount(
  input: Omit<CustomerAccountRecord, 'accountId' | 'completedServicesThisPeriod' | 'persisted'>,
): Promise<CustomerAccountRecord> {
  const item = await request<Parameters<typeof toCustomerAccountRecord>[0]>('/customer-accounts', {
    method: 'POST',
    body: JSON.stringify({
      organization_id: input.organizationId,
      customer_name: input.customerName,
      billing_model: input.billingModel,
      payment_status: input.paymentStatus,
      service_approval_status: input.serviceApprovalStatus,
      contracted_services_per_period: input.contractedServicesPerPeriod,
      billing_notes: input.billingNotes || null,
      primary_contact_name: input.primaryContactName || null,
      contact_email: input.contactEmail || null,
      contact_phone: input.contactPhone || null,
      email_notifications_enabled: input.emailNotificationsEnabled,
      sms_notifications_enabled: input.smsNotificationsEnabled,
      quiet_hours_start: input.quietHoursStart || null,
      quiet_hours_end: input.quietHoursEnd || null,
    }),
  });
  return toCustomerAccountRecord(item);
}

export function customerAccountPath(accountId: string): string {
  return `/customer-accounts/${encodeURIComponent(accountId)}`;
}

export async function updateCustomerAccount(
  accountId: string,
  input: Omit<CustomerAccountRecord, 'accountId' | 'organizationId' | 'completedServicesThisPeriod' | 'persisted'>,
): Promise<CustomerAccountRecord> {
  const item = await request<Parameters<typeof toCustomerAccountRecord>[0]>(customerAccountPath(accountId), {
    method: 'PUT',
    body: JSON.stringify({
      customer_name: input.customerName,
      billing_model: input.billingModel,
      payment_status: input.paymentStatus,
      service_approval_status: input.serviceApprovalStatus,
      contracted_services_per_period: input.contractedServicesPerPeriod,
      billing_notes: input.billingNotes || null,
      primary_contact_name: input.primaryContactName || null,
      contact_email: input.contactEmail || null,
      contact_phone: input.contactPhone || null,
      email_notifications_enabled: input.emailNotificationsEnabled,
      sms_notifications_enabled: input.smsNotificationsEnabled,
      quiet_hours_start: input.quietHoursStart || null,
      quiet_hours_end: input.quietHoursEnd || null,
    }),
  });
  return toCustomerAccountRecord(item);
}

export function customerAccountPropertiesPath(accountId: string): string {
  return `/customer-accounts/${encodeURIComponent(accountId)}/properties`;
}

function toCustomerPropertyRecord(item: {
  property_id: string;
  account_id: string;
  organization_id: string;
  display_name: string;
  service_address: string;
  status: CustomerPropertyRecord['status'];
  persisted: boolean;
}): CustomerPropertyRecord {
  return {
    propertyId: item.property_id,
    accountId: item.account_id,
    organizationId: item.organization_id,
    displayName: item.display_name,
    serviceAddress: item.service_address,
    status: item.status,
    persisted: item.persisted,
  };
}

export async function fetchCustomerProperties(accountId: string): Promise<CustomerPropertyRecord[]> {
  const items = await request<Parameters<typeof toCustomerPropertyRecord>[0][]>(
    customerAccountPropertiesPath(accountId),
  );
  return items.map(toCustomerPropertyRecord);
}

export async function createCustomerProperty(
  accountId: string,
  input: Pick<CustomerPropertyRecord, 'organizationId' | 'displayName' | 'serviceAddress'>,
): Promise<CustomerPropertyRecord> {
  const item = await request<Parameters<typeof toCustomerPropertyRecord>[0]>(
    customerAccountPropertiesPath(accountId),
    {
      method: 'POST',
      body: JSON.stringify({
        organization_id: input.organizationId,
        display_name: input.displayName,
        service_address: input.serviceAddress,
      }),
    },
  );
  return toCustomerPropertyRecord(item);
}

export async function updateCustomerPropertyStatus(
  accountId: string,
  propertyId: string,
  status: 'onboarding' | 'active' | 'archived',
): Promise<CustomerPropertyRecord> {
  const item = await request<Parameters<typeof toCustomerPropertyRecord>[0]>(
    `${customerAccountPropertiesPath(accountId)}/${encodeURIComponent(propertyId)}`,
    {
      method: 'PUT',
      body: JSON.stringify({ status }),
    },
  );
  return toCustomerPropertyRecord(item);
}

export async function updateCustomerPropertyIdentity(
  accountId: string,
  propertyId: string,
  input: Pick<CustomerPropertyRecord, 'displayName' | 'serviceAddress'>,
): Promise<CustomerPropertyRecord> {
  const item = await request<Parameters<typeof toCustomerPropertyRecord>[0]>(
    `${customerAccountPropertiesPath(accountId)}/${encodeURIComponent(propertyId)}/identity`,
    {
      method: 'PUT',
      body: JSON.stringify({
        display_name: input.displayName,
        service_address: input.serviceAddress,
      }),
    },
  );
  return toCustomerPropertyRecord(item);
}

export async function fetchCustomerPropertyActivationReadiness(
  accountId: string,
  propertyId: string,
): Promise<CustomerPropertyActivationReadiness> {
  const item = await request<{
    property_id: string;
    profile_ready: boolean;
    crew_ready: boolean;
    ready: boolean;
    persisted: boolean;
  }>(
    `${customerAccountPropertiesPath(accountId)}/${encodeURIComponent(propertyId)}/activation-readiness`,
  );
  return {
    propertyId: item.property_id,
    profileReady: item.profile_ready,
    crewReady: item.crew_ready,
    ready: item.ready,
    persisted: item.persisted,
  };
}

export async function fetchCrews(): Promise<CrewRecord[]> {
  const items = await request<Array<{
    id: string; name: string; organization_id: string; status: CrewRecord['status'];
    daily_stop_capacity: number; lead_membership_id?: string | null; persisted: boolean;
  }>>('/crews');
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    organizationId: item.organization_id,
    status: item.status,
    dailyStopCapacity: item.daily_stop_capacity,
    leadMembershipId: item.lead_membership_id ?? null,
    persisted: item.persisted,
  }));
}

export async function createOrganizationCrew(
  organizationId: string,
  name: string,
): Promise<CrewRecord> {
  const item = await request<{
    id: string; name: string; organization_id: string; status: CrewRecord['status'];
    daily_stop_capacity: number; lead_membership_id?: string | null; persisted: boolean;
  }>(`/organizations/${encodeURIComponent(organizationId)}/crews`, {
    method: 'POST',
    body: JSON.stringify({ name: name.trim() }),
  });
  return {
    id: item.id,
    name: item.name,
    organizationId: item.organization_id,
    status: item.status,
    dailyStopCapacity: item.daily_stop_capacity,
    leadMembershipId: item.lead_membership_id ?? null,
    persisted: item.persisted,
  };
}

export async function fetchOrganizationCrews(organizationId: string): Promise<CrewRecord[]> {
  const items = await request<Array<{
    id: string; name: string; organization_id: string; status: CrewRecord['status'];
    daily_stop_capacity: number; lead_membership_id?: string | null; persisted: boolean;
  }>>(`/organizations/${encodeURIComponent(organizationId)}/crews`);
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    organizationId: item.organization_id,
    status: item.status,
    dailyStopCapacity: item.daily_stop_capacity,
    leadMembershipId: item.lead_membership_id ?? null,
    persisted: item.persisted,
  }));
}

export async function updateOrganizationCrew(
  organizationId: string,
  crewId: string,
  name: string,
  status: CrewRecord['status'],
  dailyStopCapacity: number,
  leadMembershipId: string | null,
): Promise<CrewRecord> {
  const item = await request<{
    id: string; name: string; organization_id: string; status: CrewRecord['status'];
    daily_stop_capacity: number; lead_membership_id?: string | null; persisted: boolean;
  }>(
    `/organizations/${encodeURIComponent(organizationId)}/crews/${encodeURIComponent(crewId)}`,
    {
      method: 'PUT',
      body: JSON.stringify({
        name: name.trim(),
        status,
        daily_stop_capacity: dailyStopCapacity,
        lead_membership_id: leadMembershipId,
      }),
    },
  );
  return {
    id: item.id,
    name: item.name,
    organizationId: item.organization_id,
    status: item.status,
    dailyStopCapacity: item.daily_stop_capacity,
    leadMembershipId: item.lead_membership_id ?? null,
    persisted: item.persisted,
  };
}

function toPropertyPortfolioRecord(item: {
  id: string; account_id: string; organization_id: string; display_name: string;
  portfolio_type: PropertyPortfolioRecord['portfolioType']; property_count: number; persisted: boolean;
}): PropertyPortfolioRecord {
  return {
    id: item.id,
    accountId: item.account_id,
    organizationId: item.organization_id,
    displayName: item.display_name,
    portfolioType: item.portfolio_type,
    propertyCount: item.property_count,
    persisted: item.persisted,
  };
}

export async function fetchPropertyPortfolios(accountId: string): Promise<PropertyPortfolioRecord[]> {
  const items = await request<Parameters<typeof toPropertyPortfolioRecord>[0][]>(
    `/accounts/${encodeURIComponent(accountId)}/property-portfolios`,
  );
  return items.map(toPropertyPortfolioRecord);
}

function toPortfolioPropertyRecord(item: {
  id: string; account_id: string; organization_id: string; display_name: string;
  address: string; last_service_date: string | null; persisted: boolean;
}): PortfolioPropertyRecord {
  return {
    id: item.id,
    accountId: item.account_id,
    organizationId: item.organization_id,
    displayName: item.display_name,
    address: item.address,
    lastServiceDate: item.last_service_date,
    persisted: item.persisted,
  };
}

export function toCustomerPropertyPortfolioRecord(item: {
  account_id: string;
  organization_ids: string[];
  portfolios: Array<Parameters<typeof toPropertyPortfolioRecord>[0] & {
    properties: Parameters<typeof toPortfolioPropertyRecord>[0][];
  }>;
  ungrouped_properties: Parameters<typeof toPortfolioPropertyRecord>[0][];
  persisted: boolean;
}): CustomerPropertyPortfolioRecord {
  return {
    accountId: item.account_id,
    organizationIds: item.organization_ids,
    portfolios: item.portfolios.map((portfolio) => ({
      ...toPropertyPortfolioRecord(portfolio),
      properties: portfolio.properties.map(toPortfolioPropertyRecord),
    })),
    ungroupedProperties: item.ungrouped_properties.map(toPortfolioPropertyRecord),
    persisted: item.persisted,
  };
}

export async function fetchCustomerPropertyPortfolio(
  accountId: string,
): Promise<CustomerPropertyPortfolioRecord> {
  const item = await request<Parameters<typeof toCustomerPropertyPortfolioRecord>[0]>(
    `/accounts/${encodeURIComponent(accountId)}/customer-property-portfolio`,
  );
  return toCustomerPropertyPortfolioRecord(item);
}

export async function createPropertyPortfolio(input: Omit<PropertyPortfolioRecord, 'id' | 'propertyCount' | 'persisted'>): Promise<PropertyPortfolioRecord> {
  const item = await request<Parameters<typeof toPropertyPortfolioRecord>[0]>('/property-portfolios', {
    method: 'POST',
    body: JSON.stringify({
      account_id: input.accountId,
      organization_id: input.organizationId,
      display_name: input.displayName,
      portfolio_type: input.portfolioType,
    }),
  });
  return toPropertyPortfolioRecord(item);
}

export async function addPropertyToPortfolio(
  portfolioId: string,
  propertyId: string,
  organizationId: string,
): Promise<void> {
  await request(`/property-portfolios/${encodeURIComponent(portfolioId)}/properties`, {
    method: 'POST',
    body: JSON.stringify({ property_id: propertyId, organization_id: organizationId }),
  });
}

function toPropertyCrewAssignmentRecord(item: {
  id: string; property_id: string; crew_id: string; organization_id: string;
  active: boolean; assigned_at: string; ended_at: string | null; persisted: boolean;
}): PropertyCrewAssignmentRecord {
  return {
    id: item.id,
    propertyId: item.property_id,
    crewId: item.crew_id,
    organizationId: item.organization_id,
    active: item.active,
    assignedAt: item.assigned_at,
    endedAt: item.ended_at,
    persisted: item.persisted,
  };
}

export async function fetchPropertyCrewAssignments(propertyId: string): Promise<PropertyCrewAssignmentRecord[]> {
  const items = await request<Parameters<typeof toPropertyCrewAssignmentRecord>[0][]>(
    `/properties/${encodeURIComponent(propertyId)}/crew-assignments`,
  );
  return items.map(toPropertyCrewAssignmentRecord);
}

export async function assignPropertyCrew(
  propertyId: string,
  crewId: string,
  organizationId: string,
): Promise<PropertyCrewAssignmentRecord> {
  const item = await request<Parameters<typeof toPropertyCrewAssignmentRecord>[0]>(
    `/properties/${encodeURIComponent(propertyId)}/crew-assignments`,
    {
      method: 'POST',
      body: JSON.stringify({ crew_id: crewId, organization_id: organizationId }),
    },
  );
  return toPropertyCrewAssignmentRecord(item);
}

export function customerPrivacyExportPath(accountId: string): string {
  return `/accounts/${encodeURIComponent(accountId)}/privacy-export`;
}

export function customerPhotoErasurePath(accountId: string): string {
  return `/accounts/${encodeURIComponent(accountId)}/photo-erasure`;
}

export async function fetchCustomerPrivacyExport(accountId: string): Promise<CustomerPrivacyExport> {
  const privacyExport = await request<ApiCustomerPrivacyExport>(customerPrivacyExportPath(accountId));
  return toCustomerPrivacyExport(privacyExport);
}

export async function eraseCustomerPhotoEvidence(
  accountId: string,
  reason: string,
): Promise<CustomerPhotoErasureSummary> {
  const summary = await request<ApiCustomerPhotoErasureSummary>(
    customerPhotoErasurePath(accountId),
    {
      method: 'POST',
      body: JSON.stringify({ reason }),
    },
  );
  return toCustomerPhotoErasureSummary(summary);
}

export async function fetchSharedCompletionReport(shareToken: string): Promise<CompletionReportSnapshot> {
  const response = await fetch(`${API_BASE_URL}/reports/${encodeURIComponent(shareToken)}`);

  if (!response.ok) {
    throw new Error(`Shared completion report request failed with status ${response.status}`);
  }

  const report = await response.json() as ApiCompletionReport;
  return toCompletionReport(report);
}

export async function startCompletionReportReview(reportId: string): Promise<CompletionReportAction> {
  const action = await request<ApiCompletionReportAction>(`/completion-reports/${reportId}/review`, {
    method: 'POST',
  });
  return toCompletionReportAction(action);
}

export async function requestCompletionReportChanges(
  reportId: string,
  reason: string,
): Promise<CompletionReportAction> {
  const action = await request<ApiCompletionReportAction>(`/completion-reports/${reportId}/request-changes`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
  return toCompletionReportAction(action);
}

export async function resubmitCompletionReport(reportId: string): Promise<CompletionReportAction> {
  const action = await request<ApiCompletionReportAction>(`/completion-reports/${reportId}/resubmit`, {
    method: 'POST',
  });
  return toCompletionReportAction(action);
}

export async function deliverCompletionReport(reportId: string): Promise<CompletionReportAction> {
  const action = await request<ApiCompletionReportAction>(`/completion-reports/${reportId}/deliver`, {
    method: 'POST',
  });
  return toCompletionReportAction(action);
}

export async function queueCompletionReportDeliveryNotification(
  reportId: string,
  channel: 'email' | 'sms',
  recipient: string,
): Promise<CompletionReportDeliveryNotification> {
  const notification = await request<ApiCompletionReportDeliveryNotification>(
    `/completion-reports/${reportId}/delivery-notifications`,
    {
      method: 'POST',
      body: JSON.stringify({ channel, recipient }),
    },
  );
  return toCompletionReportDeliveryNotification(notification);
}

export async function startJob(jobId: string): Promise<void> {
  await request(`/jobs/${jobId}/start`, { method: 'POST' });
}

export async function completeJob(jobId: string): Promise<void> {
  await request(`/jobs/${jobId}/complete`, { method: 'POST' });
}

export async function createPhotoUploadTicket(
  jobId: string,
  file: File,
  photoType: 'before' | 'after' | 'issue' | 'extra',
): Promise<PhotoUploadTicket> {
  const ticket = await request<{
    status: string;
    job_id: string;
    photo_id: string;
    photo_type?: 'before' | 'after' | 'issue' | 'extra';
    file_name?: string;
    content_type?: string;
    upload_mode: string;
    upload_url: string;
    object_key: string;
    thumbnail_upload_url?: string | null;
    thumbnail_object_key?: string | null;
    thumbnail_content_type?: string | null;
    thumbnail_max_dimension_px?: number | null;
  }>(`/jobs/${jobId}/photos/presign`, {
    method: 'POST',
    body: JSON.stringify({
      file_name: file.name,
      content_type: file.type || 'application/octet-stream',
      photo_type: photoType,
    }),
  });

  return {
    status: ticket.status,
    jobId: ticket.job_id,
    photoId: ticket.photo_id,
    photoType: ticket.photo_type ?? photoType,
    fileName: ticket.file_name ?? file.name,
    contentType: ticket.content_type ?? (file.type || 'application/octet-stream'),
    uploadMode: ticket.upload_mode,
    uploadUrl: ticket.upload_url,
    objectKey: ticket.object_key,
    thumbnailUploadUrl: ticket.thumbnail_upload_url ?? undefined,
    thumbnailObjectKey: ticket.thumbnail_object_key ?? undefined,
    thumbnailContentType: ticket.thumbnail_content_type ?? undefined,
    thumbnailMaxDimensionPx: ticket.thumbnail_max_dimension_px ?? undefined,
  };
}

export async function uploadPhotoToTicket(ticket: PhotoUploadTicket, file: File): Promise<void> {
  if (ticket.uploadMode === 'local-placeholder') {
    return;
  }

  await putFileToUrl(ticket.uploadUrl, file, file.type || ticket.contentType);

  if (ticket.thumbnailUploadUrl) {
    const thumbnailContentType = ticket.thumbnailContentType ?? 'image/jpeg';
    const thumbnail = await createPhotoThumbnail(
      file,
      ticket.thumbnailMaxDimensionPx ?? 640,
      thumbnailContentType,
    );
    await putFileToUrl(ticket.thumbnailUploadUrl, thumbnail, thumbnailContentType);
  }
}

async function putFileToUrl(url: string, body: Blob, contentType: string): Promise<void> {
  const response = await fetch(url, {
    method: 'PUT',
    body,
    headers: {
      'content-type': contentType,
    },
  });

  if (!response.ok) {
    throw new Error(`Photo upload failed with status ${response.status}`);
  }
}

async function createPhotoThumbnail(
  file: File,
  maxSize: number,
  contentType: string,
): Promise<Blob> {
  const imageUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(imageUrl);
    const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not prepare thumbnail canvas');
    }

    context.drawImage(image, 0, 0, width, height);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Could not create thumbnail image'));
        }
      }, contentType, 0.78);
    });
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not load selected photo'));
    image.src = src;
  });
}

export async function fetchJobPhotoEvidence(jobId: string): Promise<PhotoUploadTicket[]> {
  const photos = await request<ApiPhotoEvidence[]>(`/jobs/${jobId}/photos`);

  return photos.map(toPhotoEvidence);
}

export interface CompletePhotoUploadMetadata {
  fileSizeBytes?: number;
  imageWidthPx?: number;
  imageHeightPx?: number;
}

export async function completePhotoUpload(
  jobId: string,
  photoId: string,
  metadata: CompletePhotoUploadMetadata = {},
): Promise<void> {
  await request(`/jobs/${jobId}/photos/complete`, {
    method: 'POST',
    body: JSON.stringify({
      photo_id: photoId,
      file_size_bytes: metadata.fileSizeBytes,
      image_width_px: metadata.imageWidthPx,
      image_height_px: metadata.imageHeightPx,
    }),
  });
}

export async function readPhotoUploadMetadata(file: File): Promise<CompletePhotoUploadMetadata> {
  const metadata: CompletePhotoUploadMetadata = {
    fileSizeBytes: file.size,
  };

  if (!file.type.startsWith('image/')) {
    return metadata;
  }

  try {
    const imageUrl = URL.createObjectURL(file);
    try {
      const image = await loadImage(imageUrl);
      metadata.imageWidthPx = image.naturalWidth;
      metadata.imageHeightPx = image.naturalHeight;
    } finally {
      URL.revokeObjectURL(imageUrl);
    }
  } catch {
    return metadata;
  }

  return metadata;
}
