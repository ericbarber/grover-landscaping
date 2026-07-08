import { describe, expect, it } from 'vitest';
import { seedManagerActivityItems } from './managerActivity';
import {
  getManagerActivityToneFilterSummaries,
  getManagerActivityToneFilterSummary,
} from './managerActivityToneFilterSummary';

describe('manager activity tone filter summaries', () => {
  it('builds an all-tones filter summary', () => {
    expect(getManagerActivityToneFilterSummary(seedManagerActivityItems, 'all')).toEqual({
      value: 'all',
      label: 'All tones',
      count: 4,
      ariaLabel: 'All tones: 4 activity items',
    });
  });

  it('builds a tone-specific filter summary', () => {
    expect(getManagerActivityToneFilterSummary(seedManagerActivityItems, 'success')).toEqual({
      value: 'success',
      label: 'Success',
      count: 1,
      ariaLabel: 'Success: 1 activity item',
    });
  });

  it('builds tone filter summaries in option order', () => {
    expect(getManagerActivityToneFilterSummaries(seedManagerActivityItems)).toEqual([
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
    ]);
  });
});
