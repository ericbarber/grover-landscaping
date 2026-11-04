import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchAccountProjectBids } from '../../../api/projectBidsClient';
import type { ProjectBid } from '../../../domain/stopProgress';

export async function readCustomerProjectBidHistory(
  accountId: string,
  readBids: (accountId: string) => Promise<ProjectBid[]> = fetchAccountProjectBids,
): Promise<ProjectBid[]> {
  return readBids(accountId);
}

export function useCustomerProjectBidHistory({
  enabled,
  accountId,
  onUnavailable,
}: {
  enabled: boolean;
  accountId: string;
  onUnavailable: () => void;
}) {
  const [bids, setBids] = useState<ProjectBid[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const request = useRef(0);

  const refresh = useCallback(async () => {
    const requestId = ++request.current;
    if (!enabled) {
      setBids([]);
      setIsLoading(false);
      setHasError(false);
      return;
    }
    setIsLoading(true);
    try {
      const nextBids = await readCustomerProjectBidHistory(accountId);
      if (requestId !== request.current) return;
      setBids(nextBids);
      setHasError(false);
    } catch {
      if (requestId !== request.current) return;
      setBids([]);
      setHasError(true);
      onUnavailable();
    } finally {
      if (requestId === request.current) setIsLoading(false);
    }
  }, [accountId, enabled, onUnavailable]);

  useEffect(() => {
    void refresh();
    return () => {
      ++request.current;
    };
  }, [refresh]);

  return { bids, isLoading, hasError };
}
