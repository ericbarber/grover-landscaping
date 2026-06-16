import { describe, expect, it } from 'vitest';
import type { DayPlanStop } from './dayPlans';
import type { YardCareJob } from './jobs';
import { nextDraftStopsForSelectedJob } from './managerJobAssignment';

const draftStops: DayPlanStop[] = [
  {
    id: 'stop_1001',
    jobId: 'job_1001',
    customerName: 'Sample Customer',
    propertyAddress: '123 Oak Street',
    stopOrder: 1,
    jobStatus: 'scheduled',
    stopStatus: 'pending',
    estimatedDriveMinutes: 12,
    estimatedServiceMinutes: 45,
  },
];

const jobs: YardCareJob[] = [
  {
    id: 'job_1003',
    customerName: 'Open Scheduled Job',
    propertyAddress: '789 Pine Road',
    scheduledDate: '2026-06-16',
    status: 'scheduled',
    beforePhotos: 0,
    afterPhotos: 0,
    checklistItems: 4,
    completedChecklistItems: 0,
  },
];

describe('draft route state helper', () => {
  it('returns next draft stops for a selected job id', () => {
    expect(nextDraftStopsForSelectedJob(draftStops, jobs, 'job_1003').map((stop) => stop.id)).toEqual([
      'stop_1001',
      'local_stop_job_1003',
    ]);
  });

  it('preserves stops for missing selected job ids', () => {
    expect(nextDraftStopsForSelectedJob(draftStops, jobs, 'job_missing')).toEqual(draftStops);
  });
});
