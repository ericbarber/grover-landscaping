import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import {
  completeJob,
  completePhotoUpload,
  createPhotoUploadTicket,
  fetchJobDetail,
  fetchJobs,
  readPhotoUploadMetadata,
  startJob,
  updateChecklistItem,
  uploadPhotoToTicket,
  type JobDetail,
  type PhotoUploadTicket,
} from '../../../api/client';
import type { YardCareJob } from '../../../domain/jobs';
import {
  getOfflinePhotoBlob,
  enqueueChecklistMutation,
  enqueueJobLifecycleMutation,
  enqueuePhotoUploadMutation,
  isChecklistOfflineMutation,
  isOfflineMutationConflict,
  isJobLifecycleOfflineMutation,
  isPhotoUploadOfflineMutation,
  listOfflineMutationsForActor,
  markOfflineMutationFailed,
  removeOfflineMutation,
  requestPersistentOfflineStorage,
  type ChecklistOfflineMutation,
  type JobLifecycleOfflineMutation,
  type OfflineMutation,
  type PhotoUploadOfflineMutation,
} from '../../../domain/offlineMutationQueue';
import {
  MissingOfflinePhotoBlobError,
  replayOfflinePhotoMutation,
} from '../../../domain/offlinePhotoReplay';

export interface FieldOfflineQueues {
  jobMutations: JobLifecycleOfflineMutation[];
  checklistMutations: ChecklistOfflineMutation[];
  photoMutations: PhotoUploadOfflineMutation[];
}

export function partitionFieldOfflineMutations(mutations: OfflineMutation[]): FieldOfflineQueues {
  return {
    jobMutations: mutations.filter(isJobLifecycleOfflineMutation),
    checklistMutations: mutations.filter(isChecklistOfflineMutation),
    photoMutations: mutations.filter(isPhotoUploadOfflineMutation),
  };
}

export interface FieldOfflineRecovery extends FieldOfflineQueues {
  isReplayingJobs: boolean;
  isReplayingChecklist: boolean;
  isReplayingPhotos: boolean;
  replayJobs: () => Promise<void>;
  replayChecklist: () => Promise<void>;
  replayPhotos: () => Promise<void>;
  queueJobLifecycle: (
    organizationId: string | null | undefined,
    jobId: string,
    action: JobLifecycleOfflineMutation['action'],
  ) => Promise<boolean>;
  queueChecklist: (
    organizationId: string | null | undefined,
    jobId: string,
    checklistItemId: string,
    completed: boolean,
  ) => Promise<boolean>;
  queuePhoto: (
    organizationId: string | null | undefined,
    jobId: string,
    photoType: PhotoUploadOfflineMutation['photoType'],
    file: File,
  ) => Promise<boolean>;
  discardJobConflict: (mutation: JobLifecycleOfflineMutation) => Promise<FieldConflictDiscardOutcome>;
  discardChecklistConflict: (mutation: ChecklistOfflineMutation) => Promise<FieldConflictDiscardOutcome>;
  discardPhotoConflict: (mutation: PhotoUploadOfflineMutation) => Promise<FieldConflictDiscardOutcome>;
}

export type FieldConflictDiscardOutcome =
  | 'remove_failed'
  | 'restored_server_state'
  | 'server_refresh_unavailable';

export interface FieldConflictDiscardResult<T> {
  outcome: FieldConflictDiscardOutcome;
  serverState: T | null;
}

export async function enqueueFieldOfflineMutation<T>(
  enqueue: () => Promise<T>,
  requestStorage: () => Promise<unknown> = requestPersistentOfflineStorage,
): Promise<T | null> {
  try {
    const mutation = await enqueue();
    void Promise.resolve().then(requestStorage).catch(() => undefined);
    return mutation;
  } catch {
    return null;
  }
}

