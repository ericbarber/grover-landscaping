import { describe, expect, it } from 'vitest';
import { safeAuthReturnPath } from './AuthProvider';

describe('authentication return path', () => {
  it('preserves a local invitation route after sign-in', () => {
    expect(safeAuthReturnPath({
      returnTo: '/organization-invitations/invite_1001',
    })).toBe('/organization-invitations/invite_1001');
  });

  it('rejects missing and external return paths', () => {
    expect(safeAuthReturnPath(null)).toBe('/');
    expect(safeAuthReturnPath({ returnTo: 'https://example.com' })).toBe('/');
    expect(safeAuthReturnPath({ returnTo: '//example.com' })).toBe('/');
  });
});
