import type { ManagerActivitySource } from './managerActivity';
import { managerActivitySourceLabel } from './managerActivityLabels';
import { managerActivityReviewBadgeLabel } from './managerActivityReviewCopy';

export function managerActivitySourceFilterStatusLabel(needsReviewCount: number): string {
  return managerActivityReviewBadgeLabel(needsReviewCount);
}

export function managerActivitySourceFilterAriaLabel(
  source: ManagerActivitySource,
  totalCount: number,
  needsReviewCount: number,
): string {
  const label = managerActivitySourceLabel(source);

  return `${label}: ${totalCount} activity items, ${needsReviewCount} review items`;
}
