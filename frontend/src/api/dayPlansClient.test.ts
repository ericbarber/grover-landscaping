import { describe, expect, it } from 'vitest';
import { toDayPlan, toDayPlanMutation, type ApiDayPlan, type ApiDayPlanMutationResponse } from './dayPlansClient';

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
});
