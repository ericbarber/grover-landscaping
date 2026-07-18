import { describe, expect, it } from 'vitest';
import { validateTeamInvitation } from './ManagerTeamInvitationsPanel';

describe('team invitation validation', () => {
  it('accepts a normalized email destination', () => {
    expect(validateTeamInvitation(' crew.member@example.com ')).toBeNull();
  });

  it('rejects incomplete and oversized email destinations', () => {
    expect(validateTeamInvitation('crew.member')).toBe('Enter a valid email address.');
    expect(validateTeamInvitation(`${'a'.repeat(310)}@example.com`)).toBe(
      'Email address cannot exceed 320 characters.',
    );
  });
});
