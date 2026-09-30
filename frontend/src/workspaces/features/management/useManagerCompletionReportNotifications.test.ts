import { describe, expect, it, vi } from 'vitest';
import type {
  CompletionReportDeliveryNotification,
  NotificationHistoryItem,
} from '../../../api/client';
import { executeManagerReportNotification } from './useManagerCompletionReportNotifications';

const notification = {
  reportId: 'report-1',
  notificationId: 'notification-1',
  channel: 'email',
  recipient: 'customer@example.com',
} as CompletionReportDeliveryNotification;

const history = [{
  id: 'notification-1',
  entityType: 'completion_report',
  entityId: 'report-1',
}] as NotificationHistoryItem[];

describe('manager completion report notifications', () => {
  it('returns refreshed history after a successful queue command', async () => {
    const command = vi.fn(async () => notification);
    const refreshHistory = vi.fn(async () => history);

    await expect(executeManagerReportNotification(command, refreshHistory)).resolves.toEqual({
      ok: true,
      notification,
      history,
    });
    expect(command).toHaveBeenCalledOnce();
    expect(refreshHistory).toHaveBeenCalledOnce();
  });

  it('preserves queue success when the history refresh is unavailable', async () => {
    const historyError = new Error('History unavailable');

    await expect(executeManagerReportNotification(
      async () => notification,
      async () => { throw historyError; },
    )).resolves.toEqual({
      ok: true,
      notification,
      history: null,
    });
  });

  it('returns the command error without attempting a history refresh', async () => {
    const commandError = new Error('Queue rejected');
    const refreshHistory = vi.fn(async () => history);

    await expect(executeManagerReportNotification(
      async () => { throw commandError; },
      refreshHistory,
    )).resolves.toEqual({ ok: false, error: commandError });
    expect(refreshHistory).not.toHaveBeenCalled();
  });
});
