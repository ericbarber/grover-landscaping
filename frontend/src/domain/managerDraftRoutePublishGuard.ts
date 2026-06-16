import type { DayPlanStop } from './dayPlans';
import type { YardCareJob } from './jobs';
import {
  getManagerDraftRoutePlanningMetrics,
  type ManagerDraftRoutePlanningMetrics,
} from './managerDraftRoutePlanningMetrics';
import { getManagerDraftRouteReviewMessage } from './managerDraftRouteReviewMessage';

export type ManagerDraftRoutePublishGuard = {
  canPublish: boolean;
  disabledReason: string | null;
};

export function getManagerDraftRoutePublishGuardFromMetrics(
  metrics: ManagerDraftRoutePlanningMetrics,
): ManagerDraftRoutePublishGuard {
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

export function getManagerDraftRoutePublishGuard(
  jobs: YardCareJob[],
  stops: DayPlanStop[],
): ManagerDraftRoutePublishGuard {
  return getManagerDraftRoutePublishGuardFromMetrics(getManagerDraftRoutePlanningMetrics(jobs, stops));
}
