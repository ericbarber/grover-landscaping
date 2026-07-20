import { describe, expect, it } from 'vitest';
import { emptyCrewDayPlan, getTotalEstimatedMinutes, seedDayPlan } from './dayPlans';

describe('day plan domain helpers', () => {
  it('totals drive and service minutes for all stops', () => {
    expect(getTotalEstimatedMinutes(seedDayPlan)).toBe(125);
  });

  it('keeps the seeded route ordered by stop number', () => {
    expect(seedDayPlan.stops.map((stop) => stop.stopOrder)).toEqual([1, 2]);
  });

  it('builds an honest empty state without seeded stops', () => {
    expect(emptyCrewDayPlan('crew_new')).toMatchObject({
      crewId: 'crew_new',
      organizationId: '',
      stops: [],
    });
  });
});
