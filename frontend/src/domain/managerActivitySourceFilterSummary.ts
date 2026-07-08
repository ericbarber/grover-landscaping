import {
  countManagerActivityNeedingReview,
  type ManagerActivityItem,
  type ManagerActivitySource,
} from './managerActivity';
import { managerActivityItemCountLabel } from './managerActivityItemCountCopy';
import { managerActivitySourceLabel } from './managerActivityLabels';
import {
  getManagerActivitySourceSummaryWithAriaLabel,
  managerActivitySourceStatusLabel,
} from './managerActivitySourceSummary';
import { managerActivityReviewAriaLabel } from './managerActivityReviewCopy';

export type ManagerActivitySourceFilterValue = ManagerActivitySource | 'all';

export type ManagerActivitySourceFilterSummary = {
  value: ManagerActivitySourceFilterValue;
  label: string;
  totalCount: number;
  needsReviewCount: number;
  statusLabel: string;
  ariaLabel: string;
};

export function getManagerActivitySourceFilterSummary(
  items: ManagerActivityItem[],
  value: ManagerActivitySourceFilterValue,
): ManagerActivitySourceFilterSummary {
  if (value === 'all') {
    const needsReviewCount = countManagerActivityNeedingReview(items);

    return {
      value,
      label: 'All sources',
      totalCount: items.length,
      needsReviewCount,
      statusLabel: managerActivitySourceStatusLabel(needsReviewCount),
      ariaLabel: `All sources: ${managerActivityItemCountLabel(items.length)}, ${managerActivityReviewAriaLabel(needsReviewCount)}`,
    };
  }

  const summary = getManagerActivitySourceSummaryWithAriaLabel(items, value);

  return {
    value,
    label: managerActivitySourceLabel(value),
    totalCount: summary.totalCount,
    needsReviewCount: summary.needsReviewCount,
    statusLabel: summary.statusLabel,
    ariaLabel: summary.ariaLabel,
  };
}

export function getManagerActivitySourceFilterSummaries(
  items: ManagerActivityItem[],
  sources: ManagerActivitySource[],
): ManagerActivitySourceFilterSummary[] {
  return [
    getManagerActivitySourceFilterSummary(items, 'all'),
    ...sources.map((source) => getManagerActivitySourceFilterSummary(items, source)),
  ];
}
