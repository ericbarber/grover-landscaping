import { describe, expect, it } from 'vitest';
import {
  defaultManagerServiceDate,
  draftDayPlanId,
  draftPlanPersistenceDetail,
  draftPlanPersistenceLabel,
  localDraftDayPlanResponse,
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

  it('labels persisted and local draft plans', () => {
    expect(draftPlanPersistenceLabel(true)).toBe('Saved to backend');
    expect(draftPlanPersistenceLabel(false)).toBe('Local planning only');
  });

  it('explains whether draft route changes can be published', () => {
    expect(draftPlanPersistenceDetail(true)).toBe(
      'Route changes can sync to the backend and be published when ready.',
    );
    expect(draftPlanPersistenceDetail(false)).toBe(
      'Backend draft was not created, so this route cannot be published to crews until draft creation succeeds.',
    );
  });
});
