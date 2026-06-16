import type { DayPlanStop } from '../domain/dayPlans';
import { ManagerDraftRouteStopsList } from './ManagerDraftRouteStopsList';

type ManagerDraftRoutePanelProps = {
  stops: DayPlanStop[];
};

export function ManagerDraftRoutePanel({ stops }: ManagerDraftRoutePanelProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Draft route</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950">Planned stops</h2>
          <p className="mt-1 text-sm text-slate-600">Jobs already added to this draft day plan.</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
          {stops.length} stops
        </span>
      </div>

      <div className="mt-5">
        <ManagerDraftRouteStopsList stops={stops} />
      </div>
    </section>
  );
}
