import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchOperationalActivity,
  type FetchOperationalActivityOptions,
  type OperationalActivity,
} from '../../../api/client';

const operationalActivityPageSize = 25;

export function operationalActivityPageOptions(
  before?: string,
): FetchOperationalActivityOptions {
  return before
    ? { before, limit: operationalActivityPageSize }
    : { limit: operationalActivityPageSize };
}

export function appendUniqueOperationalActivity(
  current: OperationalActivity[],
  nextPage: OperationalActivity[],
): OperationalActivity[] {
  const existingIds = new Set(current.map((item) => item.id));
  return [...current, ...nextPage.filter((item) => !existingIds.has(item.id))];
}

export interface ManagerOperationalActivity {
  items: OperationalActivity[];
  isUnavailable: boolean;
  canLoadOlder: boolean;
  isLoadingOlder: boolean;
  refresh: () => Promise<boolean>;
  loadOlder: () => Promise<boolean>;
}

export function useManagerOperationalActivity({
  enabled,
  refreshSignal,
}: {
  enabled: boolean;
  refreshSignal: number;
}): ManagerOperationalActivity {
  const [items, setItems] = useState<OperationalActivity[]>([]);
  const [isUnavailable, setIsUnavailable] = useState(false);
  const [canLoadOlder, setCanLoadOlder] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const refreshRequest = useRef(0);
  const olderRequest = useRef(0);

  const refresh = useCallback(async () => {
    const requestId = ++refreshRequest.current;
    ++olderRequest.current;
    if (!enabled) {
      setItems([]);
      setCanLoadOlder(false);
      setIsUnavailable(false);
      setIsLoadingOlder(false);
      return false;
    }

    setIsUnavailable(false);
    try {
      const activity = await fetchOperationalActivity(operationalActivityPageOptions());
      if (requestId !== refreshRequest.current) return false;
      setItems(activity);
      setCanLoadOlder(activity.length === operationalActivityPageSize);
      return true;
    } catch {
      if (requestId !== refreshRequest.current) return false;
      setItems([]);
      setCanLoadOlder(false);
      setIsUnavailable(true);
      return false;
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
    return () => {
      ++refreshRequest.current;
      ++olderRequest.current;
    };
  }, [refresh, refreshSignal]);

  const loadOlder = useCallback(async () => {
    const before = items[items.length - 1]?.occurredAt;
    if (!enabled || !before || isLoadingOlder) return false;

    const requestId = ++olderRequest.current;
    setIsLoadingOlder(true);
    try {
      const older = await fetchOperationalActivity(operationalActivityPageOptions(before));
      if (requestId !== olderRequest.current) return false;
      setItems((current) => appendUniqueOperationalActivity(current, older));
      setCanLoadOlder(older.length === operationalActivityPageSize);
      return true;
    } catch {
      if (requestId === olderRequest.current) setCanLoadOlder(false);
      return false;
    } finally {
      if (requestId === olderRequest.current) setIsLoadingOlder(false);
    }
  }, [enabled, isLoadingOlder, items]);

  return {
    items,
    isUnavailable,
    canLoadOlder,
    isLoadingOlder,
    refresh,
    loadOlder,
  };
}
