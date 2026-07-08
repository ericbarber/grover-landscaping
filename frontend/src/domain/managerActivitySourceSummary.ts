import {
  countManagerActivityBySource,
  countManagerActivityNeedingReviewBySource,
  type ManagerActivityItem,
  type ManagerActivitySource,
} from './managerActivity';
import { managerActivityReviewBadgeLabel } from './managerActivityReviewCopy';
import { managerActivitySourceSummaryAriaCopy } from './managerActivitySourceSummaryAriaCopy';

export type ManagerActivitySourceSummary = {
  source: ManagerActivitySource;
  totalCount: number;
  needsReviewCount: number;
  statusLabel: string;
};

export type ManagerActivitySourceSummaryWithAriaLabel = ManagerActivitySourceSummary & {
  ariaLabel: string;
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

export function getManagerActivitySourceSummaryWithAriaLabel(
  items: ManagerActivityItem[],
  source: ManagerActivitySource,
): ManagerActivitySourceSummaryWithAriaLabel {
  const summary = getManagerActivitySourceSummary(items, source);

  return {
    ...summary,
    ariaLabel: managerActivitySourceSummaryAriaCopy(summary),
  };
}

export function getManagerActivitySourceSummaries(
  items: ManagerActivityItem[],
  sources: ManagerActivitySource[],
): ManagerActivitySourceSummary[] {
  return sources.map((source) => getManagerActivitySourceSummary(items, source));
}

export function getManagerActivitySourceSummariesWithAriaLabels(
  items: ManagerActivityItem[],
  sources: ManagerActivitySource[],
): ManagerActivitySourceSummaryWithAriaLabel[] {
  return sources.map((source) => getManagerActivitySourceSummaryWithAriaLabel(items, source));
}
