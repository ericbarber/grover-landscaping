import { describe, expect, it } from 'vitest';
import type { DayPlanStop } from './dayPlans';
import { moveDraftStopDown, moveDraftStopUp } from './managerJobAssignment';

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

describe('draft route ordering helpers', () => {
  it('moves a draft stop up and renumbers stops', () => {
    expect(moveDraftStopUp(stops, 'job_1002').map((stop) => [stop.jobId, stop.stopOrder])).toEqual([
      ['job_1002', 1],
      ['job_1001', 2],
      ['job_1003', 3],
    ]);
  });

  it('moves a draft stop down and renumbers stops', () => {
    expect(moveDraftStopDown(stops, 'job_1002').map((stop) => [stop.jobId, stop.stopOrder])).toEqual([
      ['job_1001', 1],
      ['job_1003', 2],
      ['job_1002', 3],
    ]);
  });

  it('preserves stops when moving beyond route bounds', () => {
    expect(moveDraftStopUp(stops, 'job_1001')).toEqual(stops);
    expect(moveDraftStopDown(stops, 'job_1003')).toEqual(stops);
  });

  it('preserves stops when the selected job is not assigned', () => {
    expect(moveDraftStopUp(stops, 'job_missing')).toEqual(stops);
  });
});
