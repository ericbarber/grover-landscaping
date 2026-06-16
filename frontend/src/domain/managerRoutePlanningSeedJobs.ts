import { seedJobs, type YardCareJob } from './jobs';

export const managerRoutePlanningExtraSeedJob: YardCareJob = {
  id: 'job_1003',
  customerName: 'Route Planning Demo Customer',
  propertyAddress: '789 Pine Road',
  scheduledDate: '2026-06-15',
  status: 'scheduled',
  beforePhotos: 0,
  afterPhotos: 0,
  checklistItems: 4,
  completedChecklistItems: 0,
};

export function getManagerRoutePlanningSeedJobs(jobs: YardCareJob[] = seedJobs): YardCareJob[] {
  if (jobs.some((job) => job.id === managerRoutePlanningExtraSeedJob.id)) {
    return jobs;
  }

  return [...jobs, managerRoutePlanningExtraSeedJob];
}
