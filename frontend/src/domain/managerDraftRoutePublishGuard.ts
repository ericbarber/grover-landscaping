import type { DayPlanStop } from './dayPlans';
import type { YardCareJob } from './jobs';
import { getManagerDraftRoutePlanningMetrics } from './managerDraftRoutePlanningMetrics';
import { getManagerDraftRouteReviewMessage } from './managerDraftRouteReviewMessage';

export type ManagerDraftRoutePublishGuard = {
  canPublish: boolean;
  disabledReason: string | null;
};

export function getManagerDraftRoutePublishGuard(
  jobs: YardCareJob[],
  stops: DayPlanStop[],
): ManagerDraftRoutePublishGuard {
  const metrics = getManagerDraftRoutePlanningMetrics(jobs, stops);

  if (metrics.isReadyToReview) {
    return {
      canPublish: true,
      disabledReason: null,
    };
  }

  return {
    canPublish: false,
    disabledReason: getManagerDraftRouteReviewMessage(
      metrics.isReadyToReview,
      metrics.summary.hasStops,
      metrics.workload.totalMinutes,
    ),
  };
}
