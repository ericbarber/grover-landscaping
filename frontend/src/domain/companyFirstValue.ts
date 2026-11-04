import type {
  FirstOwnerSetupProgress,
  OrganizationMembership,
  PrincipalAccessSummary,
} from '../api/client';

export type CompanyFirstValueTarget =
  | 'operational-profile'
  | 'service-setup'
  | 'customer-accounts'
  | 'day-plan'
  | 'completion-reports'
  | 'team-invitations';

export type CompanyFirstValueStageId =
  | 'organization_profile'
  | 'first_crew'
  | 'first_customer_property'
  | 'first_route'
  | 'first_service'
  | 'first_report';

export interface CompanyFirstValueMilestone {
  id: CompanyFirstValueStageId;
  label: string;
  detail: string;
  unlockedOutcome: string;
  complete: boolean;
  target: CompanyFirstValueTarget | null;
}

export type CompanySetupMembershipResolution =
  | { state: 'none'; membership: null }
  | { state: 'selected'; membership: OrganizationMembership }
  | { state: 'conflict'; membership: null };

export function resolveCompanySetupMembership(
  access: PrincipalAccessSummary,
): CompanySetupMembershipResolution {
  if (access.memberships.length === 0) return { state: 'none', membership: null };
  if (access.memberships.length === 1) {
    return { state: 'selected', membership: access.memberships[0] };
  }
  return { state: 'conflict', membership: null };
}

export function firstOwnerSetupSteps(access: PrincipalAccessSummary): string[] {
  if (access.memberships.length === 0) return ['Create your company'];
  return [
    'Complete your company profile',
    'Add your first crew',
    'Add your first customer and property',
    'Publish your first route',
    'Complete your first service',
    'Send your first service report',
    'Invite another team member',
  ];
}

export function firstOwnerSetupTarget(step: string): CompanyFirstValueTarget | null {
  switch (step) {
    case 'Add your first crew':
      return null;
    case 'Add your first customer and property':
      return 'customer-accounts';
    case 'Publish your first route':
    case 'Complete your first service':
      return 'day-plan';
    case 'Send your first service report':
      return 'completion-reports';
    case 'Invite another team member':
      return 'team-invitations';
    default:
      return null;
  }
}

export function firstOwnerProgressMilestones(
  progress: FirstOwnerSetupProgress,
): CompanyFirstValueMilestone[] {
  return [
    {
      id: 'organization_profile',
      label: 'Complete your company profile',
      detail: 'Add contact information, your service area, and daily capacity.',
      unlockedOutcome: 'Your company is ready to add crews and customers.',
      complete: progress.organizationProfileComplete,
      target: null,
    },
    {
      id: 'first_crew',
      label: 'Add your first crew',
      detail: 'Create one active crew for routes and property assignments.',
      unlockedOutcome: 'A route can now be assigned to your crew.',
      complete: progress.crewConfigured,
      target: null,
    },
    {
      id: 'first_customer_property',
      label: 'Add your first customer and property',
      detail: 'Add the customer and service address for your first job.',
      unlockedOutcome: 'The property is ready to schedule.',
      complete: progress.customerPropertyCreated,
      target: 'customer-accounts',
    },
    {
      id: 'first_route',
      label: 'Publish your first route',
      detail: 'Build and publish a day plan for an active crew.',
      unlockedOutcome: 'Your crew can open the route and prepare for each stop.',
      complete: progress.firstRoutePublished,
      target: 'day-plan',
    },
    {
      id: 'first_service',
      label: 'Complete your first service',
      detail: 'Finish the job and add the required photos and notes.',
      unlockedOutcome: 'Your team can review the completed work.',
      complete: progress.firstServiceCompleted,
      target: 'day-plan',
    },
    {
      id: 'first_report',
      label: 'Send your first service report',
      detail: 'Review the completed work and send the customer-safe summary.',
      unlockedOutcome: 'Your first customer service cycle is complete.',
      complete: progress.firstReportDelivered,
      target: 'completion-reports',
    },
  ];
}

export function firstOwnerNextMilestone(progress: FirstOwnerSetupProgress) {
  return firstOwnerProgressMilestones(progress).find((milestone) => !milestone.complete) ?? null;
}

export function newlyCompletedCompanyFirstValueStages(
  previous: FirstOwnerSetupProgress | null,
  current: FirstOwnerSetupProgress,
): CompanyFirstValueStageId[] {
  if (!previous) return [];
  const previousById = new Map(
    firstOwnerProgressMilestones(previous).map((milestone) => [milestone.id, milestone.complete]),
  );
  return firstOwnerProgressMilestones(current)
    .filter((milestone) => milestone.complete && previousById.get(milestone.id) === false)
    .map((milestone) => milestone.id);
}
