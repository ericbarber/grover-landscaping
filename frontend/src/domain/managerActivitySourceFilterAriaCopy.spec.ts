import { describe, expect, it } from 'vitest';
import { managerActivitySourceFilterAriaCopy } from './managerActivitySourceFilterAriaCopy';
import { managerActivitySourceFilterAriaLabel } from './managerActivitySourceFilterLabels';

describe('manager activity source filter aria copy', () => {
  it('formats source filter copy with singular counts', () => {
    expect(managerActivitySourceFilterAriaCopy('job', 1, 1)).toBe('Job: 1 activity item, 1 item needs review');
  });

  it('formats source filter copy with plural counts', () => {
    expect(managerActivitySourceFilterAriaCopy('route', 2, 2)).toBe('Route: 2 activity items, 2 items need review');
  });

  it('matches the source filter label wrapper', () => {
    expect(managerActivitySourceFilterAriaLabel('photo', 1, 0)).toBe('Photo: 1 activity item, 0 items need review');
  });
});
