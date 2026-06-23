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

export type NotificationQuietHours = {
  startHour: number;
  endHour: number;
  timezone: string;
};

export type NotificationPreference = {
  audience: NotificationAudience;
  emailEnabled: boolean;
  smsEnabled: boolean;
  quietHours?: NotificationQuietHours;
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

export function notificationChannelIsEnabled(
  preference: NotificationPreference,
  channel: NotificationChannel,
): boolean {
  return channel === 'email' ? preference.emailEnabled : preference.smsEnabled;
}

export function notificationHourIsQuiet(quietHours: NotificationQuietHours | undefined, hour: number): boolean {
  if (!quietHours) {
    return false;
  }

  if (quietHours.startHour === quietHours.endHour) {
    return true;
  }

  if (quietHours.startHour < quietHours.endHour) {
    return hour >= quietHours.startHour && hour < quietHours.endHour;
  }

  return hour >= quietHours.startHour || hour < quietHours.endHour;
}

export function notificationCanAttemptDelivery(item: NotificationOutboxItem): boolean {
  return item.status === 'queued' || item.status === 'failed';
}

export function notificationCanAttemptWithPreference(
  item: NotificationOutboxItem,
  preference: NotificationPreference,
): boolean {
  return (
    item.audience === preference.audience &&
    notificationCanAttemptDelivery(item) &&
    notificationChannelIsEnabled(preference, item.channel)
  );
}

export function notificationNeedsRetry(item: NotificationOutboxItem): boolean {
  return item.status === 'failed';
}

export function notificationIsTerminal(item: NotificationOutboxItem): boolean {
  return item.status === 'sent' || item.status === 'skipped' || item.status === 'resolved';
}
