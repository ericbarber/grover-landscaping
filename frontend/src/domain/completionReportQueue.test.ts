import { describe, expect, it } from 'vitest';
import {
  buildCompletionReportQueue,
  completionReportQueueGroup,
  completionReportQueueGroupLabel,
  completionReportQueueReadinessFilterLabel,
  completionReportReadinessBlockerLabel,
  completionReportQueueStatusFilterLabel,
  filterCompletionReportQueue,
  summarizeCompletionReportQueue,
  type CompletionReportQueueItem,
} from './completionReportQueue';
import type { CompletionReportSnapshot, CompletionReportStatus } from '../api/client';

function report(
  jobId: string,
  status: CompletionReportStatus,
  customerName = jobId,
  overrides: Partial<CompletionReportSnapshot> = {},
): CompletionReportSnapshot {
  const snapshot: CompletionReportSnapshot = {
    reportId: `report_${jobId}`,
    jobId,
    reportStatus: status,
    persisted: true,
    readyForCustomer: status !== 'draft',
    checklistProgress: status === 'draft' ? 50 : 100,
    beforePhotos: status === 'draft' ? 0 : 1,
    afterPhotos: status === 'draft' ? 0 : 1,
    issuePhotos: 0,
    pendingAddOns: 0,
    shareUrl: status === 'delivered' ? `/report-view/share_${jobId}` : null,
    job: {
      id: jobId,
      customerName,
      propertyAddress: `${jobId} Oak Street`,
      scheduledDate: '2026-06-15',
      status: 'completed',
      beforePhotos: status === 'draft' ? 0 : 1,
      afterPhotos: status === 'draft' ? 0 : 1,
      checklistItems: 4,
      completedChecklistItems: status === 'draft' ? 2 : 4,
      checklist: [],
    },
    account: {
      jobId,
      accountId: `acct_${jobId}`,
      customerName,
      billingModel: 'per_job',
      paymentStatus: 'paid',
      serviceApprovalStatus: 'approved',
      contractedServicesPerPeriod: 1,
      completedServicesThisPeriod: 1,
      billingNotes: 'Ready.',
    },
    photoEvidence: [],
    completedAddOns: [],
  };

  return {
    ...snapshot,
    ...overrides,
    job: {
      ...snapshot.job,
      ...overrides.job,
    },
    account: {
      ...snapshot.account,
      ...overrides.account,
    },
  };
}

describe('completion report queue helpers', () => {
  it('groups lifecycle statuses into manager queue lanes', () => {
    expect(completionReportQueueGroup('submitted')).toBe('needs_review');
    expect(completionReportQueueGroup('in_review')).toBe('in_review');
    expect(completionReportQueueGroup('changes_requested')).toBe('changes_requested');
    expect(completionReportQueueGroup('delivered')).toBe('delivered');
    expect(completionReportQueueGroup('draft')).toBe('draft');
  });

  it('labels manager queue groups', () => {
    expect(completionReportQueueGroupLabel('needs_review')).toBe('Needs review');
    expect(completionReportQueueGroupLabel('changes_requested')).toBe('Changes requested');
    expect(completionReportQueueGroupLabel('draft')).toBe('Draft');
    expect(completionReportQueueStatusFilterLabel('active')).toBe('Active');
    expect(completionReportQueueReadinessFilterLabel('local_only')).toBe('Local only');
    expect(completionReportReadinessBlockerLabel('route_stop')).toBe('Finish route stop');
  });

  it('retains actionable readiness blockers on queue items', () => {
    const [item] = buildCompletionReportQueue([
      report('job_1', 'draft', 'Blocked', {
        readinessBlockers: ['checklist', 'after_photos', 'route_stop'],
      }),
    ]);
    expect(item.readinessBlockers).toEqual(['checklist', 'after_photos', 'route_stop']);
  });

  it('sorts attention items before drafts and delivered history', () => {
    const queue = buildCompletionReportQueue([
      report('job_4', 'delivered', 'Delta'),
      report('job_2', 'submitted', 'Beta'),
      report('job_1', 'changes_requested', 'Alpha'),
      report('job_3', 'draft', 'Charlie'),
    ]);

    expect(queue.map((item) => item.jobId)).toEqual(['job_1', 'job_2', 'job_3', 'job_4']);
  });

  it('summarizes queue counts by group', () => {
    const items: CompletionReportQueueItem[] = buildCompletionReportQueue([
      report('job_1', 'submitted'),
      report('job_2', 'submitted'),
      report('job_3', 'in_review'),
      report('job_4', 'changes_requested'),
      report('job_5', 'delivered'),
      report('job_6', 'draft'),
    ]);

    expect(summarizeCompletionReportQueue(items)).toEqual({
      total: 6,
      needsReview: 2,
      inReview: 1,
      changesRequested: 1,
      delivered: 1,
      draft: 1,
    });
  });

  it('filters active manager work separately from delivered history', () => {
    const items = buildCompletionReportQueue([
      report('job_1', 'submitted'),
      report('job_2', 'in_review'),
      report('job_3', 'delivered'),
    ]);

    expect(filterCompletionReportQueue(items, { status: 'active', readiness: 'all' }).map((item) => item.jobId)).toEqual([
      'job_1',
      'job_2',
    ]);
    expect(filterCompletionReportQueue(items, { status: 'delivered', readiness: 'all' }).map((item) => item.jobId)).toEqual([
      'job_3',
    ]);
  });

  it('filters by readiness and local persistence state', () => {
    const items = buildCompletionReportQueue([
      report('job_1', 'submitted'),
      report('job_2', 'draft', 'Blocked', { readyForCustomer: false }),
      report('job_3', 'submitted', 'Local', { persisted: false }),
    ]);

    expect(filterCompletionReportQueue(items, { status: 'all', readiness: 'ready' }).map((item) => item.jobId)).toEqual([
      'job_1',
      'job_3',
    ]);
    expect(filterCompletionReportQueue(items, { status: 'all', readiness: 'blocked' }).map((item) => item.jobId)).toEqual([
      'job_2',
    ]);
    expect(filterCompletionReportQueue(items, { status: 'all', readiness: 'local_only' }).map((item) => item.jobId)).toEqual([
      'job_3',
    ]);
  });
});
