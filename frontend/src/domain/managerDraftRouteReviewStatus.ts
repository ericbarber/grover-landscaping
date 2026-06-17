import type { ManagerDraftRouteSummary } from './managerDraftRouteSummary';
import type { ManagerDraftRouteWorkload } from './managerDraftRouteWorkload';

export type ManagerDraftRouteReviewStatus = 'empty' | 'missing_workload' | 'ready';

type ManagerDraftRouteReviewMetrics = {
  isReadyToReview: boolean;
  summary: Pick<ManagerDraftRouteSummary, 'hasStops'>;
  workload: Pick<ManagerDraftRouteWorkload, 'totalMinutes'>;
};

export function getManagerDraftRouteReviewStatus(
  metrics: ManagerDraftRouteReviewMetrics,
): ManagerDraftRouteReviewStatus {
  if (metrics.isReadyToReview) {
    return 'ready';
  }

  if (!metrics.summary.hasStops) {
    return 'empty';
  }

  return 'missing_workload';
}
