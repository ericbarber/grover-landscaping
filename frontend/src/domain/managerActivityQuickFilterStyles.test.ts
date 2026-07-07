import { describe, expect, it } from 'vitest';
import { seedManagerActivityItems } from './managerActivity';
import { getManagerActivityQuickFilters } from './managerActivityQuickFilters';
import {
  managerActivityQuickFilterClassName,
  managerActivityQuickFilterDisplayLabel,
} from './managerActivityQuickFilterStyles';

describe('manager activity quick filter style helpers', () => {
  it('uses the active class and label for the selected quick filter', () => {
    const completionReview = getManagerActivityQuickFilters(seedManagerActivityItems, {
      source: 'job',
      tone: 'all',
    }).find((quickFilter) => quickFilter.id === 'completion-review');

    expect(completionReview).toBeDefined();
    expect(managerActivityQuickFilterDisplayLabel(completionReview!)).toBe('Showing completion review');
    expect(managerActivityQuickFilterClassName(completionReview!)).toContain('text-indigo-700');
  });

  it('uses the inactive class and label for unselected quick filters', () => {
    const routeReview = getManagerActivityQuickFilters(seedManagerActivityItems, {
      source: 'job',
      tone: 'all',
    }).find((quickFilter) => quickFilter.id === 'route-review');

    expect(routeReview).toBeDefined();
    expect(managerActivityQuickFilterDisplayLabel(routeReview!)).toBe('Show route review');
    expect(managerActivityQuickFilterClassName(routeReview!)).toContain('text-slate-600');
  });
});
