import type { ManagerActivitySource } from './managerActivity';
import { managerActivityItemCountLabel } from './managerActivityItemCountCopy';
import { managerActivitySourceLabel } from './managerActivityLabels';
import { managerActivityReviewAriaLabel } from './managerActivityReviewCopy';

export function managerActivitySourceFilterAriaCopy(
  source: ManagerActivitySource,
  totalCount: number,
  needsReviewCount: number,
): string {
  const label = managerActivitySourceLabel(source);
  const itemCountLabel = managerActivityItemCountLabel(totalCount);
  const reviewLabel = managerActivityReviewAriaLabel(needsReviewCount);

  return `${label}: ${itemCountLabel}, ${reviewLabel}`;
}
