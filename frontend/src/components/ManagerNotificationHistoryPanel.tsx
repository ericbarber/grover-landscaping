import { useMemo, useState } from 'react';
import type {
  NotificationHistoryEntityType,
  NotificationHistoryItem,
  NotificationHistoryStatus,
} from '../api/client';

type ManagerNotificationHistoryPanelProps = {
  notifications: NotificationHistoryItem[];
  isLoading: boolean;
  onRefresh: (filters: NotificationHistoryFilters) => void;
  onRetry: (notificationId: string, filters: NotificationHistoryFilters) => void;
  onResolve: (notificationId: string, filters: NotificationHistoryFilters) => void;
};

export type NotificationHistoryEntityFilter = NotificationHistoryEntityType | 'all';
export type NotificationHistoryStatusFilter = NotificationHistoryStatus | 'all';

export type NotificationHistoryFilters = {
  entityType: NotificationHistoryEntityFilter;
  status: NotificationHistoryStatusFilter;
};

const entityFilters: NotificationHistoryEntityFilter[] = ['all', 'completion_report', 'project_bid'];
const statusFilters: NotificationHistoryStatusFilter[] = [
  'all',
  'queued',
  'sending',
  'sent',
  'failed',
  'dead_letter',
  'resolved',
  'skipped',
];

function statusLabel(status: NotificationHistoryStatusFilter): string {
  if (status === 'dead_letter') return 'Needs attention';
  if (status === 'resolved') return 'Resolved';
  if (status === 'all') return 'All statuses';
  return status.replace('_', ' ');
}

function entityLabel(entity: NotificationHistoryEntityFilter): string {
  if (entity === 'completion_report') return 'Reports';
  if (entity === 'project_bid') return 'Bids';
  return 'All work';
}

function statusClassName(status: NotificationHistoryStatus): string {
  if (status === 'sent') return 'bg-emerald-100 text-emerald-800';
  if (status === 'resolved') return 'bg-violet-100 text-violet-800';
  if (status === 'failed' || status === 'dead_letter') return 'bg-rose-100 text-rose-800';
  if (status === 'sending' || status === 'queued') return 'bg-sky-100 text-sky-800';
  return 'bg-slate-100 text-slate-700';
}

function formatDate(value: string | null): string {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function ManagerNotificationHistoryPanel({
  notifications,
  isLoading,
  onRefresh,
  onRetry,
  onResolve,
}: ManagerNotificationHistoryPanelProps) {
  const [entityType, setEntityType] = useState<NotificationHistoryEntityFilter>('all');
  const [status, setStatus] = useState<NotificationHistoryStatusFilter>('all');
  const failedCount = useMemo(
    () => notifications.filter((item) => item.status === 'failed' || item.status === 'dead_letter').length,
    [notifications],
  );

  function updateFilters(nextFilters: Partial<NotificationHistoryFilters>) {
    const filters = {
      entityType,
      status,
      ...nextFilters,
    };
    setEntityType(filters.entityType);
    setStatus(filters.status);
    onRefresh(filters);
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Notifications</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">Delivery history</h2>
          <p className="mt-1 text-xs text-slate-500">
            {failedCount > 0 ? `${failedCount} delivery item${failedCount === 1 ? '' : 's'} need attention.` : 'No failed deliveries in the current view.'}
          </p>
        </div>
        <button
          className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          disabled={isLoading}
          onClick={() => onRefresh({ entityType, status })}
          type="button"
        >
          {isLoading ? 'Refreshing' : 'Refresh'}
        </button>
      </div>

      <div aria-label="Filter notification history by work type" className="mt-4 flex flex-wrap gap-2">
        {entityFilters.map((filter) => (
          <button
            key={filter}
            aria-pressed={entityType === filter}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              entityType === filter
                ? 'border-slate-950 bg-slate-950 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
            onClick={() => updateFilters({ entityType: filter })}
            type="button"
          >
            {entityLabel(filter)}
          </button>
        ))}
      </div>

      <div aria-label="Filter notification history by status" className="mt-3 flex flex-wrap gap-2">
        {statusFilters.map((filter) => (
          <button
            key={filter}
            aria-pressed={status === filter}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize transition ${
              status === filter
                ? 'border-slate-950 bg-slate-950 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
            onClick={() => updateFilters({ status: filter })}
            type="button"
          >
            {statusLabel(filter)}
          </button>
        ))}
      </div>

      {notifications.length === 0 ? (
        <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          No delivery history matches the selected filters.
        </p>
      ) : (
        <div className="mt-4 space-y-2">
          {notifications.map((notification) => (
            <article key={notification.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold text-slate-950">
                    {entityLabel(notification.entityType)} · {notification.templateKey.replace(/_/g, ' ')}
                  </p>
                  <p className="mt-1 break-all text-xs text-slate-600">
                    {notification.channel.toUpperCase()} to {notification.recipient}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-bold uppercase ${statusClassName(notification.status)}`}>
                  {statusLabel(notification.status)}
                </span>
              </div>
              <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
                <p>Attempts: {notification.attemptCount}</p>
                <p>Last attempt: {formatDate(notification.lastAttemptAt)}</p>
                <p>Next available: {formatDate(notification.availableAt)}</p>
              </div>
              {notification.lastError ? (
                <p className="mt-2 break-words rounded-lg bg-white p-2 text-xs text-rose-700">
                  {notification.lastError}
                </p>
              ) : null}
              {notification.providerMessageId ? (
                <p className="mt-2 break-all text-xs text-slate-500">
                  Provider message: {notification.providerMessageId}
                </p>
              ) : null}
              {notification.status === 'failed' || notification.status === 'dead_letter' ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    className="rounded-lg border border-rose-300 bg-white px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                    disabled={isLoading}
                    onClick={() => onRetry(notification.id, { entityType, status })}
                    type="button"
                  >
                    Retry delivery
                  </button>
                  <button
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    disabled={isLoading}
                    onClick={() => onResolve(notification.id, { entityType, status })}
                    type="button"
                  >
                    Mark resolved
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
