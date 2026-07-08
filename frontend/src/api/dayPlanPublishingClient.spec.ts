import { describe, expect, it } from 'vitest';
import type { DayPlanMutationResponse } from './dayPlansClient';
import {
  assertPublishedDayPlan,
  normalizePublishDayPlanId,
  validatePublishDayPlanId,
} from './dayPlanPublishingClient';

const publishedPersistedDayPlan: DayPlanMutationResponse = {
  id: 'day_plan_2026_06_16_crew_1001',
  crewId: 'crew_1001',
  serviceDate: '2026-06-16',
  status: 'published',
  routeStatus: 'manual',
  persisted: true,
};

describe('day plan publishing client', () => {
  it('normalizes day plan IDs before publishing', () => {
    expect(normalizePublishDayPlanId(' day_plan_2026_06_16_crew_1001 ')).toBe(
      'day_plan_2026_06_16_crew_1001',
    );
  });

  it('rejects blank day plan IDs before publishing', () => {
    expect(() => validatePublishDayPlanId('   ')).toThrow(
      'dayPlanId is required before publishing a day plan',
    );
  });

  it('accepts persisted published day plan responses', () => {
    expect(assertPublishedDayPlan(publishedPersistedDayPlan)).toBe(publishedPersistedDayPlan);
  });

  it('rejects local publish fallback responses', () => {
    expect(() =>
      assertPublishedDayPlan({
        ...publishedPersistedDayPlan,
        persisted: false,
      }),
    ).toThrow('Publish day plan request did not return a persisted published route');
  });

  it('rejects non-published day plan responses', () => {
    expect(() =>
      assertPublishedDayPlan({
        ...publishedPersistedDayPlan,
        status: 'draft',
      }),
    ).toThrow('Publish day plan request did not return a persisted published route');
  });
});
