import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createDayPlanAmendment,
  fetchDayPlanAmendments,
} from '../api/dayPlanAmendmentsClient';
import { DayPlanRequestError, fetchCrewDayPlan } from '../api/dayPlansClient';
import { updateStopProgress } from '../api/stopProgressClient';
import { emptyCrewDayPlan, getTotalEstimatedMinutes, seedDayPlan, type DayPlan } from '../domain/dayPlans';
import { isJobSelectionButtonText } from '../domain/jobSelection';
import {
  enqueueDayPlanAmendmentMutation,
  enqueueStopProgressMutation,
  isDayPlanAmendmentOfflineMutation,
  isOfflineMutationConflict,
  isStopProgressOfflineMutation,
  listOfflineMutationsForActor,
  markOfflineMutationFailed,
  removeOfflineMutation,
  requestPersistentOfflineStorage,
  summarizeOfflineMutations,
  withOfflineMutationFailure,
  type OfflineStoragePersistence,
  type DayPlanAmendmentOfflineMutation,
  type StopProgressOfflineMutation,
} from '../domain/offlineMutationQueue';
import {
  amendmentRequiresBid,
  countResolvedFinishedStops,
  dayPlanAmendmentTypeLabel,
  getNextStopStatus,
  resetStopStates,
  resolveStopStatus,
  stopActionLabel,
  syncStatusFromPersistence,
  syncStatusLabel,
  type DayPlanAmendmentRequest,
  type DayPlanAmendmentType,
  type RouteProgressSyncStatus,
  type ServiceCatalogItem,
  type StopProgressStatus,
  type StopStateMap,
} from '../domain/stopProgress';

type DayPlanPanelProps = {
  actorId?: string | null;
  onSelectJob?: (jobId: string) => void;
  refreshSignal?: number;
};

const crewExtraServiceCatalog: ServiceCatalogItem[] = [
  {
    id: 'service_sprinkler_repair',
    name: 'Sprinkler repair',
    description: 'Crew noticed sprinkler work that needs manager pricing review.',
    defaultDurationMinutes: 45,
    defaultPriceCents: 12500,
    requiresManagerApproval: true,
  },
  {
    id: 'service_tree_limb_removal',
    name: 'Tree limb removal',
    description: 'Crew noticed tree limb cleanup outside the standard service.',
    defaultDurationMinutes: 60,
    defaultPriceCents: 17500,
    requiresManagerApproval: true,
  },
  {
    id: 'service_gate_latch_adjustment',
    name: 'Gate latch adjustment',
    description: 'Small non-billable access correction for the current stop.',
    defaultDurationMinutes: 15,
    requiresManagerApproval: false,
  },
];

function storageKey(dayPlanId: string): string {
  return `grover.dayPlan.${dayPlanId}.stopStates`;
}

function loadStopStates(dayPlanId: string): StopStateMap {
  try {
    const rawValue = window.localStorage.getItem(storageKey(dayPlanId));
    return rawValue ? (JSON.parse(rawValue) as StopStateMap) : {};
  } catch {
    return {};
  }
}

function saveStopStates(dayPlanId: string, stopStates: StopStateMap): boolean {
  try {
    window.localStorage.setItem(storageKey(dayPlanId), JSON.stringify(stopStates));
    return true;
  } catch {
    return false;
  }
}

function clearStopStates(dayPlanId: string) {
  try {
    window.localStorage.removeItem(storageKey(dayPlanId));
  } catch {
    // In-memory route state still resets when browser storage is unavailable.
  }
}

function servicePriceLabel(service: ServiceCatalogItem): string {
  if (!service.defaultPriceCents) {
    return 'No default charge';
  }

  return `$${(service.defaultPriceCents / 100).toFixed(2)}`;
}

