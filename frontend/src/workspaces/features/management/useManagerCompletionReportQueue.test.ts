import { describe, expect, it, vi } from 'vitest';
import type { CompletionReportSnapshot } from '../../../api/client';
import type { YardCareJob } from '../../../domain/jobs';
import { readManagerCompletionReportQueue } from './useManagerCompletionReportQueue';

const jobs = [{ id: 'job-1' }, { id: 'job-2' }] as YardCareJob[];
const report = (jobId: string, customerName = jobId) => ({
  jobId,
  job: { customerName, propertyAddress: `${jobId} property` },
} as CompletionReportSnapshot);

describe('manager completion report queue coordinator', () => {
  it('uses the authoritative collection when it is available', async () => {
    const reports = [report('job-1')];
    const fetchCollection = vi.fn(async () => reports);
    const fetchOne = vi.fn(async () => report('unused'));

    await expect(readManagerCompletionReportQueue(
      jobs,
      {},
      false,
      fetchCollection,
      fetchOne,
    )).resolves.toEqual({ reports, partial: false });
    expect(fetchOne).not.toHaveBeenCalled();
  });

  it('retains successful job snapshots when an initial fallback is partial', async () => {
    const fetchCollection = vi.fn(async () => { throw new Error('Collection unavailable'); });
    const fetchOne = vi.fn(async (jobId: string) => {
      if (jobId === 'job-2') throw new Error('Snapshot unavailable');
      return report(jobId);
    });

    await expect(readManagerCompletionReportQueue(
      jobs,
      {},
      true,
      fetchCollection,
      fetchOne,
    )).resolves.toEqual({ reports: [report('job-1')], partial: true });
  });

  it('keeps an explicit refresh all-or-nothing when its fallback is incomplete', async () => {
    const fetchCollection = vi.fn(async () => { throw new Error('Collection unavailable'); });
    const fetchOne = vi.fn(async (jobId: string) => {
      if (jobId === 'job-2') throw new Error('Snapshot unavailable');
      return report(jobId);
    });

    await expect(readManagerCompletionReportQueue(
      jobs,
      {},
      false,
      fetchCollection,
      fetchOne,
    )).rejects.toThrow('Snapshot unavailable');
  });
});
