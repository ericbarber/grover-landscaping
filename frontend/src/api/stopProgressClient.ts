import type { StopProgressStatus } from '../domain/stopProgress';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

export interface StopProgressResponse {
  dayPlanId: string;
  stopId: string;
  status: StopProgressStatus;
  persisted: boolean;
}

export interface ApiStopProgressResponse {
  day_plan_id: string;
  stop_id: string;
  status: StopProgressStatus;
  persisted: boolean;
}

export function toStopProgress(response: ApiStopProgressResponse): StopProgressResponse {
  return {
    dayPlanId: response.day_plan_id,
    stopId: response.stop_id,
    status: response.status,
    persisted: response.persisted,
  };
}

export async function updateStopProgress(
  dayPlanId: string,
  stopId: string,
  status: StopProgressStatus,
): Promise<StopProgressResponse> {
  const response = await fetch(`${API_BASE_URL}/day-plans/${dayPlanId}/stops/${stopId}/status`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error(`Stop progress request failed with status ${response.status}`);
  }

  const progress = (await response.json()) as ApiStopProgressResponse;
  return toStopProgress(progress);
}
