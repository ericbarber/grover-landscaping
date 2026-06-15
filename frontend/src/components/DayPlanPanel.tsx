import { useEffect, useState } from 'react';
import { fetchCrewDayPlan } from '../api/dayPlansClient';
import { updateStopProgress } from '../api/stopProgressClient';
import { getTotalEstimatedMinutes, seedDayPlan, type DayPlan } from '../domain/dayPlans';
import { isJobSelectionButtonText } from '../domain/jobSelection';
import {
  countFinishedStops,
  getNextStopStatus,
  resetStopStates,
  syncStatusLabel,
  type RouteProgressSyncStatus,
  type StopProgressStatus,
  type StopStateMap,
} from '../domain/stopProgress';

type DayPlanPanelProps = {
  onSelectJob?: (jobId: string) => void;
};

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

export function DayPlanPanel({ onSelectJob }: DayPlanPanelProps) {
  const [dayPlan, setDayPlan] = useState<DayPlan>(seedDayPlan);
  const [source, setSource] = useState<'api' | 'local'>('local');
  const [syncStatus, setSyncStatus] = useState<RouteProgressSyncStatus>('local');
  const [stopStates, setStopStates] = useState<StopStateMap>(() => loadStopStates(seedDayPlan.id));
  const totalMinutes = getTotalEstimatedMinutes(dayPlan);
  const completedStops = countFinishedStops(
    dayPlan.stops.map((stop) => stop.id),
    stopStates,
  );

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

  function persistStopState(stopId: string, next: StopStateMap) {
    saveStopStates(dayPlan.id, next);
    setSyncStatus('syncing');

    void updateStopProgress(dayPlan.id, stopId, next[stopId])
      .then(() => setSyncStatus('synced'))
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
      .then(() => setSyncStatus('synced'))
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
  }, []);

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

      <div className="mt-5 space-y-3">
        {dayPlan.stops.map((stop) => {
          const localState: StopProgressStatus = stopStates[stop.id] ?? stop.stopStatus ?? 'pending';
          const actionLabel = localState === 'pending' ? 'Start stop' : localState === 'in_progress' ? 'Finish stop' : 'Finished';

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
            </article>
          );
        })}
      </div>
    </section>
  );
}
