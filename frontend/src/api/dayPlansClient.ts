import type { DayPlan } from '../domain/dayPlans';
import { localDraftDayPlanResponse } from '../domain/managerDayPlans';
import type { StopProgressStatus } from '../domain/stopProgress';
import { API_BASE_URL } from './baseUrl';
import { authenticatedFetch } from './authenticatedFetch';

export interface ApiDayPlanStop {
  id: string;
  job_id: string;
  customer_name: string;
  property_address: string;
  stop_order: number;
  job_status: DayPlan['stops'][number]['jobStatus'];
  stop_status?: StopProgressStatus;
  estimated_drive_minutes: number;
  estimated_service_minutes: number;
}

export interface ApiDayPlan {
  id: string;
  crew_id: string;
  crew_name: string;
  service_date: string;
  status: DayPlan['status'];
  route_status: DayPlan['routeStatus'];
  stops: ApiDayPlanStop[];
}

export interface CreateDayPlanRequest {
  crewId: string;
  serviceDate: string;
}

export interface ApiDayPlanMutationResponse {
  id: string;
  crew_id: string;
  service_date: string;
  status: DayPlan['status'];
  route_status: DayPlan['routeStatus'];
  persisted: boolean;
}

export interface DayPlanMutationResponse {
  id: string;
  crewId: string;
  serviceDate: string;
  status: DayPlan['status'];
  routeStatus: DayPlan['routeStatus'];
  persisted: boolean;
}

export interface AssignDayPlanStopRequest {
  jobId: string;
  estimatedDriveMinutes?: number;
  estimatedServiceMinutes?: number;
}

export interface ApiDayPlanStopMutationResponse {
  day_plan_id: string;
  stop_id: string;
  job_id: string;
  stop_order: number;
  persisted: boolean;
}

export interface DayPlanStopMutationResponse {
  dayPlanId: string;
  stopId: string;
  jobId: string;
  stopOrder: number;
  persisted: boolean;
}

export interface ApiDayPlanStopRemovalResponse {
  day_plan_id: string;
  stop_id: string;
  persisted: boolean;
}

export interface DayPlanStopRemovalResponse {
  dayPlanId: string;
  stopId: string;
  persisted: boolean;
}

export interface ApiDayPlanStopReorderResponse {
  day_plan_id: string;
  stop_ids: string[];
  persisted: boolean;
}

export interface DayPlanStopReorderResponse {
  dayPlanId: string;
  stopIds: string[];
  persisted: boolean;
}

export function normalizeAssignDayPlanStopRequest(
  request: AssignDayPlanStopRequest,
): AssignDayPlanStopRequest {
  return {
    ...request,
    jobId: request.jobId.trim(),
  };
}

export function validateAssignDayPlanStopRequest(request: AssignDayPlanStopRequest): void {
  if (request.jobId.trim().length === 0) {
    throw new Error('jobId is required before assigning a day plan stop');
  }
}

export function normalizeDayPlanStopId(stopId: string): string {
  return stopId.trim();
}

export function normalizeDayPlanStopIds(stopIds: string[]): string[] {
  return stopIds.map(normalizeDayPlanStopId);
}

export function validateDayPlanStopId(stopId: string): void {
  if (stopId.trim().length === 0) {
    throw new Error('stopId is required before removing a day plan stop');
  }
}

export function validateDayPlanStopIds(stopIds: string[]): void {
  if (stopIds.length === 0) {
    throw new Error('At least one stop ID is required before reordering a day plan');
  }

  if (stopIds.some((stopId) => stopId.trim().length === 0)) {
    throw new Error('Stop IDs cannot be blank before reordering a day plan');
  }

  if (new Set(stopIds.map((stopId) => stopId.trim())).size !== stopIds.length) {
    throw new Error('Stop IDs must be unique before reordering a day plan');
  }
}

export function toDayPlan(apiDayPlan: ApiDayPlan): DayPlan {
  return {
    id: apiDayPlan.id,
    crewId: apiDayPlan.crew_id,
    crewName: apiDayPlan.crew_name,
    serviceDate: apiDayPlan.service_date,
    status: apiDayPlan.status,
    routeStatus: apiDayPlan.route_status,
    stops: apiDayPlan.stops.map((stop) => ({
      id: stop.id,
      jobId: stop.job_id,
      customerName: stop.customer_name,
      propertyAddress: stop.property_address,
      stopOrder: stop.stop_order,
      jobStatus: stop.job_status,
      stopStatus: stop.stop_status,
      estimatedDriveMinutes: stop.estimated_drive_minutes,
      estimatedServiceMinutes: stop.estimated_service_minutes,
    })),
  };
}

