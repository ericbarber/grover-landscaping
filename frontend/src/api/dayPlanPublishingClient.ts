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

export async function publishDayPlan(dayPlanId: string): Promise<DayPlanMutationResponse> {
  const response = await authenticatedFetch(`${API_BASE_URL}/day-plans/${dayPlanId}/publish`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`Publish day plan request failed with status ${response.status}`);
  }

  return toDayPlanMutation((await response.json()) as ApiDayPlanMutationResponse);
}
