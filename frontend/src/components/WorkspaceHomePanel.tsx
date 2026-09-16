import type { WorkspacePersona } from '../domain/workspacePersona';
import { classifyRouteDate, type CrewRouteOverview } from '../domain/dayPlans';
import type { MobileWorkspaceView } from './MobileWorkspaceShell';
import { GroverBrand } from './GroverBrand';
import { WorkspaceIcon } from './WorkspaceIcon';
import { WorkspaceStatusBadge, WorkspaceStatusNotice } from './WorkspaceStatus';

const viewDescriptions: Record<MobileWorkspaceView, string> = {
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
  if (persona.id === 'yard-owner') return 'Your yard, all in one place.';
  if (persona.id === 'property-manager') return 'Keep every property moving.';
  if (persona.id === 'crew-lead' || persona.id === 'crew-member') {
    return 'A clear plan for the work ahead.';
  }
  if (persona.id === 'company-owner' || persona.id === 'company-manager') {
    return 'Run today with confidence.';
  }
  if (persona.id === 'dispatcher') return 'Keep crews and schedules aligned.';
  if (persona.id === 'billing-admin') return 'Keep completed work revenue-ready.';
  if (persona.id === 'support') return 'Resolve what needs attention.';
  return 'Everything you need for today.';
}

export function personaHomePromise(persona: WorkspacePersona): string {
  if (persona.id === 'yard-owner') return 'See the care behind every visit—and the difference it makes.';
  if (persona.id === 'property-manager') return 'One clear view from service plans to property-ready proof.';
  if (persona.id === 'crew-lead' || persona.id === 'crew-member') {
    return 'The right details at every stop, from arrival to finished work.';
  }
  if (persona.id === 'company-owner' || persona.id === 'company-manager') {
    return 'Turn great field work into a business customers trust.';
  }
  if (persona.id === 'dispatcher') return 'Give every crew a clear route and every customer a reliable day.';
  if (persona.id === 'billing-admin') return 'Move verified work from the field to revenue with confidence.';
  if (persona.id === 'support') return 'Find the full story quickly and keep every relationship strong.';
  return 'Bring every property, person, and promise into one clear view.';
}

