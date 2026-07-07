import { describe, expect, it } from 'vitest';
import { managerActivityReviewBadgeLabel } from './managerActivityReviewCopy';

describe('manager activity review badge copy', () => {
  it('formats badge labels', () => {
    expect(managerActivityReviewBadgeLabel(0)).toBe('Clear');
    expect(managerActivityReviewBadgeLabel(1)).toBe('1 review');
    expect(managerActivityReviewBadgeLabel(2)).toBe('2 reviews');
  });
});
