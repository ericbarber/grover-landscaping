import { describe, expect, it } from 'vitest';
import { LOCAL_DEVELOPMENT_USER_ID, safeAuthReturnPath } from './AuthProvider';

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

  it('uses the backend disabled-auth principal for durable local field work', () => {
    expect(LOCAL_DEVELOPMENT_USER_ID).toBe('local-development-user');
  });
});
