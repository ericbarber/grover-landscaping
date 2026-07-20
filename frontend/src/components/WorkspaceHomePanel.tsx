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

export function homePriorityStatus({
  assignedJobCount,
  completedJobCount,
  pendingChangeCount,
}: {
  assignedJobCount: number;
  completedJobCount: number;
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
      detail: 'No field work is currently assigned. Use your workspace shortcuts for the next task.',
    };
  }
  if (completedJobCount >= assignedJobCount) {
    return {
      tone: 'complete',
      title: 'Today’s assigned work is complete',
      detail: 'Everything is synced and ready for the next workflow.',
    };
  }
  const remaining = assignedJobCount - completedJobCount;
  return {
    tone: 'ready',
    title: `${remaining} ${remaining === 1 ? 'job' : 'jobs'} remaining`,
    detail: 'Everything is synced. Continue with the recommended next action.',
  };
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
  const priorityStatus = homePriorityStatus({
    assignedJobCount,
    completedJobCount,
    pendingChangeCount,
  });

  return (
    <section className="space-y-4 lg:hidden">
      <article className="relative min-h-[19rem] overflow-hidden rounded-[1.75rem] bg-emerald-950 p-5 text-white shadow-xl shadow-emerald-950/20">
        <img
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
          src="/brand/grover-landscape-home-hero.webp"
        />
        <span className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/70 to-emerald-950/10" />
        <span className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-slate-950/80 to-transparent" />
        <div className="relative flex min-h-[16.5rem] flex-col">
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-emerald-200">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.16)]" />
              Grover
            </p>
            <p className="rounded-full border border-white/15 bg-slate-950/30 px-2.5 py-1 text-xs font-semibold text-slate-100 backdrop-blur-sm">
              {now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
          </div>
          <div className="mt-auto max-w-sm">
            <p className="text-sm font-semibold text-emerald-200">
              {homeGreeting(now.getHours())}, {firstName}
            </p>
            <h2 className="mt-2 max-w-xs text-3xl font-black leading-[1.02] tracking-tight">
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

      <aside className={`rounded-2xl border p-4 ${
        priorityStatus.tone === 'attention'
          ? 'border-amber-300 bg-amber-50'
          : priorityStatus.tone === 'complete'
            ? 'border-emerald-300 bg-emerald-50'
            : 'border-sky-200 bg-sky-50'
      }`} role="status">
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-black ${
              priorityStatus.tone === 'attention'
                ? 'bg-amber-200 text-amber-950'
                : priorityStatus.tone === 'complete'
                  ? 'bg-emerald-200 text-emerald-950'
                  : 'bg-sky-200 text-sky-950'
            }`}
          >
            {priorityStatus.tone === 'attention' ? '!' : '✓'}
          </span>
          <div>
            <p className="text-sm font-black text-slate-950">{priorityStatus.title}</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">{priorityStatus.detail}</p>
          </div>
        </div>
      </aside>

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
