import { describe, expect, it } from 'vitest';
import { seedManagerActivityItems } from './managerActivity';
import { getSelectableManagerActivityFilterSummary } from './managerActivitySelectableFilterSummary';

describe('selectable manager activity filter summary', () => {
  it('marks the selected source and tone filters active', () => {
    const summary = getSelectableManagerActivityFilterSummary(
      seedManagerActivityItems,
      ['route', 'job'],
      { source: 'route', tone: 'warning' },
    );

    expect(summary.sourceFilters.map(({ value, isActive }) => ({ value, isActive }))).toEqual([
      { value: 'all', isActive: false },
      { value: 'route', isActive: true },
      { value: 'job', isActive: false },
    ]);

    expect(summary.toneFilters.map(({ value, isActive }) => ({ value, isActive }))).toEqual([
      { value: 'all', isActive: false },
      { value: 'warning', isActive: true },
      { value: 'success', isActive: false },
      { value: 'info', isActive: false },
    ]);
  });

  it('preserves summary counts and accessible copy', () => {
    const summary = getSelectableManagerActivityFilterSummary(
      seedManagerActivityItems,
      ['route'],
      { source: 'all', tone: 'all' },
    );

    expect(summary.sourceFilters[0]).toMatchObject({
      value: 'all',
      totalCount: 4,
      needsReviewCount: 2,
      ariaLabel: 'All sources: 4 activity items, 2 items need review',
      isActive: true,
    });

    expect(summary.toneFilters[0]).toMatchObject({
      value: 'all',
      count: 4,
      ariaLabel: 'All tones: 4 activity items',
      isActive: true,
    });
  });
});
