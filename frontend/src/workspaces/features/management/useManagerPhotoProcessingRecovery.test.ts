import { describe, expect, it, vi } from 'vitest';
import type { PhotoProcessingHistoryItem } from '../../../api/client';
import {
  executeManagerPhotoProcessingAction,
  initialManagerPhotoProcessingOptions,
  managerPhotoProcessingOptions,
} from './useManagerPhotoProcessingRecovery';

const processingJob = {
  id: 'processing-1',
  fileName: 'after.jpg',
  taskType: 'thumbnail_generation',
  status: 'failed',
} as PhotoProcessingHistoryItem;

describe('manager photo processing recovery', () => {
  it('uses the existing failed-item initial view and bounded filtered reads', () => {
    expect(initialManagerPhotoProcessingOptions).toEqual({ status: 'failed', limit: 25 });
    expect(managerPhotoProcessingOptions({ status: 'all' })).toEqual({
      taskType: 'thumbnail_generation',
      status: undefined,
      limit: 25,
    });
    expect(managerPhotoProcessingOptions({ status: 'dead_letter' })).toEqual({
      taskType: 'thumbnail_generation',
      status: 'dead_letter',
      limit: 25,
    });
  });

  it('refreshes the active filtered history after a successful action', async () => {
    const command = vi.fn(async () => processingJob);
    const readHistory = vi.fn(async () => [processingJob]);

    await expect(executeManagerPhotoProcessingAction(
      command,
      { status: 'failed' },
      readHistory,
    )).resolves.toEqual({ ok: true, item: processingJob, history: [processingJob] });
    expect(command).toHaveBeenCalledOnce();
    expect(readHistory).toHaveBeenCalledWith({
      taskType: 'thumbnail_generation',
      status: 'failed',
      limit: 25,
    });
  });

  it('does not report success when the action or required refresh fails', async () => {
    const actionError = new Error('Retry rejected');
    const readHistory = vi.fn(async () => [processingJob]);

    await expect(executeManagerPhotoProcessingAction(
      async () => { throw actionError; },
      { status: 'failed' },
      readHistory,
    )).resolves.toEqual({ ok: false, error: actionError });
    expect(readHistory).not.toHaveBeenCalled();

    const refreshError = new Error('History unavailable');
    await expect(executeManagerPhotoProcessingAction(
      async () => processingJob,
      { status: 'failed' },
      async () => { throw refreshError; },
    )).resolves.toEqual({ ok: false, error: refreshError });
  });
});