export function personaProgressLanguage(persona: WorkspacePersona): {
  eyebrow: string;
  completed: string;
  total: string;
  itemSingular: string;
  itemPlural: string;
} {
  if (persona.id === 'yard-owner') {
    return {
      eyebrow: 'Service progress', completed: 'visits complete', total: 'scheduled',
      itemSingular: 'visit', itemPlural: 'visits',
    };
  }
  if (persona.id === 'property-manager') {
    return {
      eyebrow: 'Portfolio progress', completed: 'services complete', total: 'scheduled',
      itemSingular: 'service', itemPlural: 'services',
    };
  }
  if (persona.id === 'crew-lead' || persona.id === 'crew-member') {
    return {
      eyebrow: 'Route progress', completed: 'stops finished', total: 'assigned',
      itemSingular: 'stop', itemPlural: 'stops',
    };
  }
  if (persona.id === 'billing-admin') {
    return {
      eyebrow: 'Revenue readiness', completed: 'jobs complete', total: 'to review',
      itemSingular: 'job', itemPlural: 'jobs',
    };
  }
  return {
    eyebrow: 'Field delivery', completed: 'jobs complete', total: 'assigned',
    itemSingular: 'job', itemPlural: 'jobs',
  };
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

export type PortalHomeReadState = 'loading' | 'ready' | 'access_required' | 'inconsistent' | 'unavailable';

export function homeContinuityStatus(
  personaId: WorkspacePersona['id'],
  portalReadState: PortalHomeReadState,
  routeOverview: CrewRouteOverview,
): { title: string; detail: string; tone: 'attention' | 'ready' | 'complete'; progressAvailable: boolean } | null {
  if (personaId === 'yard-owner' && portalReadState !== 'ready') {
    const states = {
      loading: ['Checking your visits', 'Your service summary will appear after account access is checked.'],
      access_required: ['Customer portal access is not active', 'Review account access before relying on a visit summary.'],
      inconsistent: ['Portal access needs review', 'Your account and property access could not be reconciled. Review account access.'],
      unavailable: ['Visits could not be loaded', 'Retry My yard when the service is available.'],
    } as const;
    const [title, detail] = states[portalReadState];
    return { title, detail, tone: portalReadState === 'loading' ? 'ready' : 'attention', progressAvailable: false };
  }
  if (personaId !== 'crew-lead' && personaId !== 'crew-member') return null;
  if (routeOverview.source === 'loading') {
    return { title: 'Checking your route', detail: 'The crew plan is loading.', tone: 'ready', progressAvailable: false };
  }
  if (routeOverview.source === 'missing') {
    return { title: 'No published route is available', detail: 'Ask a manager to publish a plan for this crew.', tone: 'attention', progressAvailable: false };
  }
  if (routeOverview.source === 'unavailable') {
    return { title: 'Route could not be loaded', detail: 'Retry Route when the service is available.', tone: 'attention', progressAvailable: false };
  }
  const routeDate = classifyRouteDate(routeOverview.serviceDate ?? '');
  if (routeDate.kind === 'today') {
    if (routeOverview.source === 'local') {
      return { title: 'Local route preview', detail: 'The published crew plan could not be verified. Check with a manager before starting stops.', tone: 'attention', progressAvailable: true };
    }
    if (routeOverview.totalStops === 0) {
      return { title: 'No stops on today’s plan', detail: 'Check with a manager before assuming no field work is assigned.', tone: 'ready', progressAvailable: true };
    }
    if (routeOverview.completedStops >= routeOverview.totalStops) {
      return { title: 'Today’s route stops are finished', detail: 'Open Route to confirm final sync and proof.', tone: 'complete', progressAvailable: true };
    }
    const remaining = routeOverview.totalStops - routeOverview.completedStops;
    return { title: `${remaining} ${remaining === 1 ? 'stop' : 'stops'} on today’s plan`, detail: 'Open Route to review stop progress and sync status.', tone: 'ready', progressAvailable: true };
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

export function WorkspaceHomePanel({
  assignedJobCount,
  completedJobCount,
  hasSelectedJob,
  hasWorkspaceRole,
  onOpen,
  pendingChangeCount,
  persona,
  portalReadState = 'ready',
  routeOverview = { source: 'loading', totalStops: 0, completedStops: 0 },
  signedInName,
}: {
  assignedJobCount: number;
  completedJobCount: number;
  hasSelectedJob: boolean;
  hasWorkspaceRole: boolean;
  onOpen: (view: MobileWorkspaceView) => void;
  pendingChangeCount: number;
  persona: WorkspacePersona;
  portalReadState?: PortalHomeReadState;
  routeOverview?: CrewRouteOverview;
  signedInName: string;
}) {
  if (!hasWorkspaceRole) {
    return (
      <section className="mx-auto grid max-w-3xl gap-4 lg:grid-cols-2" aria-labelledby="workspace-access-heading">
        <WorkspaceStatusNotice
          detail="This signed-in account has no active organization membership. Ask an organization owner to send a new invitation or restore the membership before opening protected work."
          role="alert"
          title="No active workspace role"
          tone="warning"
        />
        <article className="grover-card p-5 text-sm text-slate-600">
          <p className="grover-eyebrow">Signed-in identity</p>
          <h2 className="mt-2 font-display text-2xl font-black text-forest" id="workspace-access-heading">
            {signedInName}
          </h2>
          <p className="mt-2 leading-6">
            Workspace navigation remains limited to Home until active access is assigned and verified.
          </p>
        </article>
      </section>
    );
  }

  const actions = workspaceHomeActions(persona, hasSelectedJob);
  const primaryAction = actions[0];
  const secondaryActions = actions.slice(1);
  const now = new Date();
  const isCrew = persona.id === 'crew-lead' || persona.id === 'crew-member';
  const displayedTotal = isCrew ? routeOverview.totalStops : assignedJobCount;
  const displayedCompleted = isCrew ? routeOverview.completedStops : completedJobCount;
  const continuityStatus = homeContinuityStatus(persona.id, portalReadState, routeOverview);
  const progressAvailable = continuityStatus?.progressAvailable ?? true;
  const progress = progressAvailable && displayedTotal > 0
    ? Math.min(100, Math.round((displayedCompleted / displayedTotal) * 100))
    : 0;
  const firstName = signedInName.split(/[\s@]/)[0] || signedInName;
  const progressLanguage = personaProgressLanguage(persona);
  const priorityStatus = homePriorityStatus({
    assignedJobCount: displayedTotal,
    completedJobCount: displayedCompleted,
    itemPlural: progressLanguage.itemPlural,
    itemSingular: progressLanguage.itemSingular,
    pendingChangeCount,
  });
  const visibleStatus = pendingChangeCount > 0 ? priorityStatus : continuityStatus ?? priorityStatus;
  const routeIsCurrent = !isCrew || classifyRouteDate(routeOverview.serviceDate ?? '').kind === 'today';
  const actionDescription = isCrew && !routeIsCurrent
    ? 'Check the route date and ask a manager for a current plan.'
    : primaryAction?.description;
  const alertAction = pendingChangeCount > 0
    ? actions.find((action) => action.view === 'jobs') ?? primaryAction
    : primaryAction;

  return (
    <section className="space-y-4 lg:grid lg:grid-cols-12 lg:gap-4 lg:space-y-0">
      <article className="relative min-h-[19rem] overflow-hidden rounded-2xl bg-emerald-950 p-5 text-white shadow-grover-md lg:hidden">
        <img
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
          src="/brand/grover-landscape-home-hero.webp"
        />
        <span className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/70 to-emerald-950/10" />
        <span className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-slate-950/80 to-transparent" />
        <div className="relative flex min-h-[16.5rem] flex-col">
          <div className="flex items-center justify-between gap-3">
            <GroverBrand className="text-sand" />
            <p className="rounded-lg border border-white/15 bg-slate-950/30 px-2.5 py-1 text-xs font-semibold text-slate-100 backdrop-blur-sm">
              {now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
          </div>
          <div className="mt-auto max-w-sm">
            <p className="text-sm font-semibold text-emerald-200">
              {homeGreeting(now.getHours())}, {firstName}
            </p>
            <h2 className="mt-2 max-w-xs font-display text-3xl font-bold leading-[1.02] tracking-tight">
              {personaHomeHeadline(persona)}
            </h2>
            <p className="mt-3 max-w-xs text-sm font-medium leading-5 text-slate-100">
              {personaHomePromise(persona)}
            </p>
            <div className="mt-4 flex items-center gap-2 text-[0.68rem] font-black uppercase tracking-[0.12em] text-white">
              <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1.5 backdrop-blur-sm">
                {persona.label}
              </span>
              <span className="text-emerald-300" aria-hidden="true">•</span>
              <span>Plan</span>
              <span className="text-emerald-300" aria-hidden="true">•</span>
              <span>Care</span>
              <span className="text-emerald-300" aria-hidden="true">•</span>
              <span>Proof</span>
            </div>
          </div>
        </div>
      </article>

      <article className="grover-card p-4 lg:col-span-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              {progressLanguage.eyebrow}
            </p>
            <p className="mt-1 text-2xl font-black text-slate-950">
              {progressAvailable ? `${displayedCompleted} of ${displayedTotal}` : 'Not available'}
            </p>
            {progressAvailable ? (
              <p className="mt-0.5 text-xs font-semibold text-slate-500">
                {progressLanguage.completed}
              </p>
            ) : null}
          </div>
          {progressAvailable ? <p className="text-lg font-black text-emerald-800">{progress}%</p> : null}
        </div>
        {progressAvailable ? (
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-[width]"
              style={{ width: `${progress}%` }}
            />
          </div>
        ) : null}
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-600">
            {progressAvailable
              ? isCrew ? `${displayedTotal} on this plan` : `${displayedTotal} ${progressLanguage.total}`
              : 'Awaiting a verified read'}
          </span>
          <WorkspaceStatusBadge tone={pendingChangeCount > 0 || !progressAvailable || (isCrew && !routeIsCurrent) ? 'warning' : 'success'}>
            {pendingChangeCount > 0
              ? `${pendingChangeCount} waiting to sync`
              : !progressAvailable ? 'Status unverified'
                : isCrew && routeOverview.source === 'local' ? 'Local preview'
                  : isCrew && !routeIsCurrent ? 'Read only'
                    : isCrew ? 'Route loaded'
                      : persona.id === 'yard-owner' ? 'Visits loaded' : 'Everything synced'}
          </WorkspaceStatusBadge>
        </div>
      </article>

      <WorkspaceStatusNotice
        className="lg:col-span-4"
        detail={visibleStatus.detail}
        title={visibleStatus.title}
        tone={visibleStatus.tone === 'attention'
          ? 'warning'
          : visibleStatus.tone === 'complete'
            ? 'success'
            : 'info'}
      >
        {alertAction ? (
          <button
            className="min-h-11 rounded-lg border border-current/25 bg-white/70 px-3 py-2 text-xs font-black"
            onClick={() => onOpen(alertAction.view)}
            type="button"
          >
            {pendingChangeCount > 0 ? `Review ${alertAction.label}` : `Open ${alertAction.label}`}
          </button>
        ) : null}
      </WorkspaceStatusNotice>

      {primaryAction ? (
        <button
          className="group flex min-h-24 w-full items-center justify-between gap-4 rounded-2xl bg-emerald-800 p-4 text-left text-white shadow-lg shadow-emerald-950/15 lg:col-span-4"
          onClick={() => onOpen(primaryAction.view)}
          type="button"
        >
          <span>
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">
              Recommended next
            </span>
            <span className="mt-1 block text-xl font-black">{primaryAction.label}</span>
            <span className="mt-1 block text-xs leading-5 text-emerald-100">
              {actionDescription}
            </span>
          </span>
          <span
            aria-hidden="true"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/15 text-2xl transition-transform group-hover:translate-x-1"
          >
            <WorkspaceIcon className="size-6" name="forward" />
          </span>
        </button>
      ) : null}

      {secondaryActions.length > 0 ? (
        <section className="grover-card p-4 lg:col-span-12">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
            Your workspace
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {secondaryActions.map((action) => (
              <button
                className="min-h-24 rounded-xl border border-slate-200 bg-slate-50 p-3 text-left"
                key={action.view}
                onClick={() => onOpen(action.view)}
                type="button"
              >
                <WorkspaceIcon className="size-5 text-emerald-800" name={action.icon} />
                <span className="mt-2 block text-sm font-black text-slate-900">{action.label}</span>
                <span className="mt-1 line-clamp-2 block text-xs leading-4 text-slate-500">
                  {action.description}
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

    </section>
  );
}
