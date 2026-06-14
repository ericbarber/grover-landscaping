import { getTotalEstimatedMinutes, seedDayPlan } from '../domain/dayPlans';

export function DayPlanPanel() {
  const totalMinutes = getTotalEstimatedMinutes(seedDayPlan);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Crew day plan</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950">{seedDayPlan.crewName}</h2>
          <p className="mt-1 text-sm text-slate-600">{seedDayPlan.serviceDate}</p>
        </div>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800">
          {seedDayPlan.routeStatus}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-2xl font-bold text-slate-950">{seedDayPlan.stops.length}</p>
          <p className="text-xs text-slate-500">Stops</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-2xl font-bold text-slate-950">{totalMinutes}</p>
          <p className="text-xs text-slate-500">Minutes</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-2xl font-bold text-slate-950">{seedDayPlan.status}</p>
          <p className="text-xs text-slate-500">Status</p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {seedDayPlan.stops.map((stop) => (
          <article key={stop.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
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
          </article>
        ))}
      </div>
    </section>
  );
}
