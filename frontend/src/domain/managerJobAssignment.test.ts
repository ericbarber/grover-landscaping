import { describe, expect, it } from 'vitest';
import type { DayPlanStop } from './dayPlans';
import {
  appendJobIdToDraftStops,
  appendJobToDraftStops,
  getAssignableJobCount,
  getAssignableJobs,
  getAssignedJobIds,
  getDraftRouteEstimatedMinutes,
  getDraftRouteStopCount,
  localDraftStopFromJob,
  localDraftStopId,
} from './managerJobAssignment';
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

const assignedStops: Pick<DayPlanStop, 'jobId'>[] = [{ jobId: 'job_1001' }];

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

describe('manager job assignment helpers', () => {
  it('extracts assigned job ids from day plan stops', () => {
    expect(getAssignedJobIds(assignedStops)).toEqual(['job_1001']);
  });

  it('returns only scheduled jobs that are not already assigned to the day plan', () => {
    expect(getAssignableJobs(jobs, assignedStops).map((job) => job.id)).toEqual(['job_1003']);
  });

  it('counts assignable jobs', () => {
    expect(getAssignableJobCount(jobs, assignedStops)).toBe(1);
  });

  it('creates stable local draft stop IDs', () => {
    expect(localDraftStopId('job_1003')).toBe('local_stop_job_1003');
  });

  it('creates local draft stops from scheduled jobs', () => {
    expect(localDraftStopFromJob(jobs[2], 2)).toEqual({
      id: 'local_stop_job_1003',
      jobId: 'job_1003',
      customerName: 'Open Scheduled Job',
      propertyAddress: '789 Pine Road',
      stopOrder: 2,
      jobStatus: 'scheduled',
      stopStatus: 'pending',
      estimatedDriveMinutes: 0,
      estimatedServiceMinutes: 0,
    });
  });

  it('appends unassigned jobs as the next local draft stop', () => {
    expect(appendJobToDraftStops(draftStops, jobs[2]).map((stop) => stop.id)).toEqual([
      'stop_1001',
      'local_stop_job_1003',
    ]);
  });

  it('appends jobs by selected job id', () => {
    expect(appendJobIdToDraftStops(draftStops, jobs, 'job_1003').map((stop) => stop.id)).toEqual([
      'stop_1001',
      'local_stop_job_1003',
    ]);
  });

  it('preserves draft stops when the selected job id is unknown', () => {
    expect(appendJobIdToDraftStops(draftStops, jobs, 'job_missing')).toEqual(draftStops);
  });

  it('does not append duplicate jobs', () => {
    expect(appendJobToDraftStops(draftStops, jobs[0])).toEqual(draftStops);
  });

  it('summarizes draft route stop count', () => {
    expect(getDraftRouteStopCount(draftStops)).toBe(1);
  });

  it('summarizes draft route estimated minutes', () => {
    expect(getDraftRouteEstimatedMinutes(draftStops)).toBe(57);
  });
});
