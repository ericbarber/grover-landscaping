import type { DayPlanMutationResponse } from './dayPlansClient';
import { API_BASE_URL } from './baseUrl';
import { authenticatedFetch } from './authenticatedFetch';

interface ApiDayPlanMutationResponse {
  id: string;
  crew_id: string;
  service_date: string;
  status: DayPlanMutationResponse['status'];
  route_status: DayPlanMutationResponse['routeStatus'];
  persisted: boolean;
}

function toDayPlanMutation(response: ApiDayPlanMutationResponse): DayPlanMutationResponse {
  return {
    id: response.id,
    crewId: response.crew_id,
    serviceDate: response.service_date,
    status: response.status,
    routeStatus: response.route_status,
    persisted: response.persisted,
  };
}

export function normalizePublishDayPlanId(dayPlanId: string): string {
  return dayPlanId.trim();
}

export function validatePublishDayPlanId(dayPlanId: string): void {
  if (dayPlanId.trim().length === 0) {
    throw new Error('dayPlanId is required before publishing a day plan');
  }
}

export function assertPublishedDayPlan(response: DayPlanMutationResponse): DayPlanMutationResponse {
  if (response.status !== 'published' || !response.persisted) {
    throw new Error('Publish day plan request did not return a persisted published route');
  }

  return response;
}

export async function publishDayPlan(dayPlanId: string): Promise<DayPlanMutationResponse> {
  const normalizedDayPlanId = normalizePublishDayPlanId(dayPlanId);
  validatePublishDayPlanId(normalizedDayPlanId);

  const response = await authenticatedFetch(`${API_BASE_URL}/day-plans/${normalizedDayPlanId}/publish`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`Publish day plan request failed with status ${response.status}`);
  }

  return assertPublishedDayPlan(
    toDayPlanMutation((await response.json()) as ApiDayPlanMutationResponse),
  );
}
