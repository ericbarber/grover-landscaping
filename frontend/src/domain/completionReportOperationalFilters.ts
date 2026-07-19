import type { CompletionReportSnapshot } from '../api/client';

export type CompletionReportOperationalFilters = {
  organizationId?: string;
  crewId?: string;
  customer?: string;
  property?: string;
  scheduledFrom?: string;
  scheduledTo?: string;
};

function includesNormalized(value: string, query?: string): boolean {
  return !query || value.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
}

export function matchesCompletionReportOperationalFilters(
  report: CompletionReportSnapshot,
  filters: CompletionReportOperationalFilters,
): boolean {
  return (
    (!filters.organizationId || report.job.organizationId === filters.organizationId)
    && (!filters.crewId || (report.job.assignedCrewId ?? report.routeStop?.crewId) === filters.crewId)
    && includesNormalized(report.job.customerName, filters.customer)
    && includesNormalized(report.job.propertyAddress, filters.property)
    && (!filters.scheduledFrom || report.job.scheduledDate >= filters.scheduledFrom)
    && (!filters.scheduledTo || report.job.scheduledDate <= filters.scheduledTo)
  );
}
