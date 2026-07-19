import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createStopProgressOfflineMutation,
  createJobLifecycleOfflineMutation,
  createChecklistOfflineMutation,
  createDayPlanAmendmentOfflineMutation,
  createOfflineMutationId,
  createPhotoUploadOfflineMutation,
  enqueuePhotoUploadMutation,
  enqueueDayPlanAmendmentMutation,
  getOfflinePhotoBlob,
  isOfflineMutationConflict,
  listOfflineMutations,
  markOfflineMutationFailed,
  removeOfflineMutation,
  requestPersistentOfflineStorage,
  summarizeOfflineMutations,
  withOfflineMutationFailure,
} from './offlineMutationQueue';
import { ApiRequestError } from '../api/apiError';
import { replayOfflinePhotoMutation } from './offlinePhotoReplay';

describe('offline mutation queue records', () => {
  beforeEach(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase('grover-field-offline');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('offline test database deletion was blocked'));
    });
  });

  it('creates an RFC 4122 mutation UUID when randomUUID is unavailable', () => {
    const mutationId = createOfflineMutationId({
      getRandomValues: (values) => {
        (values as unknown as Uint8Array).fill(0xab);
        return values;
      },
    });
    expect(mutationId).toBe('abababab-abab-4bab-abab-abababababab');
  });

  it('captures tenant, actor, ordering, and retry context for stop progress', () => {
    const record = createStopProgressOfflineMutation(
      {
        organizationId: 'org-1',
        actorId: 'user-1',
        dayPlanId: 'plan-1',
        stopId: 'stop-1',
        status: 'in_progress',
      },
      'mutation-1',
      new Date('2026-07-19T20:30:00.000Z'),
    );

    expect(record).toEqual({
      id: 'mutation-1',
      kind: 'stop_progress',
      organizationId: 'org-1',
      actorId: 'user-1',
      dayPlanId: 'plan-1',
      stopId: 'stop-1',
      status: 'in_progress',
      createdAt: '2026-07-19T20:30:00.000Z',
      attemptCount: 0,
      syncState: 'pending',
    });
  });

  it('validates safe offline photo metadata before storing a blob', () => {
    expect(createPhotoUploadOfflineMutation(
      {
        organizationId: 'org-1',
        actorId: 'user-1',
        jobId: 'job-1',
        photoType: 'before',
        fileName: 'yard.jpg',
        contentType: 'image/jpeg',
        fileSizeBytes: 1024,
      },
      'mutation-4',
      new Date('2026-07-19T21:20:00.000Z'),
    )).toMatchObject({
      id: 'mutation-4',
      kind: 'photo_upload',
      contentType: 'image/jpeg',
      fileSizeBytes: 1024,
      syncState: 'pending',
    });

    expect(() => createPhotoUploadOfflineMutation({
      organizationId: 'org-1',
      actorId: 'user-1',
      jobId: 'job-1',
      photoType: 'before',
      fileName: 'document.pdf',
      contentType: 'application/pdf',
      fileSizeBytes: 1024,
    })).toThrow(/JPEG, PNG, GIF, or WebP/);
  });

  it('persists photo metadata and bytes, retains conflicts, and removes both together', async () => {
    const bytes = new Blob(['offline image bytes'], { type: 'image/jpeg' });
    const mutation = await enqueuePhotoUploadMutation({
      organizationId: 'org-photo',
      actorId: 'crew-photo',
      jobId: 'job-photo',
      photoType: 'after',
      fileName: 'completed-yard.jpg',
    }, bytes);

    expect(await listOfflineMutations('org-photo', 'crew-photo')).toEqual([mutation]);
    expect(await getOfflinePhotoBlob(mutation.id)).toEqual(bytes);

    await markOfflineMutationFailed(mutation, 'server state changed', 'conflict');
    expect(await listOfflineMutations('org-photo', 'crew-photo')).toEqual([
      expect.objectContaining({
        id: mutation.id,
        attemptCount: 1,
        syncState: 'conflict',
      }),
    ]);
    expect(await getOfflinePhotoBlob(mutation.id)).toEqual(bytes);

    await removeOfflineMutation(mutation.id);
    expect(await listOfflineMutations('org-photo', 'crew-photo')).toEqual([]);
    expect(await getOfflinePhotoBlob(mutation.id)).toBeNull();
  });

  it('replays a stored photo in order and removes it only after completion', async () => {
    const mutation = await enqueuePhotoUploadMutation({
      organizationId: 'org-replay',
      actorId: 'crew-replay',
      jobId: 'job-replay',
      photoType: 'before',
      fileName: 'arrival.jpg',
    }, new Blob(['photo bytes'], { type: 'image/jpeg' }));
    const events: string[] = [];
    const createTicket = vi.fn(async (
      _jobId: string,
      file: File,
      _photoType: 'before' | 'after' | 'issue' | 'extra',
      clientMutationId: string,
    ) => {
      events.push('ticket');
      expect(file.name).toBe('arrival.jpg');
      expect(clientMutationId).toBe(mutation.id);
      return {
        status: 'created',
        jobId: mutation.jobId,
        photoId: 'photo-replay',
        photoType: mutation.photoType,
        fileName: mutation.fileName,
        contentType: mutation.contentType,
        uploadMode: 'local-placeholder',
        uploadUrl: 'local://upload',
        objectKey: 'local/photo-replay',
      };
    });

    const ticket = await replayOfflinePhotoMutation(mutation, {
      getBlob: getOfflinePhotoBlob,
      createTicket,
      upload: async () => {
        events.push('upload');
        expect(await getOfflinePhotoBlob(mutation.id)).not.toBeNull();
      },
      readMetadata: async () => {
        events.push('metadata');
        return {
          fileSizeBytes: 11,
          imageWidthPx: 1200,
          imageHeightPx: 800,
        };
      },
      complete: async () => {
        events.push('complete');
        expect(await getOfflinePhotoBlob(mutation.id)).not.toBeNull();
      },
      remove: async (mutationId) => {
        events.push('remove');
        await removeOfflineMutation(mutationId);
      },
    });

    expect(events).toEqual(['ticket', 'upload', 'metadata', 'complete', 'remove']);
    expect(ticket).toMatchObject({
      status: 'uploaded',
      photoId: 'photo-replay',
      fileSizeBytes: 11,
      metadataSource: 'client_reported',
    });
    expect(await listOfflineMutations('org-replay', 'crew-replay')).toEqual([]);
    expect(await getOfflinePhotoBlob(mutation.id)).toBeNull();
  });

  it('captures tenant and item state for checklist mutations', () => {
    expect(createChecklistOfflineMutation(
      {
        organizationId: 'org-1',
        actorId: 'user-1',
        jobId: 'job-1',
        checklistItemId: 'checklist-1',
        completed: true,
      },
      'mutation-3',
      new Date('2026-07-19T21:10:00.000Z'),
    )).toMatchObject({
      id: 'mutation-3',
      kind: 'checklist',
      jobId: 'job-1',
      checklistItemId: 'checklist-1',
      completed: true,
      syncState: 'pending',
    });
  });

  it('persists tenant-scoped day-plan amendment requests with service context', async () => {
    const mutation = createDayPlanAmendmentOfflineMutation(
      {
        organizationId: 'org-1',
        actorId: 'crew-user-1',
        dayPlanId: 'day-plan-1',
        amendmentType: 'add_service',
        requestedByCrewId: 'crew-1',
        stopId: 'stop-1',
        service: {
          id: 'service-1',
          name: 'Sprinkler repair',
          requiresManagerApproval: true,
        },
        note: 'Broken sprinkler head',
      },
      'mutation-amendment',
      new Date('2026-07-19T22:30:00.000Z'),
    );
    expect(mutation).toMatchObject({
      id: 'mutation-amendment',
      kind: 'day_plan_amendment',
      amendmentType: 'add_service',
      stopId: 'stop-1',
      syncState: 'pending',
    });

    const persisted = await enqueueDayPlanAmendmentMutation({
      organizationId: 'org-1',
      actorId: 'crew-user-1',
      dayPlanId: 'day-plan-1',
      amendmentType: 'remove_stop',
      requestedByCrewId: 'crew-1',
      stopId: 'stop-1',
      note: 'Gate is inaccessible',
    });
    expect(await listOfflineMutations('org-1', 'crew-user-1')).toEqual([persisted]);
  });

  it('captures tenant, actor, and idempotency context for job lifecycle actions', () => {
    expect(createJobLifecycleOfflineMutation(
      {
        organizationId: 'org-1',
        actorId: 'user-1',
        jobId: 'job-1',
        action: 'complete',
      },
      'mutation-2',
      new Date('2026-07-19T21:00:00.000Z'),
    )).toEqual({
      id: 'mutation-2',
      kind: 'job_lifecycle',
      organizationId: 'org-1',
      actorId: 'user-1',
      jobId: 'job-1',
      action: 'complete',
      createdAt: '2026-07-19T21:00:00.000Z',
      attemptCount: 0,
      syncState: 'pending',
    });
  });

  it('reports whether the browser protects offline storage from eviction', async () => {
    expect(await requestPersistentOfflineStorage(undefined)).toBe('unsupported');
    expect(await requestPersistentOfflineStorage({
      persisted: async () => false,
      persist: async () => true,
    })).toBe('persisted');
    expect(await requestPersistentOfflineStorage({
      persisted: async () => false,
      persist: async () => false,
    })).toBe('browser_managed');
  });

  it('summarizes ordered queue age and retry states', () => {
    const first = withOfflineMutationFailure(
      createStopProgressOfflineMutation(
        {
          organizationId: 'org-1',
          actorId: 'user-1',
          dayPlanId: 'plan-1',
          stopId: 'stop-1',
          status: 'in_progress',
        },
        'mutation-1',
        new Date('2026-07-19T20:00:00.000Z'),
      ),
      'network failed',
    );
    const second = createStopProgressOfflineMutation(
      {
        organizationId: 'org-1',
        actorId: 'user-1',
        dayPlanId: 'plan-1',
        stopId: 'stop-2',
        status: 'finished',
      },
      'mutation-2',
      new Date('2026-07-19T20:05:00.000Z'),
    );

    expect(summarizeOfflineMutations([second, first])).toEqual({
      total: 2,
      pending: 1,
      failed: 1,
      conflicts: 0,
      oldestCreatedAt: '2026-07-19T20:00:00.000Z',
      maxAttempts: 1,
    });
  });

  it('increments retry context without losing the original action identity', () => {
    const record = createStopProgressOfflineMutation(
      {
        organizationId: 'org-1',
        actorId: 'user-1',
        dayPlanId: 'plan-1',
        stopId: 'stop-1',
        status: 'finished',
      },
      'mutation-1',
      new Date('2026-07-19T20:30:00.000Z'),
    );

    expect(withOfflineMutationFailure(record, 'API unavailable')).toMatchObject({
      id: 'mutation-1',
      status: 'finished',
      attemptCount: 1,
      syncState: 'failed',
      lastError: 'API unavailable',
    });
  });

  it('classifies stale or invalid server transitions as conflicts', () => {
    expect(isOfflineMutationConflict(new ApiRequestError(409))).toBe(true);
    expect(isOfflineMutationConflict(new ApiRequestError(422))).toBe(true);
    expect(isOfflineMutationConflict(new ApiRequestError(503))).toBe(false);
    expect(isOfflineMutationConflict(new TypeError('network failed'))).toBe(false);
  });
});
