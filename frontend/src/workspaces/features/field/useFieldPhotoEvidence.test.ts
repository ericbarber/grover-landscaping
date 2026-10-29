import { describe, expect, it } from 'vitest';
import { ApiRequestError } from '../../../api/apiError';
import type { PhotoUploadTicket } from '../../../api/client';
import { readFieldPhotoEvidence } from './useFieldPhotoEvidence';

describe('field photo evidence reads', () => {
  it('returns authoritative photo evidence', async () => {
    const photos = [{ photoId: 'photo-1' }] as PhotoUploadTicket[];

    await expect(readFieldPhotoEvidence('job-1', async () => photos)).resolves.toEqual({
      state: 'ready',
      photos,
    });
  });

  it('distinguishes a transport fallback from authoritative unavailability', async () => {
    await expect(readFieldPhotoEvidence('job-1', async () => {
      throw new TypeError('Network connection failed');
    })).resolves.toEqual({ state: 'fallback', photos: null });

    await expect(readFieldPhotoEvidence('job-1', async () => {
      throw new ApiRequestError(403, 'job_access_denied', 'Access denied');
    })).resolves.toEqual({ state: 'unavailable', photos: null });
  });
});
