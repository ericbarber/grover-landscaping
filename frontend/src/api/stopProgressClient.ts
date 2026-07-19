import type { StopProgressStatus } from '../domain/stopProgress';
import { API_BASE_URL } from './baseUrl';
import { authenticatedFetch } from './authenticatedFetch';
import { apiRequestError } from './apiError';

export interface StopProgressResponse {
  dayPlanId: string;
  stopId: string;
  status: StopProgressStatus;
  persisted: boolean;
  idempotentReplay: boolean;
}

export interface ApiStopProgressResponse {
  day_plan_id: string;
  stop_id: string;
  status: StopProgressStatus;
  persisted: boolean;
  idempotent_replay?: boolean;
}

export function toStopProgress(response: ApiStopProgressResponse): StopProgressResponse {
  return {
    dayPlanId: response.day_plan_id,
    stopId: response.stop_id,
    status: response.status,
    persisted: response.persisted,
    idempotentReplay: response.idempotent_replay ?? false,
  };
}

export async function updateStopProgress(
  dayPlanId: string,
  stopId: string,
  status: StopProgressStatus,
  clientMutationId?: string,
): Promise<StopProgressResponse> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/day-plans/${dayPlanId}/stops/${stopId}/status`,
    {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      status,
      ...(clientMutationId ? { client_mutation_id: clientMutationId } : {}),
    }),
    },
  );

  if (!response.ok) {
    throw await apiRequestError(
      response,
      `Stop progress request failed with status ${response.status}`,
    );
  }

  const progress = (await response.json()) as ApiStopProgressResponse;
  return toStopProgress(progress);
}
