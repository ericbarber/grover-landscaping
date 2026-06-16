import type { DayPlanStop } from '../domain/dayPlans';
import type { YardCareJob } from '../domain/jobs';
import { getAssignableJobCount } from '../domain/managerJobAssignment';

type ManagerAssignableJobsSummaryProps = {
  jobs: YardCareJob[];
  stops: Pick<DayPlanStop, 'jobId'>[];
};

export function ManagerAssignableJobsSummary({ jobs, stops }: ManagerAssignableJobsSummaryProps) {
  const assignableJobCount = getAssignableJobCount(jobs, stops);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Assignable jobs</p>
      <div className="mt-2 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-950">Jobs ready for route planning</h2>
          <p className="mt-1 text-sm text-slate-600">Scheduled jobs not already assigned to this draft day plan.</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
          {assignableJobCount} open
        </span>
      </div>
    </section>
  );
}
