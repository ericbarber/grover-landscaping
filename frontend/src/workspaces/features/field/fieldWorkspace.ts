import {
  summarizeOfflineMutations,
  type ChecklistOfflineMutation,
  type JobLifecycleOfflineMutation,
  type OfflineMutationSummary,
  type PhotoUploadOfflineMutation,
} from '../../../domain/offlineMutationQueue';

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
