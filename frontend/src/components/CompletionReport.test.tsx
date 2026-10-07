import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { CompletionReportSnapshot, JobDetail, PhotoUploadTicket } from '../api/client';
import { CompletionReport } from './CompletionReport';

const job: JobDetail = {
  id: 'job-1',
  customerName: 'North Yard',
  propertyAddress: '101 North Street',
  scheduledDate: '2026-09-30',
  status: 'completed',
  beforePhotos: 1,
  afterPhotos: 1,
  checklistItems: 1,
  completedChecklistItems: 1,
  checklist: [{ id: 'cleanup', label: 'Clean work area', completed: true }],
};

const photo: PhotoUploadTicket = {
  status: 'ready_for_review',
  jobId: job.id,
  photoId: 'photo-1',
  photoType: 'before',
  fileName: 'before.jpg',
  contentType: 'image/jpeg',
  uploadMode: 'signed_internal_mode',
  uploadUrl: 'https://uploads.example.test/photo-1',
  objectKey: 'internal/jobs/job-1/photo-1',
};

const report: CompletionReportSnapshot = {
  reportId: 'report_internal_identifier',
  jobId: job.id,
  reportStatus: 'in_review',
  persisted: true,
  readyForCustomer: true,
  checklistProgress: 100,
  beforePhotos: 1,
  afterPhotos: 1,
  issuePhotos: 0,
  pendingAddOns: 0,
  shareUrl: null,
  job,
  account: {
    jobId: job.id,
    billingModel: 'per_job',
    paymentStatus: 'paid',
    serviceApprovalStatus: 'approved',
    contractedServicesPerPeriod: 1,
    completedServicesThisPeriod: 1,
    billingNotes: 'Current.',
  },
  photoEvidence: [photo],
  completedAddOns: [],
};

describe('CompletionReport', () => {
  it('presents the handoff in user language without storage identifiers', () => {
    const markup = renderToStaticMarkup(createElement(CompletionReport, {
      job,
      uploadTickets: [photo],
      reportSnapshot: report,
    }));

    expect(markup).toContain('Customer report preview');
    expect(markup).toContain('Saved to Yardfolio');
    expect(markup).toContain('Current status: In Review.');
    expect(markup).toContain('Job photos');
    expect(markup).toContain('Ready For Review');
    expect(markup).not.toContain('report_internal_identifier');
    expect(markup).not.toContain('signed_internal_mode');
    expect(markup).not.toContain('internal/jobs/job-1/photo-1');
  });
});
