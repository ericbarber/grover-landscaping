import {
  summarizeOfflineMutations,
  type ChecklistOfflineMutation,
  type JobLifecycleOfflineMutation,
  type OfflineMutationSummary,
  type PhotoUploadOfflineMutation,
} from '../../../domain/offlineMutationQueue';
import type {
  CompletePhotoUploadMetadata,
  JobDetail,
  PhotoUploadTicket,
} from '../../../api/client';
import type { YardCareJob } from '../../../domain/jobs';

export type FieldPhotoType = 'before' | 'after' | 'issue' | 'extra';

export interface FieldRecoveryState {
  jobs: OfflineMutationSummary;
  checklist: OfflineMutationSummary;
  photos: OfflineMutationSummary;
  pendingChangeCount: number;
}

export function fieldRecoveryState({
  jobMutations,
  checklistMutations,
  photoMutations,
}: {
  jobMutations: JobLifecycleOfflineMutation[];
  checklistMutations: ChecklistOfflineMutation[];
  photoMutations: PhotoUploadOfflineMutation[];
}): FieldRecoveryState {
  const jobs = summarizeOfflineMutations(jobMutations);
  const checklist = summarizeOfflineMutations(checklistMutations);
  const photos = summarizeOfflineMutations(photoMutations);

  return {
    jobs,
    checklist,
    photos,
    pendingChangeCount: jobs.total + checklist.total + photos.total,
  };
}

export function fieldQueueCanSync(
  summary: OfflineMutationSummary,
  online: boolean,
  replaying: boolean,
): boolean {
  return online && !replaying && summary.conflicts === 0;
}

export function fallbackJobDetail(job: YardCareJob): JobDetail {
  return {
    ...job,
    checklist: [
      { id: 'before-photos', label: 'Capture before photos', completed: job.beforePhotos > 0 },
      { id: 'yard-service', label: 'Complete yard service', completed: job.status !== 'scheduled' },
      { id: 'after-photos', label: 'Capture after photos', completed: job.afterPhotos > 0 },
      { id: 'completion-notes', label: 'Submit completion notes', completed: job.status === 'completed' },
    ],
  };
}

export function createLocalPhotoTicket(
  jobId: string,
  file: Pick<File, 'name' | 'type'>,
  photoType: FieldPhotoType,
  metadata: CompletePhotoUploadMetadata,
  options: {
    now?: number;
    createObjectUrl?: (file: Pick<File, 'name' | 'type'>) => string;
  } = {},
): PhotoUploadTicket {
  return {
    status: 'created',
    jobId,
    photoId: `local_${jobId}_${photoType}_${options.now ?? Date.now()}`,
    photoType,
    fileName: file.name,
    contentType: file.type || 'application/octet-stream',
    uploadMode: 'browser-local-placeholder',
    uploadUrl: `local://${file.name}`,
    objectKey: `browser/jobs/${jobId}/${photoType}/${file.name}`,
    thumbnailUrl: (options.createObjectUrl
      ?? ((source) => URL.createObjectURL(source as File)))(file),
    fileSizeBytes: metadata.fileSizeBytes,
    imageWidthPx: metadata.imageWidthPx,
    imageHeightPx: metadata.imageHeightPx,
    metadataSource: 'client_reported',
  };
}

export function mergePhotoEvidence(
  current: PhotoUploadTicket[],
  jobId: string,
  persistedEvidence: PhotoUploadTicket[],
): PhotoUploadTicket[] {
  const persistedIds = new Set(persistedEvidence.map((photo) => photo.photoId));
  const currentJobLocalEvidence = current.filter(
    (photo) => photo.jobId === jobId && !persistedIds.has(photo.photoId),
  );
  const otherJobEvidence = current.filter((photo) => photo.jobId !== jobId);

  return [...persistedEvidence, ...currentJobLocalEvidence, ...otherJobEvidence];
}
