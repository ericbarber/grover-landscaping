import type { CompletionReportSnapshot } from '../api/client';
import { completionReportReadinessBlockerLabel } from './completionReportQueue';
import type { YardCareJob } from './jobs';

export type ManagerTodayQueueTone = 'attention' | 'review' | 'active' | 'planned';

export interface ManagerTodayQueueItem {
  jobId: string;
  customerName: string;
  propertyAddress: string;
  scheduledDate: string;
  title: string;
  detail: string;
  statusLabel: string;
  tone: ManagerTodayQueueTone;
  workflow: 'overview' | 'report';
  priority: number;
}

function localDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function reportQueueItem(
  job: YardCareJob,
  report: CompletionReportSnapshot,
): ManagerTodayQueueItem | null {
  const base = {
    jobId: job.id,
    customerName: job.customerName,
    propertyAddress: job.propertyAddress,
    scheduledDate: job.scheduledDate,
    workflow: 'report' as const,
  };

  if (report.reportStatus === 'changes_requested') {
    return {
      ...base,
      title: 'Completion report needs field changes',
      detail: 'Open the report to review the requested correction and current tasks and photos.',
      statusLabel: 'Changes requested',
      tone: 'attention',
      priority: 0,
    };
  }
  if (report.reportStatus === 'submitted') {
    return {
      ...base,
      title: 'Completion report is ready for review',
      detail: 'Review the completed tasks, photos, and customer summary.',
      statusLabel: 'Manager review',
      tone: 'review',
      priority: 1,
    };
  }
  if (report.reportStatus === 'in_review') {
    return {
      ...base,
      title: 'Completion report review is in progress',
      detail: 'Continue the report review before delivery or a change request.',
      statusLabel: 'In review',
      tone: 'review',
      priority: 3,
    };
  }
  if (report.reportStatus === 'draft' && job.status === 'completed') {
    const blockers = (report.readinessBlockers ?? [])
      .map(completionReportReadinessBlockerLabel);
    return blockers.length > 0
      ? {
        ...base,
        title: 'Completion report needs more work',
        detail: `Finish before customer delivery: ${blockers.join(', ')}.`,
        statusLabel: 'Missing items',
        tone: 'attention',
        priority: 2,
      }
      : {
        ...base,
        title: 'Completion report is still a draft',
        detail: 'Review the completed service record and submit it for manager review.',
        statusLabel: 'Draft report',
        tone: 'review',
        priority: 7,
      };
  }
  return null;
}

function jobQueueItem(job: YardCareJob, today: string): ManagerTodayQueueItem | null {
  const base = {
    jobId: job.id,
    customerName: job.customerName,
    propertyAddress: job.propertyAddress,
    scheduledDate: job.scheduledDate,
    workflow: 'overview' as const,
  };

  if (job.status === 'in_progress') {
    return {
      ...base,
      title: 'Service is in progress',
      detail: 'Review current field progress, photos, and any service exception.',
      statusLabel: 'Field work active',
      tone: 'active',
      priority: 4,
    };
  }
  if (job.status === 'scheduled' && job.scheduledDate < today) {
    return {
      ...base,
      title: 'Past scheduled service needs review',
      detail: 'Confirm whether this service should be reassigned, rescheduled, or completed.',
      statusLabel: 'Schedule attention',
      tone: 'attention',
      priority: 5,
    };
  }
  if (job.status === 'scheduled' && job.scheduledDate === today) {
    return {
      ...base,
      title: 'Today’s service is scheduled',
      detail: 'Confirm crew context and readiness before field work begins.',
      statusLabel: 'Today',
      tone: 'planned',
      priority: 6,
    };
  }
  return null;
}

export function buildManagerTodayQueue(
  jobs: YardCareJob[],
  reports: CompletionReportSnapshot[],
  now = new Date(),
): ManagerTodayQueueItem[] {
  const reportByJobId = new Map(reports.map((report) => [report.jobId, report]));
  const today = localDateKey(now);

  return jobs
    .map((job) => {
      const report = reportByJobId.get(job.id);
      return (report ? reportQueueItem(job, report) : null) ?? jobQueueItem(job, today);
    })
    .filter((item): item is ManagerTodayQueueItem => item !== null)
    .sort((first, second) => (
      first.priority - second.priority
      || first.scheduledDate.localeCompare(second.scheduledDate)
      || first.customerName.localeCompare(second.customerName)
      || first.jobId.localeCompare(second.jobId)
    ));
}
