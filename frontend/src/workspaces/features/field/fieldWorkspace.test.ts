import { describe, expect, it } from 'vitest';
import type {
  ChecklistOfflineMutation,
  JobLifecycleOfflineMutation,
  PhotoUploadOfflineMutation,
} from '../../../domain/offlineMutationQueue';
import { fieldQueueCanSync, fieldRecoveryState } from './fieldWorkspace';

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
});
