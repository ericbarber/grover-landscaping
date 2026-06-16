import type { DayPlanStop } from '../domain/dayPlans';
import type { YardCareJob } from '../domain/jobs';
import { getAssignableJobs } from '../domain/managerJobAssignment';

type ManagerAssignableJobsListProps = {
  jobs: YardCareJob[];
  stops: Pick<DayPlanStop, 'jobId'>[];
  onAddJob?: (jobId: string) => void;
};

export function ManagerAssignableJobsList({ jobs, stops, onAddJob }: ManagerAssignableJobsListProps) {
  const assignableJobs = getAssignableJobs(jobs, stops);

  if (assignableJobs.length === 0) {
    return <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">No scheduled jobs are available to add.</p>;
  }

  return (
    <div className="space-y-3">
      {assignableJobs.map((job) => (
        <article key={job.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-950">{job.customerName}</p>
              <p className="mt-1 text-sm text-slate-600">{job.propertyAddress}</p>
              <p className="mt-2 text-xs text-slate-500">{job.scheduledDate}</p>
            </div>
            <button
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!onAddJob}
              onClick={() => onAddJob?.(job.id)}
              type="button"
            >
              Add
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
