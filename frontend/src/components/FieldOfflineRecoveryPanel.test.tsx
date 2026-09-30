import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { JobLifecycleOfflineMutation } from '../domain/offlineMutationQueue';
import type { YardCareJob } from '../domain/jobs';
import { fieldRecoveryState } from '../workspaces/features/field/fieldWorkspace';
import { FieldOfflineRecoveryPanel } from './FieldOfflineRecoveryPanel';

const job: YardCareJob = {
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
};

const conflict: JobLifecycleOfflineMutation = {
  id: 'mutation-1',
  organizationId: 'organization-1',
  actorId: 'user-1',
  createdAt: '2026-09-30T12:00:00.000Z',
  attemptCount: 2,
  syncState: 'conflict',
  kind: 'job_lifecycle',
  jobId: 'job-1',
  action: 'start',
};

describe('FieldOfflineRecoveryPanel', () => {
  it('renders conflict-safe recovery controls from the shared field summary', () => {
    const recovery = fieldRecoveryState({
      jobMutations: [conflict],
      checklistMutations: [],
      photoMutations: [],
    });
    const markup = renderToStaticMarkup(createElement(FieldOfflineRecoveryPanel, {
      checklistMutations: [],
      isOnline: true,
      isReplayingChecklist: false,
      isReplayingJobs: false,
      isReplayingPhotos: false,
      jobMutations: [conflict],
      jobs: [job],
      onDiscardChecklistConflict: () => undefined,
      onDiscardJobConflict: () => undefined,
      onDiscardPhotoConflict: () => undefined,
      onReplayChecklist: () => undefined,
      onReplayJobs: () => undefined,
      onReplayPhotos: () => undefined,
      photoMutations: [],
      recovery,
      selectedJob: null,
    }));

    expect(markup).toContain('1 job change is queued offline');
    expect(markup).toContain('North Yard');
    expect(markup).toContain('2 attempts');
    expect(markup).toContain('Resolve after manager review');
    expect(markup).toMatch(/<button[^>]*disabled=""[^>]*>Sync job changes<\/button>/);
  });

  it('renders nothing when every recovery queue is empty', () => {
    const recovery = fieldRecoveryState({
      jobMutations: [], checklistMutations: [], photoMutations: [],
    });
    const markup = renderToStaticMarkup(createElement(FieldOfflineRecoveryPanel, {
      checklistMutations: [],
      isOnline: true,
      isReplayingChecklist: false,
      isReplayingJobs: false,
      isReplayingPhotos: false,
      jobMutations: [],
      jobs: [],
      onDiscardChecklistConflict: () => undefined,
      onDiscardJobConflict: () => undefined,
      onDiscardPhotoConflict: () => undefined,
      onReplayChecklist: () => undefined,
      onReplayJobs: () => undefined,
      onReplayPhotos: () => undefined,
      photoMutations: [],
      recovery,
      selectedJob: null,
    }));

    expect(markup).toBe('');
  });
});
