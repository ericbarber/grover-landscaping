import type { StopProgressStatus } from './stopProgress';

export interface DayPlanStop {
  id: string;
  jobId: string;
  customerName: string;
  propertyAddress: string;
  stopOrder: number;
  jobStatus: 'scheduled' | 'in_progress' | 'completed';
  stopStatus?: StopProgressStatus;
  estimatedDriveMinutes: number;
  estimatedServiceMinutes: number;
}

export interface DayPlan {
  id: string;
  crewId: string;
  crewName: string;
  organizationId: string;
  serviceDate: string;
  status: 'draft' | 'published' | 'completed';
  routeStatus: 'manual' | 'optimized';
  stops: DayPlanStop[];
}

export const seedDayPlan: DayPlan = {
  id: 'day_plan_2026_06_15_crew_1001',
  crewId: 'crew_1001',
  crewName: 'North Route Crew',
  organizationId: 'org_demo_landscaping',
  serviceDate: '2026-06-15',
  status: 'published',
  routeStatus: 'manual',
  stops: [
    {
      id: 'stop_1001',
      jobId: 'job_1001',
      customerName: 'Sample Customer',
      propertyAddress: '123 Oak Street',
      stopOrder: 1,
      jobStatus: 'scheduled',
      stopStatus: 'pending',
      estimatedDriveMinutes: 12,
      estimatedServiceMinutes: 45,
    },
    {
      id: 'stop_1002',
      jobId: 'job_1002',
      customerName: 'Demo Property Owner',
      propertyAddress: '456 Maple Avenue',
      stopOrder: 2,
      jobStatus: 'in_progress',
      stopStatus: 'pending',
      estimatedDriveMinutes: 8,
      estimatedServiceMinutes: 60,
    },
  ],
};

export function emptyCrewDayPlan(crewId: string): DayPlan {
  return {
    id: `no_persisted_route_${crewId}`,
    crewId,
    crewName: 'Crew route',
    organizationId: '',
    serviceDate: new Date().toISOString().slice(0, 10),
    status: 'published',
    routeStatus: 'manual',
    stops: [],
  };
}

export function getTotalEstimatedMinutes(dayPlan: DayPlan): number {
  return dayPlan.stops.reduce(
    (total, stop) => total + stop.estimatedDriveMinutes + stop.estimatedServiceMinutes,
    0,
  );
}
