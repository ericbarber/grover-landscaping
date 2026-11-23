import { describe, expect, it, vi } from 'vitest';
import type { CustomerPhotoErasureSummary, CustomerPrivacyExport } from '../../../api/client';
import {
  executeManagerCustomerPhotoErasure,
  executeManagerCustomerPrivacyExport,
} from './useManagerCustomerPrivacy';

const privacyExport = {
  account: { accountId: 'account-1', customerName: 'Canyon View' },
  photoEvidence: [],
} as unknown as CustomerPrivacyExport;

const erasure = {
  accountId: 'account-1',
  status: 'erased',
  erasedPhotoCount: 2,
} as CustomerPhotoErasureSummary;

describe('manager customer privacy coordination', () => {
  it('returns an exact account export', async () => {
    const readExport = vi.fn(async () => privacyExport);

    await expect(executeManagerCustomerPrivacyExport(
      'account-1',
      readExport,
    )).resolves.toEqual({ ok: true, privacyExport });
    expect(readExport).toHaveBeenCalledWith('account-1');
  });

  it('refreshes privacy data after a successful erasure', async () => {
    const erasePhotos = vi.fn(async () => erasure);
    const readExport = vi.fn(async () => privacyExport);

    await expect(executeManagerCustomerPhotoErasure(
      'account-1',
      'Customer request',
      erasePhotos,
      readExport,
    )).resolves.toEqual({ ok: true, erasure, privacyExport });
    expect(erasePhotos).toHaveBeenCalledWith('account-1', 'Customer request');
    expect(readExport).toHaveBeenCalledWith('account-1');
  });

  it('preserves erasure success when only the follow-up export is unavailable', async () => {
    await expect(executeManagerCustomerPhotoErasure(
      'account-1',
      'Customer request',
      async () => erasure,
      async () => { throw new Error('Export unavailable'); },
    )).resolves.toEqual({ ok: true, erasure, privacyExport: null });
  });

  it('does not refresh privacy data after a rejected erasure', async () => {
    const erasureError = new Error('Erasure rejected');
    const readExport = vi.fn(async () => privacyExport);

    await expect(executeManagerCustomerPhotoErasure(
      'account-1',
      'Customer request',
      async () => { throw erasureError; },
      readExport,
    )).resolves.toEqual({ ok: false, error: erasureError });
    expect(readExport).not.toHaveBeenCalled();
  });
});
