import { describe, expect, it, vi } from 'vitest';
import {
  reviewedFieldConflictMessage,
  runChecklistMutationCommand,
  runFieldAddOnMutationCommand,
  runFieldPhotoUploadCommand,
  runJobLifecycleMutationCommand,
} from './fieldMutationCommands';
import type { PhotoUploadTicket } from '../../../api/client';

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

  it('rejects an invalid photo before requesting an upload ticket', async () => {
    const createTicket = vi.fn();
    const file = { name: 'tiny.jpg', size: 100, type: 'image/jpeg' } as File;

    await expect(runFieldPhotoUploadCommand({
      jobId: 'job-1',
      photoType: 'before',
      file,
      existingPhotos: [],
      dependencies: {
        readMetadata: async () => ({ fileSizeBytes: 100, imageWidthPx: 10, imageHeightPx: 10 }),
        assessQuality: () => ({ accepted: false, issues: ['too_small'] }),
        qualityMessage: () => 'the image is too small',
        createTicket,
        upload: vi.fn(),
        complete: vi.fn(),
        createLocalTicket: vi.fn(),
      },
    })).resolves.toEqual({
      outcome: 'rejected',
      message: 'Photo not added: the image is too small.',
      ticket: null,
      activity: null,
    });
    expect(createTicket).not.toHaveBeenCalled();
  });

  it('owns the complete persisted photo upload sequence', async () => {
    const file = { name: 'after.jpg', size: 500_000, type: 'image/jpeg' } as File;
    const createdTicket = {
      status: 'created', jobId: 'job-1', photoId: 'photo-1', photoType: 'after',
      fileName: file.name, contentType: file.type, uploadMode: 'signed',
      uploadUrl: 'https://uploads.example.test/photo-1', objectKey: 'jobs/job-1/photo-1',
    } satisfies PhotoUploadTicket;
    const upload = vi.fn(async () => undefined);
    const complete = vi.fn(async () => undefined);

    const result = await runFieldPhotoUploadCommand({
      jobId: 'job-1',
      photoType: 'after',
      file,
      existingPhotos: [],
      dependencies: {
        readMetadata: async () => ({
          fileSizeBytes: file.size, imageWidthPx: 1200, imageHeightPx: 900,
        }),
        assessQuality: () => ({ accepted: true, issues: [] }),
        qualityMessage: vi.fn(),
        createTicket: async () => createdTicket,
        upload,
        complete,
        createLocalTicket: vi.fn(),
      },
    });

    expect(upload).toHaveBeenCalledWith(createdTicket, file);
    expect(complete).toHaveBeenCalledWith('job-1', 'photo-1', {
      fileSizeBytes: file.size, imageWidthPx: 1200, imageHeightPx: 900,
    });
    expect(result.outcome).toBe('uploaded');
    expect(result.ticket).toMatchObject({
      status: 'uploaded', metadataSource: 'client_reported', imageWidthPx: 1200,
    });
  });

  it('keeps a local photo and reports whether durable queueing succeeded', async () => {
    const file = { name: 'before.jpg', size: 500_000, type: 'image/jpeg' } as File;
    const localTicket = {
      status: 'created', jobId: 'job-2', photoId: 'local-photo', photoType: 'before',
      fileName: file.name, contentType: file.type, uploadMode: 'browser-local-placeholder',
      uploadUrl: 'local://before.jpg', objectKey: 'browser/job-2/before.jpg',
    } satisfies PhotoUploadTicket;
    const dependencies = {
      readMetadata: async () => ({ fileSizeBytes: file.size, imageWidthPx: 1000, imageHeightPx: 800 }),
      assessQuality: () => ({ accepted: true, issues: [] as [] }),
      qualityMessage: vi.fn(),
      createTicket: async () => { throw new Error('API unavailable'); },
      upload: vi.fn(),
      complete: vi.fn(),
      createLocalTicket: () => localTicket,
    };

    const queued = await runFieldPhotoUploadCommand({
      jobId: 'job-2', photoType: 'before', file, existingPhotos: [],
      queue: async () => true,
      dependencies,
    });
    expect(queued).toMatchObject({ outcome: 'queued', ticket: localTicket });

    const localOnly = await runFieldPhotoUploadCommand({
      jobId: 'job-2', photoType: 'before', file, existingPhotos: [], dependencies,
    });
    expect(localOnly).toMatchObject({ outcome: 'local_only', ticket: localTicket });
  });

  it('refreshes the authoritative report only after a completed add-on update', async () => {
    const addOn = {
      id: 'add-on-1', jobId: 'job-1', serviceName: 'Hedge shaping',
      quantity: 1, unitPriceCents: 12_000, status: 'completed' as const,
    };
    const report = { reportId: 'report-1' };
    const loadReport = vi.fn(async () => report as never);

    await expect(runFieldAddOnMutationCommand({
      jobId: 'job-1', addOnId: addOn.id, status: 'completed',
      update: async () => addOn,
      loadReport,
    })).resolves.toMatchObject({
      outcome: 'updated', addOn, report,
      message: 'Hedge shaping marked completed.',
    });
    expect(loadReport).toHaveBeenCalledWith('job-1');

    loadReport.mockClear();
    await expect(runFieldAddOnMutationCommand({
      jobId: 'job-1', addOnId: addOn.id, status: 'in_progress',
      update: async () => ({ ...addOn, status: 'in_progress' }),
      loadReport,
    })).resolves.toMatchObject({ outcome: 'updated', report: null });
    expect(loadReport).not.toHaveBeenCalled();
  });

  it('does not misreport a saved add-on when its report refresh fails', async () => {
    const addOn = {
      id: 'add-on-2', jobId: 'job-2', serviceName: 'Cleanup',
      quantity: 1, unitPriceCents: 8_000, status: 'completed' as const,
    };

    await expect(runFieldAddOnMutationCommand({
      jobId: 'job-2', addOnId: addOn.id, status: 'completed',
      update: async () => addOn,
      loadReport: async () => { throw new Error('report unavailable'); },
    })).resolves.toEqual({
      outcome: 'updated_report_unavailable',
      message: 'Cleanup marked completed. The completion report could not refresh; retry the report when the API is available.',
      addOn,
      report: null,
    });
  });

  it('keeps an add-on update failure separate from report recovery', async () => {
    const loadReport = vi.fn();
    await expect(runFieldAddOnMutationCommand({
      jobId: 'job-3', addOnId: 'add-on-3', status: 'cancelled',
      update: async () => { throw new Error('write unavailable'); },
      loadReport,
    })).resolves.toEqual({
      outcome: 'update_failed',
      message: 'Could not update add-on work. Check the API connection and try again.',
      addOn: null,
      report: null,
    });
    expect(loadReport).not.toHaveBeenCalled();
  });
});
