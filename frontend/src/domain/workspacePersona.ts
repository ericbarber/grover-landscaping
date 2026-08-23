import type { MobileWorkspaceView } from '../components/MobileWorkspaceShell';
import type { WorkspaceIconName } from '../components/WorkspaceIcon';

export type WorkspacePersonaId =
  | 'yard-owner'
  | 'property-manager'
  | 'crew-lead'
  | 'crew-member'
  | 'company-owner'
  | 'company-manager'
  | 'dispatcher'
  | 'billing-admin'
  | 'support'
  | 'general';

export interface WorkspacePersona {
  id: WorkspacePersonaId;
  label: string;
  description: string;
  defaultView: MobileWorkspaceView;
  navigation: Array<{ view: MobileWorkspaceView; label: string; icon: WorkspaceIconName }>;
}

export interface WorkspaceSurfaces {
  fieldOperations: boolean;
  customerCare: boolean;
  management: boolean;
}

const fieldNavigation: WorkspacePersona['navigation'] = [
  { view: 'home', label: 'Home', icon: 'home' },
  { view: 'route', label: 'Route', icon: 'route' },
  { view: 'jobs', label: 'Jobs', icon: 'jobs' },
  { view: 'job', label: 'Job', icon: 'job' },
];

const managerNavigation: WorkspacePersona['navigation'] = [
  { view: 'home', label: 'Home', icon: 'home' },
  { view: 'manager', label: 'Manage', icon: 'manage' },
  ...fieldNavigation.slice(1),
];

const personaDefinitions: Record<WorkspacePersonaId, WorkspacePersona> = {
  'yard-owner': {
    id: 'yard-owner',
    label: 'Yard owner',
    description: 'Properties, upcoming service, reports, photos, and bids',
    defaultView: 'home',
    navigation: [
      { view: 'home', label: 'Home', icon: 'home' },
      { view: 'customer', label: 'My yard', icon: 'customer' },
    ],
  },
  'property-manager': {
    id: 'property-manager',
    label: 'Property manager',
    description: 'Portfolio service, vendor work, reports, and approvals',
    defaultView: 'home',
    navigation: [
      { view: 'home', label: 'Home', icon: 'home' },
      { view: 'customer', label: 'Portfolio', icon: 'customer' },
      { view: 'manager', label: 'Manage', icon: 'manage' },
    ],
  },
  'crew-lead': {
    id: 'crew-lead',
    label: 'Crew lead',
    description: 'Today’s route, crew progress, field work, and exceptions',
    defaultView: 'home',
    navigation: fieldNavigation,
  },
  'crew-member': {
    id: 'crew-member',
    label: 'Crew member',
    description: 'Assigned route, job steps, photos, and completion evidence',
    defaultView: 'home',
    navigation: fieldNavigation,
  },
  'company-owner': {
    id: 'company-owner',
    label: 'Yard-care company owner',
    description: 'Company operations, customers, teams, routes, and recovery',
    defaultView: 'home',
    navigation: managerNavigation,
  },
  'company-manager': {
    id: 'company-manager',
    label: 'Yard-care company manager',
    description: 'Dispatch, schedules, customers, reports, and daily operations',
    defaultView: 'home',
    navigation: managerNavigation,
  },
  dispatcher: {
    id: 'dispatcher',
    label: 'Dispatcher',
    description: 'Route risk, crew workload, assignments, and schedule changes',
    defaultView: 'home',
    navigation: managerNavigation,
  },
  'billing-admin': {
    id: 'billing-admin',
    label: 'Billing administrator',
    description: 'Customer accounts, bids, approvals, and billing readiness',
    defaultView: 'home',
    navigation: [
      { view: 'home', label: 'Home', icon: 'home' },
      { view: 'manager', label: 'Billing', icon: 'manage' },
      { view: 'customer', label: 'Accounts', icon: 'customer' },
    ],
  },
  support: {
    id: 'support',
    label: 'Support administrator',
    description: 'Tenant support, access review, recovery, and diagnostics',
    defaultView: 'home',
    navigation: [
      { view: 'home', label: 'Home', icon: 'home' },
      { view: 'manager', label: 'Support', icon: 'manage' },
    ],
  },
  general: {
    id: 'general',
    label: 'Team member',
    description: 'No active organization role is assigned to this account',
    defaultView: 'home',
    navigation: [
      { view: 'home', label: 'Home', icon: 'home' },
    ],
  },
};

const rolePersonaIds: Record<string, WorkspacePersonaId> = {
  PropertyOwner: 'yard-owner',
  PropertyManager: 'property-manager',
  CrewLead: 'crew-lead',
  CrewMember: 'crew-member',
  OrganizationOwner: 'company-owner',
  Manager: 'company-manager',
  Dispatcher: 'dispatcher',
  BillingAdmin: 'billing-admin',
  SupportAdmin: 'support',
};

const priority: WorkspacePersonaId[] = [
  'company-owner',
  'company-manager',
  'property-manager',
  'crew-lead',
  'crew-member',
  'yard-owner',
  'dispatcher',
  'billing-admin',
  'support',
];

export function workspacePersonasForRoles(roles: string[]): WorkspacePersona[] {
  const ids = new Set(
    roles.map((role) => rolePersonaIds[role]).filter(
      (id): id is WorkspacePersonaId => Boolean(id),
    ),
  );
  const personas = priority.filter((id) => ids.has(id)).map((id) => personaDefinitions[id]);
  return personas.length > 0 ? personas : [personaDefinitions.general];
}

export function workspaceSurfacesForPersona(
  personaId: WorkspacePersonaId,
): WorkspaceSurfaces {
  if (personaId === 'yard-owner') {
    return { fieldOperations: false, customerCare: true, management: false };
  }
  if (personaId === 'property-manager' || personaId === 'billing-admin') {
    return { fieldOperations: false, customerCare: true, management: true };
  }
  if (personaId === 'crew-lead' || personaId === 'crew-member') {
    return { fieldOperations: true, customerCare: false, management: false };
  }
  if (personaId === 'general') {
    return { fieldOperations: false, customerCare: false, management: false };
  }
  if (personaId === 'support') {
    return { fieldOperations: false, customerCare: false, management: true };
  }
  return { fieldOperations: true, customerCare: false, management: true };
}
