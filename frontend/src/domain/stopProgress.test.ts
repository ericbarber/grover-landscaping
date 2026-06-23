import { describe, expect, it } from 'vitest';
import {
  amendmentRequiresBid,
  countFinishedStops,
  countResolvedFinishedStops,
  dayPlanAmendmentTypeLabel,
  getNextStopStatus,
  projectBidCanConvertToWork,
  projectBidTotalCents,
  resetStopStates,
  resolveStopStatus,
  stopActionLabel,
  syncStatusFromPersistence,
  syncStatusLabel,
} from './stopProgress';

describe('stop progress helpers', () => {
  it('advances pending stops to in progress', () => {
    expect(getNextStopStatus('pending')).toBe('in_progress');
    expect(getNextStopStatus(undefined)).toBe('in_progress');
  });

  it('advances in-progress and finished stops to finished', () => {
    expect(getNextStopStatus('in_progress')).toBe('finished');
    expect(getNextStopStatus('finished')).toBe('finished');
  });

  it('formats stop action labels', () => {
    expect(stopActionLabel('pending')).toBe('Start stop');
    expect(stopActionLabel('in_progress')).toBe('Finish stop');
    expect(stopActionLabel('finished')).toBe('Finished');
  });

  it('formats day-plan amendment labels', () => {
    expect(dayPlanAmendmentTypeLabel('add_stop')).toBe('Add stop');
    expect(dayPlanAmendmentTypeLabel('remove_stop')).toBe('Remove stop');
    expect(dayPlanAmendmentTypeLabel('add_service')).toBe('Add service');
  });

  it('requires a bid for manager-approved extra services', () => {
    expect(
      amendmentRequiresBid({
        id: 'amendment_1001',
        dayPlanId: 'day_plan_1001',
        amendmentType: 'add_service',
        status: 'submitted',
        requestedByCrewId: 'crew_1001',
        stopId: 'stop_1001',
        service: {
          id: 'service_sprinkler_repair',
          name: 'Sprinkler repair',
          requiresManagerApproval: true,
        },
      }),
    ).toBe(true);
  });

  it('does not require a bid for non-billable stop changes', () => {
    expect(
      amendmentRequiresBid({
        id: 'amendment_1002',
        dayPlanId: 'day_plan_1001',
        amendmentType: 'remove_stop',
        status: 'submitted',
        requestedByCrewId: 'crew_1001',
        stopId: 'stop_1002',
      }),
    ).toBe(false);
  });

  it('totals project bid line items', () => {
    expect(
      projectBidTotalCents({
        id: 'bid_1001',
        customerId: 'customer_1001',
        status: 'draft',
        lineItems: [
          {
            id: 'line_1001',
            service: {
              id: 'service_tree_limb_removal',
              name: 'Tree limb removal',
              requiresManagerApproval: true,
            },
            quantity: 2,
            unitPriceCents: 7500,
          },
          {
            id: 'line_1002',
            service: {
              id: 'service_sprinkler_repair',
              name: 'Sprinkler repair',
              requiresManagerApproval: true,
            },
            quantity: 1,
            unitPriceCents: 12500,
          },
        ],
      }),
    ).toBe(27500);
  });

  it('allows approved bids with line items to convert to work', () => {
    expect(
      projectBidCanConvertToWork({
        id: 'bid_1002',
        customerId: 'customer_1001',
        status: 'approved',
        lineItems: [
          {
            id: 'line_1003',
            service: {
              id: 'service_tree_limb_removal',
              name: 'Tree limb removal',
              requiresManagerApproval: true,
            },
            quantity: 1,
            unitPriceCents: 9500,
          },
        ],
      }),
    ).toBe(true);
  });

  it('does not convert draft bids to work', () => {
    expect(
      projectBidCanConvertToWork({
        id: 'bid_1003',
        customerId: 'customer_1001',
        status: 'draft',
        lineItems: [],
      }),
    ).toBe(false);
  });

  it('resolves local status before server status', () => {
    expect(resolveStopStatus('finished', 'in_progress')).toBe('finished');
  });

  it('resolves server status when local status is missing', () => {
    expect(resolveStopStatus(undefined, 'in_progress')).toBe('in_progress');
  });

  it('defaults unresolved stops to pending', () => {
    expect(resolveStopStatus(undefined, undefined)).toBe('pending');
  });

  it('maps persisted backend responses to synced status', () => {
    expect(syncStatusFromPersistence(true)).toBe('synced');
  });

  it('maps local-only backend responses to local status', () => {
    expect(syncStatusFromPersistence(false)).toBe('local');
  });

  it('counts finished stops', () => {
    expect(
      countFinishedStops(['stop_1001', 'stop_1002'], {
        stop_1001: 'finished',
        stop_1002: 'in_progress',
      }),
    ).toBe(1);
  });

  it('counts server-resolved finished stops', () => {
    expect(
      countResolvedFinishedStops(
        [
          { id: 'stop_1001', stopStatus: 'finished' },
          { id: 'stop_1002', stopStatus: 'in_progress' },
        ],
        {},
      ),
    ).toBe(1);
  });

  it('counts local overrides before server-resolved stop statuses', () => {
    expect(
      countResolvedFinishedStops(
        [
          { id: 'stop_1001', stopStatus: 'in_progress' },
          { id: 'stop_1002', stopStatus: 'finished' },
        ],
        {
          stop_1001: 'finished',
          stop_1002: 'in_progress',
        },
      ),
    ).toBe(1);
  });

  it('resets stop state maps', () => {
    expect(resetStopStates()).toEqual({});
  });

  it('formats route progress sync labels', () => {
    expect(syncStatusLabel('local')).toBe('saved locally');
    expect(syncStatusLabel('syncing')).toBe('syncing');
    expect(syncStatusLabel('synced')).toBe('synced');
  });
});
