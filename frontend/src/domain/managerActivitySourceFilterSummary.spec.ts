import { describe, expect, it } from 'vitest';
import { seedManagerActivityItems } from './managerActivity';
import {
  getManagerActivitySourceFilterSummaries,
  getManagerActivitySourceFilterSummary,
} from './managerActivitySourceFilterSummary';

describe('manager activity source filter summaries', () => {
  it('builds an all-sources filter summary', () => {
    expect(getManagerActivitySourceFilterSummary(seedManagerActivityItems, 'all')).toEqual({
      value: 'all',
      label: 'All sources',
      totalCount: 4,
      needsReviewCount: 2,
      statusLabel: '2 reviews',
      ariaLabel: 'All sources: 4 activity items, 2 items need review',
    });
  });

  it('builds a source-specific filter summary', () => {
    expect(getManagerActivitySourceFilterSummary(seedManagerActivityItems, 'route')).toEqual({
      value: 'route',
      label: 'Route',
      totalCount: 1,
      needsReviewCount: 1,
      statusLabel: '1 review',
      ariaLabel: 'Route: 1 activity item, 1 item needs review',
    });
  });

  it('builds source filter summaries in the requested order', () => {
    expect(getManagerActivitySourceFilterSummaries(seedManagerActivityItems, ['job', 'sync'])).toEqual([
      {
        value: 'all',
        label: 'All sources',
        totalCount: 4,
        needsReviewCount: 2,
        statusLabel: '2 reviews',
        ariaLabel: 'All sources: 4 activity items, 2 items need review',
      },
      {
        value: 'job',
        label: 'Job',
        totalCount: 1,
        needsReviewCount: 0,
        statusLabel: 'Clear',
        ariaLabel: 'Job: 1 activity item, 0 items need review',
      },
      {
        value: 'sync',
        label: 'Sync',
        totalCount: 1,
        needsReviewCount: 0,
        statusLabel: 'Clear',
        ariaLabel: 'Sync: 1 activity item, 0 items need review',
      },
    ]);
  });
});
