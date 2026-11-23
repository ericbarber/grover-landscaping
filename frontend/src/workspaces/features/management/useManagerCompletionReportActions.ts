import { useCallback, useState } from 'react';
import {
  deliverCompletionReport,
  requestCompletionReportChanges,
  resubmitCompletionReport,
  startCompletionReportReview,
  type CompletionReportAction,
} from '../../../api/client';

export type ManagerReportCommandResult =
  | { ok: true; action: CompletionReportAction }
  | { ok: false; error: unknown };

export async function executeManagerReportCommand(
  command: () => Promise<CompletionReportAction>,
  refreshReport: (jobId: string) => Promise<unknown>,
  refreshActivity: () => Promise<unknown>,
): Promise<ManagerReportCommandResult> {
  try {
    const action = await command();
    await refreshReport(action.jobId);
    await refreshActivity();
    return { ok: true, action };
  } catch (error) {
    return { ok: false, error };
  }
}

export interface ManagerCompletionReportActions {
  actionStatus: string | null;
  startReview: (reportId: string) => Promise<ManagerReportCommandResult>;
  requestChanges: (reportId: string, reason: string) => Promise<ManagerReportCommandResult>;
  resubmit: (reportId: string) => Promise<ManagerReportCommandResult>;
  deliver: (reportId: string) => Promise<ManagerReportCommandResult>;
}

export function useManagerCompletionReportActions({
  refreshReport,
  refreshActivity,
}: {
  refreshReport: (jobId: string) => Promise<unknown>;
  refreshActivity: () => Promise<unknown>;
}): ManagerCompletionReportActions {
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  const run = useCallback(async (
    status: string,
    command: () => Promise<CompletionReportAction>,
  ) => {
    setActionStatus(status);
    try {
      return await executeManagerReportCommand(command, refreshReport, refreshActivity);
    } finally {
      setActionStatus(null);
    }
  }, [refreshActivity, refreshReport]);

  const startReview = useCallback(
    (reportId: string) => run(
      'Starting manager review...',
      () => startCompletionReportReview(reportId),
    ),
    [run],
  );
  const requestChanges = useCallback(
    (reportId: string, reason: string) => run(
      'Requesting report changes...',
      () => requestCompletionReportChanges(reportId, reason),
    ),
    [run],
  );
  const resubmit = useCallback(
    (reportId: string) => run(
      'Resubmitting completion report...',
      () => resubmitCompletionReport(reportId),
    ),
    [run],
  );
  const deliver = useCallback(
    (reportId: string) => run(
      'Delivering completion report...',
      () => deliverCompletionReport(reportId),
    ),
    [run],
  );

  return { actionStatus, startReview, requestChanges, resubmit, deliver };
}
