import type { MobileWorkspaceView } from '../components/MobileWorkspaceShell';

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
  navigation: Array<{ view: MobileWorkspaceView; label: string; symbol: string }>;
}

const fieldNavigation: WorkspacePersona['navigation'] = [
  { view: 'home', label: 'Home', symbol: '⌂' },
  { view: 'route', label: 'Route', symbol: '↗' },
  { view: 'jobs', label: 'Jobs', symbol: '☷' },
  { view: 'job', label: 'Job', symbol: '✓' },
];

const managerNavigation: WorkspacePersona['navigation'] = [
  { view: 'home', label: 'Home', symbol: '⌂' },
  { view: 'manager', label: 'Manage', symbol: '▦' },
  ...fieldNavigation.slice(1),
];

const personaDefinitions: Record<WorkspacePersonaId, WorkspacePersona> = {
  'yard-owner': {
    id: 'yard-owner',
    label: 'Yard owner',
    description: 'Properties, upcoming service, reports, photos, and bids',
    defaultView: 'home',
    navigation: [
      { view: 'home', label: 'Home', symbol: '⌂' },
      { view: 'customer', label: 'My yard', symbol: '◇' },
    ],
  },
  'property-manager': {
    id: 'property-manager',
    label: 'Property manager',
    description: 'Portfolio service, vendor work, reports, and approvals',
    defaultView: 'home',
    navigation: [
      { view: 'home', label: 'Home', symbol: '⌂' },
      { view: 'customer', label: 'Portfolio', symbol: '◇' },
      { view: 'manager', label: 'Manage', symbol: '▦' },
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
      { view: 'home', label: 'Home', symbol: '⌂' },
      { view: 'manager', label: 'Billing', symbol: '▦' },
      { view: 'customer', label: 'Accounts', symbol: '◇' },
    ],
  },
  support: {
    id: 'support',
    label: 'Support administrator',
    description: 'Tenant support, access review, recovery, and diagnostics',
    defaultView: 'home',
    navigation: [
      { view: 'home', label: 'Home', symbol: '⌂' },
      { view: 'manager', label: 'Support', symbol: '▦' },
    ],
  },
  general: {
    id: 'general',
    label: 'Team member',
    description: 'Available work for the signed-in organization role',
    defaultView: 'home',
    navigation: fieldNavigation,
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
