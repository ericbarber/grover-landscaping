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

export async function fetchCrewDayPlan(crewId: string): Promise<DayPlan> {
  const response = await fetch(`${API_BASE_URL}/crews/${crewId}/day-plan/today`);

  if (!response.ok) {
    throw new Error(`Day plan request failed with status ${response.status}`);
  }

  const dayPlan = (await response.json()) as ApiDayPlan;
  return toDayPlan(dayPlan);
}
