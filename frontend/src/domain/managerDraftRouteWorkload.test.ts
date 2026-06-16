import { describe, expect, it } from 'vitest';
import type { DayPlanStop } from './dayPlans';
import {
  getDraftRouteDriveMinutes,
  getDraftRouteServiceMinutes,
  getManagerDraftRouteWorkload,
} from './managerDraftRouteWorkload';

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

describe('manager draft route workload helper', () => {
  it('sums drive minutes independently', () => {
    expect(getDraftRouteDriveMinutes(stops)).toBe(20);
  });

  it('sums service minutes independently', () => {
    expect(getDraftRouteServiceMinutes(stops)).toBe(80);
  });

  it('summarizes total workload minutes', () => {
    expect(getManagerDraftRouteWorkload(stops)).toEqual({
      driveMinutes: 20,
      serviceMinutes: 80,
      totalMinutes: 100,
    });
  });
});