export function toDayPlanMutation(response: ApiDayPlanMutationResponse): DayPlanMutationResponse {
  return {
    id: response.id,
    crewId: response.crew_id,
    serviceDate: response.service_date,
    status: response.status,
    routeStatus: response.route_status,
    persisted: response.persisted,
  };
}

export function toDayPlanStopMutation(response: ApiDayPlanStopMutationResponse): DayPlanStopMutationResponse {
  return {
    dayPlanId: response.day_plan_id,
    stopId: response.stop_id,
    jobId: response.job_id,
    stopOrder: response.stop_order,
    persisted: response.persisted,
  };
}

export function toDayPlanStopRemoval(response: ApiDayPlanStopRemovalResponse): DayPlanStopRemovalResponse {
  return {
    dayPlanId: response.day_plan_id,
    stopId: response.stop_id,
    persisted: response.persisted,
  };
}

export function toDayPlanStopReorder(response: ApiDayPlanStopReorderResponse): DayPlanStopReorderResponse {
  return {
    dayPlanId: response.day_plan_id,
    stopIds: response.stop_ids,
    persisted: response.persisted,
  };
}

export async function fetchCrewDayPlan(crewId: string): Promise<DayPlan> {
  const response = await authenticatedFetch(`${API_BASE_URL}/crews/${crewId}/day-plan/today`);

  if (!response.ok) {
    throw new Error(`Day plan request failed with status ${response.status}`);
  }

  const dayPlan = (await response.json()) as ApiDayPlan;
  return toDayPlan(dayPlan);
}

export async function assignDayPlanStop(
  dayPlanId: string,
  request: AssignDayPlanStopRequest,
): Promise<DayPlanStopMutationResponse> {
  const normalizedRequest = normalizeAssignDayPlanStopRequest(request);
  validateAssignDayPlanStopRequest(normalizedRequest);

  const response = await authenticatedFetch(`${API_BASE_URL}/day-plans/${dayPlanId}/stops`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      job_id: normalizedRequest.jobId,
      estimated_drive_minutes: normalizedRequest.estimatedDriveMinutes,
      estimated_service_minutes: normalizedRequest.estimatedServiceMinutes,
    }),
  });

  if (!response.ok) {
    throw new Error(`Assign day plan stop request failed with status ${response.status}`);
  }

  return toDayPlanStopMutation((await response.json()) as ApiDayPlanStopMutationResponse);
}

export async function removeDayPlanStop(
  dayPlanId: string,
  stopId: string,
): Promise<DayPlanStopRemovalResponse> {
  const normalizedStopId = normalizeDayPlanStopId(stopId);
  validateDayPlanStopId(normalizedStopId);

  const response = await authenticatedFetch(
    `${API_BASE_URL}/day-plans/${dayPlanId}/stops/${normalizedStopId}`,
    {
      method: 'DELETE',
    },
  );

  if (!response.ok) {
    throw new Error(`Remove day plan stop request failed with status ${response.status}`);
  }

  return toDayPlanStopRemoval((await response.json()) as ApiDayPlanStopRemovalResponse);
}

export async function reorderDayPlanStops(
  dayPlanId: string,
  stopIds: string[],
): Promise<DayPlanStopReorderResponse> {
  const normalizedStopIds = normalizeDayPlanStopIds(stopIds);
  validateDayPlanStopIds(normalizedStopIds);

  const response = await authenticatedFetch(`${API_BASE_URL}/day-plans/${dayPlanId}/stops/order`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ stop_ids: normalizedStopIds }),
  });

  if (!response.ok) {
    throw new Error(`Reorder day plan stops request failed with status ${response.status}`);
  }

  return toDayPlanStopReorder((await response.json()) as ApiDayPlanStopReorderResponse);
}

export async function createDraftDayPlan(request: CreateDayPlanRequest): Promise<DayPlanMutationResponse> {
  const response = await authenticatedFetch(`${API_BASE_URL}/day-plans`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      crew_id: request.crewId,
      service_date: request.serviceDate,
    }),
  });

  if (!response.ok) {
    throw new Error(`Create day plan request failed with status ${response.status}`);
  }

  const dayPlan = (await response.json()) as ApiDayPlanMutationResponse;
  return toDayPlanMutation(dayPlan);
}

export async function createDraftDayPlanWithFallback(
  request: CreateDayPlanRequest,
): Promise<DayPlanMutationResponse> {
  try {
    return await createDraftDayPlan(request);
  } catch {
    return localDraftDayPlanResponse(request.crewId, request.serviceDate);
  }
}
