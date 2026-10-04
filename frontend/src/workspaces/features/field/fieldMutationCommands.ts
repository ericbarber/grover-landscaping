import {
  completePhotoUpload,
  createPhotoUploadTicket,
  fetchCompletionReport,
  readPhotoUploadMetadata,
  updateJobAddOnStatus,
  uploadPhotoToTicket,
  type CompletePhotoUploadMetadata,
  type CompletionReportSnapshot,
  type JobAddOn,
  type PhotoUploadTicket,
} from '../../../api/client';
import {
  assessPhotoQuality,
  photoQualityMessage,
  type PhotoQualityAssessment,
} from '../../../domain/photoQuality';
import { createLocalPhotoTicket, type FieldPhotoType } from './fieldWorkspace';
import type { FieldConflictDiscardOutcome } from './useFieldOfflineRecovery';

interface PersistedMutationResult {
  persisted: boolean;
}

export type FieldMutationCommandOutcome =
  | 'persisted'
  | 'queued'
  | 'durable_storage_unavailable'
  | 'tenant_unresolved';

export interface FieldMutationCommandResult {
  outcome: FieldMutationCommandOutcome;
  message: string;
}

export type FieldPhotoUploadCommandOutcome =
  | 'rejected'
  | 'uploaded'
  | 'queued'
  | 'local_only';

export interface FieldPhotoUploadCommandResult {
  outcome: FieldPhotoUploadCommandOutcome;
  message: string;
  ticket: PhotoUploadTicket | null;
  activity: {
    title: string;
    message: string;
    tone: 'success' | 'warning';
    source: 'photo';
  } | null;
}

export type FieldAddOnMutationCommandOutcome =
  | 'updated'
  | 'updated_report_unavailable'
  | 'update_failed';

export interface FieldAddOnMutationCommandResult {
  outcome: FieldAddOnMutationCommandOutcome;
  message: string;
  addOn: JobAddOn | null;
  report: CompletionReportSnapshot | null;
}

interface FieldPhotoUploadCommandDependencies {
  readMetadata: (file: File) => Promise<CompletePhotoUploadMetadata>;
  assessQuality: (
    file: Pick<File, 'name' | 'size' | 'type'>,
    metadata: CompletePhotoUploadMetadata,
    existingPhotos: PhotoUploadTicket[],
  ) => PhotoQualityAssessment;
  qualityMessage: (assessment: PhotoQualityAssessment) => string;
  createTicket: (
    jobId: string,
    file: File,
    photoType: FieldPhotoType,
  ) => Promise<PhotoUploadTicket>;
  upload: (ticket: PhotoUploadTicket, file: File) => Promise<void>;
  complete: (
    jobId: string,
    photoId: string,
    metadata: CompletePhotoUploadMetadata,
  ) => Promise<void>;
  createLocalTicket: (
    jobId: string,
    file: File,
    photoType: FieldPhotoType,
    metadata: CompletePhotoUploadMetadata,
  ) => PhotoUploadTicket;
}

const fieldPhotoUploadDependencies: FieldPhotoUploadCommandDependencies = {
  readMetadata: readPhotoUploadMetadata,
  assessQuality: assessPhotoQuality,
  qualityMessage: photoQualityMessage,
  createTicket: createPhotoUploadTicket,
  upload: uploadPhotoToTicket,
  complete: completePhotoUpload,
  createLocalTicket: createLocalPhotoTicket,
};

interface FieldMutationCommandOptions {
  persist: () => Promise<PersistedMutationResult>;
  queue?: () => Promise<boolean>;
  persistedMessage: string;
  queuedMessage: string;
  storageUnavailableMessage: string;
  tenantUnresolvedMessage: string;
}

async function runFieldMutationCommand({
  persist,
  queue,
  persistedMessage,
  queuedMessage,
  storageUnavailableMessage,
  tenantUnresolvedMessage,
}: FieldMutationCommandOptions): Promise<FieldMutationCommandResult> {
  try {
    const result = await persist();
    if (result.persisted) {
      return { outcome: 'persisted', message: persistedMessage };
    }
  } catch {
    // Durable queueing below owns the unavailable API path.
  }

  if (!queue) {
    return { outcome: 'tenant_unresolved', message: tenantUnresolvedMessage };
  }
  if (await queue()) {
    return { outcome: 'queued', message: queuedMessage };
  }
  return {
    outcome: 'durable_storage_unavailable',
    message: storageUnavailableMessage,
  };
}

export function runJobLifecycleMutationCommand({
  jobId,
  action,
  persist,
  queue,
}: {
  jobId: string;
  action: 'start' | 'complete';
  persist: () => Promise<PersistedMutationResult>;
  queue?: () => Promise<boolean>;
}): Promise<FieldMutationCommandResult> {
  const verb = action === 'start' ? 'Started' : 'Completed';
  return runFieldMutationCommand({
    persist,
    queue,
    persistedMessage: `${verb} ${jobId}.`,
    queuedMessage: `${verb} ${jobId} locally; the change is queued offline.`,
    storageUnavailableMessage:
      `${verb} ${jobId} locally, but durable offline storage is unavailable.`,
    tenantUnresolvedMessage:
      `${verb} ${jobId} locally without a resolved tenant; reconnect before continuing.`,
  });
}