export function DayPlanPanel({
  actorId,
  onSelectJob,
  refreshSignal = 0,
}: DayPlanPanelProps) {
  const [dayPlan, setDayPlan] = useState<DayPlan>(seedDayPlan);
  const [source, setSource] = useState<'api' | 'local' | 'missing' | 'unavailable'>('local');
  const [syncStatus, setSyncStatus] = useState<RouteProgressSyncStatus>('local');
  const [stopStates, setStopStates] = useState<StopStateMap>(() => loadStopStates(seedDayPlan.id));
  const [amendmentRequests, setAmendmentRequests] = useState<DayPlanAmendmentRequest[]>([]);
  const [selectedExtraServices, setSelectedExtraServices] = useState<Record<string, string>>({});
  const [offlineMutations, setOfflineMutations] = useState<StopProgressOfflineMutation[]>([]);
  const [offlineAmendmentMutations, setOfflineAmendmentMutations] = useState<
    DayPlanAmendmentOfflineMutation[]
  >([]);
  const [isReplayingMutations, setIsReplayingMutations] = useState(false);
  const [isReplayingAmendments, setIsReplayingAmendments] = useState(false);
  const [discardCandidateId, setDiscardCandidateId] = useState<string | null>(null);
  const [amendmentConflictDiscardId, setAmendmentConflictDiscardId] = useState<string | null>(null);
  const [conflictResolutionError, setConflictResolutionError] = useState(false);
  const [queueStorageUnavailable, setQueueStorageUnavailable] = useState(false);
  const [storagePersistence, setStoragePersistence] = useState<OfflineStoragePersistence | null>(null);
  const [showAllStops, setShowAllStops] = useState(false);
  const replayInProgress = useRef(false);
  const amendmentReplayInProgress = useRef(false);
  const offlineSummary = summarizeOfflineMutations(offlineMutations);
  const pendingMutationCount = offlineSummary.total;
  const conflictMutationCount = offlineSummary.conflicts;
  const totalMinutes = getTotalEstimatedMinutes(dayPlan);
  const completedStops = countResolvedFinishedStops(dayPlan.stops, stopStates);
  const nextStopIndex = dayPlan.stops.findIndex(
    (stop) => resolveStopStatus(stopStates[stop.id], stop.stopStatus) !== 'finished',
  );
  const focusedStopStart = nextStopIndex >= 0
    ? nextStopIndex
    : Math.max(0, dayPlan.stops.length - 2);
  const visibleStops = showAllStops
    ? dayPlan.stops
    : dayPlan.stops.slice(focusedStopStart, focusedStopStart + 2);

  function clickMatchingJobCard(customerName: string) {
    const buttons = Array.from(document.querySelectorAll('article button'));
    const button = buttons.find((candidate) => {
      const article = candidate.closest('article');
      const buttonText = candidate.textContent ?? '';

      return article?.textContent?.includes(customerName) && isJobSelectionButtonText(buttonText);
    });

    button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }

  function handleStopClick(jobId: string, customerName: string) {
    if (onSelectJob) {
      onSelectJob(jobId);
      return;
    }

    window.location.hash = `job-${jobId}`;
    clickMatchingJobCard(customerName);
  }

  function submitAmendmentRequest(
    amendmentType: DayPlanAmendmentType,
    note: string,
    stopId?: string,
    service?: ServiceCatalogItem,
  ) {
    const request: DayPlanAmendmentRequest = {
      id: `local_amendment_${dayPlan.id}_${amendmentType}_${Date.now()}`,
      dayPlanId: dayPlan.id,
      amendmentType,
      status: 'submitted',
      requestedByCrewId: dayPlan.crewId,
      stopId,
      service,
      note,
      requiresBid: amendmentType === 'add_service' && Boolean(service?.requiresManagerApproval),
      persisted: false,
    };

    setAmendmentRequests((current) => [request, ...current].slice(0, 5));

    void createDayPlanAmendment(dayPlan.id, {
      amendmentType,
      requestedByCrewId: dayPlan.crewId,
      stopId,
      service,
      note,
    })
      .then((created) => {
        setAmendmentRequests((current) =>
          [created, ...current.filter((item) => item.id !== request.id)].slice(0, 5),
        );
      })
      .catch(async (error: unknown) => {
        setAmendmentRequests((current) =>
          current.map((item) => (item.id === request.id ? { ...item, persisted: false } : item)),
        );
        if (!dayPlan.organizationId || !actorId) return;
        try {
          const mutation = await enqueueDayPlanAmendmentMutation({
            organizationId: dayPlan.organizationId,
            actorId,
            dayPlanId: dayPlan.id,
            amendmentType,
            requestedByCrewId: dayPlan.crewId,
            stopId,
            service,
            note,
          });
          const queuedMutation = isOfflineMutationConflict(error)
            ? withOfflineMutationFailure(
                mutation,
                error instanceof Error ? error.message : 'Persisted route request conflict',
                'conflict',
              )
            : mutation;
          if (queuedMutation.syncState === 'conflict') {
            await markOfflineMutationFailed(
              mutation,
              queuedMutation.lastError ?? 'Persisted route request conflict',
              'conflict',
            );
          }
          setOfflineAmendmentMutations((current) => [...current, queuedMutation].sort(
            (left, right) => left.createdAt.localeCompare(right.createdAt),
          ));
          setQueueStorageUnavailable(false);
          setStoragePersistence(await requestPersistentOfflineStorage());
        } catch {
          setQueueStorageUnavailable(true);
        }
      });
  }

  async function queueStopState(
    stopId: string,
    status: StopProgressStatus,
    failure?: unknown,
  ) {
    if (!dayPlan.organizationId || !actorId) {
      setSyncStatus('local');
      return;
    }
    try {
      const mutation = await enqueueStopProgressMutation({
        organizationId: dayPlan.organizationId,
        actorId,
        dayPlanId: dayPlan.id,
        stopId,
        status,
      });
      const queuedMutation = failure && isOfflineMutationConflict(failure)
        ? withOfflineMutationFailure(
            mutation,
            failure instanceof Error ? failure.message : 'Persisted route progress conflict',
            'conflict',
          )
        : mutation;
      if (queuedMutation.syncState === 'conflict') {
        await markOfflineMutationFailed(
          mutation,
          queuedMutation.lastError ?? 'Persisted route progress conflict',
          'conflict',
        );
      }
      setOfflineMutations((current) => [...current, queuedMutation].sort(
        (left, right) => left.createdAt.localeCompare(right.createdAt),
      ));
      setQueueStorageUnavailable(false);
      setStoragePersistence(await requestPersistentOfflineStorage());
    } catch {
      // Browser-local progress remains available when durable storage is blocked.
      setQueueStorageUnavailable(true);
    } finally {
      setSyncStatus('local');
    }
  }

  function persistStopState(stopId: string, next: StopStateMap) {
    saveStopStates(dayPlan.id, next);
    if (pendingMutationCount > 0) {
      void queueStopState(stopId, next[stopId]);
      return;
    }
    setSyncStatus('syncing');

    void updateStopProgress(dayPlan.id, stopId, next[stopId])
      .then((progress) => {
        if (progress.persisted) {
          setSyncStatus(syncStatusFromPersistence(true));
        } else {
          void queueStopState(stopId, next[stopId]);
        }
      })
      .catch((error: unknown) => {
        saveStopStates(dayPlan.id, next);
        void queueStopState(stopId, next[stopId], error);
      });
  }

  function advanceStop(stopId: string) {
    setStopStates((current) => {
      const nextState = getNextStopStatus(current[stopId]);
      const next = { ...current, [stopId]: nextState };
      persistStopState(stopId, next);
      return next;
    });
  }

  function resetRouteProgress() {
    clearStopStates(dayPlan.id);
    setStopStates(resetStopStates());
    if (pendingMutationCount > 0) {
      dayPlan.stops.forEach((stop) => void queueStopState(stop.id, 'pending'));
      return;
    }
    setSyncStatus('syncing');

    void Promise.allSettled(
      dayPlan.stops.map((stop) => updateStopProgress(dayPlan.id, stop.id, 'pending')),
    )
      .then((progress) => {
        const allPersisted = progress.every(
          (item) => item.status === 'fulfilled' && item.value.persisted,
        );
        if (allPersisted) {
          setSyncStatus(syncStatusFromPersistence(true));
        } else {
          progress.forEach((item, index) => {
            if (item.status === 'rejected' || !item.value.persisted) {
              void queueStopState(dayPlan.stops[index].id, 'pending');
            }
          });
        }
      });
  }

  const replayOfflineMutations = useCallback(async () => {
    if (!actorId || !navigator.onLine || replayInProgress.current) return;
    replayInProgress.current = true;
    setIsReplayingMutations(true);
    try {
      const mutations = (await listOfflineMutationsForActor(actorId))
        .filter(isStopProgressOfflineMutation);
      for (const mutation of mutations) {
        if (mutation.syncState === 'conflict') break;
        try {
          const result = await updateStopProgress(
            mutation.dayPlanId,
            mutation.stopId,
            mutation.status,
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
            error instanceof Error ? error.message : 'Stop progress sync failed',
            isOfflineMutationConflict(error) ? 'conflict' : 'failed',
          );
          break;
        }
      }
      const remaining = (await listOfflineMutationsForActor(actorId))
        .filter(isStopProgressOfflineMutation);
      setQueueStorageUnavailable(false);
      setOfflineMutations(remaining);
      if (remaining.length === 0 && mutations.length > 0) setSyncStatus('synced');
    } catch {
      // Keep the visible count from the last successful IndexedDB read.
      setQueueStorageUnavailable(true);
    } finally {
      replayInProgress.current = false;
      setIsReplayingMutations(false);
    }
  }, [actorId]);

  const replayOfflineAmendments = useCallback(async () => {
    if (!actorId || !navigator.onLine || amendmentReplayInProgress.current) return;
    amendmentReplayInProgress.current = true;
    setIsReplayingAmendments(true);
    try {
      const mutations = (await listOfflineMutationsForActor(actorId))
        .filter(isDayPlanAmendmentOfflineMutation);
      for (const mutation of mutations) {
        if (mutation.syncState === 'conflict') break;
        try {
          const created = await createDayPlanAmendment(
            mutation.dayPlanId,
            {
              amendmentType: mutation.amendmentType,
              requestedByCrewId: mutation.requestedByCrewId,
              stopId: mutation.stopId,
              service: mutation.service,
              note: mutation.note,
            },
            mutation.id,
          );
          if (!created.persisted) {
            await markOfflineMutationFailed(mutation, 'API used local fallback');
            break;
          }
          await removeOfflineMutation(mutation.id);
          setAmendmentRequests((current) => [
            created,
            ...current.filter((item) =>
              item.id !== created.id
              && !(
                item.id.startsWith('local_amendment_')
                && item.amendmentType === mutation.amendmentType
                && item.stopId === mutation.stopId
                && item.note === mutation.note
              )
            ),
          ].slice(0, 5));
        } catch (error) {
          await markOfflineMutationFailed(
            mutation,
            error instanceof Error ? error.message : 'Route request sync failed',
            isOfflineMutationConflict(error) ? 'conflict' : 'failed',
          );
          break;
        }
      }
      const remaining = (await listOfflineMutationsForActor(actorId))
        .filter(isDayPlanAmendmentOfflineMutation);
      setQueueStorageUnavailable(false);
      setOfflineAmendmentMutations(remaining);
    } catch {
      setQueueStorageUnavailable(true);
    } finally {
      amendmentReplayInProgress.current = false;
      setIsReplayingAmendments(false);
    }
  }, [actorId]);

  async function discardReviewedConflict(mutation: StopProgressOfflineMutation) {
    try {
      await removeOfflineMutation(mutation.id);
    } catch {
      setConflictResolutionError(true);
      setQueueStorageUnavailable(true);
      return;
    }
    setConflictResolutionError(false);
    const remaining = offlineMutations.filter((item) => item.id !== mutation.id);
    setOfflineMutations(remaining);
    setDiscardCandidateId(null);
    setStopStates((current) => {
      const next = { ...current };
      const latestForStop = [...remaining]
        .reverse()
        .find((item) => item.stopId === mutation.stopId);
      if (latestForStop) {
        next[mutation.stopId] = latestForStop.status;
      } else {
        delete next[mutation.stopId];
      }
      saveStopStates(dayPlan.id, next);
      return next;
    });
    if (navigator.onLine) await replayOfflineMutations();
  }

  async function discardReviewedAmendmentConflict(
    mutation: DayPlanAmendmentOfflineMutation,
  ) {
    try {
      await removeOfflineMutation(mutation.id);
    } catch {
      setQueueStorageUnavailable(true);
      return;
    }
    setAmendmentConflictDiscardId(null);
    setOfflineAmendmentMutations((current) =>
      current.filter((item) => item.id !== mutation.id)
    );
    setAmendmentRequests((current) => current.filter((item) =>
      !(
        item.id.startsWith('local_amendment_')
        && item.amendmentType === mutation.amendmentType
        && item.stopId === mutation.stopId
        && item.note === mutation.note
      )
    ));
    if (navigator.onLine) await replayOfflineAmendments();
  }

  useEffect(() => {
    let isMounted = true;

    fetchCrewDayPlan(seedDayPlan.crewId)
      .then((apiDayPlan) => {
        if (isMounted) {
          setDayPlan(apiDayPlan);
          setStopStates(loadStopStates(apiDayPlan.id));
          setSource('api');
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          if (error instanceof DayPlanRequestError) {
            setDayPlan(emptyCrewDayPlan(seedDayPlan.crewId));
            setStopStates({});
            setSource(error.status === 404 ? 'missing' : 'unavailable');
          } else {
            setDayPlan(seedDayPlan);
            setStopStates(loadStopStates(seedDayPlan.id));
            setSource('local');
          }
        }
      });

    return () => {
      isMounted = false;
    };
  }, [refreshSignal]);

  useEffect(() => {
    if (source === 'missing' || source === 'unavailable') return;
    let isMounted = true;

    fetchDayPlanAmendments(dayPlan.id)
      .then((amendments) => {
        if (isMounted && amendments.length > 0) {
          setAmendmentRequests(amendments.slice(0, 5));
        }
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, [dayPlan.id, source]);

  useEffect(() => {
    if (!actorId) {
      setOfflineMutations([]);
      setOfflineAmendmentMutations([]);
      return;
    }
    setOfflineMutations([]);
    setOfflineAmendmentMutations([]);
    let active = true;
    void listOfflineMutationsForActor(actorId)
      .then((mutations) => {
        if (!active) return;
        setQueueStorageUnavailable(false);
        const stopMutations = mutations.filter(isStopProgressOfflineMutation);
        setOfflineMutations(stopMutations);
        const amendmentMutations = mutations.filter(isDayPlanAmendmentOfflineMutation);
        setOfflineAmendmentMutations(amendmentMutations);
        if (stopMutations.length > 0 && navigator.onLine) void replayOfflineMutations();
        if (amendmentMutations.length > 0 && navigator.onLine) {
          void replayOfflineAmendments();
        }
      })
      .catch(() => {
        if (!active) return;
        setOfflineMutations([]);
        setOfflineAmendmentMutations([]);
        setQueueStorageUnavailable(true);
      });
    const handleOnline = () => {
      void replayOfflineMutations();
      void replayOfflineAmendments();
    };
    window.addEventListener('online', handleOnline);
    return () => {
      active = false;
      window.removeEventListener('online', handleOnline);
    };
  }, [
    actorId,
    replayOfflineAmendments,
    replayOfflineMutations,
  ]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col items-start justify-between gap-3 min-[380px]:flex-row">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Crew day plan</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950">{dayPlan.crewName}</h2>
          <p className="mt-1 text-sm text-slate-600">{dayPlan.serviceDate}</p>
          <p className="mt-1 text-xs text-slate-500">
            Source: {source === 'api'
              ? 'local API'
              : source === 'local'
                ? 'browser fallback'
                : 'persisted route status'}
          </p>
          <p className="mt-1 text-xs text-slate-500">Progress: {syncStatusLabel(syncStatus)}</p>
          {queueStorageUnavailable && (
            <p className="mt-2 rounded-lg bg-red-50 p-2 text-xs font-semibold text-red-900" role="alert">
              Durable offline storage is unavailable. Keep this app open and reconnect before continuing field work.
            </p>
          )}
          {!queueStorageUnavailable && storagePersistence === 'browser_managed' && (
            <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs font-semibold text-amber-900" role="status">
              Offline changes are saved, but this browser may remove them under storage pressure. Reconnect and sync soon.
            </p>
          )}
          {!queueStorageUnavailable && storagePersistence === 'unsupported' && (
            <p className="mt-2 rounded-lg bg-slate-100 p-2 text-xs font-semibold text-slate-700" role="status">
              Offline changes are saved with browser-managed retention. Keep Grover Field installed and open it regularly.
            </p>
          )}
          {pendingMutationCount > 0 && (
            <div className="mt-2 rounded-lg bg-amber-50 p-2 text-xs font-semibold text-amber-900" role="status">
              <p>
                {pendingMutationCount} offline {pendingMutationCount === 1 ? 'change' : 'changes'} waiting to sync
              </p>
              <p className="mt-1 font-medium">
                {offlineSummary.pending} pending · {offlineSummary.failed} retry failed · {offlineSummary.conflicts} conflicted
              </p>
              {offlineSummary.oldestCreatedAt && (
                <p className="mt-1 font-medium">
                  Oldest queued {new Date(offlineSummary.oldestCreatedAt).toLocaleString()}
                  {offlineSummary.maxAttempts > 0
                    ? ` · up to ${offlineSummary.maxAttempts} ${offlineSummary.maxAttempts === 1 ? 'attempt' : 'attempts'}`
                    : ''}
                </p>
              )}
              {conflictMutationCount > 0 && (
                <p className="mt-1 font-medium">
                  {conflictMutationCount} {conflictMutationCount === 1 ? 'change needs' : 'changes need'} manager review before retrying.
                </p>
              )}
              {conflictResolutionError && (
                <p className="mt-1 font-medium text-red-900">
                  The reviewed conflict could not be removed from this phone. Try again.
                </p>
              )}
              <details className="mt-2 rounded-lg border border-amber-300 bg-white p-2">
                <summary className="min-h-11 cursor-pointer py-3 font-bold">
                  Review queued changes
                </summary>
                <div className="space-y-2 border-t border-amber-200 pt-2">
                  {offlineMutations.map((mutation) => {
                    const stop = dayPlan.stops.find((item) => item.id === mutation.stopId);
                    return (
                      <article className="rounded-lg bg-amber-50 p-2 font-medium" key={mutation.id}>
                        <p className="font-bold text-slate-900">
                          {stop?.customerName ?? `Stop ${mutation.stopId}`}
                        </p>
                        <p className="mt-1 text-slate-700">
                          Set to {mutation.status.replace('_', ' ')} · {mutation.syncState}
                        </p>
                        <p className="mt-1 text-slate-600">
                          Queued {new Date(mutation.createdAt).toLocaleString()}
                          {mutation.attemptCount > 0
                            ? ` · ${mutation.attemptCount} ${mutation.attemptCount === 1 ? 'attempt' : 'attempts'}`
                            : ''}
                        </p>
                        {mutation.syncState === 'conflict' && (
                          discardCandidateId === mutation.id ? (
                            <div className="mt-2 rounded-lg border border-red-300 bg-white p-2">
                              <p className="text-red-900">
                                Confirm a manager reviewed this change. Discarding uses the server or next queued state.
                              </p>
                              <div className="mt-2 flex gap-2">
                                <button
                                  className="min-h-11 flex-1 rounded-lg bg-red-800 px-3 font-bold text-white"
                                  onClick={() => void discardReviewedConflict(mutation)}
                                  type="button"
                                >
                                  Discard conflict
                                </button>
                                <button
                                  className="min-h-11 flex-1 rounded-lg border border-slate-300 bg-white px-3 font-bold"
                                  onClick={() => setDiscardCandidateId(null)}
                                  type="button"
                                >
                                  Keep change
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              className="mt-2 min-h-11 rounded-lg border border-red-300 bg-white px-3 font-bold text-red-900"
                              onClick={() => {
                                setConflictResolutionError(false);
                                setDiscardCandidateId(mutation.id);
                              }}
                              type="button"
                            >
                              Resolve after manager review
                            </button>
                          )
                        )}
                      </article>
                    );
                  })}
                </div>
              </details>
              <button
                className="mt-2 min-h-11 rounded-lg border border-amber-400 bg-white px-3 font-bold disabled:opacity-60"
                disabled={!navigator.onLine || isReplayingMutations || conflictMutationCount > 0}
                onClick={() => void replayOfflineMutations()}
                type="button"
              >
                {isReplayingMutations
                  ? 'Syncing…'
                  : conflictMutationCount > 0
                    ? 'Manager review needed'
                    : 'Sync now'}
              </button>
            </div>
          )}
        </div>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800">
          {dayPlan.routeStatus}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 text-center sm:gap-3">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-2xl font-bold text-slate-950">{dayPlan.stops.length}</p>
          <p className="text-xs text-slate-500">Stops</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-2xl font-bold text-slate-950">{totalMinutes}</p>
          <p className="text-xs text-slate-500">Minutes</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-2xl font-bold text-slate-950">{completedStops}</p>
          <p className="text-xs text-slate-500">Finished</p>
        </div>
      </div>

      <details className="mt-4 rounded-xl border border-dashed border-emerald-300 bg-emerald-50 p-3">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-emerald-950 [&::-webkit-details-marker]:hidden">
          Route changes
          <span className="text-xs font-medium text-emerald-700">Add a stop</span>
        </summary>
        <div className="border-t border-emerald-200 pt-3">
          <p className="text-xs leading-5 text-emerald-800">
            Submit an amendment for manager review. Browser fallback remains available offline.
          </p>
          <button
            className="mt-3 w-full rounded-xl bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800 sm:w-auto"
            onClick={() =>
              submitAmendmentRequest(
                'add_stop',
                `${dayPlan.crewName} requested an unplanned stop for manager review.`,
              )
            }
            type="button"
          >
            Request unplanned stop
          </button>
          <button
            className="mt-2 w-full rounded-xl border border-emerald-300 bg-white px-3 py-2 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 sm:ml-2 sm:w-auto"
            onClick={resetRouteProgress}
            type="button"
          >
            Reset route progress
          </button>
        </div>
      </details>

      {amendmentRequests.length > 0 ? (
        <details className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-slate-950 [&::-webkit-details-marker]:hidden">
            Submitted requests
            <span className="rounded-full bg-white px-2 py-1 text-xs text-slate-600">{amendmentRequests.length}</span>
          </summary>
          <div className="mt-3 space-y-2">
            {amendmentRequests.map((request) => (
              <article key={request.id} className="rounded-lg bg-white p-3 text-xs text-slate-600 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{dayPlanAmendmentTypeLabel(request.amendmentType)}</p>
                    <p className="mt-1">{request.note}</p>
                    {request.service ? (
                      <p className="mt-1 text-slate-500">
                        {request.service.name} · {servicePriceLabel(request.service)}
                      </p>
                    ) : null}
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 font-semibold uppercase tracking-wide text-slate-600">
                    {request.status === 'bid_review'
                      ? 'Bid review'
                      : request.status === 'submitted' && (request.requiresBid ?? amendmentRequiresBid(request))
                        ? 'Bid required'
                        : request.status}
                  </span>
                </div>
                <p className="mt-2 text-[11px] font-medium text-slate-500">
                  {request.persisted ? 'Synced with manager workflow' : 'Saved locally; sync pending'}
                </p>
              </article>
            ))}
          </div>
        </details>
      ) : null}
      {offlineAmendmentMutations.length > 0 && (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs font-semibold text-amber-900" role="status">
          <p>
            {offlineAmendmentMutations.length} route {offlineAmendmentMutations.length === 1 ? 'request is' : 'requests are'} queued offline.
          </p>
          <p className="mt-1 font-medium">
            Keep the request on this phone. It will be sent for manager review after connectivity returns.
          </p>
          <p className="mt-1 font-medium">
            {offlineAmendmentMutations.filter((mutation) => mutation.syncState === 'failed').length} retry failed ·{' '}
            {offlineAmendmentMutations.filter((mutation) => mutation.syncState === 'conflict').length} conflicted
          </p>
          <details className="mt-2 rounded-lg border border-amber-300 bg-white p-2">
            <summary className="min-h-11 cursor-pointer py-3 font-bold">
              Review queued route requests
            </summary>
            <div className="space-y-2 border-t border-amber-200 pt-2">
              {offlineAmendmentMutations.map((mutation) => {
                const stop = dayPlan.stops.find((item) => item.id === mutation.stopId);
                return (
                  <article className="rounded-lg bg-amber-50 p-2 font-medium" key={mutation.id}>
                    <p className="font-bold text-slate-900">
                      {dayPlanAmendmentTypeLabel(mutation.amendmentType)}
                    </p>
                    <p className="mt-1 text-slate-700">
                      {stop?.customerName ?? mutation.service?.name ?? 'Route-level request'} ·{' '}
                      {mutation.syncState}
                    </p>
                    {mutation.note && <p className="mt-1 text-slate-600">{mutation.note}</p>}
                    <p className="mt-1 text-slate-600">
                      Queued {new Date(mutation.createdAt).toLocaleString()}
                      {mutation.attemptCount > 0
                        ? ` · ${mutation.attemptCount} ${mutation.attemptCount === 1 ? 'attempt' : 'attempts'}`
                        : ''}
                    </p>
                    {mutation.syncState === 'conflict' && (
                      amendmentConflictDiscardId === mutation.id ? (
                        <div className="mt-2 rounded-lg border border-red-300 bg-white p-2">
                          <p className="text-red-900">
                            Confirm a manager reviewed this route request before discarding its local copy.
                          </p>
                          <div className="mt-2 flex gap-2">
                            <button
                              className="min-h-11 flex-1 rounded-lg bg-red-800 px-3 font-bold text-white"
                              onClick={() => void discardReviewedAmendmentConflict(mutation)}
                              type="button"
                            >
                              Discard request
                            </button>
                            <button
                              className="min-h-11 flex-1 rounded-lg border border-slate-300 bg-white px-3 font-bold"
                              onClick={() => setAmendmentConflictDiscardId(null)}
                              type="button"
                            >
                              Keep request
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          className="mt-2 min-h-11 rounded-lg border border-red-300 bg-white px-3 font-bold text-red-900"
                          onClick={() => setAmendmentConflictDiscardId(mutation.id)}
                          type="button"
                        >
                          Resolve after manager review
                        </button>
                      )
                    )}
                  </article>
                );
              })}
            </div>
          </details>
          <button
            className="mt-2 min-h-11 rounded-lg border border-amber-400 bg-white px-3 font-bold disabled:opacity-60"
            disabled={
              !navigator.onLine
              || isReplayingAmendments
              || offlineAmendmentMutations.some((mutation) => mutation.syncState === 'conflict')
            }
            onClick={() => void replayOfflineAmendments()}
            type="button"
          >
            {isReplayingAmendments ? 'Sending requests…' : 'Send queued requests'}
          </button>
        </div>
      )}

      <div className="mt-5 space-y-3">
        {source === 'missing' ? (
          <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700" role="status">
            No published persisted route is available for this crew. Ask a manager to publish the day plan.
          </p>
        ) : null}
        {source === 'unavailable' ? (
          <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm font-medium text-amber-950" role="alert">
            The persisted crew route could not be loaded. Retry after API readiness recovers.
          </p>
        ) : null}
        {dayPlan.stops.length > 2 ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
            <div>
              <p className="text-sm font-bold text-emerald-950">
                {showAllStops ? 'Full route' : 'Current route focus'}
              </p>
              <p className="text-xs text-emerald-800">
                {showAllStops
                  ? `${dayPlan.stops.length} stops shown`
                  : `Showing the next ${visibleStops.length} stops · ${completedStops} finished`}
              </p>
            </div>
            <button
              className="min-h-11 shrink-0 rounded-xl border border-emerald-300 bg-white px-3 text-xs font-bold text-emerald-900"
              onClick={() => setShowAllStops((current) => !current)}
              type="button"
            >
              {showAllStops ? 'Focus current' : `Show all ${dayPlan.stops.length}`}
            </button>
          </div>
        ) : null}
        {visibleStops.map((stop) => {
          const localState: StopProgressStatus = resolveStopStatus(stopStates[stop.id], stop.stopStatus);
          const actionLabel = stopActionLabel(localState);
          const selectedExtraServiceId = selectedExtraServices[stop.id] ?? crewExtraServiceCatalog[0]?.id ?? '';
          const selectedExtraService = crewExtraServiceCatalog.find((service) => service.id === selectedExtraServiceId);

          return (
            <article key={stop.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <button className="w-full text-left" onClick={() => handleStopClick(stop.jobId, stop.customerName)}>
                <div className="flex flex-col items-start gap-3 min-[380px]:flex-row">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">
                    {stop.stopOrder}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-950">{stop.customerName}</p>
                    <p className="text-sm text-slate-600">{stop.propertyAddress}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      Drive {stop.estimatedDriveMinutes} min / service {stop.estimatedServiceMinutes} min
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    {localState.replace('_', ' ')}
                  </span>
                </div>
              </button>

              <button
                className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={localState === 'finished'}
                onClick={() => advanceStop(stop.id)}
              >
                {actionLabel}
              </button>

              <details className="mt-3 rounded-xl border border-slate-200 bg-white px-3">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-xs font-semibold text-slate-600 [&::-webkit-details-marker]:hidden">
                  Stop options
                  <span className="font-normal text-slate-500">Skip or add service</span>
                </summary>
                <div className="border-t border-slate-100 py-3">
                  <p className="text-xs leading-5 text-slate-500">
                    Ask the manager to approve a route change or price extra work.
                  </p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <button
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 sm:w-auto"
                    onClick={() =>
                      submitAmendmentRequest(
                        'remove_stop',
                        `Crew requested manager review to remove or skip ${stop.customerName}.`,
                        stop.id,
                      )
                    }
                    type="button"
                  >
                    Request skip/removal
                  </button>
                  <select
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 sm:min-w-0"
                    value={selectedExtraServiceId}
                    onChange={(event) =>
                      setSelectedExtraServices((current) => ({ ...current, [stop.id]: event.target.value }))
                    }
                  >
                    {crewExtraServiceCatalog.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} · {servicePriceLabel(service)}
                      </option>
                    ))}
                  </select>
                  <button
                    className="w-full rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    disabled={!selectedExtraService}
                    onClick={() =>
                      submitAmendmentRequest(
                        'add_service',
                        `Crew requested ${selectedExtraService?.name ?? 'an extra service'} at ${stop.customerName}.`,
                        stop.id,
                        selectedExtraService,
                      )
                    }
                    type="button"
                  >
                    Request extra service
                  </button>
                  </div>
                </div>
              </details>
            </article>
          );
        })}
      </div>
    </section>
  );
}
