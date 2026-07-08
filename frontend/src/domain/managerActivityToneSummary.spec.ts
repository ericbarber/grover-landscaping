import { describe, expect, it } from 'vitest';
import { seedManagerActivityItems } from './managerActivity';
import {
  getManagerActivityToneSummaries,
  getManagerActivityToneSummary,
} from './managerActivityToneSummary';

describe('manager activity tone summaries', () => {
  it('builds a tone summary with count and accessible copy', () => {
    expect(getManagerActivityToneSummary(seedManagerActivityItems, 'warning')).toEqual({
      tone: 'warning',
      label: 'Warning',
      count: 2,
      ariaLabel: 'Warning: 2 activity items',
    });
  });

  it('builds tone summaries in display order', () => {
    expect(getManagerActivityToneSummaries(seedManagerActivityItems)).toEqual([
      {
        tone: 'warning',
        label: 'Warning',
        count: 2,
        ariaLabel: 'Warning: 2 activity items',
      },
      {
        tone: 'success',
        label: 'Success',
        count: 1,
        ariaLabel: 'Success: 1 activity item',
      },
      {
        tone: 'info',
        label: 'Info',
        count: 1,
        ariaLabel: 'Info: 1 activity item',
      },
    ]);
  });
});
