import { describe, expect, it } from 'vitest';
import { managerActivitySourceSummaryAriaCopy } from './managerActivitySourceSummaryAriaCopy';
import type { ManagerActivitySourceSummary } from './managerActivitySourceSummary';

function buildSummary(totalCount: number, needsReviewCount: number): ManagerActivitySourceSummary {
  return {
    source: 'route',
    totalCount,
    needsReviewCount,
    statusLabel: needsReviewCount === 0 ? 'Clear' : `${needsReviewCount} reviews`,
  };
}

describe('manager activity source summary aria copy', () => {
  it('formats clear summary copy', () => {
    expect(managerActivitySourceSummaryAriaCopy(buildSummary(0, 0))).toBe('Route: 0 activity items, 0 items need review');
  });

  it('formats singular summary copy', () => {
    expect(managerActivitySourceSummaryAriaCopy(buildSummary(1, 1))).toBe('Route: 1 activity item, 1 item needs review');
  });

  it('formats plural summary copy', () => {
    expect(managerActivitySourceSummaryAriaCopy(buildSummary(2, 2))).toBe('Route: 2 activity items, 2 items need review');
  });
});
