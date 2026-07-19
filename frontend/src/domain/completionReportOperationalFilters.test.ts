import { describe, expect, it } from 'vitest';
import type { CompletionReportSnapshot } from '../api/client';
import { matchesCompletionReportOperationalFilters } from './completionReportOperationalFilters';

const report = {
  reportStatus: 'submitted',
  readyForCustomer: false,
  persisted: true,
  readinessBlockers: ['route_stop'],
  routeStop: { crewId: 'crew_1001' },
  job: {
    organizationId: 'org_1001',
    customerName: 'Desert View HOA',
    propertyAddress: '400 West Palm Avenue',
    scheduledDate: '2026-07-19',
  },
} as CompletionReportSnapshot;

describe('completion report operational filters', () => {
  it('matches organization, crew, customer, property, and inclusive dates', () => {
    expect(matchesCompletionReportOperationalFilters(report, {
      organizationId: 'org_1001',
      crewId: 'crew_1001',
      customer: 'desert view',
      property: 'palm',
      scheduledFrom: '2026-07-19',
      scheduledTo: '2026-07-19',
    })).toBe(true);
  });

  it('rejects reports outside any selected operational boundary', () => {
    expect(matchesCompletionReportOperationalFilters(report, { crewId: 'crew_2002' })).toBe(false);
    expect(matchesCompletionReportOperationalFilters(report, { customer: 'commercial' })).toBe(false);
    expect(matchesCompletionReportOperationalFilters(report, { scheduledFrom: '2026-07-20' })).toBe(false);
  });

  it('matches persisted lifecycle, readiness, and blocker filters', () => {
    expect(matchesCompletionReportOperationalFilters(report, {
      status: 'submitted',
      readiness: 'blocked',
      readinessBlocker: 'route_stop',
    })).toBe(true);
    expect(matchesCompletionReportOperationalFilters(report, { status: 'delivered' })).toBe(false);
    expect(matchesCompletionReportOperationalFilters(report, { readiness: 'ready' })).toBe(false);
    expect(matchesCompletionReportOperationalFilters(report, { readinessBlocker: 'add_ons' })).toBe(false);
  });
});
