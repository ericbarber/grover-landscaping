import type { WorkspacePersona, WorkspacePersonaId } from '../domain/workspacePersona';
import { GroverBrand } from './GroverBrand';
import { WorkspaceIcon } from './WorkspaceIcon';

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
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-paper/95 px-4 py-3 shadow-grover-sm backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-lg items-center gap-3">
        {input.view === 'job' ? (
          <button
            aria-label="Back to assigned jobs"
            className="grid min-h-11 min-w-11 place-items-center rounded-xl border border-slate-300 bg-paper text-xl font-bold text-slate-800"
            onClick={onBackToJobs}
            type="button"
          >
            <WorkspaceIcon className="size-5" name="back" />
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
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-paper px-2 py-2 text-xs font-semibold normal-case tracking-normal text-slate-800"
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

interface DesktopWorkspaceNavigationProps extends MobileWorkspaceNavigationProps {
  personaLabel: string;
  signedInName: string;
}

export function DesktopWorkspaceNavigation({
  activeView,
  hasSelectedJob,
  navigationItems,
  onChange,
  personaLabel,
  signedInName,
}: DesktopWorkspaceNavigationProps) {
  return (
    <aside className="fixed bottom-0 left-0 top-[3.25rem] z-30 hidden w-60 flex-col bg-forest px-5 py-8 text-white shadow-grover-md lg:flex">
      <GroverBrand className="text-sand" />
      <p className="mt-5 text-[0.68rem] font-black uppercase tracking-[0.16em] text-emerald-200">
        {personaLabel}
      </p>
      <nav aria-label="Desktop workspace" className="mt-7 space-y-1.5">
        {navigationItems.map((item) => {
          const disabled = item.view === 'job' && !hasSelectedJob;
          const active = activeView === item.view;

          return (
            <button
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-bold transition ${
                active
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-emerald-50 hover:bg-white/10 disabled:text-emerald-950/60'
              }`}
              disabled={disabled}
              key={item.view}
              onClick={() => onChange(item.view)}
              type="button"
            >
              <WorkspaceIcon className="size-5 shrink-0" name={item.icon} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="mt-auto rounded-xl border border-white/10 bg-slate-950/20 p-3">
        <p className="truncate text-sm font-black text-white">{signedInName}</p>
        <p className="mt-1 truncate text-xs text-emerald-100">{personaLabel}</p>
      </div>
    </aside>
  );
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
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-paper/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgba(15,47,40,0.10)] backdrop-blur md:inset-y-0 md:left-0 md:right-auto md:w-24 md:border-r md:border-t-0 md:px-2 md:py-24 md:shadow-grover-md lg:hidden"
    >
      <div
        className="mx-auto grid max-w-lg gap-1 md:flex md:h-full md:flex-col md:justify-center"
        style={{ gridTemplateColumns: `repeat(${navigationItems.length}, minmax(0, 1fr))` }}
      >
        {navigationItems.map((item) => {
          const disabled = item.view === 'job' && !hasSelectedJob;
          const active = activeView === item.view;

          return (
            <button
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-12 flex-col items-center justify-center rounded-xl px-1 text-[0.68rem] font-bold md:min-h-16 md:w-full ${
                active
                  ? 'bg-emerald-800 text-white'
                  : 'text-slate-600 hover:bg-slate-100 disabled:text-slate-300'
              }`}
              disabled={disabled}
              key={item.view}
              onClick={() => onChange(item.view)}
              type="button"
            >
              <WorkspaceIcon className="size-5" name={item.icon} />
              <span className="mt-1">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