export async function discardFieldOfflineConflict<T>(
  mutationId: string,
  refreshServerState: () => Promise<T>,
  remove: (id: string) => Promise<void> = removeOfflineMutation,
): Promise<FieldConflictDiscardResult<T>> {
  try {
    await remove(mutationId);
  } catch {
    return { outcome: 'remove_failed', serverState: null };
  }
  try {
    return {
      outcome: 'restored_server_state',
      serverState: await refreshServerState(),
    };
  } catch {
    return { outcome: 'server_refresh_unavailable', serverState: null };
  }
}

interface FieldOfflineRecoveryOptions {
  actorId: string | null | undefined;
  selectedJobId: string | null;
  setJobs: Dispatch<SetStateAction<YardCareJob[]>>;
  setSelectedJob: Dispatch<SetStateAction<JobDetail | null>>;
  setUploadTickets: Dispatch<SetStateAction<PhotoUploadTicket[]>>;
}

export function useFieldOfflineRecovery({
  actorId,
  selectedJobId,
  setJobs,
  setSelectedJob,
  setUploadTickets,
}: FieldOfflineRecoveryOptions): FieldOfflineRecovery {
  const [jobMutations, setJobMutations] = useState<JobLifecycleOfflineMutation[]>([]);
  const [checklistMutations, setChecklistMutations] = useState<ChecklistOfflineMutation[]>([]);
  const [photoMutations, setPhotoMutations] = useState<PhotoUploadOfflineMutation[]>([]);
  const [isReplayingJobs, setIsReplayingJobs] = useState(false);
  const [isReplayingChecklist, setIsReplayingChecklist] = useState(false);
  const [isReplayingPhotos, setIsReplayingPhotos] = useState(false);
  const jobReplayInProgress = useRef(false);
  const checklistReplayInProgress = useRef(false);
  const photoReplayInProgress = useRef(false);

  const replayJobs = useCallback(async () => {
    if (!actorId || !navigator.onLine || jobReplayInProgress.current) return;
    jobReplayInProgress.current = true;
    setIsReplayingJobs(true);
    try {
      const mutations = partitionFieldOfflineMutations(
        await listOfflineMutationsForActor(actorId),
      ).jobMutations;
      for (const mutation of mutations) {
        if (mutation.syncState === 'conflict') break;
        try {
          const result = mutation.action === 'start'
            ? await startJob(mutation.jobId, mutation.id)
            : await completeJob(mutation.jobId, mutation.id);
          if (!result.persisted) {
            await markOfflineMutationFailed(mutation, 'API used local fallback');
            break;
          }
          await removeOfflineMutation(mutation.id);
        } catch (error) {
          await markOfflineMutationFailed(
            mutation,
            error instanceof Error ? error.message : 'Job lifecycle sync failed',
            isOfflineMutationConflict(error) ? 'conflict' : 'failed',
          );
          break;
        }
      }
      setJobMutations(partitionFieldOfflineMutations(
        await listOfflineMutationsForActor(actorId),
      ).jobMutations);
    } catch {
      // Keep the last durable queue snapshot visible.
    } finally {
      jobReplayInProgress.current = false;
      setIsReplayingJobs(false);
    }
  }, [actorId]);

  const replayChecklist = useCallback(async () => {
    if (!actorId || !navigator.onLine || checklistReplayInProgress.current) return;
    checklistReplayInProgress.current = true;
    setIsReplayingChecklist(true);
    try {
      const mutations = partitionFieldOfflineMutations(
        await listOfflineMutationsForActor(actorId),
      ).checklistMutations;
      for (const mutation of mutations) {
        if (mutation.syncState === 'conflict') break;
        try {
          const result = await updateChecklistItem(
            mutation.jobId,
            mutation.checklistItemId,
            mutation.completed,
            mutation.id,
          );
          if (!result.persisted) {
            await markOfflineMutationFailed(mutation, 'API used local fallback');
            break;
          }
          await removeOfflineMutation(mutation.id);
        } catch (error) {
          await markOfflineMutationFailed(
            mutation,
            error instanceof Error ? error.message : 'Checklist sync failed',
            isOfflineMutationConflict(error) ? 'conflict' : 'failed',
          );
          break;
        }
      }
      setChecklistMutations(partitionFieldOfflineMutations(
        await listOfflineMutationsForActor(actorId),
      ).checklistMutations);
    } catch {
      // Keep the last durable queue snapshot visible.
    } finally {
      checklistReplayInProgress.current = false;
      setIsReplayingChecklist(false);
    }
  }, [actorId]);

  const replayPhotos = useCallback(async () => {
    if (!actorId || !navigator.onLine || photoReplayInProgress.current) return;
    photoReplayInProgress.current = true;
    setIsReplayingPhotos(true);
    let replayedAny = false;
    try {
      const mutations = partitionFieldOfflineMutations(
        await listOfflineMutationsForActor(actorId),
      ).photoMutations;
      for (const mutation of mutations) {
        if (mutation.syncState === 'conflict') break;
        try {
          const ticket = await replayOfflinePhotoMutation(mutation, {
            getBlob: getOfflinePhotoBlob,
            createTicket: createPhotoUploadTicket,
            upload: uploadPhotoToTicket,
            readMetadata: readPhotoUploadMetadata,
            complete: completePhotoUpload,
            remove: removeOfflineMutation,
          });
          setUploadTickets((current) => [
            ticket,
            ...current.filter((item) => item.photoId !== ticket.photoId),
          ]);
          replayedAny = true;
        } catch (error) {
          await markOfflineMutationFailed(
            mutation,
            error instanceof Error ? error.message : 'Photo replay failed',
            error instanceof MissingOfflinePhotoBlobError || isOfflineMutationConflict(error)
              ? 'conflict'
              : 'failed',
          );
          break;
        }
      }
      setPhotoMutations(partitionFieldOfflineMutations(
        await listOfflineMutationsForActor(actorId),
      ).photoMutations);
      if (replayedAny) setJobs(await fetchJobs());
    } catch {
      // Keep the last durable queue snapshot visible.
    } finally {
      photoReplayInProgress.current = false;
      setIsReplayingPhotos(false);
    }
  }, [actorId, setJobs, setUploadTickets]);

  const queueJobLifecycle = useCallback(async (
    organizationId: string | null | undefined,
    jobId: string,
    action: JobLifecycleOfflineMutation['action'],
  ) => {
    if (!actorId || !organizationId) return false;
    const mutation = await enqueueFieldOfflineMutation(
      () => enqueueJobLifecycleMutation({
        organizationId,
        actorId,
        jobId,
        action,
      }),
    );
    if (!mutation) return false;
    setJobMutations((current) => [...current, mutation].sort(
      (left, right) => left.createdAt.localeCompare(right.createdAt),
    ));
    return true;
  }, [actorId]);

  const queueChecklist = useCallback(async (
    organizationId: string | null | undefined,
    jobId: string,
    checklistItemId: string,
    completed: boolean,
  ) => {
    if (!actorId || !organizationId) return false;
    const mutation = await enqueueFieldOfflineMutation(
      () => enqueueChecklistMutation({
        organizationId,
        actorId,
        jobId,
        checklistItemId,
        completed,
      }),
    );
    if (!mutation) return false;
    setChecklistMutations((current) => [...current, mutation].sort(
      (left, right) => left.createdAt.localeCompare(right.createdAt),
    ));
    return true;
  }, [actorId]);

  const queuePhoto = useCallback(async (
    organizationId: string | null | undefined,
    jobId: string,
    photoType: PhotoUploadOfflineMutation['photoType'],
    file: File,
  ) => {
    if (!actorId || !organizationId) return false;
    const mutation = await enqueueFieldOfflineMutation(
      () => enqueuePhotoUploadMutation({
        organizationId,
        actorId,
        jobId,
        photoType,
        fileName: file.name,
      }, file),
    );
    if (!mutation) return false;
    setPhotoMutations((current) => [...current, mutation].sort(
      (left, right) => left.createdAt.localeCompare(right.createdAt),
    ));
    return true;
  }, [actorId]);

  const discardJobConflict = useCallback(async (
    mutation: JobLifecycleOfflineMutation,
  ): Promise<FieldConflictDiscardOutcome> => {
    const result = await discardFieldOfflineConflict(
      mutation.id,
      () => fetchJobDetail(mutation.jobId),
    );
    if (result.outcome === 'remove_failed') return result.outcome;
    setJobMutations((current) => current.filter((item) => item.id !== mutation.id));
    if (result.serverState) {
      const serverJob = result.serverState;
      setJobs((current) => current.map((job) => job.id === serverJob.id ? serverJob : job));
      if (selectedJobId === serverJob.id) setSelectedJob(serverJob);
    }
    await replayJobs();
    return result.outcome;
  }, [replayJobs, selectedJobId, setJobs, setSelectedJob]);

  const discardChecklistConflict = useCallback(async (
    mutation: ChecklistOfflineMutation,
  ): Promise<FieldConflictDiscardOutcome> => {
    const result = await discardFieldOfflineConflict(
      mutation.id,
      () => fetchJobDetail(mutation.jobId),
    );
    if (result.outcome === 'remove_failed') return result.outcome;
    setChecklistMutations((current) => current.filter((item) => item.id !== mutation.id));
    if (result.serverState) {
      const serverJob = result.serverState;
      setJobs((current) => current.map((job) => job.id === serverJob.id ? serverJob : job));
      if (selectedJobId === serverJob.id) setSelectedJob(serverJob);
    }
    await replayChecklist();
    return result.outcome;
  }, [replayChecklist, selectedJobId, setJobs, setSelectedJob]);

  const discardPhotoConflict = useCallback(async (
    mutation: PhotoUploadOfflineMutation,
  ): Promise<FieldConflictDiscardOutcome> => {
    const result = await discardFieldOfflineConflict(mutation.id, fetchJobs);
    if (result.outcome === 'remove_failed') return result.outcome;
    setPhotoMutations((current) => current.filter((item) => item.id !== mutation.id));
    if (result.serverState) setJobs(result.serverState);
    await replayPhotos();
    return result.outcome;
  }, [replayPhotos, setJobs]);

  useEffect(() => {
    if (!actorId) {
      setJobMutations([]);
      setChecklistMutations([]);
      setPhotoMutations([]);
      return;
    }

    setJobMutations([]);
    setChecklistMutations([]);
    setPhotoMutations([]);
    let active = true;
    void listOfflineMutationsForActor(actorId)
      .then((mutations) => {
        if (!active) return;
        const queues = partitionFieldOfflineMutations(mutations);
        setJobMutations(queues.jobMutations);
        setChecklistMutations(queues.checklistMutations);
        setPhotoMutations(queues.photoMutations);
        if (queues.jobMutations.length > 0 && navigator.onLine) void replayJobs();
        if (queues.checklistMutations.length > 0 && navigator.onLine) void replayChecklist();
        if (queues.photoMutations.length > 0 && navigator.onLine) void replayPhotos();
      })
      .catch(() => {
        if (!active) return;
        setJobMutations([]);
        setChecklistMutations([]);
        setPhotoMutations([]);
      });

    const handleOnline = () => {
      void replayJobs();
      void replayChecklist();
      void replayPhotos();
    };
    window.addEventListener('online', handleOnline);
    return () => {
      active = false;
      window.removeEventListener('online', handleOnline);
    };
  }, [actorId, replayChecklist, replayJobs, replayPhotos]);

  return {
    jobMutations,
    checklistMutations,
    photoMutations,
    isReplayingJobs,
    isReplayingChecklist,
    isReplayingPhotos,
    replayJobs,
    replayChecklist,
    replayPhotos,
    queueJobLifecycle,
    queueChecklist,
    queuePhoto,
    discardJobConflict,
    discardChecklistConflict,
    discardPhotoConflict,
  };
}
