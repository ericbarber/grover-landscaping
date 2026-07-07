import type { ManagerActivitySource } from './managerActivity';
import { managerActivitySourceLabel } from './managerActivityLabels';
import {
  managerActivityReviewAriaLabel,
  managerActivityReviewBadgeLabel,
} from './managerActivityReviewCopy';

export function managerActivitySourceFilterStatusLabel(needsReviewCount: number): string {
  return managerActivityReviewBadgeLabel(needsReviewCount);
}

export function managerActivitySourceFilterAriaLabel(
  source: ManagerActivitySource,
  totalCount: number,
  needsReviewCount: number,
): string {
  const label = managerActivitySourceLabel(source);
  const reviewLabel = managerActivityReviewAriaLabel(needsReviewCount);

  return `${label}: ${totalCount} activity items, ${reviewLabel}`;
}
