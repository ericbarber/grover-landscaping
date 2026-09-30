import { describe, expect, it } from 'vitest';
import type { OfflineMutation } from '../../../domain/offlineMutationQueue';
import { partitionFieldOfflineMutations } from './useFieldOfflineRecovery';

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
});
