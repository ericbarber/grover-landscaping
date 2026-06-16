import type { ManagerDraftRoutePlanningMetrics } from './managerDraftRoutePlanningMetrics';

export type ManagerDraftRouteReviewStatus = 'empty' | 'missing_workload' | 'ready';

export function getManagerDraftRouteReviewStatus(
  metrics: Pick<ManagerDraftRoutePlanningMetrics, 'isReadyToReview' | 'summary' | 'workload'>,
): ManagerDraftRouteReviewStatus {
  if (metrics.isReadyToReview) {
    return 'ready';
  }

  if (!metrics.summary.hasStops) {
    return 'empty';
  }

  return 'missing_workload';
}
