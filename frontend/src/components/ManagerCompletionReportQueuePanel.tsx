import { useMemo, useState } from 'react';
import {
  buildCompletionReportQueue,
  completionReportQueueReadinessFilterLabel,
  completionReportQueueGroupLabel,
  completionReportQueueStatusFilterLabel,
  filterCompletionReportQueue,
  summarizeCompletionReportQueue,
  type CompletionReportQueueReadinessFilter,
  type CompletionReportQueueStatusFilter,
} from '../domain/completionReportQueue';
import type { CompletionReportSnapshot } from '../api/client';
import type { CompletionReportQueueItem } from '../domain/completionReportQueue';

type ManagerCompletionReportQueuePanelProps = {
  reports: CompletionReportSnapshot[];
  isLoading: boolean;
  onRefresh: () => void;
  onSelectJob: (jobId: string) => void;
};

function readinessLabel(item: CompletionReportQueueItem): string {
  if (item.readyForCustomer) return 'Delivery ready';
  return `${item.checklistProgress}% checklist`;
}

const statusFilters: CompletionReportQueueStatusFilter[] = [
  'active',
  'needs_review',
  'in_review',
  'changes_requested',
  'draft',
  'delivered',
  'all',
];

const readinessFilters: CompletionReportQueueReadinessFilter[] = ['all', 'ready', 'blocked', 'local_only'];

export function ManagerCompletionReportQueuePanel({
  reports,
  isLoading,
  onRefresh,
  onSelectJob,
}: ManagerCompletionReportQueuePanelProps) {
  const [statusFilter, setStatusFilter] = useState<CompletionReportQueueStatusFilter>('active');
  const [readinessFilter, setReadinessFilter] = useState<CompletionReportQueueReadinessFilter>('all');
  const queueItems = useMemo(() => buildCompletionReportQueue(reports), [reports]);
  const visibleItems = useMemo(
    () => filterCompletionReportQueue(queueItems, { status: statusFilter, readiness: readinessFilter }),
    [queueItems, readinessFilter, statusFilter],
  );
  const summary = summarizeCompletionReportQueue(queueItems);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Manager reports</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">Completion review queue</h2>
        </div>
        <button
          className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          disabled={isLoading}
          onClick={onRefresh}
          type="button"
        >
          {isLoading ? 'Refreshing' : 'Refresh'}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-center sm:grid-cols-5">
        <div className="rounded-lg bg-amber-50 p-3">
          <p className="text-lg font-bold text-amber-900">{summary.changesRequested}</p>
          <p className="text-xs text-amber-700">Changes</p>
        </div>
        <div className="rounded-lg bg-emerald-50 p-3">
          <p className="text-lg font-bold text-emerald-900">{summary.needsReview}</p>
          <p className="text-xs text-emerald-700">Review</p>
        </div>
        <div className="rounded-lg bg-sky-50 p-3">
          <p className="text-lg font-bold text-sky-900">{summary.inReview}</p>
          <p className="text-xs text-sky-700">In review</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-lg font-bold text-slate-900">{summary.draft}</p>
          <p className="text-xs text-slate-600">Draft</p>
        </div>
        <div className="rounded-lg bg-indigo-50 p-3">
          <p className="text-lg font-bold text-indigo-900">{summary.delivered}</p>
          <p className="text-xs text-indigo-700">Delivered</p>
        </div>
      </div>

      <div aria-label="Filter completion reports by status" className="mt-4 flex flex-wrap gap-2">
        {statusFilters.map((filter) => (
          <button
            key={filter}
            aria-pressed={statusFilter === filter}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              statusFilter === filter
                ? 'border-slate-950 bg-slate-950 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
            onClick={() => setStatusFilter(filter)}
            type="button"
          >
            {completionReportQueueStatusFilterLabel(filter)}
          </button>
        ))}
      </div>

      <div aria-label="Filter completion reports by readiness" className="mt-3 flex flex-wrap gap-2">
        {readinessFilters.map((filter) => (
          <button
            key={filter}
            aria-pressed={readinessFilter === filter}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              readinessFilter === filter
                ? 'border-slate-950 bg-slate-950 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
            onClick={() => setReadinessFilter(filter)}
            type="button"
          >
            {completionReportQueueReadinessFilterLabel(filter)}
          </button>
        ))}
      </div>

      <p aria-live="polite" className="mt-3 text-xs font-medium text-slate-500">
        Showing {visibleItems.length} of {summary.total}
      </p>

      {visibleItems.length === 0 ? (
        <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          No completion reports match the selected filters.
        </p>
      ) : (
        <div className="mt-4 space-y-2">
          {visibleItems.map((item) => (
            <article key={item.reportId} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold text-slate-950">{item.customerName}</p>
                  <p className="mt-1 break-words text-xs text-slate-600">{item.propertyAddress}</p>
                </div>
                <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[11px] font-bold uppercase text-slate-600">
                  {completionReportQueueGroupLabel(item.group)}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                <span>{readinessLabel(item)}</span>
                <span>{item.beforePhotos} before</span>
                <span>{item.afterPhotos} after</span>
                {item.issuePhotos > 0 ? <span>{item.issuePhotos} issue</span> : null}
                {!item.persisted ? <span>Local only</span> : null}
              </div>
              <button
                className="mt-3 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                onClick={() => onSelectJob(item.jobId)}
                type="button"
              >
                Open report
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
