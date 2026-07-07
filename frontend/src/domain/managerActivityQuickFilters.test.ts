import { describe, expect, it } from 'vitest';
import { seedManagerActivityItems, type ManagerActivityItem } from './managerActivity';
import {
  getManagerActivityQuickFilters,
  getVisibleManagerActivityQuickFilters,
} from './managerActivityQuickFilters';

describe('manager activity quick filter helpers', () => {
  it('builds all manager activity quick filters in review queue order', () => {
    const quickFilters = getManagerActivityQuickFilters(seedManagerActivityItems, { source: 'all', tone: 'all' });

    expect(quickFilters.map((quickFilter) => quickFilter.id)).toEqual([
      'needs-review',
      'route-review',
      'completion-review',
      'sync-fallback',
      'photo-evidence',
    ]);
  });

  it('adds completion-review quick filter metadata for job activity', () => {
    const completionReview = getManagerActivityQuickFilters(seedManagerActivityItems, {
      source: 'job',
      tone: 'all',
    }).find((quickFilter) => quickFilter.id === 'completion-review');

    expect(completionReview).toEqual({
      id: 'completion-review',
      count: 1,
      isVisible: true,
      isActive: true,
      filters: { source: 'job', tone: 'all' },
      ariaLabel: 'Show 1 manager activity items from completion review',
      activeLabel: 'Showing completion review',
      inactiveLabel: 'Show completion review',
      title: 'Show completion report and job review activity.',
    });
  });

  it('marks the needs-review quick filter active when warning activity is selected', () => {
    const needsReview = getManagerActivityQuickFilters(seedManagerActivityItems, {
      source: 'all',
      tone: 'warning',
    }).find((quickFilter) => quickFilter.id === 'needs-review');

    expect(needsReview?.count).toBe(2);
    expect(needsReview?.isActive).toBe(true);
  });

  it('filters out quick filters with no matching activity', () => {
    const onlyJobActivity: ManagerActivityItem[] = [
      {
        id: 'job-only',
        title: 'Completion review ready',
        message: 'A completion report is ready for manager review.',
        tone: 'success',
        source: 'job',
        occurredAt: 'Today 10:00 AM',
      },
    ];

    expect(getVisibleManagerActivityQuickFilters(onlyJobActivity, { source: 'all', tone: 'all' }).map((quickFilter) => quickFilter.id)).toEqual([
      'completion-review',
    ]);
  });
});
