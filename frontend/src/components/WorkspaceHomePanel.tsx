import type { WorkspacePersona } from '../domain/workspacePersona';
import type { MobileWorkspaceView } from './MobileWorkspaceShell';

const viewDescriptions: Record<MobileWorkspaceView, string> = {
  home: 'Your signed-in workspace summary',
  route: 'Continue today’s route and stop progress',
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

export function WorkspaceHomePanel({
  assignedJobCount,
  completedJobCount,
  hasSelectedJob,
  onOpen,
  pendingChangeCount,
  persona,
  signedInName,
}: {
  assignedJobCount: number;
  completedJobCount: number;
  hasSelectedJob: boolean;
  onOpen: (view: MobileWorkspaceView) => void;
  pendingChangeCount: number;
  persona: WorkspacePersona;
  signedInName: string;
}) {
  const actions = workspaceHomeActions(persona, hasSelectedJob);
  const primaryAction = actions[0];
  const secondaryActions = actions.slice(1);
  const now = new Date();
  const progress = assignedJobCount > 0
    ? Math.min(100, Math.round((completedJobCount / assignedJobCount) * 100))
    : 0;
  const firstName = signedInName.split(/[\s@]/)[0] || signedInName;

  return (
    <section className="space-y-4 lg:hidden">
      <article className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-emerald-950 via-slate-950 to-slate-900 p-5 text-white shadow-xl">
        <span className="absolute -right-12 -top-16 h-40 w-40 rounded-full border border-emerald-400/20 bg-emerald-400/10" />
        <span className="absolute -bottom-16 right-12 h-32 w-32 rounded-full border border-white/10" />
        <div className="relative">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300">
              Grover
            </p>
            <p className="text-xs font-semibold text-slate-300">
              {now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
          </div>
          <p className="mt-8 text-sm font-semibold text-emerald-200">
            {homeGreeting(now.getHours())}, {firstName}
          </p>
          <h2 className="mt-2 max-w-xs text-3xl font-black leading-[1.05] tracking-tight">
            {personaHomeHeadline(persona)}
          </h2>
          <div className="mt-5 inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-bold text-slate-100 backdrop-blur">
            {persona.label}
          </div>
        </div>
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Today’s progress
            </p>
            <p className="mt-1 text-2xl font-black text-slate-950">
              {completedJobCount} of {assignedJobCount}
            </p>
          </div>
          <p className="text-lg font-black text-emerald-800">{progress}%</p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-[width]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-600">{assignedJobCount} assigned</span>
          <span className={`rounded-full px-2 py-1 font-bold ${
            pendingChangeCount > 0
              ? 'bg-amber-100 text-amber-900'
              : 'bg-emerald-100 text-emerald-800'
          }`}>
            {pendingChangeCount > 0 ? `${pendingChangeCount} waiting to sync` : 'Everything synced'}
          </span>
        </div>
      </article>

      {primaryAction ? (
        <button
          className="group flex min-h-24 w-full items-center justify-between gap-4 rounded-2xl bg-emerald-800 p-4 text-left text-white shadow-lg shadow-emerald-950/15"
          onClick={() => onOpen(primaryAction.view)}
          type="button"
        >
          <span>
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">
              Recommended next
            </span>
            <span className="mt-1 block text-xl font-black">{primaryAction.label}</span>
            <span className="mt-1 block text-xs leading-5 text-emerald-100">
              {primaryAction.description}
            </span>
          </span>
          <span
            aria-hidden="true"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/15 text-2xl transition-transform group-hover:translate-x-1"
          >
            →
          </span>
        </button>
      ) : null}

      {secondaryActions.length > 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
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
                <span aria-hidden="true" className="text-lg text-emerald-800">{action.symbol}</span>
                <span className="mt-2 block text-sm font-black text-slate-900">{action.label}</span>
                <span className="mt-1 line-clamp-2 block text-xs leading-4 text-slate-500">
                  {action.description}
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <article className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        <p className="font-bold text-slate-900">Signed in as {signedInName}</p>
        <p className="mt-1 text-xs leading-5">
          {persona.description}
        </p>
      </article>
    </section>
  );
}
