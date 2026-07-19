import type { ManagerActivityItem, ManagerActivitySource, ManagerActivityTone } from './managerActivity';

const managerActivityStorageKey = 'grover.managerActivity.items';
const maxStoredManagerActivityItems = 20;
const activitySources: ManagerActivitySource[] = ['route', 'job', 'photo', 'sync'];
const activityTones: ManagerActivityTone[] = ['info', 'warning', 'success'];

function isManagerActivityItem(value: unknown): value is ManagerActivityItem {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const item = value as Partial<ManagerActivityItem>;

  return (
    typeof item.id === 'string' &&
    typeof item.title === 'string' &&
    typeof item.message === 'string' &&
    typeof item.occurredAt === 'string' &&
    activitySources.includes(item.source as ManagerActivitySource) &&
    activityTones.includes(item.tone as ManagerActivityTone)
  );
}

export function readStoredManagerActivityItems(
  fallbackItems: ManagerActivityItem[] = [],
): ManagerActivityItem[] {
  if (typeof window === 'undefined') {
    return fallbackItems;
  }

  try {
    const rawValue = window.localStorage.getItem(managerActivityStorageKey);

    if (!rawValue) {
      return fallbackItems;
    }

    const parsedValue = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue)) {
      return fallbackItems;
    }

    const storedItems = parsedValue.filter(isManagerActivityItem).slice(0, maxStoredManagerActivityItems);

    return storedItems;
  } catch {
    return fallbackItems;
  }
}

export function writeStoredManagerActivityItems(items: ManagerActivityItem[]): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    window.localStorage.setItem(
      managerActivityStorageKey,
      JSON.stringify(items.slice(0, maxStoredManagerActivityItems)),
    );
    return true;
  } catch {
    return false;
  }
}
