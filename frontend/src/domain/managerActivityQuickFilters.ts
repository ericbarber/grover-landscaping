import {
  countManagerActivityBySource,
  countManagerActivityNeedingReview,
  type ManagerActivityFilters,
  type ManagerActivityItem,
} from './managerActivity';

export type ManagerActivityQuickFilterId =
  | 'needs-review'
  | 'route-review'
  | 'completion-review'
  | 'sync-fallback'
  | 'photo-evidence';

export type ManagerActivityQuickFilter = {
  id: ManagerActivityQuickFilterId;
  count: number;
  isVisible: boolean;
  isActive: boolean;
  filters: ManagerActivityFilters;
  ariaLabel: string;
  activeLabel: string;
  inactiveLabel: string;
  title: string;
};

function isQuickFilterActive(currentFilters: ManagerActivityFilters, quickFilterFilters: ManagerActivityFilters): boolean {
  return currentFilters.source === quickFilterFilters.source && currentFilters.tone === quickFilterFilters.tone;
}

function buildManagerActivityQuickFilter({
  id,
  count,
  currentFilters,
  filters,
  ariaLabel,
  activeLabel,
  inactiveLabel,
  title,
}: Omit<ManagerActivityQuickFilter, 'isVisible' | 'isActive'> & {
  currentFilters: ManagerActivityFilters;
}): ManagerActivityQuickFilter {
  return {
    id,
    count,
    isVisible: count > 0,
    isActive: isQuickFilterActive(currentFilters, filters),
    filters,
    ariaLabel,
    activeLabel,
    inactiveLabel,
    title,
  };
}

export function getManagerActivityQuickFilters(
  items: ManagerActivityItem[],
  currentFilters: ManagerActivityFilters,
): ManagerActivityQuickFilter[] {
  const totalReviewCount = countManagerActivityNeedingReview(items);
  const totalRouteReviewCount = countManagerActivityBySource(items, 'route');
  const totalCompletionReviewCount = countManagerActivityBySource(items, 'job');
  const totalSyncFallbackCount = countManagerActivityBySource(items, 'sync');
  const totalPhotoEvidenceCount = countManagerActivityBySource(items, 'photo');

  return [
    buildManagerActivityQuickFilter({
      id: 'needs-review',
      count: totalReviewCount,
      currentFilters,
      filters: { source: 'all', tone: 'warning' },
      ariaLabel: `Show ${totalReviewCount} manager activity items that need review`,
      activeLabel: 'Showing needs review',
      inactiveLabel: 'Show needs review',
      title: 'Show all warning activity that needs manager review.',
    }),
    buildManagerActivityQuickFilter({
      id: 'route-review',
      count: totalRouteReviewCount,
      currentFilters,
      filters: { source: 'route', tone: 'all' },
      ariaLabel: `Show ${totalRouteReviewCount} manager activity items from route review`,
      activeLabel: 'Showing route review',
      inactiveLabel: 'Show route review',
      title: 'Show route planning and route review activity.',
    }),
    buildManagerActivityQuickFilter({
      id: 'completion-review',
      count: totalCompletionReviewCount,
      currentFilters,
      filters: { source: 'job', tone: 'all' },
      ariaLabel: `Show ${totalCompletionReviewCount} manager activity items from completion review`,
      activeLabel: 'Showing completion review',
      inactiveLabel: 'Show completion review',
      title: 'Show completion report and job review activity.',
    }),
    buildManagerActivityQuickFilter({
      id: 'sync-fallback',
      count: totalSyncFallbackCount,
      currentFilters,
      filters: { source: 'sync', tone: 'all' },
      ariaLabel: `Show ${totalSyncFallbackCount} manager activity items from sync fallback`,
      activeLabel: 'Showing sync fallback',
      inactiveLabel: 'Show sync fallback',
      title: 'Show local fallback and sync-related activity.',
    }),
    buildManagerActivityQuickFilter({
      id: 'photo-evidence',
      count: totalPhotoEvidenceCount,
      currentFilters,
      filters: { source: 'photo', tone: 'all' },
      ariaLabel: `Show ${totalPhotoEvidenceCount} manager activity items from photo evidence`,
      activeLabel: 'Showing photo evidence',
      inactiveLabel: 'Show photo evidence',
      title: 'Show photo evidence and completion-report activity.',
    }),
  ];
}

export function getVisibleManagerActivityQuickFilters(
  items: ManagerActivityItem[],
  currentFilters: ManagerActivityFilters,
): ManagerActivityQuickFilter[] {
  return getManagerActivityQuickFilters(items, currentFilters).filter((quickFilter) => quickFilter.isVisible);
}
