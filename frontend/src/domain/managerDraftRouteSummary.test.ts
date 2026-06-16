import { describe, expect, it } from 'vitest';
import type { DayPlanStop } from './dayPlans';
import type { YardCareJob } from './jobs';
import { getManagerDraftRouteSummary } from './managerDraftRouteSummary';

const jobs: YardCareJob[] = [
  {
    id: 'job_1001',
    customerName: 'Assigned Customer',
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
    customerName: 'Assignable Customer',
    propertyAddress: '456 Maple Avenue',
    scheduledDate: '2026-06-16',
    status: 'scheduled',
    beforePhotos: 0,
    afterPhotos: 0,
    checklistItems: 4,
    completedChecklistItems: 0,
  },
];

const stops: DayPlanStop[] = [
  {
    id: 'stop_1001',
    jobId: 'job_1001',
    customerName: 'Assigned Customer',
    propertyAddress: '123 Oak Street',
    stopOrder: 1,
    jobStatus: 'scheduled',
    stopStatus: 'pending',
    estimatedDriveMinutes: 12,
    estimatedServiceMinutes: 45,
  },
];

describe('manager draft route summary helper', () => {
  it('summarizes populated draft routes', () => {
    expect(getManagerDraftRouteSummary(jobs, stops)).toEqual({
      stopCount: 1,
      estimatedMinutes: 57,
      assignableJobCount: 1,
      hasStops: true,
      hasAssignableJobs: true,
    });
  });

  it('summarizes empty draft routes', () => {
    expect(getManagerDraftRouteSummary(jobs, [])).toEqual({
      stopCount: 0,
      estimatedMinutes: 0,
      assignableJobCount: 2,
      hasStops: false,
      hasAssignableJobs: true,
    });
  });
});
