import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { YardCareJob } from '../domain/jobs';
import { AssignedJobsPanel } from './AssignedJobsPanel';

const jobs: YardCareJob[] = [{
  id: 'job-1',
  customerName: 'North Yard',
  propertyAddress: '101 North Street',
  scheduledDate: '2026-09-30',
  status: 'in_progress',
  beforePhotos: 1,
  afterPhotos: 0,
  checklistItems: 4,
  completedChecklistItems: 2,
}, {
  id: 'job-2',
  customerName: 'South Yard',
  propertyAddress: '202 South Street',
  scheduledDate: '2026-09-30',
  status: 'scheduled',
  beforePhotos: 0,
  afterPhotos: 0,
  checklistItems: 3,
  completedChecklistItems: 0,
}];

describe('AssignedJobsPanel', () => {
  it('renders field presentation and owns the initial filter state', () => {
    const markup = renderToStaticMarkup(createElement(AssignedJobsPanel, {
      jobs,
      jobsUnavailable: false,
      onSelectJob: () => undefined,
      recovery: createElement('p', null, 'Recovery summary'),
      selectedJobId: 'job-1',
      statusMessage: 'Connected to the API.',
    }));

    expect(markup).toContain('Assigned jobs');
    expect(markup).toContain('Recovery summary');
    expect(markup).toContain('North Yard');
    expect(markup).toContain('South Yard');
    expect(markup).toContain('2 shown');
    expect(markup).toContain('Selected Job');
  });

  it('shows a persisted-data failure without substituting work', () => {
    const markup = renderToStaticMarkup(createElement(AssignedJobsPanel, {
      jobs: [],
      jobsUnavailable: true,
      onSelectJob: () => undefined,
      selectedJobId: null,
      statusMessage: 'Persisted field work is unavailable.',
    }));

    expect(markup).toContain('Persisted field work could not be loaded.');
    expect(markup).toContain('0 shown');
  });
});
