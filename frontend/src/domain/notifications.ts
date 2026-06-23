export type NotificationChannel = 'email' | 'sms';
export type NotificationStatus = 'queued' | 'sent' | 'failed' | 'skipped' | 'resolved';
export type NotificationAudience = 'customer' | 'crew' | 'manager';
export type NotificationTemplate =
  | 'day_plan_published'
  | 'route_changed'
  | 'completion_report_ready'
  | 'bid_approval_requested'
  | 'extra_service_requested';

export type NotificationOutboxItem = {
  id: string;
  audience: NotificationAudience;
  channel: NotificationChannel;
  template: NotificationTemplate;
  status: NotificationStatus;
  recipient: string;
  subject?: string;
  message: string;
  relatedEntityId?: string;
  attemptedAt?: string;
  errorMessage?: string;
};

export function notificationChannelLabel(channel: NotificationChannel): string {
  return channel === 'email' ? 'Email' : 'Text message';
}

export function notificationStatusLabel(status: NotificationStatus): string {
  if (status === 'queued') {
    return 'Queued';
  }

  if (status === 'sent') {
    return 'Sent';
  }

  if (status === 'failed') {
    return 'Failed';
  }

  if (status === 'skipped') {
    return 'Skipped';
  }

  return 'Manually resolved';
}

export function notificationNeedsRetry(item: NotificationOutboxItem): boolean {
  return item.status === 'failed';
}

export function notificationIsTerminal(item: NotificationOutboxItem): boolean {
  return item.status === 'sent' || item.status === 'skipped' || item.status === 'resolved';
}
