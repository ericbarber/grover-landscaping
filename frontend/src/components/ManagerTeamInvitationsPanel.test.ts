import { describe, expect, it } from 'vitest';
import {
  invitationExpirationIso,
  invitationCreationFailureMessage,
  invitationDeliveryLabel,
  validateTeamInvitation,
} from './ManagerTeamInvitationsPanel';

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

  it('creates finite UTC invitation expirations', () => {
    expect(invitationExpirationIso(7, new Date('2026-07-18T12:00:00.000Z'))).toBe(
      '2026-07-25T12:00:00.000Z',
    );
  });

  it('guides duplicate recipients to existing invitation history', () => {
    expect(invitationCreationFailureMessage(new Error('API request failed with status 409'))).toBe(
      'This recipient may already have pending access. Refresh history, or reissue expired or revoked access.',
    );
  });

  it('turns delivery state into concise mobile guidance', () => {
    expect(invitationDeliveryLabel('queued', 0)).toBe('Email queued');
    expect(invitationDeliveryLabel('failed', 2)).toBe('Email retry pending · 2 attempts');
    expect(invitationDeliveryLabel('dead_letter', 5)).toBe('Email delivery failed · 5 attempts');
  });
});
