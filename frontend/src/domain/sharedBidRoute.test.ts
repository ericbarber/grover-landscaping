import { describe, expect, it } from 'vitest';
import { sharedBidTokenFromPath } from './sharedBidRoute';

describe('shared bid route', () => {
  it('extracts the customer approval token', () => {
    expect(sharedBidTokenFromPath('/bid-review/token-1001')).toBe('token-1001');
    expect(sharedBidTokenFromPath('/bid-review/token%201/')).toBe('token 1');
  });

  it('ignores unrelated or malformed paths', () => {
    expect(sharedBidTokenFromPath('/')).toBeNull();
    expect(sharedBidTokenFromPath('/bid-review/')).toBeNull();
    expect(sharedBidTokenFromPath('/bid-review/%E0%A4%A')).toBeNull();
  });
});
