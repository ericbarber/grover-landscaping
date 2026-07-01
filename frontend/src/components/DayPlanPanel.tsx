import { useEffect, useState } from 'react';
import {
  createDayPlanAmendment,
  fetchDayPlanAmendments,
} from '../api/dayPlanAmendmentsClient';
import { fetchCrewDayPlan } from '../api/dayPlansClient';
import { updateStopProgress } from '../api/stopProgressClient';
import { getTotalEstimatedMinutes, seedDayPlan, type DayPlan } from '../domain/dayPlans';
import { isJobSelectionButtonText } from '../domain/jobSelection';
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

function saveStopStates(dayPlanId: string, stopStates: StopStateMap) {
  window.localStorage.setItem(storageKey(dayPlanId), JSON.stringify(stopStates));
}

function clearStopStates(dayPlanId: string) {
  window.localStorage.removeItem(storageKey(dayPlanId));
}

function servicePriceLabel(service: ServiceCatalogItem): string {
  if (!service.defaultPriceCents) {
    return 'No default charge';
  }

  return `$${(service.defaultPriceCents / 100).toFixed(2)}`;
}

export function DayPlanPanel({ onSelectJob, refreshSignal = 0 }: DayPlanPanelProps) {
  const [dayPlan, setDayPlan] = useState<DayPlan>(seedDayPlan);
  const [source, setSource] = useState<'api' | 'local'>('local');
  const [syncStatus, setSyncStatus] = useState<RouteProgressSyncStatus>('local');
  const [stopStates, setStopStates] = useState<StopStateMap>(() => loadStopStates(seedDayPlan.id));
  const [amendmentRequests, setAmendmentRequests] = useState<DayPlanAmendmentRequest[]>([]);
  const [selectedExtraServices, setSelectedExtraServices] = useState<Record<string, string>>({});
  const totalMinutes = getTotalEstimatedMinutes(dayPlan);
  const completedStops = countResolvedFinishedStops(dayPlan.stops, stopStates);

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
      .catch(() => {
        setAmendmentRequests((current) =>
          current.map((item) => (item.id === request.id ? { ...item, persisted: false } : item)),
        );
      });
  }

  function persistStopState(stopId: string, next: StopStateMap) {
    saveStopStates(dayPlan.id, next);
    setSyncStatus('syncing');

    void updateStopProgress(dayPlan.id, stopId, next[stopId])
      .then((progress) => setSyncStatus(syncStatusFromPersistence(progress.persisted)))
      .catch(() => {
        saveStopStates(dayPlan.id, next);
        setSyncStatus('local');
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
    setSyncStatus('syncing');

    void Promise.all(
      dayPlan.stops.map((stop) => updateStopProgress(dayPlan.id, stop.id, 'pending')),
    )
      .then((progress) => {
        const allPersisted = progress.every((item) => item.persisted);
        setSyncStatus(syncStatusFromPersistence(allPersisted));
      })
      .catch(() => setSyncStatus('local'));
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
      .catch(() => {
        if (isMounted) {
          setDayPlan(seedDayPlan);
          setStopStates(loadStopStates(seedDayPlan.id));
          setSource('local');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [refreshSignal]);

  useEffect(() => {
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
  }, [dayPlan.id]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Crew day plan</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950">{dayPlan.crewName}</h2>
          <p className="mt-1 text-sm text-slate-600">{dayPlan.serviceDate}</p>
          <p className="mt-1 text-xs text-slate-500">Source: {source === 'api' ? 'local API' : 'browser fallback'}</p>
          <p className="mt-1 text-xs text-slate-500">Progress: {syncStatusLabel(syncStatus)}</p>
        </div>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800">
          {dayPlan.routeStatus}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 text-center">
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

      <button
        className="mt-4 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        onClick={resetRouteProgress}
      >
        Reset route progress
      </button>

      <div className="mt-4 rounded-xl border border-dashed border-emerald-300 bg-emerald-50 p-4">
        <p className="text-sm font-semibold text-emerald-950">Need a route change?</p>
        <p className="mt-1 text-xs text-emerald-800">
          Submit an amendment for backend persistence and manager review. Browser fallback remains available offline.
        </p>
        <button
          className="mt-3 rounded-full bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800"
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
      </div>

      {amendmentRequests.length > 0 ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-950">Submitted amendment requests</p>
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
        </div>
      ) : null}

      <div className="mt-5 space-y-3">
        {dayPlan.stops.map((stop) => {
          const localState: StopProgressStatus = resolveStopStatus(stopStates[stop.id], stop.stopStatus);
          const actionLabel = stopActionLabel(localState);
          const selectedExtraServiceId = selectedExtraServices[stop.id] ?? crewExtraServiceCatalog[0]?.id ?? '';
          const selectedExtraService = crewExtraServiceCatalog.find((service) => service.id === selectedExtraServiceId);

          return (
            <article key={stop.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <button className="w-full text-left" onClick={() => handleStopClick(stop.jobId, stop.customerName)}>
                <div className="flex items-start gap-3">
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

              <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Crew amendment</p>
                <p className="mt-1 text-xs text-slate-500">
                  Ask the manager to approve a route change or price an extra service for this stop.
                </p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <button
                    className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
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
                    className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
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
                    className="rounded-full bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
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
            </article>
          );
        })}
      </div>
    </section>
  );
}
