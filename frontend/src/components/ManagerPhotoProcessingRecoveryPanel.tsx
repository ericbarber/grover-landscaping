import { useMemo, useState } from 'react';
import type { PhotoProcessingHistoryItem, PhotoProcessingStatus } from '../api/client';

type ManagerPhotoProcessingRecoveryPanelProps = {
  items: PhotoProcessingHistoryItem[];
  isLoading: boolean;
  onRefresh: (filters: PhotoProcessingRecoveryFilters) => void;
  onRetry: (processingJobId: string, filters: PhotoProcessingRecoveryFilters) => void;
  onResolve: (processingJobId: string, filters: PhotoProcessingRecoveryFilters) => void;
};

export type PhotoProcessingStatusFilter = PhotoProcessingStatus | 'all';

export type PhotoProcessingRecoveryFilters = {
  status: PhotoProcessingStatusFilter;
};

const statusFilters: PhotoProcessingStatusFilter[] = ['all', 'failed', 'dead_letter', 'queued', 'processing', 'completed', 'resolved'];

function statusLabel(status: PhotoProcessingStatusFilter): string {
  if (status === 'dead_letter') return 'Needs attention';
  if (status === 'all') return 'All statuses';
  return status.replace('_', ' ');
}

function statusClassName(status: PhotoProcessingStatus): string {
  if (status === 'completed' || status === 'resolved') return 'bg-emerald-100 text-emerald-800';
  if (status === 'failed' || status === 'dead_letter') return 'bg-rose-100 text-rose-800';
  if (status === 'queued' || status === 'processing') return 'bg-sky-100 text-sky-800';
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

function taskLabel(item: PhotoProcessingHistoryItem): string {
  return item.taskType === 'thumbnail_generation' ? 'Thumbnail generation' : 'Photo processing';
}

export function ManagerPhotoProcessingRecoveryPanel({
  items,
  isLoading,
  onRefresh,
  onRetry,
  onResolve,
}: ManagerPhotoProcessingRecoveryPanelProps) {
  const [status, setStatus] = useState<PhotoProcessingStatusFilter>('failed');
  const attentionCount = useMemo(
    () => items.filter((item) => item.status === 'failed' || item.status === 'dead_letter').length,
    [items],
  );

  function updateFilters(nextFilters: Partial<PhotoProcessingRecoveryFilters>) {
    const filters = {
      status,
      ...nextFilters,
    };
    setStatus(filters.status);
    onRefresh(filters);
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Photo processing</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">Recovery queue</h2>
          <p className="mt-1 text-xs text-slate-500">
            {attentionCount > 0 ? `${attentionCount} thumbnail job${attentionCount === 1 ? '' : 's'} need attention.` : 'No failed thumbnail work in the current view.'}
          </p>
        </div>
        <button
          className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          disabled={isLoading}
          onClick={() => onRefresh({ status })}
          type="button"
        >
          {isLoading ? 'Refreshing' : 'Refresh'}
        </button>
      </div>

      <div aria-label="Filter photo processing history by status" className="mt-4 flex flex-wrap gap-2">
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

      {items.length === 0 ? (
        <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          No photo processing jobs match the selected filters.
        </p>
      ) : (
        <div className="mt-4 space-y-2">
          {items.map((item) => (
            <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold text-slate-950">
                    {taskLabel(item)} · {item.fileName}
                  </p>
                  <p className="mt-1 break-all text-xs text-slate-600">
                    {item.jobId} · {item.photoType}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-bold uppercase ${statusClassName(item.status)}`}>
                  {statusLabel(item.status)}
                </span>
              </div>
              <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
                <p>Attempts: {item.attemptCount}</p>
                <p>Last attempt: {formatDate(item.lastAttemptAt)}</p>
                <p>Next available: {formatDate(item.availableAt)}</p>
              </div>
              {item.lastError ? (
                <p className="mt-2 break-words rounded-lg bg-white p-2 text-xs text-rose-700">
                  {item.lastError}
                </p>
              ) : null}
              {item.resolutionNote ? (
                <p className="mt-2 break-words rounded-lg bg-white p-2 text-xs text-emerald-700">
                  {item.resolutionNote}
                </p>
              ) : null}
              {item.status === 'failed' || item.status === 'dead_letter' ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    className="rounded-lg border border-rose-300 bg-white px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                    disabled={isLoading}
                    onClick={() => onRetry(item.id, { status })}
                    type="button"
                  >
                    Retry processing
                  </button>
                  <button
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    disabled={isLoading}
                    onClick={() => onResolve(item.id, { status })}
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
