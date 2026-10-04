import { describe, expect, it } from 'vitest';
import type { CompletionReportSnapshot } from '../api/client';
import type { YardCareJob } from './jobs';
import { buildManagerTodayQueue } from './managerTodayQueue';

const jobs: YardCareJob[] = [
  {
    id: 'job-review', customerName: 'Review Customer', propertyAddress: '1 Review Way',
    scheduledDate: '2026-10-01', status: 'completed', beforePhotos: 1, afterPhotos: 1,
    checklistItems: 2, completedChecklistItems: 2,
  },
  {
    id: 'job-field', customerName: 'Field Customer', propertyAddress: '2 Field Way',
    scheduledDate: '2026-10-01', status: 'in_progress', beforePhotos: 1, afterPhotos: 0,
    checklistItems: 2, completedChecklistItems: 1,
  },
  {
    id: 'job-past', customerName: 'Past Customer', propertyAddress: '3 Past Way',
    scheduledDate: '2026-09-30', status: 'scheduled', beforePhotos: 0, afterPhotos: 0,
    checklistItems: 2, completedChecklistItems: 0,
  },
  {
    id: 'job-future', customerName: 'Future Customer', propertyAddress: '4 Future Way',
    scheduledDate: '2026-10-02', status: 'scheduled', beforePhotos: 0, afterPhotos: 0,
    checklistItems: 2, completedChecklistItems: 0,
  },
];

function report(
  overrides: Partial<CompletionReportSnapshot> = {},
): CompletionReportSnapshot {
  return {
    reportId: 'report-review', jobId: 'job-review', reportStatus: 'submitted',
    persisted: true, readyForCustomer: true, checklistProgress: 100,
    beforePhotos: 1, afterPhotos: 1, issuePhotos: 0, pendingAddOns: 0,
    shareUrl: null, job: { ...jobs[0], checklist: [] },
    account: {} as CompletionReportSnapshot['account'], photoEvidence: [], completedAddOns: [],
    ...overrides,
  };
}

describe('manager Today queue', () => {
  it('prioritizes report review before active and past scheduled work', () => {
    const queue = buildManagerTodayQueue(jobs, [report()], new Date(2026, 9, 1, 10));

    expect(queue.map(({ jobId }) => jobId)).toEqual(['job-review', 'job-field', 'job-past']);
    expect(queue[0]).toMatchObject({
      title: 'Completion proof is ready for review', workflow: 'report', tone: 'review',
    });
    expect(queue.some(({ jobId }) => jobId === 'job-future')).toBe(false);
  });

  it('shows one exact correction item instead of duplicating the underlying job state', () => {
    const queue = buildManagerTodayQueue(jobs, [
      report({ reportStatus: 'changes_requested' }),
    ], new Date(2026, 9, 1, 10));

    expect(queue.filter(({ jobId }) => jobId === 'job-review')).toHaveLength(1);
    expect(queue[0]).toMatchObject({
      jobId: 'job-review', statusLabel: 'Changes requested', priority: 0,
    });
  });

  it('names every readiness blocker on a completed draft', () => {
    const queue = buildManagerTodayQueue(jobs, [report({
      reportStatus: 'draft',
      readyForCustomer: false,
      readinessBlockers: ['checklist', 'after_photos'],
    })], new Date(2026, 9, 1, 10));

    expect(queue[0]).toMatchObject({
      title: 'Completion proof is blocked', statusLabel: 'Evidence gap', workflow: 'report',
    });
    expect(queue[0].detail).toContain('Finish checklist');
    expect(queue[0].detail).toContain('Capture after photo');
  });
});
