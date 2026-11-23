import { describe, expect, it, vi } from 'vitest';
import type { PhotoErasureDeletionHistoryItem } from '../../../api/client';
import { executeManagerPhotoErasureAction } from './useManagerPhotoErasureRecovery';

const erasureJob = {
  id: 'erasure-1',
  accountId: 'account-1',
  objectKey: 'private/photo.jpg',
  status: 'failed',
} as PhotoErasureDeletionHistoryItem;

describe('manager photo erasure recovery', () => {
  it('refreshes deletion history after a successful action', async () => {
    const command = vi.fn(async () => erasureJob);
    const readHistory = vi.fn(async () => [erasureJob]);

    await expect(executeManagerPhotoErasureAction(command, readHistory)).resolves.toEqual({
      ok: true,
      item: erasureJob,
      history: [erasureJob],
    });
    expect(command).toHaveBeenCalledOnce();
    expect(readHistory).toHaveBeenCalledOnce();
  });

  it('does not read history after a rejected action', async () => {
    const actionError = new Error('Retry rejected');
    const readHistory = vi.fn(async () => [erasureJob]);

    await expect(executeManagerPhotoErasureAction(
      async () => { throw actionError; },
      readHistory,
    )).resolves.toEqual({ ok: false, error: actionError });
    expect(readHistory).not.toHaveBeenCalled();
  });

  it('does not report success when the required history refresh fails', async () => {
    const refreshError = new Error('History unavailable');

    await expect(executeManagerPhotoErasureAction(
      async () => erasureJob,
      async () => { throw refreshError; },
    )).resolves.toEqual({ ok: false, error: refreshError });
  });
});
