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
  if (access.memberships.length === 0) return ['Create your organization'];
  return [
    'Complete organization profile',
    'Configure the first crew',
    'Create the first customer and property',
    'Publish the first route',
    'Complete the first service',
    'Deliver the first completion report',
    'Invite additional team members',
  ];
}

export function firstOwnerSetupTarget(step: string): CompanyFirstValueTarget | null {
  switch (step) {
    case 'Configure the first crew':
      return null;
    case 'Create the first customer and property':
      return 'customer-accounts';
    case 'Publish the first route':
    case 'Complete the first service':
      return 'day-plan';
    case 'Deliver the first completion report':
      return 'completion-reports';
    case 'Invite additional team members':
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
      label: 'Complete organization profile',
      detail: 'Add a customer-facing contact and service area.',
      unlockedOutcome: 'Company identity is ready for operational setup.',
      complete: progress.organizationProfileComplete,
      target: null,
    },
    {
      id: 'first_crew',
      label: 'Configure the first crew',
      detail: 'Create one active crew inside this organization.',
      unlockedOutcome: 'A route can be assigned to an accountable crew.',
      complete: progress.crewConfigured,
      target: null,
    },
    {
      id: 'first_customer_property',
      label: 'Create the first customer and property',
      detail: 'Create an organization-scoped customer property.',
      unlockedOutcome: 'The property can enter service planning.',
      complete: progress.customerPropertyCreated,
      target: 'customer-accounts',
    },
    {
      id: 'first_route',
      label: 'Publish the first route',
      detail: 'Publish a persisted day plan for an active crew.',
      unlockedOutcome: 'The crew receives an authoritative service route.',
      complete: progress.firstRoutePublished,
      target: 'day-plan',
    },
    {
      id: 'first_service',
      label: 'Complete the first service',
      detail: 'Finish a persisted job with the required field evidence.',
      unlockedOutcome: 'The completed service can enter proof review.',
      complete: progress.firstServiceCompleted,
      target: 'day-plan',
    },
    {
      id: 'first_report',
      label: 'Deliver the first completion report',
      detail: 'Review and deliver customer-safe proof for a completed job.',
      unlockedOutcome: 'The company has reached its first delivered operating value.',
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
