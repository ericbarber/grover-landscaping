import {
  countManagerActivityBySource,
  countManagerActivityNeedingReviewBySource,
  type ManagerActivityItem,
  type ManagerActivitySource,
} from './managerActivity';
import { managerActivityReviewBadgeLabel } from './managerActivityReviewCopy';

export type ManagerActivitySourceSummary = {
  source: ManagerActivitySource;
  totalCount: number;
  needsReviewCount: number;
  statusLabel: string;
};

export function managerActivitySourceStatusLabel(needsReviewCount: number): string {
  return managerActivityReviewBadgeLabel(needsReviewCount);
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
