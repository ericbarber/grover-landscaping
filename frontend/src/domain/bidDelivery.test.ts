import { describe, expect, it } from 'vitest';
import { bidDeliveryRecipientIsValid, bidDeliveryStatusLabel } from './bidDelivery';

describe('bid delivery helpers', () => {
  it('validates email and E.164 SMS destinations', () => {
    expect(bidDeliveryRecipientIsValid('email', 'customer@example.com')).toBe(true);
    expect(bidDeliveryRecipientIsValid('email', 'customer example.com')).toBe(false);
    expect(bidDeliveryRecipientIsValid('sms', '+16025550123')).toBe(true);
    expect(bidDeliveryRecipientIsValid('sms', '602-555-0123')).toBe(false);
  });

  it('does not label queued notifications as delivered', () => {
    expect(bidDeliveryStatusLabel('queued')).toBe('Queued for delivery');
    expect(bidDeliveryStatusLabel('sent')).toBe('Delivered');
    expect(bidDeliveryStatusLabel('dead_letter')).toBe('Delivery needs attention');
  });
});
