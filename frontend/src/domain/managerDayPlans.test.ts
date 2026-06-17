import { describe, expect, it } from 'vitest';
import {
  defaultManagerServiceDate,
  draftDayPlanId,
  draftPlanPersistenceLabel,
  localDraftDayPlanResponse,
  localPublishedDayPlanResponse,
} from './managerDayPlans';

describe('manager day plan helpers', () => {
  it('formats the default manager service date for date inputs', () => {
    expect(defaultManagerServiceDate(new Date(2026, 0, 9))).toBe('2026-01-09');
  });

  it('creates stable draft day plan IDs', () => {
    expect(draftDayPlanId('crew_1001', '2026-06-16')).toBe('day_plan_2026_06_16_crew_1001');
  });

  it('creates local draft day plan responses', () => {
    expect(localDraftDayPlanResponse('crew_1001', '2026-06-16')).toEqual({
      id: 'day_plan_2026_06_16_crew_1001',
      crewId: 'crew_1001',
      serviceDate: '2026-06-16',
      status: 'draft',
      routeStatus: 'manual',
      persisted: false,
    });
  });

  it('creates local published day plan responses from draft plans', () => {
    const draftPlan = localDraftDayPlanResponse('crew_1001', '2026-06-16');

    expect(localPublishedDayPlanResponse(draftPlan)).toEqual({
      ...draftPlan,
      status: 'published',
      persisted: false,
    });
  });

  it('labels persisted and local draft plans', () => {
    expect(draftPlanPersistenceLabel(true)).toBe('Saved to backend');
    expect(draftPlanPersistenceLabel(false)).toBe('Saved locally until the backend create endpoint is available');
  });
});
