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
  thumbnailUrl?: string;
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
  };
}

export async function uploadPhotoToTicket(ticket: PhotoUploadTicket, file: File): Promise<void> {
  if (ticket.uploadMode === 'local-placeholder') {
    return;
  }

  await putFileToUrl(ticket.uploadUrl, file, file.type || ticket.contentType);

  if (ticket.thumbnailUploadUrl) {
    const thumbnail = await createPhotoThumbnail(file);
    await putFileToUrl(ticket.thumbnailUploadUrl, thumbnail, 'image/jpeg');
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

async function createPhotoThumbnail(file: File): Promise<Blob> {
  const imageUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(imageUrl);
    const maxSize = 640;
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
      }, 'image/jpeg', 0.78);
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

export async function completePhotoUpload(jobId: string, photoId: string): Promise<void> {
  await request(`/jobs/${jobId}/photos/complete`, {
    method: 'POST',
    body: JSON.stringify({ photo_id: photoId }),
  });
}
