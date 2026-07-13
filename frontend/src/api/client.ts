import type {
  BillingModel,
  CustomerAccountSummary,
  PaymentStatus,
  ServiceApprovalStatus,
} from '../domain/accounts';
import type { YardCareJob } from '../domain/jobs';
import { API_BASE_URL, toBrowserUrl } from './baseUrl';
import { authenticatedFetch } from './authenticatedFetch';

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
    throw new Error(`API request failed with status ${response.status}`);
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
