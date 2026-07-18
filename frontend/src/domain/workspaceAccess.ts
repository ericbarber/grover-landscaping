export type WorkspaceGuidance = {
  label: string;
  description: string;
  managerTools: boolean;
};

export function workspaceGuidanceForRoles(roles: string[]): WorkspaceGuidance {
  if (roles.some((role) => role === 'OrganizationOwner' || role === 'SupportAdmin')) {
    return {
      label: 'Organization administration',
      description: 'Manage routes, customers, properties, and team access.',
      managerTools: true,
    };
  }
  if (roles.some((role) => role === 'Manager' || role === 'PropertyManager')) {
    return {
      label: 'Manager workspace',
      description: 'Use the manager tools available to your organization role.',
      managerTools: true,
    };
  }
  if (roles.some((role) => role === 'CrewLead' || role === 'CrewMember')) {
    return {
      label: 'Crew workspace',
      description: 'Review assigned routes, jobs, and field completion work.',
      managerTools: false,
    };
  }
  if (roles.includes('PropertyOwner')) {
    return {
      label: 'Customer access',
      description: 'Your organization access is active; customer-scoped work remains role protected.',
      managerTools: false,
    };
  }
  return {
    label: 'Access refreshing',
    description: 'Checking active organization memberships for this signed-in account.',
    managerTools: false,
  };
}
