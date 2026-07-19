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
import type { CompletionReportOperationalFilters } from '../domain/completionReportOperationalFilters';

type ManagerCompletionReportQueuePanelProps = {
  reports: CompletionReportSnapshot[];
  isLoading: boolean;
  onRefresh: (filters: CompletionReportOperationalFilters) => void;
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
const readinessBlockers = [
  ['all', 'All blockers'],
  ['any', 'Any blocker'],
  ['checklist', 'Checklist'],
  ['before_photos', 'Before photos'],
  ['after_photos', 'After photos'],
  ['add_ons', 'Add-on work'],
  ['route_stop', 'Route stop'],
] as const;

export function ManagerCompletionReportQueuePanel({
  reports,
  isLoading,
  onRefresh,
  onSelectJob,
}: ManagerCompletionReportQueuePanelProps) {
  const [statusFilter, setStatusFilter] = useState<CompletionReportQueueStatusFilter>('active');
  const [readinessFilter, setReadinessFilter] = useState<CompletionReportQueueReadinessFilter>('all');
  const [readinessBlocker, setReadinessBlocker] = useState<(typeof readinessBlockers)[number][0]>('all');
  const [organizationId, setOrganizationId] = useState('');
  const [crewId, setCrewId] = useState('');
  const [customer, setCustomer] = useState('');
  const [property, setProperty] = useState('');
  const [scheduledFrom, setScheduledFrom] = useState('');
  const [scheduledTo, setScheduledTo] = useState('');
  const hasInvalidDateRange = Boolean(scheduledFrom && scheduledTo && scheduledFrom > scheduledTo);
  const queueItems = useMemo(() => buildCompletionReportQueue(reports), [reports]);
  const organizationIds = useMemo(
    () => Array.from(new Set([
      ...reports.map((report) => report.job.organizationId).filter((id): id is string => Boolean(id)),
      ...(organizationId ? [organizationId] : []),
    ])).sort(),
    [organizationId, reports],
  );
  const crewIds = useMemo(
    () => Array.from(new Set([
      ...reports
        .map((report) => report.job.assignedCrewId ?? report.routeStop?.crewId)
        .filter((id): id is string => Boolean(id)),
      ...(crewId ? [crewId] : []),
    ])).sort(),
    [crewId, reports],
  );
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
        <div className="grid gap-2 sm:grid-cols-3">
          <label className="text-xs font-semibold text-slate-600">
            Organization
            <select
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm font-normal text-slate-900"
              onChange={(event) => setOrganizationId(event.target.value)}
              value={organizationId}
            >
              <option value="">All organizations</option>
              {organizationIds.map((id) => <option key={id} value={id}>{id}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Crew
            <select
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm font-normal text-slate-900"
              onChange={(event) => setCrewId(event.target.value)}
              value={crewId}
            >
              <option value="">All crews</option>
              {crewIds.map((id) => <option key={id} value={id}>{id}</option>)}
            </select>
          </label>
          <button
            className="self-end rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            disabled={isLoading || hasInvalidDateRange}
            onClick={() => onRefresh({
              organizationId: organizationId || undefined,
              crewId: crewId || undefined,
              customer: customer.trim() || undefined,
              property: property.trim() || undefined,
              scheduledFrom: scheduledFrom || undefined,
              scheduledTo: scheduledTo || undefined,
              status: statusFilter === 'needs_review' ? 'submitted' : statusFilter,
              readiness: readinessFilter,
              readinessBlocker,
            })}
            type="button"
          >
            {isLoading ? 'Applying' : 'Apply'}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs font-semibold text-slate-600">
          Customer
          <input
            className="mt-1 block w-full rounded-lg border border-slate-300 px-2 py-2 text-sm font-normal text-slate-900"
            onChange={(event) => setCustomer(event.target.value)}
            placeholder="Name contains"
            value={customer}
          />
        </label>
        <label className="text-xs font-semibold text-slate-600">
          Property
          <input
            className="mt-1 block w-full rounded-lg border border-slate-300 px-2 py-2 text-sm font-normal text-slate-900"
            onChange={(event) => setProperty(event.target.value)}
            placeholder="Address contains"
            value={property}
          />
        </label>
        <label className="text-xs font-semibold text-slate-600">
          Scheduled from
          <input
            className="mt-1 block w-full rounded-lg border border-slate-300 px-2 py-2 text-sm font-normal text-slate-900"
            onChange={(event) => setScheduledFrom(event.target.value)}
            type="date"
            value={scheduledFrom}
          />
        </label>
        <label className="text-xs font-semibold text-slate-600">
          Scheduled through
          <input
            className="mt-1 block w-full rounded-lg border border-slate-300 px-2 py-2 text-sm font-normal text-slate-900"
            min={scheduledFrom || undefined}
            onChange={(event) => setScheduledTo(event.target.value)}
            type="date"
            value={scheduledTo}
          />
        </label>
      </div>
      {hasInvalidDateRange ? (
        <p className="mt-2 text-xs font-semibold text-rose-700" role="alert">
          Scheduled through must be on or after the starting date.
        </p>
      ) : null}

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

      <label className="mt-3 block max-w-xs text-xs font-semibold text-slate-600">
        Readiness blocker
        <select
          className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm font-normal text-slate-900"
          onChange={(event) => setReadinessBlocker(
            event.target.value as (typeof readinessBlockers)[number][0],
          )}
          value={readinessBlocker}
        >
          {readinessBlockers.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </label>

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
