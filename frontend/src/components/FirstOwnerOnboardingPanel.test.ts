import { describe, expect, it } from 'vitest';
import type { PrincipalAccessSummary } from '../api/client';
import {
  firstOwnerProgressMilestones,
  firstOwnerNextMilestone,
  firstOwnerSetupSteps,
  firstOwnerSetupTarget,
} from './FirstOwnerOnboardingPanel';

describe('first owner onboarding steps', () => {
  it('starts with organization creation when no membership exists', () => {
    expect(firstOwnerSetupSteps({
      userId: 'user_1',
      username: 'owner@example.com',
      verifiedEmail: 'owner@example.com',
      claimRoles: ['OrganizationOwner'],
      memberships: [],
    })).toEqual(['Create your organization']);
  });

  it('shows the operational setup sequence after bootstrap', () => {
    const access: PrincipalAccessSummary = {
      userId: 'user_1',
      username: 'owner@example.com',
      verifiedEmail: 'owner@example.com',
      claimRoles: ['OrganizationOwner'],
      memberships: [{
        id: 'membership_1',
        organizationId: 'org_1',
        organizationName: 'Grover Landscaping',
        organizationType: 'yard_care_company',
        userId: 'user_1',
        role: 'OrganizationOwner',
        status: 'active',
        scopeType: 'organization',
        scopeId: 'org_1',
      }],
    };
    expect(firstOwnerSetupSteps(access)).toContain('Publish the first day plan');
    expect(firstOwnerSetupSteps(access)).toContain('Invite additional team members');
  });

  it('routes actionable setup steps to the matching manager workspace', () => {
    expect(firstOwnerSetupTarget('Confirm organization and owner access')).toBeNull();
    expect(firstOwnerSetupTarget('Complete the first property profile')).toBe('operational-profile');
    expect(firstOwnerSetupTarget('Configure the first crew')).toBe('service-setup');
    expect(firstOwnerSetupTarget('Publish the first day plan')).toBe('day-plan');
    expect(firstOwnerSetupTarget('Invite additional team members')).toBe('team-invitations');
  });

  it('maps persisted completion state to actionable mobile milestones', () => {
    const milestones = firstOwnerProgressMilestones({
      organizationId: 'org_1',
      organizationProfileComplete: true,
      teamInvitationCreated: false,
      crewConfigured: true,
      firstRoutePublished: false,
      completedSteps: 2,
      totalSteps: 4,
      persisted: true,
    });

    expect(milestones.map(({ label, complete, target }) => ({ label, complete, target }))).toEqual([
      { label: 'Complete organization profile', complete: true, target: null },
      { label: 'Configure the first crew', complete: true, target: 'service-setup' },
      { label: 'Publish the first route', complete: false, target: 'day-plan' },
      { label: 'Invite a team member', complete: false, target: 'team-invitations' },
    ]);
  });

  it('recommends only the first incomplete launch milestone', () => {
    const progress = {
      organizationId: 'org_1',
      organizationProfileComplete: true,
      teamInvitationCreated: false,
      crewConfigured: true,
      firstRoutePublished: false,
      completedSteps: 2,
      totalSteps: 4,
      persisted: true,
    };

    expect(firstOwnerNextMilestone(progress)).toMatchObject({
      label: 'Publish the first route',
      target: 'day-plan',
    });
    expect(firstOwnerNextMilestone({
      ...progress,
      teamInvitationCreated: true,
      firstRoutePublished: true,
      completedSteps: 4,
    })).toBeNull();
  });
});
