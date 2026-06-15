import { describe, expect, it } from 'vitest';
import { draftDayPlanId, localDraftDayPlanResponse } from './managerDayPlans';

describe('manager day plan helpers', () => {
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
});
