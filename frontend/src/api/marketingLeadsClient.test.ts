import { describe, expect, it } from 'vitest';
import { marketingAttributionFromSearch } from './marketingLeadsClient';

describe('marketing lead attribution', () => {
  it('captures supported campaign parameters', () => {
    expect(marketingAttributionFromSearch(
      '?utm_source=google&utm_medium=cpc&utm_campaign=phoenix_launch',
    )).toEqual({
      source: 'google',
      medium: 'cpc',
      campaign: 'phoenix_launch',
    });
  });

  it('omits empty and unrelated parameters', () => {
    expect(marketingAttributionFromSearch('?utm_source=&ref=partner')).toEqual({
      source: undefined,
      medium: undefined,
      campaign: undefined,
    });
  });
});
