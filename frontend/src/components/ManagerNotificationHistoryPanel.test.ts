import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  ManagerNotificationHistoryPanel,
  notificationHistoryEntityFilters,
  notificationHistoryEntityLabel,
} from './ManagerNotificationHistoryPanel';

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
    expect(markup).toContain('no empty history is being assumed');
    expect(markup).not.toContain('No delivery history matches');
  });
});
