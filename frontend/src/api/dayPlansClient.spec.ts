import { describe, expect, it } from 'vitest';
import {
  normalizeAssignDayPlanStopRequest,
  validateAssignDayPlanStopRequest,
} from './dayPlansClient';

describe('day plan client stop assignment requests', () => {
  it('normalizes job IDs while preserving workload estimates', () => {
    expect(
      normalizeAssignDayPlanStopRequest({
        jobId: ' job_1001 ',
        estimatedDriveMinutes: 12,
        estimatedServiceMinutes: 45,
      }),
    ).toEqual({
      jobId: 'job_1001',
      estimatedDriveMinutes: 12,
      estimatedServiceMinutes: 45,
    });
  });

  it('rejects blank job IDs before assigning a stop', () => {
    expect(() => validateAssignDayPlanStopRequest({ jobId: '   ' })).toThrow(
      'jobId is required before assigning a day plan stop',
    );
  });
});
