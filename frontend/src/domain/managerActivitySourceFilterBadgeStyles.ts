export type ManagerActivitySourceFilterBadgeState = {
  isActive: boolean;
  needsReviewCount: number;
};

const sourceFilterBadgeBaseClassName = 'rounded-full px-2 py-0.5 text-[10px] font-semibold';
const activeSourceFilterBadgeClassName = 'bg-white/20 text-white';
const reviewSourceFilterBadgeClassName = 'bg-amber-100 text-amber-800';
const clearSourceFilterBadgeClassName = 'bg-emerald-100 text-emerald-800';

export function managerActivitySourceFilterBadgeClassName({
  isActive,
  needsReviewCount,
}: ManagerActivitySourceFilterBadgeState): string {
  if (isActive) {
    return `${sourceFilterBadgeBaseClassName} ${activeSourceFilterBadgeClassName}`;
  }

  if (needsReviewCount > 0) {
    return `${sourceFilterBadgeBaseClassName} ${reviewSourceFilterBadgeClassName}`;
  }

  return `${sourceFilterBadgeBaseClassName} ${clearSourceFilterBadgeClassName}`;
}
