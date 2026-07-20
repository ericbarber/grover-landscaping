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

  return (
    <section className="space-y-4 lg:hidden">
      <article className="rounded-2xl bg-slate-950 p-5 text-white shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
          Welcome back
        </p>
        <h2 className="mt-2 text-2xl font-black">{signedInName}</h2>
        <p className="mt-1 text-sm font-semibold text-emerald-200">{persona.label}</p>
        <p className="mt-2 text-sm leading-6 text-slate-300">{persona.description}</p>
      </article>

      <div className="grid grid-cols-3 gap-2 text-center">
        <article className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-xl font-black text-slate-950">{assignedJobCount}</p>
          <p className="text-[0.68rem] font-bold uppercase text-slate-500">Assigned</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-xl font-black text-slate-950">{completedJobCount}</p>
          <p className="text-[0.68rem] font-bold uppercase text-slate-500">Finished</p>
        </article>
        <article className={`rounded-xl border p-3 ${
          pendingChangeCount > 0
            ? 'border-amber-300 bg-amber-50'
            : 'border-emerald-200 bg-emerald-50'
        }`}>
          <p className="text-xl font-black text-slate-950">{pendingChangeCount}</p>
          <p className="text-[0.68rem] font-bold uppercase text-slate-500">To sync</p>
        </article>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
          Quick actions
        </p>
        <div className="mt-3 space-y-2">
          {actions.map((action) => (
            <button
              className="flex min-h-16 w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-left"
              key={action.view}
              onClick={() => onOpen(action.view)}
              type="button"
            >
              <span>
                <span className="block text-sm font-black text-slate-900">{action.label}</span>
                <span className="mt-1 block text-xs text-slate-500">{action.description}</span>
              </span>
              <span aria-hidden="true" className="text-lg text-emerald-800">›</span>
            </button>
          ))}
        </div>
      </section>
    </section>
  );
}
