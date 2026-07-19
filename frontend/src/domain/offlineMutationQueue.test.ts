import { describe, expect, it } from 'vitest';
import {
  createStopProgressOfflineMutation,
  isOfflineMutationConflict,
  requestPersistentOfflineStorage,
  summarizeOfflineMutations,
  withOfflineMutationFailure,
} from './offlineMutationQueue';
import { ApiRequestError } from '../api/apiError';

describe('offline mutation queue records', () => {
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
