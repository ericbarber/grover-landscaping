import { describe, expect, it, vi } from 'vitest';
import type { OfflineMutation } from '../../../domain/offlineMutationQueue';
import {
  discardFieldOfflineConflict,
  enqueueFieldOfflineMutation,
  partitionFieldOfflineMutations,
} from './useFieldOfflineRecovery';

describe('field offline recovery coordinator', () => {
  it('partitions only field job, checklist, and photo mutations', () => {
    const mutation = (kind: OfflineMutation['kind']): OfflineMutation => ({
      id: kind,
      kind,
      organizationId: 'organization-1',
      actorId: 'actor-1',
      createdAt: '2026-09-30T12:00:00Z',
      attemptCount: 0,
      syncState: 'pending',
    } as OfflineMutation);

    const queues = partitionFieldOfflineMutations([
      mutation('job_lifecycle'),
      mutation('checklist'),
      mutation('photo_upload'),
      mutation('stop_progress'),
      mutation('day_plan_amendment'),
    ]);

    expect(queues.jobMutations.map(({ kind }) => kind)).toEqual(['job_lifecycle']);
    expect(queues.checklistMutations.map(({ kind }) => kind)).toEqual(['checklist']);
    expect(queues.photoMutations.map(({ kind }) => kind)).toEqual(['photo_upload']);
  });

  it('requests persistent storage only after a mutation is durably queued', async () => {
    const requestStorage = vi.fn(async () => 'persisted');
    const mutation = { id: 'mutation-1' };

    await expect(enqueueFieldOfflineMutation(
      async () => mutation,
      requestStorage,
    )).resolves.toBe(mutation);
    await Promise.resolve();
    expect(requestStorage).toHaveBeenCalledOnce();

    requestStorage.mockClear();
    await expect(enqueueFieldOfflineMutation(
      async () => { throw new Error('IndexedDB unavailable'); },
      requestStorage,
    )).resolves.toBeNull();
    expect(requestStorage).not.toHaveBeenCalled();
  });

  it('classifies conflict removal and authoritative refresh independently', async () => {
    const remove = vi.fn(async () => undefined);
    const serverState = { id: 'job-1' };

    await expect(discardFieldOfflineConflict(
      'mutation-1',
      async () => serverState,
      remove,
    )).resolves.toEqual({
      outcome: 'restored_server_state',
      serverState,
    });

    await expect(discardFieldOfflineConflict(
      'mutation-2',
      async () => { throw new Error('API unavailable'); },
      remove,
    )).resolves.toEqual({
      outcome: 'server_refresh_unavailable',
      serverState: null,
    });

    const failedRemove = vi.fn(async () => { throw new Error('IndexedDB unavailable'); });
    const refresh = vi.fn(async () => serverState);
    await expect(discardFieldOfflineConflict(
      'mutation-3',
      refresh,
      failedRemove,
    )).resolves.toEqual({
      outcome: 'remove_failed',
      serverState: null,
    });
    expect(refresh).not.toHaveBeenCalled();
  });
});
