export type YardCareJobStatus = 'scheduled' | 'in_progress' | 'completed';

export interface YardCareJob {
  id: string;
  customerName: string;
  propertyAddress: string;
  scheduledDate: string;
  status: YardCareJobStatus;
  beforePhotos: number;
  afterPhotos: number;
  checklistItems: number;
  completedChecklistItems: number;
}

export const seedJobs: YardCareJob[] = [
  {
    id: 'job_1001',
    customerName: 'Sample Customer',
    propertyAddress: '123 Oak Street',
    scheduledDate: '2026-06-15',
    status: 'scheduled',
    beforePhotos: 0,
    afterPhotos: 0,
    checklistItems: 4,
    completedChecklistItems: 0,
  },
  {
    id: 'job_1002',
    customerName: 'Demo Property Owner',
    propertyAddress: '456 Maple Avenue',
    scheduledDate: '2026-06-15',
    status: 'in_progress',
    beforePhotos: 3,
    afterPhotos: 1,
    checklistItems: 4,
    completedChecklistItems: 2,
  },
];

export function getCompletionProgress(job: YardCareJob): number {
  if (job.checklistItems === 0) {
    return 0;
  }

  return Math.round((job.completedChecklistItems / job.checklistItems) * 100);
}
