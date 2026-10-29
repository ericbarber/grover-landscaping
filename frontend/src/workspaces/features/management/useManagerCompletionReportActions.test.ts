import { describe, expect, it, vi } from 'vitest';
import type { CompletionReportAction } from '../../../api/client';
import { executeManagerReportCommand } from './useManagerCompletionReportActions';

const action = {
  reportId: 'report-1',
  jobId: 'job-1',
} as CompletionReportAction;

describe('manager completion report actions', () => {
  it('refreshes the exact report and activity after a successful command', async () => {
    const refreshReport = vi.fn(async () => undefined);
    const refreshActivity = vi.fn(async () => undefined);

    await expect(executeManagerReportCommand(
      async () => action,
      refreshReport,
      refreshActivity,
    )).resolves.toEqual({ ok: true, action });
    expect(refreshReport).toHaveBeenCalledWith('job-1');
    expect(refreshActivity).toHaveBeenCalledOnce();
  });

  it('does not report success when the write or required refresh fails', async () => {
    const refreshReport = vi.fn(async () => undefined);
    const refreshActivity = vi.fn(async () => undefined);
    const writeError = new Error('Write rejected');

    await expect(executeManagerReportCommand(
      async () => { throw writeError; },
      refreshReport,
      refreshActivity,
    )).resolves.toEqual({ ok: false, error: writeError });
    expect(refreshReport).not.toHaveBeenCalled();
    expect(refreshActivity).not.toHaveBeenCalled();

    const refreshError = new Error('Refresh failed');
    await expect(executeManagerReportCommand(
      async () => action,
      async () => { throw refreshError; },
      refreshActivity,
    )).resolves.toEqual({ ok: false, error: refreshError });
  });
});
