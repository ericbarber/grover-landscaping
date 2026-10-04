import { describe, expect, it } from 'vitest';
import type { PrincipalAccessSummary } from '../api/client';
import {
  firstOwnerProgressMilestones,
  firstOwnerNextMilestone,
  firstOwnerSetupSteps,
  firstOwnerSetupTarget,
} from '../domain/companyFirstValue';

describe('first owner onboarding steps', () => {
  it('starts with organization creation when no membership exists', () => {
    expect(firstOwnerSetupSteps({
      userId: 'user_1',
      username: 'owner@example.com',
      verifiedEmail: 'owner@example.com',
      claimRoles: ['OrganizationOwner'],
      memberships: [],
      workspaceRollout: {
        contractVersion: 1,
        enforcementMode: 'legacy',
        rolloutMode: 'default_off',
        personas: [],
      },
    })).toEqual(['Create your organization']);
  });

  it('shows the operational setup sequence after bootstrap', () => {
    const access: PrincipalAccessSummary = {
      userId: 'user_1',
      username: 'owner@example.com',
      verifiedEmail: 'owner@example.com',
      claimRoles: ['OrganizationOwner'],
      workspaceRollout: {
        contractVersion: 1,
        enforcementMode: 'legacy',
        rolloutMode: 'default_off',
        personas: [],
      },
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
    expect(firstOwnerSetupSteps(access)).toContain('Publish the first route');
    expect(firstOwnerSetupSteps(access)).toContain('Invite additional team members');
  });

  it('routes actionable setup steps to the matching manager workspace', () => {
    expect(firstOwnerSetupTarget('Complete organization profile')).toBeNull();
    expect(firstOwnerSetupTarget('Configure the first crew')).toBeNull();
    expect(firstOwnerSetupTarget('Create the first customer and property')).toBe('customer-accounts');
    expect(firstOwnerSetupTarget('Publish the first route')).toBe('day-plan');
    expect(firstOwnerSetupTarget('Deliver the first completion report')).toBe('completion-reports');
    expect(firstOwnerSetupTarget('Invite additional team members')).toBe('team-invitations');
  });

  it('maps persisted completion state to actionable mobile milestones', () => {
    const milestones = firstOwnerProgressMilestones({
      organizationId: 'org_1',
      organizationProfileComplete: true,
      teamInvitationCreated: false,
      crewConfigured: true,
      customerPropertyCreated: false,
      firstRoutePublished: false,
      firstServiceCompleted: false,
      firstReportDelivered: false,
      completedSteps: 2,
      totalSteps: 6,
      persisted: true,
    });

    expect(milestones.map(({ label, complete, target }) => ({ label, complete, target }))).toEqual([
      { label: 'Complete organization profile', complete: true, target: null },
      { label: 'Configure the first crew', complete: true, target: null },
      { label: 'Create the first customer and property', complete: false, target: 'customer-accounts' },
      { label: 'Publish the first route', complete: false, target: 'day-plan' },
      { label: 'Complete the first service', complete: false, target: 'day-plan' },
      { label: 'Deliver the first completion report', complete: false, target: 'completion-reports' },
    ]);
  });

  it('recommends only the first incomplete launch milestone', () => {
    const progress = {
      organizationId: 'org_1',
      organizationProfileComplete: true,
      teamInvitationCreated: false,
      crewConfigured: true,
      customerPropertyCreated: true,
      firstRoutePublished: false,
      firstServiceCompleted: false,
      firstReportDelivered: false,
      completedSteps: 3,
      totalSteps: 6,
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
      firstServiceCompleted: true,
      firstReportDelivered: true,
      completedSteps: 6,
    })).toBeNull();
  });
});
