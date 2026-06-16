import { describe, expect, it } from 'vitest';
import type { DayPlanStop } from './dayPlans';
import { getAssignableJobCount, getAssignableJobs, getAssignedJobIds } from './managerJobAssignment';
import type { YardCareJob } from './jobs';

const jobs: YardCareJob[] = [
  {
    id: 'job_1001',
    customerName: 'Sample Customer',
    propertyAddress: '123 Oak Street',
    scheduledDate: '2026-06-16',
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
    scheduledDate: '2026-06-16',
    status: 'in_progress',
    beforePhotos: 1,
    afterPhotos: 0,
    checklistItems: 4,
    completedChecklistItems: 1,
  },
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

const stops: Pick<DayPlanStop, 'jobId'>[] = [{ jobId: 'job_1001' }];

describe('manager job assignment helpers', () => {
  it('extracts assigned job ids from day plan stops', () => {
    expect(getAssignedJobIds(stops)).toEqual(['job_1001']);
  });

  it('returns only scheduled jobs that are not already assigned to the day plan', () => {
    expect(getAssignableJobs(jobs, stops).map((job) => job.id)).toEqual(['job_1003']);
  });

  it('counts assignable jobs', () => {
    expect(getAssignableJobCount(jobs, stops)).toBe(1);
  });
});
