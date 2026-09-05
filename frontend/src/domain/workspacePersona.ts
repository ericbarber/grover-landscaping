import type { MobileWorkspaceView } from '../components/MobileWorkspaceShell';
import type { WorkspaceIconName } from '../components/WorkspaceIcon';
import type { WorkspaceRolloutProjection } from '../api/client';

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

export interface WorkspaceFieldControlAvailability {
  jobDetails: boolean;
  stopProgress: boolean;
  routeChanges: boolean;
  fieldEvidence: boolean;
  report: boolean;
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

const rolloutUnitOrder: Partial<Record<WorkspacePersonaId, string[]>> = {
  'yard-owner': ['u1', 'u2', 'u3', 'u4'],
  'property-manager': ['p1', 'p2', 'p3', 'p4'],
  'crew-lead': ['c1', 'c2', 'c3', 'c4'],
  'crew-member': ['cm1', 'cm2', 'cm3', 'cm4'],
  'company-owner': ['o1', 'o2', 'o3', 'o4'],
  'company-manager': ['m1', 'm2', 'm3', 'm4'],
  dispatcher: ['d1', 'd2', 'd3', 'd4'],
  'billing-admin': ['b1', 'b2', 'b3'],
  support: ['s1', 's2', 's3', 's4'],
  general: ['g1'],
};

export function workspaceEnabledUnitForPersona(
  personaId: WorkspacePersonaId,
  rollout: WorkspaceRolloutProjection,
): string | null {
  const order = rolloutUnitOrder[personaId] ?? [];
  return rollout.personas
    .filter((candidate) => (
      candidate.personaId === personaId
      && candidate.enabledUnit
      && order.includes(candidate.enabledUnit)
    ))
    .map((candidate) => candidate.enabledUnit as string)
    .sort((left, right) => order.indexOf(right) - order.indexOf(left))[0] ?? null;
}

export function workspacePersonaForRollout(
  persona: WorkspacePersona,
  rollout: WorkspaceRolloutProjection | null,
): WorkspacePersona {
  if (!rollout || rollout.enforcementMode === 'legacy' || persona.id === 'general') {
    return persona;
  }

  const enabledUnit = workspaceEnabledUnitForPersona(persona.id, rollout);
  const allowedViews = new Set<MobileWorkspaceView>(['home']);
  if (
    (persona.id === 'yard-owner' && enabledUnit && enabledUnit !== 'u1')
    || (persona.id === 'property-manager' && enabledUnit)
    || (persona.id === 'billing-admin' && enabledUnit)
  ) {
    allowedViews.add('customer');
  }
  if (
    (persona.id === 'property-manager' && enabledUnit === 'p4')
    || (persona.id === 'company-owner' && enabledUnit)
    || (persona.id === 'company-manager' && enabledUnit)
    || (persona.id === 'dispatcher' && enabledUnit)
    || (persona.id === 'billing-admin' && ['b2', 'b3'].includes(enabledUnit ?? ''))
    || (persona.id === 'support' && enabledUnit)
  ) {
    allowedViews.add('manager');
  }
  if (
    ((persona.id === 'crew-lead' || persona.id === 'crew-member') && enabledUnit)
    || (persona.id === 'company-owner' && ['o2', 'o3', 'o4'].includes(enabledUnit ?? ''))
    || (persona.id === 'company-manager' && ['m2', 'm3', 'm4'].includes(enabledUnit ?? ''))
    || (persona.id === 'dispatcher' && ['d3', 'd4'].includes(enabledUnit ?? ''))
  ) {
    allowedViews.add('route');
  }
  if (
    ((persona.id === 'crew-lead' || persona.id === 'crew-member')
      && enabledUnit
      && !['c1', 'cm1'].includes(enabledUnit))
    || (persona.id === 'company-owner' && ['o2', 'o3', 'o4'].includes(enabledUnit ?? ''))
    || (persona.id === 'company-manager' && ['m2', 'm3', 'm4'].includes(enabledUnit ?? ''))
    || (persona.id === 'dispatcher' && ['d3', 'd4'].includes(enabledUnit ?? ''))
  ) {
    allowedViews.add('jobs');
    allowedViews.add('job');
  }

  return {
    ...persona,
    defaultView: allowedViews.has(persona.defaultView) ? persona.defaultView : 'home',
    navigation: persona.navigation.filter(({ view }) => allowedViews.has(view)),
  };
}

export function workspaceFieldControlsForPersona(
  personaId: WorkspacePersonaId,
  rolloutUnit: string | null | undefined,
): WorkspaceFieldControlAvailability {
  if (rolloutUnit === undefined) {
    return {
      jobDetails: true,
      stopProgress: true,
      routeChanges: true,
      fieldEvidence: true,
      report: true,
    };
  }

  if (personaId === 'crew-lead') {
    return {
      jobDetails: ['c2', 'c3', 'c4'].includes(rolloutUnit ?? ''),
      stopProgress: ['c2', 'c3', 'c4'].includes(rolloutUnit ?? ''),
      routeChanges: rolloutUnit === 'c4',
      fieldEvidence: ['c3', 'c4'].includes(rolloutUnit ?? ''),
      report: ['c3', 'c4'].includes(rolloutUnit ?? ''),
    };
  }
  if (personaId === 'crew-member') {
    return {
      jobDetails: ['cm2', 'cm3', 'cm4'].includes(rolloutUnit ?? ''),
      stopProgress: ['cm2', 'cm3', 'cm4'].includes(rolloutUnit ?? ''),
      routeChanges: false,
      fieldEvidence: ['cm3', 'cm4'].includes(rolloutUnit ?? ''),
      report: ['cm3', 'cm4'].includes(rolloutUnit ?? ''),
    };
  }

  const oversightUnits: Partial<Record<WorkspacePersonaId, string[]>> = {
    'company-owner': ['o2', 'o3', 'o4'],
    'company-manager': ['m2', 'm3', 'm4'],
    dispatcher: ['d3', 'd4'],
  };
  return {
    jobDetails: oversightUnits[personaId]?.includes(rolloutUnit ?? '') ?? false,
    stopProgress: false,
    routeChanges: false,
    fieldEvidence: false,
    report: (personaId === 'company-owner' && rolloutUnit === 'o4')
      || (personaId === 'company-manager' && rolloutUnit === 'm4'),
  };
}
