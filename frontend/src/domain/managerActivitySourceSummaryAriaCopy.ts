import { managerActivityItemCountLabel } from './managerActivityItemCountCopy';
import { managerActivitySourceLabel } from './managerActivityLabels';
import { managerActivityReviewAriaLabel } from './managerActivityReviewCopy';
import type { ManagerActivitySourceSummary } from './managerActivitySourceSummary';

export function managerActivitySourceSummaryAriaCopy(summary: ManagerActivitySourceSummary): string {
  const label = managerActivitySourceLabel(summary.source);
  const itemCountLabel = managerActivityItemCountLabel(summary.totalCount);
  const reviewLabel = managerActivityReviewAriaLabel(summary.needsReviewCount);

  return `${label}: ${itemCountLabel}, ${reviewLabel}`;
}
