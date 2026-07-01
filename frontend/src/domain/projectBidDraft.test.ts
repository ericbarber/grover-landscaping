import { describe, expect, it } from 'vitest';
import {
  bidDollarsToCents,
  projectBidDraftIsValid,
  projectBidDraftTotalCents,
  type ProjectBidDraftLine,
} from './projectBidDraft';

const line: ProjectBidDraftLine = {
  id: 'line_1',
  serviceId: 'service_1',
  serviceName: 'Sprinkler repair',
  quantity: '2',
  unitPriceDollars: '85.50',
  note: '',
};

describe('project bid draft helpers', () => {
  it('converts dollar inputs to integer cents', () => {
    expect(bidDollarsToCents('85.50')).toBe(8550);
    expect(bidDollarsToCents('-1')).toBeNull();
    expect(bidDollarsToCents('not-a-price')).toBeNull();
  });

  it('totals valid line-item quantities', () => {
    expect(projectBidDraftTotalCents([line])).toBe(17100);
  });

  it('rejects incomplete or zero-quantity drafts', () => {
    expect(projectBidDraftIsValid([line])).toBe(true);
    expect(projectBidDraftIsValid([{ ...line, serviceName: '' }])).toBe(false);
    expect(projectBidDraftIsValid([{ ...line, quantity: '0' }])).toBe(false);
  });
});
