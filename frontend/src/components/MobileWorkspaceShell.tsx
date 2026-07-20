export type MobileWorkspaceView = 'route' | 'jobs' | 'job' | 'manager';

interface MobileWorkspaceContextInput {
  view: MobileWorkspaceView;
  assignedJobCount: number;
  selectedCustomerName?: string;
  selectedPropertyAddress?: string;
  selectedJobStatus?: string;
  managerOrganizationId: string;
  pendingChangeCount: number;
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
        eyebrow: 'Manager workspace',
        title: 'Operations',
        detail: `Organization ${input.managerOrganizationId}`,
      };
  }
}

interface MobileWorkspaceHeaderProps extends MobileWorkspaceContextInput {
  onBackToJobs: () => void;
}

export function MobileWorkspaceHeader({
  onBackToJobs,
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
      </div>
    </header>
  );
}

interface MobileWorkspaceNavigationProps {
  activeView: MobileWorkspaceView;
  canUseManagerTools: boolean;
  hasSelectedJob: boolean;
  onChange: (view: MobileWorkspaceView) => void;
}

const navigationItems: Array<{
  view: MobileWorkspaceView;
  label: string;
  symbol: string;
}> = [
  { view: 'route', label: 'Route', symbol: '↗' },
  { view: 'jobs', label: 'Jobs', symbol: '☷' },
  { view: 'job', label: 'Job', symbol: '✓' },
  { view: 'manager', label: 'Manager', symbol: '▦' },
];

export function MobileWorkspaceNavigation({
  activeView,
  canUseManagerTools,
  hasSelectedJob,
  onChange,
}: MobileWorkspaceNavigationProps) {
  return (
    <nav
      aria-label="Mobile workspace"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-300 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgba(15,23,42,0.12)] backdrop-blur lg:hidden"
    >
      <div className="mx-auto grid max-w-lg grid-cols-4 gap-1">
        {navigationItems.map((item) => {
          const disabled = (item.view === 'manager' && !canUseManagerTools)
            || (item.view === 'job' && !hasSelectedJob);
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
