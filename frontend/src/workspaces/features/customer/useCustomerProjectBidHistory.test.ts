import { describe, expect, it, vi } from 'vitest';
import type { ProjectBid } from '../../../domain/stopProgress';
import { readCustomerProjectBidHistory } from './useCustomerProjectBidHistory';

describe('customer project bid history coordination', () => {
  it('reads bids for the exact customer account', async () => {
    const bids = [{ id: 'bid-1' }] as ProjectBid[];
    const readBids = vi.fn(async () => bids);

    await expect(readCustomerProjectBidHistory('account-1', readBids)).resolves.toBe(bids);
    expect(readBids).toHaveBeenCalledWith('account-1');
  });

  it('preserves read failures for the coordinator to classify', async () => {
    const error = new Error('Unavailable');
    await expect(readCustomerProjectBidHistory(
      'account-1',
      async () => { throw error; },
    )).rejects.toBe(error);
  });
});
