import { describe, expect, it, vi } from 'vitest';
import type { NotificationHistoryItem } from '../../../api/client';
import {
  executeManagerNotificationHistoryAction,
  managerNotificationHistoryOptions,
} from './useManagerNotificationHistory';

const notification = {
  id: 'notification-1',
  entityType: 'completion_report',
  entityId: 'report-1',
  channel: 'email',
  status: 'failed',
} as NotificationHistoryItem;

describe('manager notification history', () => {
  it('maps all-value filters to a bounded unfiltered read', () => {
    expect(managerNotificationHistoryOptions({
      entityType: 'all',
      status: 'all',
    })).toEqual({ entityType: undefined, status: undefined, limit: 25 });

    expect(managerNotificationHistoryOptions({
      entityType: 'completion_report',
      status: 'failed',
    })).toEqual({ entityType: 'completion_report', status: 'failed', limit: 25 });
  });

  it('refreshes the active filtered history after a successful action', async () => {
    const command = vi.fn(async () => notification);
    const readHistory = vi.fn(async () => [notification]);

    await expect(executeManagerNotificationHistoryAction(
      command,
      { entityType: 'completion_report', status: 'failed' },
      readHistory,
    )).resolves.toEqual({ ok: true, item: notification, history: [notification] });
    expect(command).toHaveBeenCalledOnce();
    expect(readHistory).toHaveBeenCalledWith({
      entityType: 'completion_report',
      status: 'failed',
      limit: 25,
    });
  });

  it('does not report success when the action or required refresh fails', async () => {
    const actionError = new Error('Retry rejected');
    const readHistory = vi.fn(async () => [notification]);

    await expect(executeManagerNotificationHistoryAction(
      async () => { throw actionError; },
      { entityType: 'all', status: 'all' },
      readHistory,
    )).resolves.toEqual({ ok: false, error: actionError });
    expect(readHistory).not.toHaveBeenCalled();

    const refreshError = new Error('History unavailable');
    await expect(executeManagerNotificationHistoryAction(
      async () => notification,
      { entityType: 'all', status: 'all' },
      async () => { throw refreshError; },
    )).resolves.toEqual({ ok: false, error: refreshError });
  });
});
