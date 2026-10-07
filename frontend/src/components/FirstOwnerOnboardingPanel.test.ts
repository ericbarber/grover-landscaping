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
    })).toEqual(['Create your company']);
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
    expect(firstOwnerSetupSteps(access)).toContain('Publish your first route');
    expect(firstOwnerSetupSteps(access)).toContain('Invite another team member');
  });

  it('routes actionable setup steps to the matching manager workspace', () => {
    expect(firstOwnerSetupTarget('Complete your company profile')).toBeNull();
    expect(firstOwnerSetupTarget('Add your first crew')).toBeNull();
    expect(firstOwnerSetupTarget('Add your first customer and property')).toBe('customer-accounts');
    expect(firstOwnerSetupTarget('Publish your first route')).toBe('day-plan');
    expect(firstOwnerSetupTarget('Send your first service report')).toBe('completion-reports');
    expect(firstOwnerSetupTarget('Invite another team member')).toBe('team-invitations');
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
      { label: 'Complete your company profile', complete: true, target: null },
      { label: 'Add your first crew', complete: true, target: null },
      { label: 'Add your first customer and property', complete: false, target: 'customer-accounts' },
      { label: 'Publish your first route', complete: false, target: 'day-plan' },
      { label: 'Complete your first service', complete: false, target: 'day-plan' },
      { label: 'Send your first service report', complete: false, target: 'completion-reports' },
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
      label: 'Publish your first route',
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
