import { describe, expect, it } from 'vitest';
import { ApiRequestError } from '../../../api/apiError';
import type { YardCareJob } from '../../../domain/jobs';
import { readFieldJobs } from './useFieldJobs';

describe('field job collection reads', () => {
  it('returns persisted jobs when the API responds', async () => {
    const jobs = [{ id: 'job-1' }] as YardCareJob[];

    await expect(readFieldJobs(async () => jobs)).resolves.toEqual({
      state: 'ready',
      jobs,
    });
  });

  it('does not substitute seed work for an authoritative API error', async () => {
    await expect(readFieldJobs(async () => {
      throw new ApiRequestError(403, 'job_access_denied', 'Access denied');
    })).resolves.toEqual({ state: 'unavailable', jobs: [] });
  });

  it('uses seed work only when the API transport is unreachable', async () => {
    const result = await readFieldJobs(async () => {
      throw new TypeError('Network connection failed');
    });

    expect(result.state).toBe('fallback');
    expect(result.jobs.length).toBeGreaterThan(0);
  });
});
