export type ManagerActivityTone = 'info' | 'warning' | 'success';
export type ManagerActivitySource = 'route' | 'job' | 'photo' | 'sync';

export type ManagerActivityItem = {
  id: string;
  title: string;
  message: string;
  tone: ManagerActivityTone;
  source: ManagerActivitySource;
  occurredAt: string;
  recommendedAction?: string;
};

export type ManagerActivityFilters = {
  source: ManagerActivitySource | 'all';
  tone: ManagerActivityTone | 'all';
};

export type ManagerActivityEmptyState = {
  title: string;
  message: string;
  canResetFilters: boolean;
};

export const seedManagerActivityItems: ManagerActivityItem[] = [
  {
    id: 'route-review-needed',
    title: 'Route draft needs review',
    message: 'North Route Crew has local fallback route edits. Review workload and stop order before publishing.',
    tone: 'warning',
    source: 'route',
    occurredAt: 'Today 8:15 AM',
    recommendedAction: 'Review route workload and publish the final stop order.',
  },
  {
    id: 'completion-ready',
    title: 'Completion evidence ready',
    message: 'Sample Customer has a completion report ready for manager review.',
    tone: 'success',
    source: 'job',
    occurredAt: 'Today 9:05 AM',
    recommendedAction: 'Approve the completion report or return it to the crew for correction.',
  },
  {
    id: 'photo-evidence-review',
    title: 'Photo evidence needs review',
    message: 'Backyard after photos are missing from a completed service and should be checked before customer notification.',
    tone: 'warning',
    source: 'photo',
    occurredAt: 'Today 9:12 AM',
    recommendedAction: 'Request missing after photos before sending the customer completion notice.',
  },
  {
    id: 'sync-fallback-active',
    title: 'Local fallback active',
    message: 'A route change is saved locally until backend persistence is available.',
    tone: 'info',
    source: 'sync',
    occurredAt: 'Today 9:20 AM',
    recommendedAction: 'Keep the local draft available until backend sync confirms persistence.',
  },
];

export function filterManagerActivityItems(
  items: ManagerActivityItem[],
  filters: ManagerActivityFilters,
): ManagerActivityItem[] {
  return items.filter((item) => {
    const matchesSource = filters.source === 'all' || item.source === filters.source;
    const matchesTone = filters.tone === 'all' || item.tone === filters.tone;

    return matchesSource && matchesTone;
  });
}

export function hasActiveManagerActivityFilters(filters: ManagerActivityFilters): boolean {
  return filters.source !== 'all' || filters.tone !== 'all';
}

export function getManagerActivityEmptyState(
  items: ManagerActivityItem[],
  filters: ManagerActivityFilters,
): ManagerActivityEmptyState {
  if (items.length === 0) {
    return {
      title: 'No manager activity has been recorded yet.',
      message: 'New route reviews, completion evidence, and sync fallback events will appear here.',
      canResetFilters: false,
    };
  }

  return {
    title: 'No activity matches these filters.',
    message: 'Reset saved filters to return to the full manager review queue.',
    canResetFilters: hasActiveManagerActivityFilters(filters),
  };
}

export function getLatestManagerActivityTimestamp(items: ManagerActivityItem[], emptyLabel = 'No activity yet'): string {
  return items[0]?.occurredAt ?? emptyLabel;
}

export function countManagerActivityByTone(items: ManagerActivityItem[], tone: ManagerActivityTone): number {
  return items.filter((item) => item.tone === tone).length;
}

export function countManagerActivityNeedingReview(items: ManagerActivityItem[]): number {
  return countManagerActivityByTone(items, 'warning');
}

export function countManagerActivityNeedingReviewBySource(
  items: ManagerActivityItem[],
  source: ManagerActivitySource,
): number {
  return items.filter((item) => item.source === source && item.tone === 'warning').length;
}

export function countManagerActivityBySource(items: ManagerActivityItem[], source: ManagerActivitySource): number {
  return items.filter((item) => item.source === source).length;
}

export function prependManagerActivity(
  currentItems: ManagerActivityItem[],
  nextItem: ManagerActivityItem,
  maxItems = 8,
): ManagerActivityItem[] {
  return [nextItem, ...currentItems.filter((item) => item.id !== nextItem.id)].slice(0, maxItems);
}
