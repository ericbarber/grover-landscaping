import { describe, expect, it } from 'vitest';
import {
  managerActivityReviewAriaLabel,
  managerActivityReviewBadgeLabel,
} from './managerActivityReviewCopy';

describe('manager activity review copy', () => {
  it('formats badge labels', () => {
    expect(managerActivityReviewBadgeLabel(0)).toBe('Clear');
    expect(managerActivityReviewBadgeLabel(1)).toBe('1 review');
    expect(managerActivityReviewBadgeLabel(2)).toBe('2 reviews');
  });

  it('formats aria labels', () => {
    expect(managerActivityReviewAriaLabel(0)).toBe('0 items need review');
    expect(managerActivityReviewAriaLabel(1)).toBe('1 item needs review');
    expect(managerActivityReviewAriaLabel(2)).toBe('2 items need review');
  });
});
