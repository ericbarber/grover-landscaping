import type { ManagerActivitySource } from './managerActivity';
import { managerActivityReviewBadgeLabel } from './managerActivityReviewCopy';
import { managerActivitySourceFilterAriaCopy } from './managerActivitySourceFilterAriaCopy';

export function managerActivitySourceFilterStatusLabel(needsReviewCount: number): string {
  return managerActivityReviewBadgeLabel(needsReviewCount);
}

export function managerActivitySourceFilterAriaLabel(
  source: ManagerActivitySource,
  totalCount: number,
  needsReviewCount: number,
): string {
  return managerActivitySourceFilterAriaCopy(source, totalCount, needsReviewCount);
}
