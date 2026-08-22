import { describe, expect, it, vi } from 'vitest';
import {
  canDecideInitialServiceProposal,
  proposalCadenceLabel,
  proposalLines,
  proposalPriceLabel,
  type InitialServiceProposal,
} from './initialServiceProposals';

const proposal = {
  status: 'sent',
  expiresAtEpochSeconds: 1_800_000_000,
  priceAmountMinor: 12_000,
  currencyCode: 'USD',
  priceBasis: 'per_visit',
} as InitialServiceProposal;

describe('initial service proposal presentation', () => {
  it('formats neutral cadence, price, and line-item labels', () => {
    expect(proposalCadenceLabel('every_two_weeks')).toBe('Every two weeks');
    expect(proposalPriceLabel(proposal)).toMatch(/\$120\.00 per visit/);
    expect(proposalLines(' Mow and edge \n\n Blow hardscape ')).toEqual([
      'Mow and edge', 'Blow hardscape',
    ]);
  });

  it('permits a decision only for a current, unexpired sent version', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    expect(canDecideInitialServiceProposal(proposal)).toBe(true);
    expect(canDecideInitialServiceProposal({ ...proposal, status: 'superseded' })).toBe(false);
    expect(canDecideInitialServiceProposal({ ...proposal, expiresAtEpochSeconds: 1 })).toBe(false);
    vi.useRealTimers();
  });
});
