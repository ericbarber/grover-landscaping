import { describe, expect, it } from 'vitest';
import { seedManagerActivityItems } from './managerActivity';
import {
  getManagerActivitySourceSummaries,
  getManagerActivitySourceSummary,
  managerActivitySourceStatusLabel,
} from './managerActivitySourceSummary';

describe('manager activity source summary helpers', () => {
  it('labels sources with review work or clear state', () => {
    expect(managerActivitySourceStatusLabel(2)).toBe('2 reviews');
    expect(managerActivitySourceStatusLabel(1)).toBe('1 review');
    expect(managerActivitySourceStatusLabel(0)).toBe('Clear');
  });

  it('summarizes source activity counts and review status', () => {
    expect(getManagerActivitySourceSummary(seedManagerActivityItems, 'route')).toEqual({
      source: 'route',
      totalCount: 1,
      needsReviewCount: 1,
      statusLabel: '1 review',
    });

    expect(getManagerActivitySourceSummary(seedManagerActivityItems, 'job')).toEqual({
      source: 'job',
      totalCount: 1,
      needsReviewCount: 0,
      statusLabel: 'Clear',
    });
  });

  it('builds summaries for a selected source order', () => {
    expect(getManagerActivitySourceSummaries(seedManagerActivityItems, ['route', 'job', 'photo', 'sync'])).toEqual([
      {
        source: 'route',
        totalCount: 1,
        needsReviewCount: 1,
        statusLabel: '1 review',
      },
      {
        source: 'job',
        totalCount: 1,
        needsReviewCount: 0,
        statusLabel: 'Clear',
      },
      {
        source: 'photo',
        totalCount: 1,
        needsReviewCount: 1,
        statusLabel: '1 review',
      },
      {
        source: 'sync',
        totalCount: 1,
        needsReviewCount: 0,
        statusLabel: 'Clear',
      },
    ]);
  });
});
