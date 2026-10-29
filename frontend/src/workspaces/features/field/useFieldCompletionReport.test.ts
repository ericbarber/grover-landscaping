import { describe, expect, it } from 'vitest';
import type { CompletionReportSnapshot } from '../../../api/client';
import { readFieldCompletionReport } from './useFieldCompletionReport';

describe('field completion report reads', () => {
  it('returns an authoritative completion report', async () => {
    const report = { jobId: 'job-1' } as CompletionReportSnapshot;

    await expect(readFieldCompletionReport('job-1', async () => report)).resolves.toEqual({
      state: 'ready',
      report,
    });
  });

  it('keeps the existing local evidence fallback when the read fails', async () => {
    await expect(readFieldCompletionReport('job-1', async () => {
      throw new TypeError('Network connection failed');
    })).resolves.toEqual({ state: 'fallback', report: null });
  });
});
