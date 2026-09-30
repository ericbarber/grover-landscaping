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
  fetchJobs,
  readPhotoUploadMetadata,
  startJob,
  updateChecklistItem,
  uploadPhotoToTicket,
  type PhotoUploadTicket,
} from '../../../api/client';
import type { YardCareJob } from '../../../domain/jobs';
import {
  getOfflinePhotoBlob,
  isChecklistOfflineMutation,
  isOfflineMutationConflict,
  isJobLifecycleOfflineMutation,
  isPhotoUploadOfflineMutation,
  listOfflineMutationsForActor,
  markOfflineMutationFailed,
  removeOfflineMutation,
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
  setJobMutations: Dispatch<SetStateAction<JobLifecycleOfflineMutation[]>>;
  setChecklistMutations: Dispatch<SetStateAction<ChecklistOfflineMutation[]>>;
  setPhotoMutations: Dispatch<SetStateAction<PhotoUploadOfflineMutation[]>>;
  isReplayingJobs: boolean;
  isReplayingChecklist: boolean;
  isReplayingPhotos: boolean;
  replayJobs: () => Promise<void>;
  replayChecklist: () => Promise<void>;
  replayPhotos: () => Promise<void>;
}

export function useFieldOfflineRecovery(
  actorId: string | null | undefined,
  setJobs: Dispatch<SetStateAction<YardCareJob[]>>,
  setUploadTickets: Dispatch<SetStateAction<PhotoUploadTicket[]>>,
): FieldOfflineRecovery {
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
    setJobMutations,
    setChecklistMutations,
    setPhotoMutations,
    isReplayingJobs,
    isReplayingChecklist,
    isReplayingPhotos,
    replayJobs,
    replayChecklist,
    replayPhotos,
  };
}
