import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ManagerTodayQueueItem } from '../domain/managerTodayQueue';
import { ManagerTodayQueue } from './ManagerTodayQueue';

const item: ManagerTodayQueueItem = {
  jobId: 'job-1', customerName: 'Sample Customer', propertyAddress: '123 Oak Street',
  scheduledDate: '2026-10-01', title: 'Completion proof is ready for review',
  detail: 'Review submitted proof.', statusLabel: 'Manager review', tone: 'review',
  workflow: 'report', priority: 1,
};

describe('ManagerTodayQueue', () => {
  it('renders the exact service and workflow action', () => {
    const markup = renderToStaticMarkup(
      <ManagerTodayQueue items={[item]} onOpenAll={() => undefined} onOpenItem={() => undefined} state="ready" />,
    );

    expect(markup).toContain('Work that needs your attention');
    expect(markup).toContain('Sample Customer');
    expect(markup).toContain('123 Oak Street');
    expect(markup).toContain('Open report');
  });

  it('does not present an all-clear state when today’s work cannot be checked', () => {
    const markup = renderToStaticMarkup(
      <ManagerTodayQueue items={[]} onOpenAll={() => undefined} onOpenItem={() => undefined} state="unavailable" />,
    );

    expect(markup).toContain('We couldn’t check today’s work');
    expect(markup).not.toContain('Nothing loaded needs a manager decision');
  });
});
