import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  ManagerNotificationHistoryPanel,
  notificationHistoryEntityFilters,
  notificationHistoryEntityLabel,
  notificationHistoryItemLabel,
} from './ManagerNotificationHistoryPanel';
import type { NotificationHistoryItem } from '../api/client';

describe('manager notification history entity filters', () => {
  it('includes readable report, bid, and invitation filters', () => {
    expect(notificationHistoryEntityFilters).toEqual([
      'all',
      'completion_report',
      'project_bid',
      'organization_invitation',
    ]);
    expect(notificationHistoryEntityLabel('completion_report')).toBe('Reports');
    expect(notificationHistoryEntityLabel('project_bid')).toBe('Bids');
    expect(notificationHistoryEntityLabel('organization_invitation')).toBe('Invitations');
    expect(notificationHistoryItemLabel('completion_report')).toBe('Customer report');
  });

  it('distinguishes unavailable persistence from an empty delivery history', () => {
    const markup = renderToStaticMarkup(createElement(ManagerNotificationHistoryPanel, {
      notifications: [],
      isUnavailable: true,
      isLoading: false,
      onRefresh: () => undefined,
      onRetry: () => undefined,
      onResolve: () => undefined,
    }));

    expect(markup).toContain('Delivery history could not be loaded.');
    expect(markup).toContain('Your delivery records remain protected.');
    expect(markup).not.toContain('No delivery history matches');
  });

  it('shows an actionable delivery issue without provider internals', () => {
    const notification: NotificationHistoryItem = {
      id: 'notification-1',
      entityType: 'completion_report',
      entityId: 'report-1',
      channel: 'email',
      recipient: 'customer@example.com',
      templateKey: 'completion_report_delivery_internal',
      status: 'dead_letter',
      attemptCount: 3,
      availableAt: '2026-10-06T12:00:00.000Z',
      lastAttemptAt: '2026-10-06T11:00:00.000Z',
      sentAt: null,
      lastError: 'smtp_internal_rejection_detail',
      providerResponseCode: 422,
      providerMessageId: 'provider_internal_identifier',
      createdAt: '2026-10-06T10:00:00.000Z',
      updatedAt: '2026-10-06T11:00:00.000Z',
    };
    const markup = renderToStaticMarkup(createElement(ManagerNotificationHistoryPanel, {
      notifications: [notification],
      isUnavailable: false,
      isLoading: false,
      onRefresh: () => undefined,
      onRetry: () => undefined,
      onResolve: () => undefined,
    }));

    expect(markup).toContain('Customer report');
    expect(markup).toContain('Needs attention');
    expect(markup).toContain('Confirm the address or phone number before retrying.');
    expect(markup).toContain('Retry delivery');
    expect(markup).toContain('Close issue');
    expect(markup).not.toContain('completion_report_delivery_internal');
    expect(markup).not.toContain('smtp_internal_rejection_detail');
    expect(markup).not.toContain('provider_internal_identifier');
  });
});
