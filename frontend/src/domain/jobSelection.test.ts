import { describe, expect, it } from 'vitest';
import { isJobSelectionButtonText } from './jobSelection';

describe('job selection helpers', () => {
  it('matches job card selection buttons', () => {
    expect(isJobSelectionButtonText('Open Job')).toBe(true);
    expect(isJobSelectionButtonText('Selected Job')).toBe(true);
  });

  it('does not match route progress buttons', () => {
    expect(isJobSelectionButtonText('Start stop')).toBe(false);
    expect(isJobSelectionButtonText('Finish stop')).toBe(false);
    expect(isJobSelectionButtonText('Finished')).toBe(false);
  });
});
