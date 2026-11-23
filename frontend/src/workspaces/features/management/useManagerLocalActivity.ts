import { useCallback, useEffect, useState } from 'react';
import {
  prependManagerActivity,
  type ManagerActivityItem,
} from '../../../domain/managerActivity';
import {
  readStoredManagerActivityItems,
  writeStoredManagerActivityItems,
} from '../../../domain/managerActivityLocalStore';

export type NewManagerActivity = Pick<
  ManagerActivityItem,
  'title' | 'message' | 'tone' | 'source'
>;

function managerActivityTimestamp(date: Date): string {
  return `Today ${date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })}`;
}

export function createManagerActivityItem(
  item: NewManagerActivity,
  date = new Date(),
): ManagerActivityItem {
  return {
    ...item,
    id: `${item.source}_${item.tone}_${date.getTime()}`,
    occurredAt: managerActivityTimestamp(date),
  };
}

export interface ManagerLocalActivity {
  items: ManagerActivityItem[];
  isPersisted: boolean;
  record: (item: NewManagerActivity) => void;
  reset: () => void;
}

export function useManagerLocalActivity(): ManagerLocalActivity {
  const [items, setItems] = useState<ManagerActivityItem[]>(() =>
    readStoredManagerActivityItems(),
  );
  const [isPersisted, setIsPersisted] = useState(true);

  const record = useCallback((item: NewManagerActivity) => {
    setItems((current) => prependManagerActivity(
      current,
      createManagerActivityItem(item),
    ));
  }, []);

  const reset = useCallback(() => {
    setItems([]);
  }, []);

  useEffect(() => {
    setIsPersisted(writeStoredManagerActivityItems(items));
  }, [items]);

  return {
    items,
    isPersisted,
    record,
    reset,
  };
}
