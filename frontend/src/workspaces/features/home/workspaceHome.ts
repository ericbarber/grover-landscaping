import { classifyRouteDate, type CrewRouteOverview } from '../../../domain/dayPlans';
import type { CustomerPortalReadState } from '../customer/customerWorkspace';
import type {
  WorkspacePersona,
  WorkspacePersonaId,
  WorkspaceProgressLanguage,
  WorkspaceView,
} from '../../core/types';

const viewDescriptions: Record<WorkspaceView, string> = {
  home: 'Your signed-in workspace summary',
  route: 'Review the crew route and its service date',
  jobs: 'Review assigned customers and field work',
  job: 'Continue the selected job workflow',
  manager: 'Open operations and administration tools',
  customer: 'Review properties, service, reports, and bids',
};

export function workspaceHomeActions(persona: WorkspacePersona, hasSelectedJob: boolean) {
  return persona.navigation
    .filter((item) => item.view !== 'home')
    .filter((item) => item.view !== 'job' || hasSelectedJob)
    .map((item) => ({
      ...item,
      description: viewDescriptions[item.view],
    }));
}

export function homeGreeting(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function personaHomeHeadline(persona: WorkspacePersona): string {
  return persona.home.headline;
}

export function personaHomePromise(persona: WorkspacePersona): string {
  return persona.home.promise;
}

export function personaProgressLanguage(persona: WorkspacePersona): WorkspaceProgressLanguage {
  return persona.home.progress;
}

export function homeRouteIsCurrent(
  personaId: WorkspacePersonaId,
  routeOverview: CrewRouteOverview,
): boolean {
  return (
    (personaId !== 'crew-lead' && personaId !== 'crew-member')
    || classifyRouteDate(routeOverview.serviceDate ?? '').kind === 'today'
  );
}

export function homePriorityStatus({
  assignedJobCount,
  completedJobCount,
  itemPlural = 'jobs',
  itemSingular = 'job',
  pendingChangeCount,
}: {
  assignedJobCount: number;
  completedJobCount: number;
  itemPlural?: string;
  itemSingular?: string;
  pendingChangeCount: number;
}): { tone: 'attention' | 'ready' | 'complete'; title: string; detail: string } {
  if (pendingChangeCount > 0) {
    return {
      tone: 'attention',
      title: 'Sync needs attention',
      detail: `${pendingChangeCount} saved ${pendingChangeCount === 1 ? 'change is' : 'changes are'} waiting to reach the server.`,
    };
  }
  if (assignedJobCount === 0) {
    return {
      tone: 'ready',
      title: 'You’re clear for now',
      detail: `No ${itemPlural} are currently scheduled or assigned. Use your workspace shortcuts for the next task.`,
    };
  }
  if (completedJobCount >= assignedJobCount) {
    return {
      tone: 'complete',
      title: `Today’s ${itemPlural} are complete`,
      detail: 'Everything is synced and ready for the next workflow.',
    };
  }
  const remaining = assignedJobCount - completedJobCount;
  return {
    tone: 'ready',
    title: `${remaining} ${remaining === 1 ? itemSingular : itemPlural} remaining`,
    detail: 'Everything is synced. Continue with the recommended next action.',
  };
}

export function homeContinuityStatus(
  personaId: WorkspacePersonaId,
  portalReadState: CustomerPortalReadState,
  routeOverview: CrewRouteOverview,
): {
  title: string;
  detail: string;
  tone: 'attention' | 'ready' | 'complete';
  progressAvailable: boolean;
} | null {
  if (personaId === 'yard-owner' && portalReadState !== 'ready') {
    const states = {
      loading: ['Checking your visits', 'Your service summary will appear after account access is checked.'],
      access_required: ['Customer portal access is not active', 'Review account access before relying on a visit summary.'],
      inconsistent: ['Portal access needs review', 'Your account and property access could not be reconciled. Review account access.'],
      unavailable: ['Visits could not be loaded', 'Retry My yard when the service is available.'],
    } as const;
    const [title, detail] = states[portalReadState];
    return {
      title,
      detail,
      tone: portalReadState === 'loading' ? 'ready' : 'attention',
      progressAvailable: false,
    };
  }
  if (personaId === 'property-manager' && portalReadState !== 'ready') {
    const states = {
      loading: ['Checking your properties', 'Portfolio service summaries will appear after account access is checked.'],
      access_required: ['Property portfolio access is not active', 'Review property access before relying on a service summary.'],
      inconsistent: ['Property access needs review', 'Your property grant and membership could not be reconciled.'],
      unavailable: ['Portfolio visits could not be loaded', 'Retry Portfolio when the service is available.'],
    } as const;
    const [title, detail] = states[portalReadState];
    return {
      title,
      detail,
      tone: portalReadState === 'loading' ? 'ready' : 'attention',
      progressAvailable: false,
    };
  }
  if (personaId !== 'crew-lead' && personaId !== 'crew-member') return null;
  if (routeOverview.source === 'loading') {
    return {
      title: 'Checking your route',
      detail: 'The crew plan is loading.',
      tone: 'ready',
      progressAvailable: false,
    };
  }
  if (routeOverview.source === 'missing') {
    return {
      title: 'No published route is available',
      detail: 'Ask a manager to publish a plan for this crew.',
      tone: 'attention',
      progressAvailable: false,
    };
  }
  if (routeOverview.source === 'unavailable') {
    return {
      title: 'Route could not be loaded',
      detail: 'Retry Route when the service is available.',
      tone: 'attention',
      progressAvailable: false,
    };
  }
  const routeDate = classifyRouteDate(routeOverview.serviceDate ?? '');
  if (routeDate.kind === 'today') {
    if (routeOverview.source === 'local') {
      return {
        title: 'Local route preview',
        detail: 'The published crew plan could not be verified. Check with a manager before starting stops.',
        tone: 'attention',
        progressAvailable: true,
      };
    }
    if (routeOverview.totalStops === 0) {
      return {
        title: 'No stops on today’s plan',
        detail: 'Check with a manager before assuming no field work is assigned.',
        tone: 'ready',
        progressAvailable: true,
      };
    }
    if (routeOverview.completedStops >= routeOverview.totalStops) {
      return {
        title: 'Today’s route stops are finished',
        detail: 'Open Route to confirm final sync and proof.',
        tone: 'complete',
        progressAvailable: true,
      };
    }
    const remaining = routeOverview.totalStops - routeOverview.completedStops;
    return {
      title: `${remaining} ${remaining === 1 ? 'stop' : 'stops'} on today’s plan`,
      detail: 'Open Route to review stop progress and sync status.',
      tone: 'ready',
      progressAvailable: true,
    };
  }
  const detail = routeDate.kind === 'past'
    ? 'This plan is read only. Ask a manager for a current plan before starting stops.'
    : routeDate.kind === 'upcoming'
      ? 'Stop progress opens on the service day.'
      : 'Confirm the service date with a manager before starting stops.';
  return {
    title: `${routeDate.label} · ${routeDate.dateLabel}`,
    detail: routeOverview.source === 'local' ? `${detail} This is a local preview.` : detail,
    tone: 'attention',
    progressAvailable: true,
  };
}