export function runChecklistMutationCommand({
  persist,
  queue,
}: {
  persist: () => Promise<PersistedMutationResult>;
  queue?: () => Promise<boolean>;
}): Promise<FieldMutationCommandResult> {
  return runFieldMutationCommand({
    persist,
    queue,
    persistedMessage: 'Checklist updated.',
    queuedMessage: 'Checklist change saved locally and queued offline.',
    storageUnavailableMessage:
      'Checklist changed locally, but durable offline storage is unavailable.',
    tenantUnresolvedMessage:
      'Checklist changed locally without a resolved tenant; reconnect before continuing.',
  });
}

export async function runFieldPhotoUploadCommand({
  jobId,
  photoType,
  file,
  existingPhotos,
  queue,
  dependencies = fieldPhotoUploadDependencies,
}: {
  jobId: string;
  photoType: FieldPhotoType;
  file: File;
  existingPhotos: PhotoUploadTicket[];
  queue?: () => Promise<boolean>;
  dependencies?: FieldPhotoUploadCommandDependencies;
}): Promise<FieldPhotoUploadCommandResult> {
  const metadata = await dependencies.readMetadata(file);
  const quality = dependencies.assessQuality(file, metadata, existingPhotos);
  if (!quality.accepted) {
    return {
      outcome: 'rejected',
      message: `Photo not added: ${dependencies.qualityMessage(quality)}.`,
      ticket: null,
      activity: null,
    };
  }

  try {
    const createdTicket = await dependencies.createTicket(jobId, file, photoType);
    await dependencies.upload(createdTicket, file);
    await dependencies.complete(jobId, createdTicket.photoId, metadata);
    const ticket: PhotoUploadTicket = {
      ...createdTicket,
      status: 'uploaded',
      fileSizeBytes: metadata.fileSizeBytes,
      imageWidthPx: metadata.imageWidthPx,
      imageHeightPx: metadata.imageHeightPx,
      metadataSource: 'client_reported',
    };
    return {
      outcome: 'uploaded',
      message: `Uploaded ${photoType} photo evidence for ${file.name}.`,
      ticket,
      activity: {
        title: 'Photo evidence uploaded',
        message: `${photoType} photo evidence was uploaded for ${jobId}.`,
        tone: 'success',
        source: 'photo',
      },
    };
  } catch {
    const ticket = dependencies.createLocalTicket(jobId, file, photoType, metadata);
    const queued = queue ? await queue().catch(() => false) : false;
    return {
      outcome: queued ? 'queued' : 'local_only',
      message: queued
        ? `Saved ${photoType} photo in the durable offline queue.`
        : `Prepared ${photoType} photo locally, but it could not be queued for offline upload.`,
      ticket,
      activity: {
        title: queued ? 'Photo evidence queued offline' : 'Photo evidence saved locally',
        message: queued
          ? `${photoType} photo evidence for ${jobId} is queued durably until the API is reachable.`
          : `${photoType} photo evidence for ${jobId} is browser-local until the API is reachable.`,
        tone: 'warning',
        source: 'photo',
      },
    };
  }
}

export async function runFieldAddOnMutationCommand({
  jobId,
  addOnId,
  status,
  update = updateJobAddOnStatus,
  loadReport = fetchCompletionReport,
}: {
  jobId: string;
  addOnId: string;
  status: JobAddOn['status'];
  update?: (jobId: string, addOnId: string, status: JobAddOn['status']) => Promise<JobAddOn>;
  loadReport?: (jobId: string) => Promise<CompletionReportSnapshot>;
}): Promise<FieldAddOnMutationCommandResult> {
  let addOn: JobAddOn;
  try {
    addOn = await update(jobId, addOnId, status);
  } catch {
    return {
      outcome: 'update_failed',
      message: 'Could not update add-on work. Check the API connection and try again.',
      addOn: null,
      report: null,
    };
  }

  const updatedMessage = `${addOn.serviceName} marked ${status.replace('_', ' ')}.`;
  if (status !== 'completed') {
    return { outcome: 'updated', message: updatedMessage, addOn, report: null };
  }
  try {
    return {
      outcome: 'updated',
      message: updatedMessage,
      addOn,
      report: await loadReport(jobId),
    };
  } catch {
    return {
      outcome: 'updated_report_unavailable',
      message: `${updatedMessage} The completion report could not refresh; retry the report when the API is available.`,
      addOn,
      report: null,
    };
  }
}

export type FieldConflictKind = 'job' | 'checklist' | 'photo';

export function reviewedFieldConflictMessage(
  kind: FieldConflictKind,
  outcome: FieldConflictDiscardOutcome,
  jobAction?: 'start' | 'complete',
): string {
  if (outcome === 'remove_failed') {
    if (kind === 'job') {
      return 'The reviewed job conflict could not be removed from this phone. Try again.';
    }
    return `The reviewed ${kind} conflict could not be removed from this phone.`;
  }
  if (outcome === 'server_refresh_unavailable') {
    const subject = kind === 'job' && jobAction ? jobAction : kind;
    return `Discarded the reviewed ${subject} conflict; refresh when the API is available.`;
  }
  if (kind === 'job') {
    return `Discarded the reviewed ${jobAction ?? 'job'} conflict and restored server job state.`;
  }
  if (kind === 'checklist') {
    return 'Discarded the reviewed checklist conflict and restored server state.';
  }
  return 'Discarded the reviewed photo conflict and refreshed server photo counts.';
}
