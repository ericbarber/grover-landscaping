import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchPropertyCompletionReports,
  type PropertyCompletionReportSummary,
} from '../../../api/client';

export interface CustomerPropertyReportHistoryRead {
  reportsByProperty: Record<string, PropertyCompletionReportSummary[]>;
  partial: boolean;
}

export async function readCustomerPropertyReportHistory(
  propertyIds: string[],
  readReports: (
    propertyId: string,
  ) => Promise<PropertyCompletionReportSummary[]> = fetchPropertyCompletionReports,
): Promise<CustomerPropertyReportHistoryRead> {
  const results = await Promise.allSettled(
    propertyIds.map(async (propertyId) => ({
      propertyId,
      reports: await readReports(propertyId),
    })),
  );
  return {
    reportsByProperty: results.reduce<Record<string, PropertyCompletionReportSummary[]>>(
      (reports, result) => {
        if (result.status === 'fulfilled') {
          reports[result.value.propertyId] = result.value.reports;
        }
        return reports;
      },
      {},
    ),
    partial: results.some((result) => result.status === 'rejected'),
  };
}

export interface CustomerPropertyReportHistory {
  reportsByProperty: Record<string, PropertyCompletionReportSummary[]>;
  isLoading: boolean;
  hasError: boolean;
}

export function useCustomerPropertyReportHistory({
  enabled,
  propertyIds,
  onPartialUnavailable,
}: {
  enabled: boolean;
  propertyIds: string[];
  onPartialUnavailable: () => void;
}): CustomerPropertyReportHistory {
  const [reportsByProperty, setReportsByProperty] = useState<
    Record<string, PropertyCompletionReportSummary[]>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const request = useRef(0);
  const propertyKey = propertyIds.join('\u0000');

  const refresh = useCallback(async () => {
    const requestId = ++request.current;
    if (!enabled) {
      setReportsByProperty({});
      setIsLoading(false);
      setHasError(false);
      return;
    }

    setReportsByProperty({});
    setIsLoading(true);
    const result = await readCustomerPropertyReportHistory(propertyIds);
    if (requestId !== request.current) return;
    setReportsByProperty(result.reportsByProperty);
    setHasError(result.partial);
    setIsLoading(false);
    if (result.partial) onPartialUnavailable();
  }, [enabled, onPartialUnavailable, propertyKey]);

  useEffect(() => {
    void refresh();
    return () => {
      ++request.current;
    };
  }, [refresh]);

  return { reportsByProperty, isLoading, hasError };
}
