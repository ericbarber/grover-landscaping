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
