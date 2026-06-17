import { describe, expect, it } from 'vitest';
import {
  toDayPlan,
  toDayPlanMutation,
  toDayPlanStopMutation,
  toDayPlanStopRemoval,
  toDayPlanStopReorder,
  type ApiDayPlan,
  type ApiDayPlanMutationResponse,
  type ApiDayPlanStopMutationResponse,
  type ApiDayPlanStopRemovalResponse,
  type ApiDayPlanStopReorderResponse,
} from './dayPlansClient';

describe('day plan API client mapping', () => {
  it('maps API stop status into the day plan domain model', () => {
    const apiDayPlan: ApiDayPlan = {
      id: 'day_plan_1',
      crew_id: 'crew_1',
      crew_name: 'North Route Crew',
      service_date: '2026-06-15',
      status: 'published',
      route_status: 'manual',
      stops: [
        {
          id: 'stop_1',
          job_id: 'job_1',
          customer_name: 'Sample Customer',
          property_address: '123 Oak Street',
          stop_order: 1,
          job_status: 'scheduled',
          stop_status: 'in_progress',
          estimated_drive_minutes: 12,
          estimated_service_minutes: 45,
        },
      ],
    };

    expect(toDayPlan(apiDayPlan).stops[0].stopStatus).toBe('in_progress');
  });

  it('maps draft day plan mutation responses', () => {
    const apiResponse: ApiDayPlanMutationResponse = {
      id: 'day_plan_2026_06_16_crew_1001',
      crew_id: 'crew_1001',
      service_date: '2026-06-16',
      status: 'draft',
      route_status: 'manual',
      persisted: true,
    };

    expect(toDayPlanMutation(apiResponse)).toEqual({
      id: 'day_plan_2026_06_16_crew_1001',
      crewId: 'crew_1001',
      serviceDate: '2026-06-16',
      status: 'draft',
      routeStatus: 'manual',
      persisted: true,
    });
  });

  it('maps assigned stop mutation responses', () => {
    const apiResponse: ApiDayPlanStopMutationResponse = {
      day_plan_id: 'day_plan_1',
      stop_id: 'stop_job_1',
      job_id: 'job_1',
      stop_order: 2,
      persisted: true,
    };

    expect(toDayPlanStopMutation(apiResponse)).toEqual({
      dayPlanId: 'day_plan_1',
      stopId: 'stop_job_1',
      jobId: 'job_1',
      stopOrder: 2,
      persisted: true,
    });
  });

  it('maps removed stop mutation responses', () => {
    const apiResponse: ApiDayPlanStopRemovalResponse = {
      day_plan_id: 'day_plan_1',
      stop_id: 'stop_job_1',
      persisted: true,
    };

    expect(toDayPlanStopRemoval(apiResponse)).toEqual({
      dayPlanId: 'day_plan_1',
      stopId: 'stop_job_1',
      persisted: true,
    });
  });

  it('maps reordered stop mutation responses', () => {
    const apiResponse: ApiDayPlanStopReorderResponse = {
      day_plan_id: 'day_plan_1',
      stop_ids: ['stop_job_2', 'stop_job_1'],
      persisted: true,
    };

    expect(toDayPlanStopReorder(apiResponse)).toEqual({
      dayPlanId: 'day_plan_1',
      stopIds: ['stop_job_2', 'stop_job_1'],
      persisted: true,
    });
  });
});
