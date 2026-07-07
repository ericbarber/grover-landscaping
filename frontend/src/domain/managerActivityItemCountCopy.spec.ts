import { describe, expect, it } from 'vitest';
import { managerActivityItemCountLabel } from './managerActivityItemCountCopy';

describe('manager activity item count copy', () => {
  it('formats singular and plural item counts', () => {
    expect(managerActivityItemCountLabel(0)).toBe('0 activity items');
    expect(managerActivityItemCountLabel(1)).toBe('1 activity item');
    expect(managerActivityItemCountLabel(2)).toBe('2 activity items');
  });
});
