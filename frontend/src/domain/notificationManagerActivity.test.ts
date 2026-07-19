import { describe, expect, it } from 'vitest';
import type { NotificationHistoryItem } from '../api/client';
import { notificationToManagerActivity } from './notificationManagerActivity';

const notification: NotificationHistoryItem = {
  id: 'notification_1001',
  entityType: 'completion_report',
  entityId: 'report_1001',
  channel: 'email',
  recipient: 'customer@example.com',
  templateKey: 'completion_report_delivery',
  status: 'dead_letter',
  attemptCount: 5,
  availableAt: '2026-07-19T16:00:00Z',
  lastAttemptAt: '2026-07-19T16:05:00Z',
  sentAt: null,
  lastError: 'Provider rejected the recipient.',
  providerResponseCode: 400,
  providerMessageId: null,
  createdAt: '2026-07-19T16:00:00Z',
  updatedAt: '2026-07-19T16:05:00Z',
};

describe('persisted notification manager activity', () => {
  it('maps recovery-required deliveries to warning activity', () => {
    expect(notificationToManagerActivity(notification)).toEqual({
      id: 'notification_notification_1001_2026-07-19T16:05:00Z',
      title: 'Customer delivery needs recovery',
      message: 'Completion report report_1001 email delivery to customer@example.com is dead_letter. Provider rejected the recipient.',
      tone: 'warning',
      source: 'sync',
      occurredAt: '2026-07-19T16:05:00Z',
      recommendedAction: 'Review the delivery error, then retry or resolve it from notification history.',
    });
  });

  it('maps sent bid deliveries to successful activity', () => {
    expect(notificationToManagerActivity({
      ...notification,
      entityType: 'project_bid',
      entityId: 'bid_1001',
      channel: 'sms',
      recipient: '+16025550123',
      status: 'sent',
      lastError: null,
    })).toMatchObject({
      title: 'Customer delivery sent',
      message: 'Project bid bid_1001 SMS delivery to +16025550123 is sent.',
      tone: 'success',
      recommendedAction: undefined,
    });
  });
});
