import type { WorkspacePersona, WorkspacePersonaId } from '../domain/workspacePersona';

export type MobileWorkspaceView = 'home' | 'route' | 'jobs' | 'job' | 'manager' | 'customer';

interface MobileWorkspaceContextInput {
  view: MobileWorkspaceView;
  assignedJobCount: number;
  selectedCustomerName?: string;
  selectedPropertyAddress?: string;
  selectedJobStatus?: string;
  pendingChangeCount: number;
  personaDescription: string;
  personaLabel: string;
}

export interface MobileWorkspaceContext {
  eyebrow: string;
  title: string;
  detail: string;
}

export function mobileWorkspaceScrollTop(
  savedPositions: Partial<Record<MobileWorkspaceView, number>>,
  destination: MobileWorkspaceView,
  resetDestination = false,
): number {
  if (resetDestination) return 0;
  return Math.max(0, savedPositions[destination] ?? 0);
}

export function mobileWorkspaceContext(
  input: MobileWorkspaceContextInput,
): MobileWorkspaceContext {
  switch (input.view) {
    case 'home':
      return {
        eyebrow: input.personaLabel,
        title: 'Home',
        detail: input.personaDescription,
      };
    case 'route':
      return {
        eyebrow: 'Today',
        title: 'Crew route',
        detail: input.pendingChangeCount > 0
          ? `${input.pendingChangeCount} change${input.pendingChangeCount === 1 ? '' : 's'} waiting to sync`
          : `${input.assignedJobCount} assigned job${input.assignedJobCount === 1 ? '' : 's'} · Synced`,
      };
    case 'jobs':
      return {
        eyebrow: 'Field work',
        title: 'Assigned jobs',
        detail: `${input.assignedJobCount} job${input.assignedJobCount === 1 ? '' : 's'} available`,
      };
    case 'job':
      return {
        eyebrow: input.selectedJobStatus?.replace(/_/g, ' ') ?? 'Job detail',
        title: input.selectedCustomerName ?? 'Select a job',
        detail: input.selectedPropertyAddress ?? 'Choose a job from Assigned jobs to begin.',
      };
    case 'manager':
      return {
        eyebrow: input.personaLabel,
        title: 'Operations',
        detail: input.personaDescription,
      };
    case 'customer':
      return {
        eyebrow: input.personaLabel,
        title: input.personaLabel === 'Property manager' ? 'Property portfolio' : 'My yard',
        detail: input.personaDescription,
      };
  }
}

interface MobileWorkspaceHeaderProps extends MobileWorkspaceContextInput {
  activePersonaId: WorkspacePersonaId;
  availablePersonas: WorkspacePersona[];
  onBackToJobs: () => void;
  onPersonaChange: (personaId: WorkspacePersonaId) => void;
  signedInName: string;
}

export function MobileWorkspaceHeader({
  activePersonaId,
  availablePersonas,
  onBackToJobs,
  onPersonaChange,
  signedInName,
  ...input
}: MobileWorkspaceHeaderProps) {
  const context = mobileWorkspaceContext(input);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-lg items-center gap-3">
        {input.view === 'job' ? (
          <button
            aria-label="Back to assigned jobs"
            className="grid min-h-11 min-w-11 place-items-center rounded-xl border border-slate-300 bg-white text-xl font-bold text-slate-800"
            onClick={onBackToJobs}
            type="button"
          >
            ←
          </button>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-emerald-700">
            {context.eyebrow}
          </p>
          <h1 className="truncate text-lg font-black text-slate-950">{context.title}</h1>
          <p className="truncate text-xs text-slate-600">{context.detail}</p>
        </div>
        {availablePersonas.length > 1 ? (
          <label className="max-w-28 shrink-0 text-right text-[0.65rem] font-bold uppercase tracking-wide text-slate-500">
            <span className="block truncate normal-case tracking-normal text-slate-700">
              {signedInName}
            </span>
            <select
              aria-label="Active workspace persona"
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs font-semibold normal-case tracking-normal text-slate-800"
              onChange={(event) => onPersonaChange(event.target.value as WorkspacePersonaId)}
              value={activePersonaId}
            >
              {availablePersonas.map((persona) => (
                <option key={persona.id} value={persona.id}>{persona.label}</option>
              ))}
            </select>
          </label>
        ) : (
          <span className="max-w-28 shrink-0 rounded-lg bg-slate-100 px-2 py-1 text-right text-[0.65rem] text-slate-600">
            <span className="block truncate font-bold text-slate-800">{signedInName}</span>
            <span className="block truncate">{input.personaLabel}</span>
          </span>
        )}
      </div>
    </header>
  );
}

interface MobileWorkspaceNavigationProps {
  activeView: MobileWorkspaceView;
  hasSelectedJob: boolean;
  navigationItems: WorkspacePersona['navigation'];
  onChange: (view: MobileWorkspaceView) => void;
}

export function MobileWorkspaceNavigation({
  activeView,
  hasSelectedJob,
  navigationItems,
  onChange,
}: MobileWorkspaceNavigationProps) {
  return (
    <nav
      aria-label="Mobile workspace"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-300 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgba(15,23,42,0.12)] backdrop-blur lg:hidden"
    >
      <div
        className="mx-auto grid max-w-lg gap-1"
        style={{ gridTemplateColumns: `repeat(${navigationItems.length}, minmax(0, 1fr))` }}
      >
        {navigationItems.map((item) => {
          const disabled = item.view === 'job' && !hasSelectedJob;
          const active = activeView === item.view;

          return (
            <button
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-12 flex-col items-center justify-center rounded-xl px-1 text-[0.68rem] font-bold ${
                active
                  ? 'bg-emerald-800 text-white'
                  : 'text-slate-600 hover:bg-slate-100 disabled:text-slate-300'
              }`}
              disabled={disabled}
              key={item.view}
              onClick={() => onChange(item.view)}
              type="button"
            >
              <span aria-hidden="true" className="text-base leading-none">{item.symbol}</span>
              <span className="mt-1">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
