import { describe, expect, it } from 'vitest';
import { seedManagerActivityItems } from './managerActivity';
import { getManagerActivityFilterSummary } from './managerActivityFilterSummary';

describe('manager activity filter summary', () => {
  it('combines source and tone filter summaries', () => {
    expect(getManagerActivityFilterSummary(seedManagerActivityItems, ['route', 'job'])).toEqual({
      sourceFilters: [
        {
          value: 'all',
          label: 'All sources',
          totalCount: 4,
          needsReviewCount: 2,
          statusLabel: '2 reviews',
          ariaLabel: 'All sources: 4 activity items, 2 items need review',
        },
        {
          value: 'route',
          label: 'Route',
          totalCount: 1,
          needsReviewCount: 1,
          statusLabel: '1 review',
          ariaLabel: 'Route: 1 activity item, 1 item needs review',
        },
        {
          value: 'job',
          label: 'Job',
          totalCount: 1,
          needsReviewCount: 0,
          statusLabel: 'Clear',
          ariaLabel: 'Job: 1 activity item, 0 items need review',
        },
      ],
      toneFilters: [
        {
          value: 'all',
          label: 'All tones',
          count: 4,
          ariaLabel: 'All tones: 4 activity items',
        },
        {
          value: 'warning',
          label: 'Warning',
          count: 2,
          ariaLabel: 'Warning: 2 activity items',
        },
        {
          value: 'success',
          label: 'Success',
          count: 1,
          ariaLabel: 'Success: 1 activity item',
        },
        {
          value: 'info',
          label: 'Info',
          count: 1,
          ariaLabel: 'Info: 1 activity item',
        },
      ],
    });
  });
});
