export type ManagerActivityTone = 'info' | 'warning' | 'success';

export type ManagerActivityItem = {
  id: string;
  title: string;
  message: string;
  tone: ManagerActivityTone;
  occurredAt: string;
};

export const seedManagerActivityItems: ManagerActivityItem[] = [
  {
    id: 'route-review-needed',
    title: 'Route draft needs review',
    message: 'North Route Crew has local fallback route edits. Review workload and stop order before publishing.',
    tone: 'warning',
    occurredAt: 'Today 8:15 AM',
  },
  {
    id: 'completion-ready',
    title: 'Completion evidence ready',
    message: 'Sample Customer has a completion report ready for manager review.',
    tone: 'success',
    occurredAt: 'Today 9:05 AM',
  },
  {
    id: 'sync-fallback-active',
    title: 'Local fallback active',
    message: 'A route change is saved locally until backend persistence is available.',
    tone: 'info',
    occurredAt: 'Today 9:20 AM',
  },
];

export function countManagerActivityByTone(items: ManagerActivityItem[], tone: ManagerActivityTone): number {
  return items.filter((item) => item.tone === tone).length;
}

export function prependManagerActivity(
  currentItems: ManagerActivityItem[],
  nextItem: ManagerActivityItem,
  maxItems = 8,
): ManagerActivityItem[] {
  return [nextItem, ...currentItems.filter((item) => item.id !== nextItem.id)].slice(0, maxItems);
}
