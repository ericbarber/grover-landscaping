import { describe, expect, it } from 'vitest';
import type { DayPlanStop } from './dayPlans';
import { draftStopsMoveDownForSelectedJob, draftStopsMoveUpForSelectedJob } from './managerJobAssignment';

const stops: DayPlanStop[] = [
  {
    id: 'stop_1001',
    jobId: 'job_1001',
    customerName: 'First Customer',
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
];

describe('draft route move updater helpers', () => {
  it('returns a state updater that moves a selected job up', () => {
    const moveSelectedJobUp = draftStopsMoveUpForSelectedJob('job_1002');

    expect(moveSelectedJobUp(stops).map((stop) => [stop.jobId, stop.stopOrder])).toEqual([
      ['job_1002', 1],
      ['job_1001', 2],
    ]);
  });

  it('returns a state updater that moves a selected job down', () => {
    const moveSelectedJobDown = draftStopsMoveDownForSelectedJob('job_1001');

    expect(moveSelectedJobDown(stops).map((stop) => [stop.jobId, stop.stopOrder])).toEqual([
      ['job_1002', 1],
      ['job_1001', 2],
    ]);
  });
});
