import type { NotificationHistoryItem } from '../api/client';
import type { ManagerActivityItem, ManagerActivityTone } from './managerActivity';

function notificationTone(status: NotificationHistoryItem['status']): ManagerActivityTone {
  if (status === 'failed' || status === 'dead_letter') return 'warning';
  if (status === 'sent') return 'success';
  return 'info';
}

function notificationTitle(status: NotificationHistoryItem['status']): string {
  if (status === 'dead_letter') return 'Customer delivery needs recovery';
  if (status === 'failed') return 'Customer delivery failed';
  if (status === 'sent') return 'Customer delivery sent';
  if (status === 'skipped') return 'Customer delivery skipped';
  if (status === 'sending') return 'Customer delivery in progress';
  return 'Customer delivery queued';
}

export function notificationToManagerActivity(
  notification: NotificationHistoryItem,
): ManagerActivityItem {
  const entityLabel = notification.entityType === 'project_bid' ? 'Project bid' : 'Completion report';
  const channelLabel = notification.channel === 'email' ? 'email' : 'SMS';
  const failureDetail = notification.lastError ? ` ${notification.lastError}` : '';

  return {
    id: `notification_${notification.id}_${notification.updatedAt}`,
    title: notificationTitle(notification.status),
    message: `${entityLabel} ${notification.entityId} ${channelLabel} delivery to ${notification.recipient} is ${notification.status}.${failureDetail}`,
    tone: notificationTone(notification.status),
    source: 'sync',
    occurredAt: notification.updatedAt,
    recommendedAction: notification.status === 'failed' || notification.status === 'dead_letter'
      ? 'Review the delivery error, then retry or resolve it from notification history.'
      : undefined,
  };
}

export function notificationsToManagerActivity(
  notifications: NotificationHistoryItem[],
): ManagerActivityItem[] {
  return notifications.map(notificationToManagerActivity);
}
