import type { DayPlanStop } from '../domain/dayPlans';
import type { YardCareJob } from '../domain/jobs';
import { getAssignableJobs } from '../domain/managerJobAssignment';

type ManagerAssignableJobsListProps = {
  jobs: YardCareJob[];
  stops: Pick<DayPlanStop, 'jobId'>[];
};

export function ManagerAssignableJobsList({ jobs, stops }: ManagerAssignableJobsListProps) {
  const assignableJobs = getAssignableJobs(jobs, stops);

  if (assignableJobs.length === 0) {
    return <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">No scheduled jobs are available to add.</p>;
  }

  return (
    <div className="space-y-3">
      {assignableJobs.map((job) => (
        <article key={job.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="font-semibold text-slate-950">{job.customerName}</p>
          <p className="mt-1 text-sm text-slate-600">{job.propertyAddress}</p>
          <p className="mt-2 text-xs text-slate-500">{job.scheduledDate}</p>
        </article>
      ))}
    </div>
  );
}
