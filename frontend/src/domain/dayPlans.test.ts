import { describe, expect, it } from 'vitest';
import {
  classifyRouteDate,
  emptyCrewDayPlan,
  getTotalEstimatedMinutes,
  seedDayPlan,
} from './dayPlans';

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

  it.each([
    ['2026-09-04', 'past', 'Past route', false],
    ['2026-09-05', 'today', 'Today’s route', true],
    ['2026-09-06', 'upcoming', 'Upcoming route', false],
  ] as const)('classifies %s as a %s service day', (serviceDate, kind, label, mutable) => {
    expect(classifyRouteDate(serviceDate, new Date(2026, 8, 5, 23, 30))).toMatchObject({
      kind,
      label,
      mutable,
    });
  });

  it('formats a complete human-readable service date without a UTC day shift', () => {
    expect(classifyRouteDate('2026-09-05', new Date(2026, 8, 5, 0, 5)).dateLabel)
      .toBe('Saturday, September 5, 2026');
  });

  it.each(['2026-02-30', '09/05/2026', ''])('fails closed for invalid service date %j', (serviceDate) => {
    expect(classifyRouteDate(serviceDate, new Date(2026, 8, 5))).toEqual({
      kind: 'unknown',
      label: 'Route date unavailable',
      dateLabel: 'Service date unavailable',
      mutable: false,
    });
  });
});
