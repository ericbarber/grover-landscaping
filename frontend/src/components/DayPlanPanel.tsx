import { useEffect, useState } from 'react';
import { fetchCrewDayPlan } from '../api/dayPlansClient';
import { getTotalEstimatedMinutes, seedDayPlan, type DayPlan } from '../domain/dayPlans';

type DayPlanPanelProps = {
  onSelectJob?: (jobId: string) => void;
};

export function DayPlanPanel({ onSelectJob }: DayPlanPanelProps) {
  const [dayPlan, setDayPlan] = useState<DayPlan>(seedDayPlan);
  const [source, setSource] = useState<'api' | 'local'>('local');
  const totalMinutes = getTotalEstimatedMinutes(dayPlan);

  useEffect(() => {
    let isMounted = true;

    fetchCrewDayPlan(seedDayPlan.crewId)
      .then((apiDayPlan) => {
        if (isMounted) {
          setDayPlan(apiDayPlan);
          setSource('api');
        }
      })
      .catch(() => {
        if (isMounted) {
          setDayPlan(seedDayPlan);
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
        {dayPlan.stops.map((stop) => (
          <button
            key={stop.id}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-left hover:border-emerald-400 hover:bg-emerald-50"
            onClick={() => onSelectJob?.(stop.jobId)}
          >
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
                {stop.jobStatus.replace('_', ' ')}
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
