import { describe, expect, it } from 'vitest';
import { isApplicationPath } from './applicationRoute';

describe('application route', () => {
  it('recognizes workspace, callback, and invitation entry paths', () => {
    expect(isApplicationPath('/app')).toBe(true);
    expect(isApplicationPath('/app/')).toBe(true);
    expect(isApplicationPath('/auth/callback')).toBe(true);
    expect(isApplicationPath('/organization-invitations/token')).toBe(true);
  });

  it('keeps the public homepage and shared customer routes outside the workspace', () => {
    expect(isApplicationPath('/')).toBe(false);
    expect(isApplicationPath('/reports/token')).toBe(false);
    expect(isApplicationPath('/bids/token')).toBe(false);
    expect(isApplicationPath('/diagnostics')).toBe(false);
  });
});
