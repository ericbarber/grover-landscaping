import type { DayPlanStop } from './dayPlans';

export type ManagerDraftRouteWorkload = {
  driveMinutes: number;
  serviceMinutes: number;
  totalMinutes: number;
};

export function getDraftRouteDriveMinutes(stops: Pick<DayPlanStop, 'estimatedDriveMinutes'>[]): number {
  return stops.reduce((total, stop) => total + stop.estimatedDriveMinutes, 0);
}

export function getDraftRouteServiceMinutes(stops: Pick<DayPlanStop, 'estimatedServiceMinutes'>[]): number {
  return stops.reduce((total, stop) => total + stop.estimatedServiceMinutes, 0);
}

export function getManagerDraftRouteWorkload(stops: DayPlanStop[]): ManagerDraftRouteWorkload {
  const driveMinutes = getDraftRouteDriveMinutes(stops);
  const serviceMinutes = getDraftRouteServiceMinutes(stops);

  return {
    driveMinutes,
    serviceMinutes,
    totalMinutes: driveMinutes + serviceMinutes,
  };
}
