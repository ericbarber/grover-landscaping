import type { DayPlanStop } from './dayPlans';

export function getDraftStopIndex(stops: Pick<DayPlanStop, 'jobId'>[], jobId: string): number {
  return stops.findIndex((stop) => stop.jobId === jobId);
}

export function canMoveDraftStopUp(stops: Pick<DayPlanStop, 'jobId'>[], jobId: string): boolean {
  return getDraftStopIndex(stops, jobId) > 0;
}

export function canMoveDraftStopDown(stops: Pick<DayPlanStop, 'jobId'>[], jobId: string): boolean {
  const index = getDraftStopIndex(stops, jobId);

  return index >= 0 && index < stops.length - 1;
}
