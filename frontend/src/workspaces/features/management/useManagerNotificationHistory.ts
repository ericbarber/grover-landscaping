import { useCallback, useEffect, useState } from 'react';
import {
  fetchNotificationHistory,
  resolveNotificationDelivery,
  retryNotificationDelivery,
  type FetchNotificationHistoryOptions,
  type NotificationHistoryEntityType,
  type NotificationHistoryItem,
  type NotificationHistoryStatus,
} from '../../../api/client';

export interface ManagerNotificationHistoryFilters {
  entityType: NotificationHistoryEntityType | 'all';
  status: NotificationHistoryStatus | 'all';
}

export function managerNotificationHistoryOptions(
  filters?: ManagerNotificationHistoryFilters,
): FetchNotificationHistoryOptions {
  return {
    entityType: filters?.entityType === 'all' ? undefined : filters?.entityType,
    status: filters?.status === 'all' ? undefined : filters?.status,
    limit: 25,
  };
}

export type ManagerNotificationHistoryActionResult =
  | {
    ok: true;
    item: NotificationHistoryItem;
    history: NotificationHistoryItem[];
  }
  | { ok: false; error: unknown };

export async function executeManagerNotificationHistoryAction(
  command: () => Promise<NotificationHistoryItem>,
  filters: ManagerNotificationHistoryFilters,
  readHistory: (
    options: FetchNotificationHistoryOptions,
  ) => Promise<NotificationHistoryItem[]> = fetchNotificationHistory,
): Promise<ManagerNotificationHistoryActionResult> {
  try {
    const item = await command();
    const history = await readHistory(managerNotificationHistoryOptions(filters));
    return { ok: true, item, history };
  } catch (error) {
    return { ok: false, error };
  }
}

export interface ManagerNotificationHistory {
  items: NotificationHistoryItem[];
  isLoading: boolean;
  isUnavailable: boolean;
  applyExternalRefresh: (history: NotificationHistoryItem[] | null) => void;
  refresh: (filters: ManagerNotificationHistoryFilters) => Promise<boolean>;
  retry: (
    notificationId: string,
    filters: ManagerNotificationHistoryFilters,
  ) => Promise<ManagerNotificationHistoryActionResult>;
  resolve: (
    notificationId: string,
    filters: ManagerNotificationHistoryFilters,
  ) => Promise<ManagerNotificationHistoryActionResult>;
}

export function useManagerNotificationHistory({
  enabled,
  onInitialUnavailable,
}: {
  enabled: boolean;
  onInitialUnavailable: () => void;
}): ManagerNotificationHistory {
  const [items, setItems] = useState<NotificationHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUnavailable, setIsUnavailable] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setItems([]);
      setIsUnavailable(false);
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);
    void fetchNotificationHistory(managerNotificationHistoryOptions())
      .then((history) => {
        if (!active) return;
        setItems(history);
        setIsUnavailable(false);
      })
      .catch(() => {
        if (!active) return;
        setItems([]);
        setIsUnavailable(true);
        onInitialUnavailable();
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [enabled, onInitialUnavailable]);

  const refresh = useCallback(async (filters: ManagerNotificationHistoryFilters) => {
    setIsLoading(true);
    try {
      setItems(await fetchNotificationHistory(managerNotificationHistoryOptions(filters)));
      setIsUnavailable(false);
      return true;
    } catch {
      setIsUnavailable(true);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const applyExternalRefresh = useCallback((history: NotificationHistoryItem[] | null) => {
    if (history) {
      setItems(history);
      setIsUnavailable(false);
    } else {
      setIsUnavailable(true);
    }
  }, []);

  const runAction = useCallback(async (
    command: () => Promise<NotificationHistoryItem>,
    filters: ManagerNotificationHistoryFilters,
  ) => {
    setIsLoading(true);
    try {
      const result = await executeManagerNotificationHistoryAction(command, filters);
      if (result.ok) {
        setItems(result.history);
        setIsUnavailable(false);
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const retry = useCallback((
    notificationId: string,
    filters: ManagerNotificationHistoryFilters,
  ) => runAction(() => retryNotificationDelivery(notificationId), filters), [runAction]);

  const resolve = useCallback((
    notificationId: string,
    filters: ManagerNotificationHistoryFilters,
  ) => runAction(() => resolveNotificationDelivery(notificationId), filters), [runAction]);

  return {
    items,
    isLoading,
    isUnavailable,
    applyExternalRefresh,
    refresh,
    retry,
    resolve,
  };
}
