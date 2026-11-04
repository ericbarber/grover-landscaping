import { describe, expect, it } from 'vitest';
import { ApiRequestError } from '../../../api/apiError';
import { classifyCustomerPortalReadError } from './useCustomerPortalCollection';

describe('customer portal collection coordination', () => {
  it('classifies missing customer access without exposing transport details', () => {
    expect(classifyCustomerPortalReadError(new ApiRequestError(
      403,
      'customer_portal_access_required',
    ))).toBe('access_required');
  });

  it('classifies inconsistent customer authorization separately', () => {
    expect(classifyCustomerPortalReadError(new ApiRequestError(
      409,
      'customer_portal_access_inconsistent',
    ))).toBe('inconsistent');
  });

  it('treats all other failures as unavailable', () => {
    expect(classifyCustomerPortalReadError(new ApiRequestError(
      503,
      'customer_portal_unavailable',
    ))).toBe('unavailable');
    expect(classifyCustomerPortalReadError(new Error('Network failed'))).toBe('unavailable');
  });
});
