import {
  countManagerActivityBySource,
  countManagerActivityNeedingReviewBySource,
  type ManagerActivityItem,
  type ManagerActivitySource,
} from './managerActivity';

export type ManagerActivitySourceSummary = {
  source: ManagerActivitySource;
  totalCount: number;
  needsReviewCount: number;
  statusLabel: string;
};

export function managerActivitySourceStatusLabel(needsReviewCount: number): string {
  return needsReviewCount > 0 ? `${needsReviewCount} review` : 'Clear';
}

export function getManagerActivitySourceSummary(
  items: ManagerActivityItem[],
  source: ManagerActivitySource,
): ManagerActivitySourceSummary {
  const needsReviewCount = countManagerActivityNeedingReviewBySource(items, source);

  return {
    source,
    totalCount: countManagerActivityBySource(items, source),
    needsReviewCount,
    statusLabel: managerActivitySourceStatusLabel(needsReviewCount),
  };
}

export function getManagerActivitySourceSummaries(
  items: ManagerActivityItem[],
  sources: ManagerActivitySource[],
): ManagerActivitySourceSummary[] {
  return sources.map((source) => getManagerActivitySourceSummary(items, source));
}
