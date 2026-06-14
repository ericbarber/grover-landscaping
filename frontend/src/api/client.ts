import type { YardCareJob } from '../domain/jobs';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

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

interface ApiJobDetail extends ApiJobSummary {
  checklist: ChecklistItem[];
}

export interface JobDetail extends YardCareJob {
  checklist: ChecklistItem[];
}

export interface PhotoUploadTicket {
  status: string;
  jobId: string;
  photoId: string;
  uploadMode: string;
  uploadUrl: string;
  objectKey: string;
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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
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

export async function fetchJobDetail(jobId: string): Promise<JobDetail> {
  const job = await request<ApiJobDetail>(`/jobs/${jobId}`);
  return toJobDetail(job);
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
    uploadMode: ticket.upload_mode,
    uploadUrl: ticket.upload_url,
    objectKey: ticket.object_key,
  };
}

export async function completePhotoUpload(jobId: string, photoId: string): Promise<void> {
  await request(`/jobs/${jobId}/photos/complete`, {
    method: 'POST',
    body: JSON.stringify({ photo_id: photoId }),
  });
}
