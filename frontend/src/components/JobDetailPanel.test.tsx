import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { JobDetail } from '../api/client';
import { JobDetailPanel } from './JobDetailPanel';

const job: JobDetail = {
  id: 'job-1',
  organizationId: 'organization-1',
  customerName: 'North Yard',
  propertyAddress: '101 North Street',
  scheduledDate: '2026-09-30',
  status: 'scheduled',
  beforePhotos: 0,
  afterPhotos: 0,
  checklistItems: 2,
  completedChecklistItems: 0,
  checklist: [
    { id: 'trim', label: 'Trim shrubs', completed: false },
    { id: 'cleanup', label: 'Clean work area', completed: false },
  ],
};

function render(overrides: Partial<Parameters<typeof JobDetailPanel>[0]> = {}) {
  return renderToStaticMarkup(createElement(JobDetailPanel, {
    job,
    executionEnabled: true,
    fieldEvidenceEnabled: true,
    isLoading: false,
    uploadTickets: [],
    reportSnapshot: null,
    addOns: [],
    onStart: async () => undefined,
    onComplete: async () => undefined,
    onChecklistItemChange: async () => undefined,
    onPhotoSelected: async () => undefined,
    onAddOnStatusChange: async () => undefined,
    onStartReportReview: async () => undefined,
    onRequestReportChanges: async () => undefined,
    onResubmitReport: async () => undefined,
    onDeliverReport: async () => undefined,
    onQueueReportDeliveryNotification: async () => undefined,
    reportActionStatus: null,
    reportEnabled: false,
    requestedWorkflow: 'overview',
    ...overrides,
  }));
}

describe('JobDetailPanel', () => {
  it('renders the selected field workflow and evidence state', () => {
    const markup = render();

    expect(markup).toContain('North Yard');
    expect(markup).toContain('Start Job');
    expect(markup).toContain('2 photos needed');
    expect(markup).toContain('Start this job when the crew is ready to begin.');
    expect(markup).toContain('Tasks');
    expect(markup).toContain('Photos');
  });

  it('keeps job oversight read only when execution is unavailable', () => {
    const markup = render({ executionEnabled: false, fieldEvidenceEnabled: false });

    expect(markup).toContain('This job is view only.');
    expect(markup).not.toContain('Start Job');
    expect(markup).not.toContain('Choose photo');
  });

  it('renders explicit loading and no-selection states', () => {
    expect(render({ isLoading: true })).toContain('Loading job details…');
    expect(render({ job: null })).toContain('Choose a job to see its tasks');
  });
});
