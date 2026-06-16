export function getManagerDraftRouteReviewMessage(
  isReadyToReview: boolean,
  hasStops: boolean,
  totalMinutes: number,
): string {
  if (isReadyToReview) {
    return 'Ready for manager review before publishing.';
  }

  if (!hasStops) {
    return 'Add at least one job before reviewing this route.';
  }

  if (totalMinutes === 0) {
    return 'Add workload estimates before publishing this route.';
  }

  return 'Review route details before publishing.';
}
