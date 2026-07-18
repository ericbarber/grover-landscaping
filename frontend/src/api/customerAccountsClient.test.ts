import { describe, expect, it } from 'vitest';
import { customerAccountPath, customerAccountPropertiesPath } from './client';

describe('customer account client', () => {
  it('encodes account ids in update paths', () => {
    expect(customerAccountPath('acct/with spaces')).toBe('/customer-accounts/acct%2Fwith%20spaces');
    expect(customerAccountPropertiesPath('acct/with spaces')).toBe(
      '/customer-accounts/acct%2Fwith%20spaces/properties',
    );
  });
});
