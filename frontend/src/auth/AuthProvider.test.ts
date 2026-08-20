import { describe, expect, it } from 'vitest';
import {
  LOCAL_DEVELOPMENT_USER_ID,
  resolveLocalReviewer,
  safeAuthReturnPath,
  type LocalReviewerProfile,
} from './AuthProvider';

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

  it('restores a configured local reviewer and safely falls back to the default', () => {
    const reviewers: LocalReviewerProfile[] = [
      {
        reviewer_id: 'organization-owner',
        user_id: 'local-review-owner',
        display_name: 'Owner',
        verified_email: 'owner@example.test',
        roles: ['OrganizationOwner'],
      },
      {
        reviewer_id: 'crew-member',
        user_id: 'local-review-crew-member',
        display_name: 'Crew member',
        verified_email: 'crew@example.test',
        roles: ['CrewMember'],
      },
    ];

    expect(resolveLocalReviewer(reviewers, 'crew-member')?.user_id)
      .toBe('local-review-crew-member');
    expect(resolveLocalReviewer(reviewers, 'removed-reviewer')?.reviewer_id)
      .toBe('organization-owner');
    expect(resolveLocalReviewer([], null)).toBeNull();
  });
});
