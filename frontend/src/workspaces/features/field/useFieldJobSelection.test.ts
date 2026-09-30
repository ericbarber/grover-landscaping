import { describe, expect, it } from 'vitest';
import { ApiRequestError } from '../../../api/apiError';
import type { JobAddOn, JobDetail } from '../../../api/client';
import type { YardCareJob } from '../../../domain/jobs';
import { readFieldJobAddOns, readFieldJobDetail } from './useFieldJobSelection';

describe('field job selection reads', () => {
  it('returns an authoritative job detail read', async () => {
    const detail = { id: 'job-1', checklist: [] } as unknown as JobDetail;

    await expect(readFieldJobDetail('job-1', [], async () => detail)).resolves.toEqual({
      state: 'ready',
      detail,
    });
  });

  it('uses the trusted job summary only for a transport failure', async () => {
    const jobs = [{
      id: 'job-1',
      status: 'scheduled',
      beforePhotos: 0,
      afterPhotos: 0,
    }] as YardCareJob[];

    const result = await readFieldJobDetail('job-1', jobs, async () => {
      throw new TypeError('Network connection failed');
    });

    expect(result.state).toBe('fallback');
    expect(result.detail?.checklist).toHaveLength(4);
  });

  it('does not substitute a fallback for an authoritative API denial', async () => {
    const jobs = [{ id: 'job-1' }] as YardCareJob[];

    await expect(readFieldJobDetail('job-1', jobs, async () => {
      throw new ApiRequestError(403, 'job_access_denied', 'Access denied');
    })).resolves.toEqual({ state: 'unavailable', detail: null });
  });

  it('keeps add-on transport fallbacks distinct from API unavailability', async () => {
    const addOns = [{ id: 'add-on-1' }] as JobAddOn[];
    await expect(readFieldJobAddOns('job-1', async () => addOns)).resolves.toEqual({
      addOns,
      unavailable: false,
    });
    await expect(readFieldJobAddOns('job-1', async () => {
      throw new TypeError('Network connection failed');
    })).resolves.toEqual({ addOns: [], unavailable: false });
    await expect(readFieldJobAddOns('job-1', async () => {
      throw new ApiRequestError(503, 'job_add_ons_unavailable', 'Unavailable');
    })).resolves.toEqual({ addOns: [], unavailable: true });
  });
});
