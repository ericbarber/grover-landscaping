import type { DayPlanStop } from '../domain/dayPlans';
import type { YardCareJob } from '../domain/jobs';
import { getManagerDraftRouteSummary } from '../domain/managerDraftRouteSummary';

type ManagerDraftRouteSummaryCardProps = {
  jobs: YardCareJob[];
  stops: DayPlanStop[];
};

export function ManagerDraftRouteSummaryCard({ jobs, stops }: ManagerDraftRouteSummaryCardProps) {
  const summary = getManagerDraftRouteSummary(jobs, stops);

  return (
    <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3">
      <div className="rounded-xl bg-slate-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Draft stops</p>
        <p className="mt-1 text-2xl font-bold text-slate-950">{summary.stopCount}</p>
      </div>
      <div className="rounded-xl bg-slate-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Estimated minutes</p>
        <p className="mt-1 text-2xl font-bold text-slate-950">{summary.estimatedMinutes}</p>
      </div>
      <div className="rounded-xl bg-slate-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Assignable jobs</p>
        <p className="mt-1 text-2xl font-bold text-slate-950">{summary.assignableJobCount}</p>
      </div>
    </section>
  );
}
