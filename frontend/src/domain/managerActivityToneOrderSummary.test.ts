import { describe, expect, it } from 'vitest';
import { managerActivityToneOrderSummary } from './managerActivityToneOrderSummary';

describe('manager activity tone order summary', () => {
  it('formats the tone order', () => {
    expect(managerActivityToneOrderSummary()).toBe('warning > success > info');
  });
});
