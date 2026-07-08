import { describe, expect, it } from 'vitest';
import { getManagerActivityToneFilterOptions } from './managerActivityToneFilterOptions';

describe('manager activity tone filter options', () => {
  it('builds tone filter options in display order', () => {
    expect(getManagerActivityToneFilterOptions()).toEqual([
      { value: 'all', label: 'All tones' },
      { value: 'warning', label: 'Warning' },
      { value: 'success', label: 'Success' },
      { value: 'info', label: 'Info' },
    ]);
  });
});
