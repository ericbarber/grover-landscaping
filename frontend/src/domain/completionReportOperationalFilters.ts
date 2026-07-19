import type {
  CompletionReportListReadinessBlockerFilter,
  CompletionReportListReadinessFilter,
  CompletionReportListStatusFilter,
  CompletionReportSnapshot,
} from '../api/client';

export type CompletionReportOperationalFilters = {
  organizationId?: string;
  crewId?: string;
  customer?: string;
  property?: string;
  scheduledFrom?: string;
  scheduledTo?: string;
  status?: CompletionReportListStatusFilter;
  readiness?: CompletionReportListReadinessFilter;
  readinessBlocker?: CompletionReportListReadinessBlockerFilter;
};

export const COMPLETION_REPORT_FILTER_STORAGE_KEY = 'grover.manager-completion-report-filters.v1';

const statusFilters = ['all', 'active', 'draft', 'submitted', 'in_review', 'changes_requested', 'delivered'];
const readinessFilters = ['all', 'ready', 'blocked', 'local_only'];
const blockerFilters = [
  'all',
  'any',
  'checklist',
  'before_photos',
  'after_photos',
  'add_ons',
  'route_stop',
];

export function parseCompletionReportOperationalFilters(
  serialized: string | null,
): CompletionReportOperationalFilters {
  if (!serialized) return {};
  try {
    const value = JSON.parse(serialized) as Record<string, unknown>;
    const text = (key: string) => typeof value[key] === 'string' && value[key]
      ? value[key] as string
      : undefined;
    const status = text('status');
    const readiness = text('readiness');
    const readinessBlocker = text('readinessBlocker');
    const filters: CompletionReportOperationalFilters = {};
    for (const key of [
      'organizationId',
      'crewId',
      'customer',
      'property',
      'scheduledFrom',
      'scheduledTo',
    ] as const) {
      const entry = text(key);
      if (entry) filters[key] = entry;
    }
    if (status && statusFilters.includes(status)) {
      filters.status = status as CompletionReportListStatusFilter;
    }
    if (readiness && readinessFilters.includes(readiness)) {
      filters.readiness = readiness as CompletionReportListReadinessFilter;
    }
    if (readinessBlocker && blockerFilters.includes(readinessBlocker)) {
      filters.readinessBlocker = readinessBlocker as CompletionReportListReadinessBlockerFilter;
    }
    return filters;
  } catch {
    return {};
  }
}

export function completionReportOperationalFilterCount(
  filters: CompletionReportOperationalFilters,
): number {
  return [
    filters.organizationId,
    filters.crewId,
    filters.customer,
    filters.property,
    filters.scheduledFrom,
    filters.scheduledTo,
    filters.status && filters.status !== 'active' ? filters.status : undefined,
    filters.readiness && filters.readiness !== 'all' ? filters.readiness : undefined,
    filters.readinessBlocker && filters.readinessBlocker !== 'all'
      ? filters.readinessBlocker
      : undefined,
  ].filter(Boolean).length;
}

function includesNormalized(value: string, query?: string): boolean {
  return !query || value.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
}

export function matchesCompletionReportOperationalFilters(
  report: CompletionReportSnapshot,
  filters: CompletionReportOperationalFilters,
): boolean {
  const statusMatches = !filters.status
    || filters.status === 'all'
    || (filters.status === 'active' && report.reportStatus !== 'delivered')
    || report.reportStatus === filters.status;
  const readinessMatches = !filters.readiness
    || filters.readiness === 'all'
    || (filters.readiness === 'ready' && report.readyForCustomer)
    || (filters.readiness === 'blocked' && !report.readyForCustomer)
    || (filters.readiness === 'local_only' && !report.persisted);
  let blockerMatches = true;
  if (filters.readinessBlocker === 'any') {
    blockerMatches = !report.readyForCustomer;
  } else if (filters.readinessBlocker && filters.readinessBlocker !== 'all') {
    blockerMatches = report.readinessBlockers?.includes(filters.readinessBlocker) ?? false;
  }

  return (
    statusMatches
    && readinessMatches
    && blockerMatches
    && (!filters.organizationId || report.job.organizationId === filters.organizationId)
    && (!filters.crewId || (report.job.assignedCrewId ?? report.routeStop?.crewId) === filters.crewId)
    && includesNormalized(report.job.customerName, filters.customer)
    && includesNormalized(report.job.propertyAddress, filters.property)
    && (!filters.scheduledFrom || report.job.scheduledDate >= filters.scheduledFrom)
    && (!filters.scheduledTo || report.job.scheduledDate <= filters.scheduledTo)
  );
}
