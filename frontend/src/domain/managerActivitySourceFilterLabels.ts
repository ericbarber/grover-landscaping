import { managerActivitySourceLabel } from './managerActivityLabels';
import type { ManagerActivitySource } from './managerActivity';

export function managerActivitySourceFilterStatusLabel(needsReviewCount: number): string {
  return needsReviewCount > 0 ? `${needsReviewCount} review` : 'Clear';
}

export function managerActivitySourceFilterAriaLabel(
  source: ManagerActivitySource,
  totalCount: number,
  needsReviewCount: number,
): string {
  const label = managerActivitySourceLabel(source);

  return `${label}: ${totalCount} activity items, ${needsReviewCount} review items`;
}
