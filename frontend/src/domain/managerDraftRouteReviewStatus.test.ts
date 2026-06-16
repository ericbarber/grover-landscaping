import { describe, expect, it } from 'vitest';
import { getManagerDraftRouteReviewStatus } from './managerDraftRouteReviewStatus';

function metrics(isReadyToReview: boolean, hasStops: boolean, totalMinutes: number) {
  return {
    isReadyToReview,
    summary: { hasStops },
    workload: { totalMinutes },
  } as const;
}

describe('manager draft route review status helper', () => {
  it('returns ready for review-ready metrics', () => {
    expect(getManagerDraftRouteReviewStatus(metrics(true, true, 45))).toBe('ready');
  });

  it('returns empty when the draft route has no stops', () => {
    expect(getManagerDraftRouteReviewStatus(metrics(false, false, 0))).toBe('empty');
  });

  it('returns missing workload when the route has stops but no estimated minutes', () => {
    expect(getManagerDraftRouteReviewStatus(metrics(false, true, 0))).toBe('missing_workload');
  });
});
