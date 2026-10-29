import { useCallback, useEffect, useState } from 'react';
import {
  fetchPhotoProcessingHistory,
  resolvePhotoProcessingJob,
  retryPhotoProcessingJob,
  type FetchPhotoProcessingHistoryOptions,
  type PhotoProcessingHistoryItem,
  type PhotoProcessingStatus,
} from '../../../api/client';

export interface ManagerPhotoProcessingFilters {
  status: PhotoProcessingStatus | 'all';
}

export const initialManagerPhotoProcessingOptions: FetchPhotoProcessingHistoryOptions = {
  status: 'failed',
  limit: 25,
};

export function managerPhotoProcessingOptions(
  filters: ManagerPhotoProcessingFilters,
): FetchPhotoProcessingHistoryOptions {
  return {
    taskType: 'thumbnail_generation',
    status: filters.status === 'all' ? undefined : filters.status,
    limit: 25,
  };
}

export type ManagerPhotoProcessingActionResult =
  | {
    ok: true;
    item: PhotoProcessingHistoryItem;
    history: PhotoProcessingHistoryItem[];
  }
  | { ok: false; error: unknown };

export async function executeManagerPhotoProcessingAction(
  command: () => Promise<PhotoProcessingHistoryItem>,
  filters: ManagerPhotoProcessingFilters,
  readHistory: (
    options: FetchPhotoProcessingHistoryOptions,
  ) => Promise<PhotoProcessingHistoryItem[]> = fetchPhotoProcessingHistory,
): Promise<ManagerPhotoProcessingActionResult> {
  try {
    const item = await command();
    const history = await readHistory(managerPhotoProcessingOptions(filters));
    return { ok: true, item, history };
  } catch (error) {
    return { ok: false, error };
  }
}

export interface ManagerPhotoProcessingRecovery {
  items: PhotoProcessingHistoryItem[];
  isLoading: boolean;
  refresh: (filters: ManagerPhotoProcessingFilters) => Promise<boolean>;
  retry: (
    processingJobId: string,
    filters: ManagerPhotoProcessingFilters,
  ) => Promise<ManagerPhotoProcessingActionResult>;
  resolve: (
    processingJobId: string,
    filters: ManagerPhotoProcessingFilters,
  ) => Promise<ManagerPhotoProcessingActionResult>;
}

export function useManagerPhotoProcessingRecovery({
  enabled,
  onInitialUnavailable,
}: {
  enabled: boolean;
  onInitialUnavailable: () => void;
}): ManagerPhotoProcessingRecovery {
  const [items, setItems] = useState<PhotoProcessingHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);
    void fetchPhotoProcessingHistory(initialManagerPhotoProcessingOptions)
      .then((history) => {
        if (active) setItems(history);
      })
      .catch(() => {
        if (!active) return;
        setItems([]);
        onInitialUnavailable();
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [enabled, onInitialUnavailable]);

  const refresh = useCallback(async (filters: ManagerPhotoProcessingFilters) => {
    setIsLoading(true);
    try {
      setItems(await fetchPhotoProcessingHistory(managerPhotoProcessingOptions(filters)));
      return true;
    } catch {
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const runAction = useCallback(async (
    command: () => Promise<PhotoProcessingHistoryItem>,
    filters: ManagerPhotoProcessingFilters,
  ) => {
    setIsLoading(true);
    try {
      const result = await executeManagerPhotoProcessingAction(command, filters);
      if (result.ok) setItems(result.history);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const retry = useCallback((
    processingJobId: string,
    filters: ManagerPhotoProcessingFilters,
  ) => runAction(() => retryPhotoProcessingJob(processingJobId), filters), [runAction]);

  const resolve = useCallback((
    processingJobId: string,
    filters: ManagerPhotoProcessingFilters,
  ) => runAction(() => resolvePhotoProcessingJob(processingJobId), filters), [runAction]);

  return { items, isLoading, refresh, retry, resolve };
}
