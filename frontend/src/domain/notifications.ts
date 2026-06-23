export type NotificationChannel = 'email' | 'sms';
export type NotificationStatus = 'queued' | 'sent' | 'failed' | 'skipped' | 'resolved';
export type NotificationAudience = 'customer' | 'crew' | 'manager';
export type NotificationTemplate =
  | 'day_plan_published'
  | 'route_changed'
  | 'completion_report_ready'
  | 'bid_approval_requested'
  | 'extra_service_requested';
export type NotificationDeliveryBlocker = 'status' | 'audience' | 'channel' | 'quiet_hours';

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

export function notificationDeliveryBlockerLabel(blocker: NotificationDeliveryBlocker): string {
  if (blocker === 'status') {
    return 'Delivery status is not ready to send';
  }

  if (blocker === 'audience') {
    return 'Notification preference does not match the audience';
  }

  if (blocker === 'channel') {
    return 'Notification channel is disabled';
  }

  return 'Quiet hours are active';
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

export function notificationCanSendAtHour(
  item: NotificationOutboxItem,
  preference: NotificationPreference,
  hour: number,
): boolean {
  return notificationCanAttemptWithPreference(item, preference) && !notificationHourIsQuiet(preference.quietHours, hour);
}

export function notificationDeliveryBlocker(
  item: NotificationOutboxItem,
  preference: NotificationPreference,
  hour: number,
): NotificationDeliveryBlocker | undefined {
  if (!notificationCanAttemptDelivery(item)) {
    return 'status';
  }

  if (item.audience !== preference.audience) {
    return 'audience';
  }

  if (!notificationChannelIsEnabled(preference, item.channel)) {
    return 'channel';
  }

  if (notificationHourIsQuiet(preference.quietHours, hour)) {
    return 'quiet_hours';
  }

  return undefined;
}

export function notificationDeliveryIsBlocked(
  item: NotificationOutboxItem,
  preference: NotificationPreference,
  hour: number,
): boolean {
  return notificationDeliveryBlocker(item, preference, hour) !== undefined;
}

export function notificationNeedsRetry(item: NotificationOutboxItem): boolean {
  return item.status === 'failed';
}

export function notificationIsTerminal(item: NotificationOutboxItem): boolean {
  return item.status === 'sent' || item.status === 'skipped' || item.status === 'resolved';
}
