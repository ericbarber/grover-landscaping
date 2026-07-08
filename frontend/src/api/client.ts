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
}

export type CompletionReportStatus =
  | 'draft'
  | 'submitted'
  | 'in_review'
  | 'changes_requested'
  | 'delivered';

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
}

export interface ApiCompletionReportAction {
  report_id: string;
  job_id: string;
  report_status: CompletionReportStatus;
  persisted: boolean;
  share_url: string | null;
}

export interface CompletionReportAction {
  reportId: string;
  jobId: string;
  reportStatus: CompletionReportStatus;
  persisted: boolean;
  shareUrl: string | null;
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
  };
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
