import { describe, expect, it } from 'vitest';
import { customerHistoryItems } from './CustomerHistoryMenu';

describe('customer history menu', () => {
  it('summarizes property and bid history before either list opens', () => {
    expect(customerHistoryItems(3, 1)).toEqual([
      { id: 'properties', label: 'Properties', count: 3 },
      { id: 'bids', label: 'Bids', count: 1 },
    ]);
  });
});
