import { useMemo, useState } from 'react';
import type { YardCareJob } from '../domain/jobs';
import { buildDispatchWorkload } from '../domain/managerDispatchWorkload';

type ManagerDispatchWorkloadPanelProps = {
  jobs: YardCareJob[];
  onSelectJob: (jobId: string) => void;
};

export function ManagerDispatchWorkloadPanel({
  jobs,
  onSelectJob,
}: ManagerDispatchWorkloadPanelProps) {
  const dates = useMemo(
    () => Array.from(new Set(jobs.map((job) => job.scheduledDate))).sort(),
    [jobs],
  );
  const [scheduledDate, setScheduledDate] = useState('');
  const groups = useMemo(
    () => buildDispatchWorkload(jobs).filter(
      (group) => !scheduledDate || group.scheduledDate === scheduledDate,
    ),
    [jobs, scheduledDate],
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Dispatch</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">Day workload</h2>
          <p className="mt-1 text-sm text-slate-600">
            Compare crew assignments and open scheduled work before changing a route.
          </p>
        </div>
        <label className="text-xs font-semibold text-slate-600">
          Service date
          <select
            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm font-normal text-slate-900"
            onChange={(event) => setScheduledDate(event.target.value)}
            value={scheduledDate}
          >
            <option value="">All loaded dates</option>
            {dates.map((date) => <option key={date} value={date}>{date}</option>)}
          </select>
        </label>
      </div>

      {groups.length === 0 ? (
        <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          No loaded jobs match this service date.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {groups.map((group) => (
            <article
              className={`rounded-xl border p-3 ${
                group.needsAssignment
                  ? 'border-amber-300 bg-amber-50'
                  : 'border-slate-200 bg-slate-50'
              }`}
              key={group.key}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-slate-950">
                    {group.crewId ?? 'Unassigned work'}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">{group.scheduledDate}</p>
                </div>
                <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-slate-700">
                  {group.jobs.length} {group.jobs.length === 1 ? 'job' : 'jobs'}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-600">
                {group.scheduled} scheduled · {group.inProgress} in progress · {group.completed} completed
              </p>
              {group.needsAssignment ? (
                <p className="mt-2 text-xs font-semibold text-amber-900">
                  Assignment needed before this work can be dispatched.
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                {group.jobs.map((job) => (
                  <button
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-xs font-semibold text-slate-800 hover:bg-slate-100"
                    key={job.id}
                    onClick={() => onSelectJob(job.id)}
                    type="button"
                  >
                    {job.customerName}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
