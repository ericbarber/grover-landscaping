import type { DayPlan } from '../domain/dayPlans';
import type { StopProgressStatus } from '../domain/stopProgress';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

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

export async function fetchCrewDayPlan(crewId: string): Promise<DayPlan> {
  const response = await fetch(`${API_BASE_URL}/crews/${crewId}/day-plan/today`);

  if (!response.ok) {
    throw new Error(`Day plan request failed with status ${response.status}`);
  }

  const dayPlan = (await response.json()) as ApiDayPlan;
  return toDayPlan(dayPlan);
}

export async function createDraftDayPlan(request: CreateDayPlanRequest): Promise<DayPlanMutationResponse> {
  const response = await fetch(`${API_BASE_URL}/day-plans`, {
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
