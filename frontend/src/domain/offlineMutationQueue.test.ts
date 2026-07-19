import { describe, expect, it } from 'vitest';
import {
  createStopProgressOfflineMutation,
  withOfflineMutationFailure,
} from './offlineMutationQueue';

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
});
