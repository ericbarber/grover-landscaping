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

    expect(markup).toContain('Services that need the next handoff');
    expect(markup).toContain('Sample Customer');
    expect(markup).toContain('123 Oak Street');
    expect(markup).toContain('Open report');
  });

  it('does not infer an empty queue when authoritative reads are unavailable', () => {
    const markup = renderToStaticMarkup(
      <ManagerTodayQueue items={[]} onOpenAll={() => undefined} onOpenItem={() => undefined} state="unavailable" />,
    );

    expect(markup).toContain('could not be verified');
    expect(markup).not.toContain('No loaded service currently requires');
  });
});
