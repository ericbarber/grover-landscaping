import type { DayPlanStop } from '../domain/dayPlans';

type ManagerDraftRouteStopsListProps = {
  stops: DayPlanStop[];
};

export function ManagerDraftRouteStopsList({ stops }: ManagerDraftRouteStopsListProps) {
  if (stops.length === 0) {
    return (
      <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
        No jobs have been added to this draft route yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {stops.map((stop) => (
        <article key={stop.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">
              {stop.stopOrder}
            </span>
            <div>
              <p className="font-semibold text-slate-950">{stop.customerName}</p>
              <p className="mt-1 text-sm text-slate-600">{stop.propertyAddress}</p>
              <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">{stop.stopStatus ?? 'pending'}</p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
