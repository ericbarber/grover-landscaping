import type { ManagerActivityQuickFilter } from './managerActivityQuickFilters';

const activeQuickFilterClassNames: Record<ManagerActivityQuickFilter['id'], string> = {
  'needs-review': 'text-amber-700 hover:text-amber-900',
  'route-review': 'text-violet-700 hover:text-violet-900',
  'completion-review': 'text-indigo-700 hover:text-indigo-900',
  'sync-fallback': 'text-sky-700 hover:text-sky-900',
  'photo-evidence': 'text-emerald-700 hover:text-emerald-900',
};

const baseQuickFilterClassName = 'inline-flex items-center gap-1 text-xs font-semibold transition';
const inactiveQuickFilterClassName = 'text-slate-600 hover:text-slate-950';

export function managerActivityQuickFilterClassName(quickFilter: ManagerActivityQuickFilter): string {
  const stateClassName = quickFilter.isActive
    ? activeQuickFilterClassNames[quickFilter.id]
    : inactiveQuickFilterClassName;

  return `${baseQuickFilterClassName} ${stateClassName}`;
}

export function managerActivityQuickFilterDisplayLabel(quickFilter: ManagerActivityQuickFilter): string {
  return quickFilter.isActive ? quickFilter.activeLabel : quickFilter.inactiveLabel;
}
