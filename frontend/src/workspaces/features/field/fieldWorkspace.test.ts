import { describe, expect, it } from 'vitest';
import type {
  ChecklistOfflineMutation,
  JobLifecycleOfflineMutation,
  PhotoUploadOfflineMutation,
} from '../../../domain/offlineMutationQueue';
import type { PhotoUploadTicket } from '../../../api/client';
import type { YardCareJob } from '../../../domain/jobs';
import {
  createLocalPhotoTicket,
  fallbackJobDetail,
  fieldQueueCanSync,
  fieldRecoveryState,
  mergePhotoEvidence,
} from './fieldWorkspace';

const base = {
  organizationId: 'organization-1',
  actorId: 'user-1',
  createdAt: '2026-09-30T12:00:00.000Z',
  attemptCount: 0,
} as const;

describe('field workspace recovery policy', () => {
  it('summarizes each local queue and the combined pending-change count', () => {
    const state = fieldRecoveryState({
      jobMutations: [{
        ...base, id: 'job-1', kind: 'job_lifecycle', jobId: 'job-1',
        action: 'start', syncState: 'failed',
      }] as JobLifecycleOfflineMutation[],
      checklistMutations: [{
        ...base, id: 'check-1', kind: 'checklist', jobId: 'job-1',
        checklistItemId: 'item-1', completed: true, syncState: 'conflict',
      }] as ChecklistOfflineMutation[],
      photoMutations: [{
        ...base, id: 'photo-1', kind: 'photo_upload', jobId: 'job-1',
        photoType: 'before', fileName: 'before.jpg', contentType: 'image/jpeg',
        fileSizeBytes: 1024, syncState: 'pending',
      }] as PhotoUploadOfflineMutation[],
    });

    expect(state.pendingChangeCount).toBe(3);
    expect(state.jobs.failed).toBe(1);
    expect(state.checklist.conflicts).toBe(1);
    expect(state.photos.pending).toBe(1);
  });

  it('allows replay only while online, idle, and conflict free', () => {
    const summary = {
      total: 1, pending: 1, failed: 0, conflicts: 0,
      oldestCreatedAt: '2026-09-30T12:00:00.000Z', maxAttempts: 0,
    };

    expect(fieldQueueCanSync(summary, true, false)).toBe(true);
    expect(fieldQueueCanSync(summary, false, false)).toBe(false);
    expect(fieldQueueCanSync(summary, true, true)).toBe(false);
    expect(fieldQueueCanSync({ ...summary, conflicts: 1 }, true, false)).toBe(false);
  });

  it('builds an explicit local detail fallback from the trusted job summary', () => {
    const job = {
      id: 'job-1',
      status: 'in_progress',
      beforePhotos: 1,
      afterPhotos: 0,
    } as YardCareJob;

    expect(fallbackJobDetail(job).checklist).toEqual([
      { id: 'before-photos', label: 'Capture before photos', completed: true },
      { id: 'yard-service', label: 'Complete yard service', completed: true },
      { id: 'after-photos', label: 'Capture after photos', completed: false },
      { id: 'completion-notes', label: 'Submit completion notes', completed: false },
    ]);
  });

  it('creates deterministic local photo evidence metadata', () => {
    const ticket = createLocalPhotoTicket(
      'job-1',
      { name: 'before.jpg', type: 'image/jpeg' },
      'before',
      { fileSizeBytes: 1024, imageWidthPx: 800, imageHeightPx: 600 },
      { now: 1234, createObjectUrl: () => 'blob:before' },
    );

    expect(ticket).toMatchObject({
      photoId: 'local_job-1_before_1234',
      objectKey: 'browser/jobs/job-1/before/before.jpg',
      thumbnailUrl: 'blob:before',
      metadataSource: 'client_reported',
    });
  });

  it('merges authoritative evidence without dropping unsaved local or other-job photos', () => {
    const ticket = (photoId: string, jobId: string): PhotoUploadTicket => ({
      status: 'created',
      jobId,
      photoId,
      photoType: 'before',
      fileName: `${photoId}.jpg`,
      contentType: 'image/jpeg',
      uploadMode: 'test',
      uploadUrl: '',
      objectKey: photoId,
    });
    const current = [
      ticket('persisted-1', 'job-1'),
      ticket('local-1', 'job-1'),
      ticket('other-1', 'job-2'),
    ];
    const persisted = [ticket('persisted-1', 'job-1'), ticket('persisted-2', 'job-1')];

    expect(mergePhotoEvidence(current, 'job-1', persisted).map(({ photoId }) => photoId)).toEqual([
      'persisted-1',
      'persisted-2',
      'local-1',
      'other-1',
    ]);
  });
});
