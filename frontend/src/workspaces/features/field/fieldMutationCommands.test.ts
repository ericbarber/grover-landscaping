import { describe, expect, it, vi } from 'vitest';
import {
  reviewedFieldConflictMessage,
  runChecklistMutationCommand,
  runJobLifecycleMutationCommand,
} from './fieldMutationCommands';

describe('field mutation commands', () => {
  it('keeps a confirmed server write out of the durable queue', async () => {
    const queue = vi.fn(async () => true);

    await expect(runJobLifecycleMutationCommand({
      jobId: 'job-1',
      action: 'start',
      persist: async () => ({ persisted: true }),
      queue,
    })).resolves.toEqual({
      outcome: 'persisted',
      message: 'Started job-1.',
    });
    expect(queue).not.toHaveBeenCalled();
  });

  it('queues unavailable and non-persisted checklist writes durably', async () => {
    const queue = vi.fn(async () => true);

    await expect(runChecklistMutationCommand({
      persist: async () => { throw new Error('API unavailable'); },
      queue,
    })).resolves.toEqual({
      outcome: 'queued',
      message: 'Checklist change saved locally and queued offline.',
    });
    await expect(runChecklistMutationCommand({
      persist: async () => ({ persisted: false }),
      queue,
    })).resolves.toEqual({
      outcome: 'queued',
      message: 'Checklist change saved locally and queued offline.',
    });
    expect(queue).toHaveBeenCalledTimes(2);
  });

  it('distinguishes missing tenant scope from failed durable storage', async () => {
    const persist = async () => { throw new Error('API unavailable'); };

    await expect(runJobLifecycleMutationCommand({
      jobId: 'job-2',
      action: 'complete',
      persist,
    })).resolves.toEqual({
      outcome: 'tenant_unresolved',
      message: 'Completed job-2 locally without a resolved tenant; reconnect before continuing.',
    });
    await expect(runJobLifecycleMutationCommand({
      jobId: 'job-2',
      action: 'complete',
      persist,
      queue: async () => false,
    })).resolves.toEqual({
      outcome: 'durable_storage_unavailable',
      message: 'Completed job-2 locally, but durable offline storage is unavailable.',
    });
  });

  it('owns reviewed-conflict recovery copy for every field queue', () => {
    expect(reviewedFieldConflictMessage('job', 'remove_failed', 'start'))
      .toBe('The reviewed job conflict could not be removed from this phone. Try again.');
    expect(reviewedFieldConflictMessage('job', 'server_refresh_unavailable', 'complete'))
      .toBe('Discarded the reviewed complete conflict; refresh when the API is available.');
    expect(reviewedFieldConflictMessage('checklist', 'restored_server_state'))
      .toBe('Discarded the reviewed checklist conflict and restored server state.');
    expect(reviewedFieldConflictMessage('photo', 'restored_server_state'))
      .toBe('Discarded the reviewed photo conflict and refreshed server photo counts.');
  });
});
