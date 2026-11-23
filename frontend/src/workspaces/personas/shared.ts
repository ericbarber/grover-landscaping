import type {
  WorkspaceHomeDefinition,
  WorkspaceNavigationItem,
  WorkspaceProgressLanguage,
} from '../core/types';

export const homeNavigation: WorkspaceNavigationItem = {
  view: 'home', label: 'Home', icon: 'home',
};

export const fieldNavigation: readonly WorkspaceNavigationItem[] = [
  homeNavigation,
  { view: 'route', label: 'Route', icon: 'route' },
  { view: 'jobs', label: 'Jobs', icon: 'jobs' },
  { view: 'job', label: 'Job', icon: 'job' },
];

export const managerNavigation: readonly WorkspaceNavigationItem[] = [
  homeNavigation,
  { view: 'manager', label: 'Manage', icon: 'manage' },
  ...fieldNavigation.slice(1),
];

export const fieldProgress: WorkspaceProgressLanguage = {
  eyebrow: 'Route progress',
  completed: 'stops finished',
  total: 'assigned',
  itemSingular: 'stop',
  itemPlural: 'stops',
};

export const operationsProgress: WorkspaceProgressLanguage = {
  eyebrow: 'Field delivery',
  completed: 'jobs complete',
  total: 'assigned',
  itemSingular: 'job',
  itemPlural: 'jobs',
};

export function homeDefinition(
  headline: string,
  promise: string,
  progress: WorkspaceProgressLanguage = operationsProgress,
): WorkspaceHomeDefinition {
  return { headline, promise, progress };
}
