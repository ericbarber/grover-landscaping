import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchCompletionReport,
  fetchCompletionReports,
  type CompletionReportSnapshot,
} from '../../../api/client';
import type { CompletionReportOperationalFilters } from '../../../domain/completionReportOperationalFilters';
import { matchesCompletionReportOperationalFilters } from '../../../domain/completionReportOperationalFilters';
import type { YardCareJob } from '../../../domain/jobs';

export interface ManagerCompletionReportQueueRead {
  reports: CompletionReportSnapshot[];
  partial: boolean;
}

export async function readManagerCompletionReportQueue(
  jobs: YardCareJob[],
  filters: CompletionReportOperationalFilters = {},
  allowPartialFallback = false,
  fetchCollection: typeof fetchCompletionReports = fetchCompletionReports,
  fetchOne: typeof fetchCompletionReport = fetchCompletionReport,
): Promise<ManagerCompletionReportQueueRead> {
  try {
    return { reports: await fetchCollection(filters), partial: false };
  } catch {
    if (!allowPartialFallback) {
      const reports = await Promise.all(jobs.map((job) => fetchOne(job.id)));
      return {
        reports: reports.filter((report) => matchesCompletionReportOperationalFilters(report, filters)),
        partial: false,
      };
    }

    const results = await Promise.allSettled(jobs.map((job) => fetchOne(job.id)));
    return {
      reports: results
        .filter((result): result is PromiseFulfilledResult<CompletionReportSnapshot> => (
          result.status === 'fulfilled'
        ))
        .map((result) => result.value)
        .filter((report) => matchesCompletionReportOperationalFilters(report, filters)),
      partial: results.some((result) => result.status === 'rejected'),
    };
  }
}

export type ManagerReportQueueRefreshOutcome = 'refreshed' | 'empty' | 'unavailable';

export interface ManagerCompletionReportQueue {
  reports: CompletionReportSnapshot[];
  snapshots: Record<string, CompletionReportSnapshot>;
  isLoading: boolean;
  upsertReport: (report: CompletionReportSnapshot) => void;
  refresh: (
    filters?: CompletionReportOperationalFilters,
  ) => Promise<ManagerReportQueueRefreshOutcome>;
}

export function useManagerCompletionReportQueue({
  enabled,
  jobs,
  onPartialLoad,
}: {
  enabled: boolean;
  jobs: YardCareJob[];
  onPartialLoad: () => void;
}): ManagerCompletionReportQueue {
  const [snapshots, setSnapshots] = useState<Record<string, CompletionReportSnapshot>>({});
  const [isLoading, setIsLoading] = useState(false);

  const upsertReport = useCallback((report: CompletionReportSnapshot) => {
    setSnapshots((current) => ({ ...current, [report.jobId]: report }));
  }, []);

  const refresh = useCallback(async (
    filters: CompletionReportOperationalFilters = {},
  ): Promise<ManagerReportQueueRefreshOutcome> => {
    if (jobs.length === 0) return 'empty';
    setIsLoading(true);
    try {
      const result = await readManagerCompletionReportQueue(jobs, filters);
      setSnapshots(result.reports.reduce<Record<string, CompletionReportSnapshot>>(
        (next, report) => {
          next[report.jobId] = report;
          return next;
        },
        {},
      ));
      return 'refreshed';
    } catch {
      return 'unavailable';
    } finally {
      setIsLoading(false);
    }
  }, [jobs]);

  useEffect(() => {
    if (!enabled || jobs.length === 0) {
      setSnapshots({});
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);
    void readManagerCompletionReportQueue(jobs, {}, true)
      .then((result) => {
        if (!active) return;
        setSnapshots((current) => {
          const next = { ...current };
          result.reports.forEach((report) => {
            next[report.jobId] = report;
          });
          return next;
        });
        if (result.partial) onPartialLoad();
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [enabled, jobs, onPartialLoad]);

  const reports = useMemo(() => Object.values(snapshots), [snapshots]);

  return { reports, snapshots, isLoading, upsertReport, refresh };
}
