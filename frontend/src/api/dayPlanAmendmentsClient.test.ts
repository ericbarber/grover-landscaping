import { describe, expect, it } from 'vitest';
import {
  toDayPlanAmendment,
  toDayPlanAmendmentReview,
  type ApiDayPlanAmendment,
} from './dayPlanAmendmentsClient';

describe('day-plan amendment API mapping', () => {
  it('maps persisted extra-service requests and bid state', () => {
    const apiAmendment: ApiDayPlanAmendment = {
      id: 'amendment_1001',
      day_plan_id: 'day_plan_1001',
      amendment_type: 'add_service',
      status: 'submitted',
      requested_by_crew_id: 'crew_1001',
      stop_id: 'stop_1001',
      service: {
        id: 'service_sprinkler_repair',
        name: 'Sprinkler repair',
        default_duration_minutes: 30,
        default_price_cents: 8500,
        requires_manager_approval: true,
      },
      note: 'Broken sprinkler head',
      requires_bid: true,
      persisted: true,
    };

    expect(toDayPlanAmendment(apiAmendment)).toEqual({
      id: 'amendment_1001',
      dayPlanId: 'day_plan_1001',
      amendmentType: 'add_service',
      status: 'submitted',
      requestedByCrewId: 'crew_1001',
      stopId: 'stop_1001',
      service: {
        id: 'service_sprinkler_repair',
        name: 'Sprinkler repair',
        description: undefined,
        defaultDurationMinutes: 30,
        defaultPriceCents: 8500,
        requiresManagerApproval: true,
      },
      note: 'Broken sprinkler head',
      requiresBid: true,
      managerNote: undefined,
      persisted: true,
    });
  });

  it('maps a persisted manager bid-review decision', () => {
    expect(
      toDayPlanAmendmentReview({
        id: 'amendment_1001',
        day_plan_id: 'day_plan_1001',
        status: 'bid_review',
        manager_note: 'Prepare an itemized estimate.',
        persisted: true,
      }),
    ).toEqual({
      id: 'amendment_1001',
      dayPlanId: 'day_plan_1001',
      status: 'bid_review',
      managerNote: 'Prepare an itemized estimate.',
      persisted: true,
    });
  });
});
