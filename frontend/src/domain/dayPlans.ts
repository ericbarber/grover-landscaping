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

export interface CrewRouteOverview {
  source: 'loading' | 'api' | 'local' | 'missing' | 'unavailable';
  serviceDate?: string;
  totalStops: number;
  completedStops: number;
}

export type RouteDateContext = {
  kind: 'past' | 'today' | 'upcoming' | 'unknown';
  label: 'Past route' | 'Today’s route' | 'Upcoming route' | 'Route date unavailable';
  dateLabel: string;
  mutable: boolean;
};

const serviceDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/;

function dateKey(year: number, month: number, day: number): number {
  return year * 10_000 + month * 100 + day;
}

export function classifyRouteDate(serviceDate: string, now = new Date()): RouteDateContext {
  const match = serviceDatePattern.exec(serviceDate);
  if (!match) {
    return {
      kind: 'unknown',
      label: 'Route date unavailable',
      dateLabel: 'Service date unavailable',
      mutable: false,
    };
  }

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const serviceDay = new Date(year, month - 1, day, 12);
  if (
    serviceDay.getFullYear() !== year
    || serviceDay.getMonth() !== month - 1
    || serviceDay.getDate() !== day
  ) {
    return {
      kind: 'unknown',
      label: 'Route date unavailable',
      dateLabel: 'Service date unavailable',
      mutable: false,
    };
  }

  const serviceKey = dateKey(year, month, day);
  const todayKey = dateKey(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const dateLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(serviceDay);

  if (serviceKey < todayKey) {
    return { kind: 'past', label: 'Past route', dateLabel, mutable: false };
  }
  if (serviceKey > todayKey) {
    return { kind: 'upcoming', label: 'Upcoming route', dateLabel, mutable: false };
  }
  return { kind: 'today', label: 'Today’s route', dateLabel, mutable: true };
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
