export type BidDeliveryChannel = 'email' | 'sms';

export function bidDeliveryRecipientIsValid(
  channel: BidDeliveryChannel,
  recipient: string,
): boolean {
  const value = recipient.trim();
  if (channel === 'email') {
    return value.includes('@') && !/\s/.test(value) && value.length <= 320;
  }

  return /^\+[1-9]\d{7,14}$/.test(value);
}

export function bidDeliveryStatusLabel(status: string | undefined): string {
  if (!status) return 'Not queued';
  if (status === 'queued') return 'Queued for delivery';
  if (status === 'sending') return 'Delivery in progress';
  if (status === 'sent') return 'Delivered';
  if (status === 'failed') return 'Delivery failed';
  if (status === 'dead_letter') return 'Delivery needs attention';
  return 'Delivery skipped';
}
