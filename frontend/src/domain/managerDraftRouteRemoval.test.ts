import { describe, expect, it } from 'vitest';
import type { DayPlanStop } from './dayPlans';
import { draftStopsRemoverForSelectedJob, removeJobIdFromDraftStops, renumberDraftStops } from './managerJobAssignment';

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
  {
    id: 'stop_1002',
    jobId: 'job_1002',
    customerName: 'Second Customer',
    propertyAddress: '456 Maple Avenue',
    stopOrder: 2,
    jobStatus: 'scheduled',
    stopStatus: 'pending',
    estimatedDriveMinutes: 8,
    estimatedServiceMinutes: 35,
  },
  {
    id: 'stop_1003',
    jobId: 'job_1003',
    customerName: 'Third Customer',
    propertyAddress: '789 Pine Road',
    stopOrder: 3,
    jobStatus: 'scheduled',
    stopStatus: 'pending',
    estimatedDriveMinutes: 10,
    estimatedServiceMinutes: 40,
  },
];

describe('draft route removal helpers', () => {
  it('renumbers draft stops from one', () => {
    expect(renumberDraftStops([draftStops[2], draftStops[0]]).map((stop) => stop.stopOrder)).toEqual([1, 2]);
  });

  it('removes selected jobs and renumbers remaining stops', () => {
    expect(removeJobIdFromDraftStops(draftStops, 'job_1002').map((stop) => [stop.jobId, stop.stopOrder])).toEqual([
      ['job_1001', 1],
      ['job_1003', 2],
    ]);
  });

  it('preserves draft stops when the selected job is not assigned', () => {
    expect(removeJobIdFromDraftStops(draftStops, 'job_missing')).toEqual(draftStops);
  });

  it('returns a state updater that removes a selected job', () => {
    const removeSelectedJob = draftStopsRemoverForSelectedJob('job_1001');

    expect(removeSelectedJob(draftStops).map((stop) => stop.jobId)).toEqual(['job_1002', 'job_1003']);
  });
});
