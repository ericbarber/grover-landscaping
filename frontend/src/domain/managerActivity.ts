export type ManagerActivityTone = 'info' | 'warning' | 'success';
export type ManagerActivitySource = 'route' | 'job' | 'photo' | 'sync';

export type ManagerActivityItem = {
  id: string;
  title: string;
  message: string;
  tone: ManagerActivityTone;
  source: ManagerActivitySource;
  occurredAt: string;
};

export type ManagerActivityFilters = {
  source: ManagerActivitySource | 'all';
  tone: ManagerActivityTone | 'all';
};

export const seedManagerActivityItems: ManagerActivityItem[] = [
  {
    id: 'route-review-needed',
    title: 'Route draft needs review',
    message: 'North Route Crew has local fallback route edits. Review workload and stop order before publishing.',
    tone: 'warning',
    source: 'route',
    occurredAt: 'Today 8:15 AM',
  },
  {
    id: 'completion-ready',
    title: 'Completion evidence ready',
    message: 'Sample Customer has a completion report ready for manager review.',
    tone: 'success',
    source: 'job',
    occurredAt: 'Today 9:05 AM',
  },
  {
    id: 'sync-fallback-active',
    title: 'Local fallback active',
    message: 'A route change is saved locally until backend persistence is available.',
    tone: 'info',
    source: 'sync',
    occurredAt: 'Today 9:20 AM',
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

export function getLatestManagerActivityTimestamp(items: ManagerActivityItem[], emptyLabel = 'No activity yet'): string {
  return items[0]?.occurredAt ?? emptyLabel;
}

export function countManagerActivityByTone(items: ManagerActivityItem[], tone: ManagerActivityTone): number {
  return items.filter((item) => item.tone === tone).length;
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
