import type { DayPlanMutationResponse } from '../api/dayPlansClient';

export function draftDayPlanId(crewId: string, serviceDate: string): string {
  return `day_plan_${serviceDate.replaceAll('-', '_')}_${crewId}`;
}

export function localDraftDayPlanResponse(crewId: string, serviceDate: string): DayPlanMutationResponse {
  return {
    id: draftDayPlanId(crewId, serviceDate),
    crewId,
    serviceDate,
    status: 'draft',
    routeStatus: 'manual',
    persisted: false,
  };
}
