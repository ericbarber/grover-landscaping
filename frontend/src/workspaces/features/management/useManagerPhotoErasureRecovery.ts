import { useCallback, useEffect, useState } from 'react';
import {
  fetchPhotoErasureDeletionHistory,
  resolvePhotoErasureDeletionJob,
  retryPhotoErasureDeletionJob,
  type PhotoErasureDeletionHistoryItem,
} from '../../../api/client';

export type ManagerPhotoErasureActionResult =
  | {
    ok: true;
    item: PhotoErasureDeletionHistoryItem;
    history: PhotoErasureDeletionHistoryItem[];
  }
  | { ok: false; error: unknown };

export async function executeManagerPhotoErasureAction(
  command: () => Promise<PhotoErasureDeletionHistoryItem>,
  readHistory: () => Promise<PhotoErasureDeletionHistoryItem[]> = fetchPhotoErasureDeletionHistory,
): Promise<ManagerPhotoErasureActionResult> {
  try {
    const item = await command();
    const history = await readHistory();
    return { ok: true, item, history };
  } catch (error) {
    return { ok: false, error };
  }
}

export interface ManagerPhotoErasureRecovery {
  items: PhotoErasureDeletionHistoryItem[];
  isLoading: boolean;
  refresh: () => Promise<boolean>;
  retry: (id: string) => Promise<ManagerPhotoErasureActionResult>;
  resolve: (id: string) => Promise<ManagerPhotoErasureActionResult>;
}

export function useManagerPhotoErasureRecovery({
  enabled,
}: {
  enabled: boolean;
}): ManagerPhotoErasureRecovery {
  const [items, setItems] = useState<PhotoErasureDeletionHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (enabled) return;
    setItems([]);
    setIsLoading(false);
  }, [enabled]);

  const refresh = useCallback(async () => {
    if (!enabled) return false;
    setIsLoading(true);
    try {
      setItems(await fetchPhotoErasureDeletionHistory());
      return true;
    } catch {
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  const runAction = useCallback(async (
    command: () => Promise<PhotoErasureDeletionHistoryItem>,
  ): Promise<ManagerPhotoErasureActionResult> => {
    if (!enabled) {
      return { ok: false, error: new Error('Photo erasure recovery is not enabled.') };
    }
    setIsLoading(true);
    try {
      const result = await executeManagerPhotoErasureAction(command);
      if (result.ok) setItems(result.history);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  const retry = useCallback(
    (id: string) => runAction(() => retryPhotoErasureDeletionJob(id)),
    [runAction],
  );
  const resolve = useCallback(
    (id: string) => runAction(() => resolvePhotoErasureDeletionJob(id)),
    [runAction],
  );

  return { items, isLoading, refresh, retry, resolve };
}
