import { describe, expect, it } from 'vitest';
import type { FirstOwnerSetupProgress } from '../api/client';
import {
  firstOwnerNextMilestone,
  firstOwnerProgressMilestones,
  firstOwnerSetupTarget,
  newlyCompletedCompanyFirstValueStages,
  resolveCompanySetupMembership,
} from './companyFirstValue';

const partialProgress: FirstOwnerSetupProgress = {
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
};

describe('company first value', () => {
  it('maps each authoritative milestone to its exact workflow', () => {
    expect(firstOwnerSetupTarget('Create the first customer and property')).toBe('customer-accounts');
    expect(firstOwnerSetupTarget('Publish the first route')).toBe('day-plan');
    expect(firstOwnerSetupTarget('Complete the first service')).toBe('day-plan');
    expect(firstOwnerSetupTarget('Deliver the first completion report')).toBe('completion-reports');
  });

  it('resumes at the first incomplete server-confirmed milestone', () => {
    expect(firstOwnerNextMilestone(partialProgress)).toMatchObject({
      id: 'first_customer_property',
      target: 'customer-accounts',
    });
  });

  it('does not report first value until delivered proof is confirmed', () => {
    const milestones = firstOwnerProgressMilestones({
      ...partialProgress,
      customerPropertyCreated: true,
      firstRoutePublished: true,
      firstServiceCompleted: true,
      completedSteps: 5,
    });
    expect(milestones[milestones.length - 1]).toMatchObject({ id: 'first_report', complete: false });
    expect(firstOwnerNextMilestone({
      ...partialProgress,
      customerPropertyCreated: true,
      firstRoutePublished: true,
      firstServiceCompleted: true,
      firstReportDelivered: true,
      completedSteps: 6,
    })).toBeNull();
  });

  it('emits only server-confirmed transitions after an initial read', () => {
    expect(newlyCompletedCompanyFirstValueStages(null, partialProgress)).toEqual([]);
    expect(newlyCompletedCompanyFirstValueStages(partialProgress, {
      ...partialProgress,
      customerPropertyCreated: true,
      firstRoutePublished: true,
      completedSteps: 4,
    })).toEqual(['first_customer_property', 'first_route']);
  });

  it('fails closed instead of choosing between multiple active organizations', () => {
    const membership = {
      id: 'membership_1', organizationId: 'org_1', organizationName: 'One',
      organizationType: 'yard_care_company', userId: 'user_1', role: 'OrganizationOwner' as const,
      status: 'active', scopeType: 'organization', scopeId: 'org_1',
    };
    const access = {
      userId: 'user_1', username: 'owner@example.com', verifiedEmail: 'owner@example.com',
      claimRoles: ['OrganizationOwner' as const], memberships: [membership],
      workspaceRollout: { contractVersion: 1, enforcementMode: 'legacy' as const, rolloutMode: 'default_off' as const, personas: [] },
    };
    expect(resolveCompanySetupMembership(access)).toMatchObject({ state: 'selected', membership });
    expect(resolveCompanySetupMembership({
      ...access,
      memberships: [membership, { ...membership, id: 'membership_2', organizationId: 'org_2' }],
    })).toEqual({ state: 'conflict', membership: null });
  });
});
