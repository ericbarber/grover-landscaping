import { describe, expect, it } from 'vitest';
import {
  normalizeAssignDayPlanStopRequest,
  normalizeDayPlanId,
  normalizeDayPlanStopId,
  normalizeDayPlanStopIds,
  validateAssignDayPlanStopRequest,
  validateDayPlanId,
  validateDayPlanStopId,
  validateDayPlanStopIds,
} from './dayPlansClient';

describe('day plan client route edit identifiers', () => {
  it('normalizes day plan IDs before editing route stops', () => {
    expect(normalizeDayPlanId(' day_plan_2026_06_16_crew_1001 ')).toBe(
      'day_plan_2026_06_16_crew_1001',
    );
  });

  it('rejects blank day plan IDs before editing route stops', () => {
    expect(() => validateDayPlanId('   ')).toThrow(
      'dayPlanId is required before editing day plan stops',
    );
  });
});

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

describe('day plan client stop removal requests', () => {
  it('normalizes stop IDs before removing a stop', () => {
    expect(normalizeDayPlanStopId(' stop_1001 ')).toBe('stop_1001');
  });

  it('rejects blank stop IDs before removing a stop', () => {
    expect(() => validateDayPlanStopId('   ')).toThrow(
      'stopId is required before removing a day plan stop',
    );
  });
});

describe('day plan client stop reorder requests', () => {
  it('normalizes stop IDs before reordering', () => {
    expect(normalizeDayPlanStopIds([' stop_1002 ', 'stop_1001 '])).toEqual([
      'stop_1002',
      'stop_1001',
    ]);
  });

  it('rejects empty reorder requests', () => {
    expect(() => validateDayPlanStopIds([])).toThrow(
      'At least one stop ID is required before reordering a day plan',
    );
  });

  it('rejects blank stop IDs before reordering', () => {
    expect(() => validateDayPlanStopIds(['stop_1001', '   '])).toThrow(
      'Stop IDs cannot be blank before reordering a day plan',
    );
  });

  it('rejects duplicate stop IDs before reordering', () => {
    expect(() => validateDayPlanStopIds(['stop_1001', 'stop_1001'])).toThrow(
      'Stop IDs must be unique before reordering a day plan',
    );
  });
});
