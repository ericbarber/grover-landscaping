import type { DayPlanStop } from './dayPlans';
import type { YardCareJob } from './jobs';
import { getManagerDraftRouteSummary, type ManagerDraftRouteSummary } from './managerDraftRouteSummary';
import { getManagerDraftRouteWorkload, type ManagerDraftRouteWorkload } from './managerDraftRouteWorkload';

export type ManagerDraftRoutePlanningMetrics = {
  summary: ManagerDraftRouteSummary;
  workload: ManagerDraftRouteWorkload;
  isReadyToReview: boolean;
  needsMoreJobs: boolean;
};

export function getManagerDraftRoutePlanningMetrics(
  jobs: YardCareJob[],
  stops: DayPlanStop[],
): ManagerDraftRoutePlanningMetrics {
  const summary = getManagerDraftRouteSummary(jobs, stops);
  const workload = getManagerDraftRouteWorkload(stops);

  return {
    summary,
    workload,
    isReadyToReview: summary.hasStops && workload.totalMinutes > 0,
    needsMoreJobs: summary.hasAssignableJobs,
  };
}
