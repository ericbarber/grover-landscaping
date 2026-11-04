import { describe, expect, it } from 'vitest';
import {
  fieldRouteOverviewReducer,
  initialFieldRouteOverview,
  resolveFieldRouteOverview,
} from './useFieldRouteOverview';

describe('field route overview coordination', () => {
  it('stores an exact route summary for authorized consumers', () => {
    const overview = {
      source: 'api' as const,
      serviceDate: '2026-10-20',
      totalStops: 8,
      completedStops: 3,
    };

    expect(fieldRouteOverviewReducer({
      contextKey: 'crew-lead:user-1',
      overview: initialFieldRouteOverview,
    }, {
      type: 'updated',
      contextKey: 'crew-lead:user-1',
      overview,
    })).toEqual({
      contextKey: 'crew-lead:user-1',
      overview,
    });
  });

  it('resets route context before another identity or persona can consume it', () => {
    const current = {
      source: 'local' as const,
      serviceDate: '2026-10-20',
      totalStops: 4,
      completedStops: 2,
    };

    expect(fieldRouteOverviewReducer({
      contextKey: 'crew-lead:user-1',
      overview: current,
    }, {
      type: 'reset',
      contextKey: 'crew-member:user-2',
    })).toEqual({
      contextKey: 'crew-member:user-2',
      overview: initialFieldRouteOverview,
    });
  });

  it('fails closed synchronously while a changed scope is being reconciled', () => {
    const priorOverview = {
      source: 'api' as const,
      serviceDate: '2026-10-20',
      totalStops: 6,
      completedStops: 1,
    };

    expect(resolveFieldRouteOverview({
      contextKey: 'crew-lead:user-1',
      overview: priorOverview,
    }, 'crew-member:user-2')).toBe(initialFieldRouteOverview);
  });
});
