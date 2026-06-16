import type { DayPlanStop } from '../domain/dayPlans';
import { getManagerDraftRouteWorkload } from '../domain/managerDraftRouteWorkload';

type ManagerDraftRouteWorkloadCardProps = {
  stops: DayPlanStop[];
};

export function ManagerDraftRouteWorkloadCard({ stops }: ManagerDraftRouteWorkloadCardProps) {
  const workload = getManagerDraftRouteWorkload(stops);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Route workload</p>
          <h3 className="mt-1 text-xl font-bold text-slate-950">Drive and service split</h3>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
          {workload.totalMinutes} total minutes
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Drive</p>
          <p className="mt-1 text-2xl font-bold text-slate-950">{workload.driveMinutes}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Service</p>
          <p className="mt-1 text-2xl font-bold text-slate-950">{workload.serviceMinutes}</p>
        </div>
      </div>
    </section>
  );
}
