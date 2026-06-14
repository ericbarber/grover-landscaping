import { useEffect, useState } from 'react';
import { fetchCrewDayPlan } from '../api/dayPlansClient';
import { updateStopProgress, type StopProgressStatus } from '../api/stopProgressClient';
import { getTotalEstimatedMinutes, seedDayPlan, type DayPlan } from '../domain/dayPlans';

type DayPlanPanelProps = {
  onSelectJob?: (jobId: string) => void;
};

type StopStateMap = Record<string, StopProgressStatus>;

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

export function DayPlanPanel({ onSelectJob }: DayPlanPanelProps) {
  const [dayPlan, setDayPlan] = useState<DayPlan>(seedDayPlan);
  const [source, setSource] = useState<'api' | 'local'>('local');
  const [stopStates, setStopStates] = useState<StopStateMap>(() => loadStopStates(seedDayPlan.id));
  const totalMinutes = getTotalEstimatedMinutes(dayPlan);

  function clickMatchingJobCard(customerName: string) {
    const cards = Array.from(document.querySelectorAll('article'));
    const card = cards.find((candidate) => candidate.textContent?.includes(customerName));
    const button = card?.querySelector('button');

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
    void updateStopProgress(dayPlan.id, stopId, next[stopId]).catch(() => {
      saveStopStates(dayPlan.id, next);
    });
  }

  function advanceStop(stopId: string) {
    setStopStates((current) => {
      const currentState = current[stopId] ?? 'pending';
      const nextState = currentState === 'pending' ? 'in_progress' : 'finished';
      const next = { ...current, [stopId]: nextState };
      persistStopState(stopId, next);
      return next;
    });
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
          <p className="text-2xl font-bold text-slate-950">{dayPlan.status}</p>
          <p className="text-xs text-slate-500">Status</p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {dayPlan.stops.map((stop) => {
          const localState = stopStates[stop.id] ?? 'pending';
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
