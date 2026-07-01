import { describe, expect, it } from 'vitest';
import {
  toCustomerProjectBid,
  toProjectBid,
  type ApiProjectBid,
} from './projectBidsClient';

describe('project bid API mapping', () => {
  it('maps persisted draft bids and line items', () => {
    const bid: ApiProjectBid = {
      id: 'bid_1001',
      day_plan_id: 'day_plan_1001',
      customer_account_id: 'acct_1001',
      source_amendment_id: 'amendment_1001',
      status: 'draft',
      line_items: [{
        id: 'line_1001',
        service_id: 'service_sprinkler_repair',
        service_name: 'Sprinkler repair',
        service_description: 'Replace two damaged heads',
        quantity: 2,
        unit_price_cents: 8500,
        note: 'Includes parts',
      }],
      customer_message: 'Please review the additional work.',
      total_cents: 17000,
      persisted: true,
    };

    expect(toProjectBid(bid)).toEqual({
      id: 'bid_1001',
      customerId: 'acct_1001',
      dayPlanId: 'day_plan_1001',
      sourceAmendmentId: 'amendment_1001',
      status: 'draft',
      lineItems: [{
        id: 'line_1001',
        service: {
          id: 'service_sprinkler_repair',
          name: 'Sprinkler repair',
          description: 'Replace two damaged heads',
          requiresManagerApproval: true,
        },
        quantity: 2,
        unitPriceCents: 8500,
        note: 'Includes parts',
      }],
      customerMessage: 'Please review the additional work.',
      shareUrl: undefined,
      sentAt: undefined,
      respondedAt: undefined,
      shareExpiresAt: undefined,
      shareRevokedAt: undefined,
      deliveryStatus: undefined,
      deliveryChannel: undefined,
      deliveryRecipient: undefined,
      convertedJobId: undefined,
      convertedAt: undefined,
      persisted: true,
    });
  });

  it('maps the public customer bid without manager identifiers', () => {
    const customerBid = toCustomerProjectBid({
      id: 'bid_1001',
      status: 'sent',
      line_items: [{
        id: 'line_1001',
        service_id: 'service_sprinkler_repair',
        service_name: 'Sprinkler repair',
        quantity: 1,
        unit_price_cents: 8500,
      }],
      total_cents: 8500,
      sent_at: '2026-06-29 19:00:00+00',
    });

    expect(customerBid.status).toBe('sent');
    expect(customerBid.totalCents).toBe(8500);
    expect(customerBid.lineItems[0]?.service.name).toBe('Sprinkler repair');
    expect(customerBid.sentAt).toBe('2026-06-29 19:00:00+00');
  });

  it('maps relative customer review links to the browser origin', () => {
    const bid: ApiProjectBid = {
      id: 'bid_1002',
      day_plan_id: 'day_plan_1001',
      customer_account_id: 'acct_1001',
      source_amendment_id: 'amendment_1002',
      status: 'sent',
      line_items: [],
      total_cents: 0,
      share_url: '/bid-review/token-1002',
      persisted: true,
    };

    expect(toProjectBid(bid).shareUrl).toBe('http://localhost:5173/bid-review/token-1002');
  });
});
