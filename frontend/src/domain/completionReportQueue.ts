import type { CompletionReportSnapshot, CompletionReportStatus } from '../api/client';

export type CompletionReportQueueGroup = 'needs_review' | 'in_review' | 'changes_requested' | 'delivered' | 'draft';
export type CompletionReportQueueStatusFilter = CompletionReportQueueGroup | 'active' | 'all';
export type CompletionReportQueueReadinessFilter = 'all' | 'ready' | 'blocked' | 'local_only';

export interface CompletionReportQueueFilters {
  status: CompletionReportQueueStatusFilter;
  readiness: CompletionReportQueueReadinessFilter;
}

export interface CompletionReportQueueItem {
  reportId: string;
  jobId: string;
  customerName: string;
  propertyAddress: string;
  reportStatus: CompletionReportStatus;
  group: CompletionReportQueueGroup;
  checklistProgress: number;
  beforePhotos: number;
  afterPhotos: number;
  issuePhotos: number;
  readyForCustomer: boolean;
  persisted: boolean;
  readinessBlockers: NonNullable<CompletionReportSnapshot['readinessBlockers']>;
  shareUrl: string | null;
}

export interface CompletionReportQueueSummary {
  total: number;
  needsReview: number;
  inReview: number;
  changesRequested: number;
  delivered: number;
  draft: number;
}

const groupPriority: Record<CompletionReportQueueGroup, number> = {
  changes_requested: 0,
  needs_review: 1,
  in_review: 2,
  draft: 3,
  delivered: 4,
};

export function completionReportQueueGroup(status: CompletionReportStatus): CompletionReportQueueGroup {
  if (status === 'submitted') return 'needs_review';
  if (status === 'in_review') return 'in_review';
  if (status === 'changes_requested') return 'changes_requested';
  if (status === 'delivered') return 'delivered';
  return 'draft';
}

export function completionReportQueueGroupLabel(group: CompletionReportQueueGroup): string {
  if (group === 'needs_review') return 'Needs review';
  if (group === 'in_review') return 'In review';
  if (group === 'changes_requested') return 'Changes requested';
  if (group === 'delivered') return 'Delivered';
  return 'Draft';
}

export function completionReportQueueStatusFilterLabel(filter: CompletionReportQueueStatusFilter): string {
  if (filter === 'all') return 'All';
  if (filter === 'active') return 'Active';
  return completionReportQueueGroupLabel(filter);
}

export function completionReportQueueReadinessFilterLabel(filter: CompletionReportQueueReadinessFilter): string {
  if (filter === 'ready') return 'Ready';
  if (filter === 'blocked') return 'Blocked';
  if (filter === 'local_only') return 'Local only';
  return 'All readiness';
}

export function completionReportReadinessBlockerLabel(
  blocker: NonNullable<CompletionReportSnapshot['readinessBlockers']>[number],
): string {
  return {
    checklist: 'Finish checklist',
    before_photos: 'Capture before photo',
    after_photos: 'Capture after photo',
    add_ons: 'Finish add-on work',
    route_stop: 'Finish route stop',
  }[blocker];
}

export function toCompletionReportQueueItem(report: CompletionReportSnapshot): CompletionReportQueueItem {
  return {
    reportId: report.reportId,
    jobId: report.jobId,
    customerName: report.job.customerName,
    propertyAddress: report.job.propertyAddress,
    reportStatus: report.reportStatus,
    group: completionReportQueueGroup(report.reportStatus),
    checklistProgress: report.checklistProgress,
    beforePhotos: report.beforePhotos,
    afterPhotos: report.afterPhotos,
    issuePhotos: report.issuePhotos,
    readyForCustomer: report.readyForCustomer,
    persisted: report.persisted,
    readinessBlockers: report.readinessBlockers ?? [],
    shareUrl: report.shareUrl,
  };
}

export function buildCompletionReportQueue(reports: CompletionReportSnapshot[]): CompletionReportQueueItem[] {
  return reports
    .map(toCompletionReportQueueItem)
    .sort((first, second) => {
      const groupComparison = groupPriority[first.group] - groupPriority[second.group];
      if (groupComparison !== 0) return groupComparison;
      return first.customerName.localeCompare(second.customerName) || first.jobId.localeCompare(second.jobId);
    });
}

export function filterCompletionReportQueue(
  items: CompletionReportQueueItem[],
  filters: CompletionReportQueueFilters,
): CompletionReportQueueItem[] {
  return items.filter((item) => {
    if (filters.status === 'active' && item.group === 'delivered') return false;
    if (filters.status !== 'all' && filters.status !== 'active' && item.group !== filters.status) return false;

    if (filters.readiness === 'ready' && !item.readyForCustomer) return false;
    if (filters.readiness === 'blocked' && item.readyForCustomer) return false;
    if (filters.readiness === 'local_only' && item.persisted) return false;

    return true;
  });
}

export function summarizeCompletionReportQueue(items: CompletionReportQueueItem[]): CompletionReportQueueSummary {
  return items.reduce<CompletionReportQueueSummary>(
    (summary, item) => {
      summary.total += 1;
      if (item.group === 'needs_review') summary.needsReview += 1;
      if (item.group === 'in_review') summary.inReview += 1;
      if (item.group === 'changes_requested') summary.changesRequested += 1;
      if (item.group === 'delivered') summary.delivered += 1;
      if (item.group === 'draft') summary.draft += 1;
      return summary;
    },
    {
      total: 0,
      needsReview: 0,
      inReview: 0,
      changesRequested: 0,
      delivered: 0,
      draft: 0,
    },
  );
}
