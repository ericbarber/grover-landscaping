import { useCallback, useState } from 'react';
import {
  fetchNotificationHistory,
  queueCompletionReportDeliveryNotification,
  type CompletionReportDeliveryNotification,
  type NotificationHistoryItem,
} from '../../../api/client';

export type ManagerReportNotificationResult =
  | {
    ok: true;
    notification: CompletionReportDeliveryNotification;
    history: NotificationHistoryItem[] | null;
  }
  | { ok: false; error: unknown };

export async function executeManagerReportNotification(
  command: () => Promise<CompletionReportDeliveryNotification>,
  refreshHistory: () => Promise<NotificationHistoryItem[]>,
): Promise<ManagerReportNotificationResult> {
  let notification: CompletionReportDeliveryNotification;
  try {
    notification = await command();
  } catch (error) {
    return { ok: false, error };
  }

  try {
    return {
      ok: true,
      notification,
      history: await refreshHistory(),
    };
  } catch {
    return { ok: true, notification, history: null };
  }
}

export interface ManagerCompletionReportNotifications {
  actionStatus: string | null;
  queueDelivery: (
    reportId: string,
    channel: 'email' | 'sms',
    recipient: string,
  ) => Promise<ManagerReportNotificationResult>;
}

export function useManagerCompletionReportNotifications(): ManagerCompletionReportNotifications {
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  const queueDelivery = useCallback(async (
    reportId: string,
    channel: 'email' | 'sms',
    recipient: string,
  ) => {
    setActionStatus('Queueing customer notification...');
    try {
      return await executeManagerReportNotification(
        () => queueCompletionReportDeliveryNotification(reportId, channel, recipient),
        () => fetchNotificationHistory({ limit: 25 }),
      );
    } finally {
      setActionStatus(null);
    }
  }, []);

  return { actionStatus, queueDelivery };
}
