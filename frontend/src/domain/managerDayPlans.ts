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
    timeZone: 'America/Phoenix',
    serviceAreaLabel: 'Phoenix metro',
    stopCapacity: 12,
    persisted: false,
  };
}

export function draftPlanPersistenceLabel(persisted: boolean): string {
  return persisted ? 'Saved to backend' : 'Local planning only';
}

export function draftPlanPersistenceDetail(persisted: boolean): string {
  return persisted
    ? 'Route changes can sync to the backend and be published when ready.'
    : 'Backend draft was not created, so this route cannot be published to crews until draft creation succeeds.';
}
