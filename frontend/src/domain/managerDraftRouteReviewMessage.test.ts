import { describe, expect, it } from 'vitest';
import { getManagerDraftRouteReviewMessage } from './managerDraftRouteReviewMessage';

describe('manager draft route review message helper', () => {
  it('returns ready copy', () => {
    expect(getManagerDraftRouteReviewMessage(true, true, 45)).toBe('Ready for manager review before publishing.');
  });

  it('returns empty route copy', () => {
    expect(getManagerDraftRouteReviewMessage(false, false, 0)).toBe('Add at least one job before reviewing this route.');
  });

  it('returns missing workload copy', () => {
    expect(getManagerDraftRouteReviewMessage(false, true, 0)).toBe('Add workload estimates before publishing this route.');
  });
});
