import type { DayPlanStop } from './dayPlans';
import type { YardCareJob } from './jobs';
import { getAssignableJobCount, getDraftRouteEstimatedMinutes, getDraftRouteStopCount } from './managerJobAssignment';

export type ManagerDraftRouteSummary = {
  stopCount: number;
  estimatedMinutes: number;
  assignableJobCount: number;
  hasStops: boolean;
  hasAssignableJobs: boolean;
};

export function getManagerDraftRouteSummary(jobs: YardCareJob[], stops: DayPlanStop[]): ManagerDraftRouteSummary {
  const stopCount = getDraftRouteStopCount(stops);
  const estimatedMinutes = getDraftRouteEstimatedMinutes(stops);
  const assignableJobCount = getAssignableJobCount(jobs, stops);

  return {
    stopCount,
    estimatedMinutes,
    assignableJobCount,
    hasStops: stopCount > 0,
    hasAssignableJobs: assignableJobCount > 0,
  };
}
