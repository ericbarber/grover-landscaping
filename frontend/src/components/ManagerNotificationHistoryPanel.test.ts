import { describe, expect, it } from 'vitest';
import {
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
});
