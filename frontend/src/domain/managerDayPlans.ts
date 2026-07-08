import type { DayPlanMutationResponse } from '../api/dayPlansClient';

export function defaultManagerServiceDate(referenceDate = new Date()): string {
  const year = referenceDate.getFullYear();
  const month = String(referenceDate.getMonth() + 1).padStart(2, '0');
  const day = String(referenceDate.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function draftDayPlanId(crewId: string, serviceDate: string): string {
  return `day_plan_${serviceDate.replace(/-/g, '_')}_${crewId}`;
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

export function draftPlanPersistenceLabel(persisted: boolean): string {
  return persisted ? 'Saved to backend' : 'Saved locally until the backend create endpoint is available';
}
