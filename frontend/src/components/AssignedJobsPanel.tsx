import { useMemo, useState, type ReactNode } from 'react';
import {
  filterAssignedJobs,
  getCompletionProgress,
  type YardCareJob,
} from '../domain/jobs';
import { JobStatusBadge } from './JobStatusBadge';
import { WorkspaceStatusBadge, WorkspaceStatusNotice } from './WorkspaceStatus';

function AssignedJobCard({
  job,
  isSelected,
  onSelect,
  position,
}: {
  job: YardCareJob;
  isSelected: boolean;
  onSelect: (jobId: string) => void;
  position: number;
}) {
  const progress = getCompletionProgress(job);

  return (
    <article
      className={`rounded-2xl border bg-paper p-4 shadow-sm ${
        isSelected ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-slate-200'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-black ${
          isSelected ? 'bg-forest text-white' : 'bg-slate-100 text-forest'
        }`}>
          {position}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                {job.scheduledDate}
              </p>
              <h3 className="mt-1 text-lg font-black text-slate-950">{job.customerName}</h3>
            </div>
            <JobStatusBadge status={job.status} />
          </div>
          <p className="mt-1 text-sm text-slate-600">{job.propertyAddress}</p>
          <p className="mt-3 text-xs font-semibold text-slate-600">
            {job.completedChecklistItems}/{job.checklistItems} checklist · {job.beforePhotos} before · {job.afterPhotos} after
          </p>
        </div>
      </div>

      <div
        aria-label={`${progress}% checklist complete`}
        className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100"
      >
        <div className="h-full rounded-full bg-emerald-700" style={{ width: `${progress}%` }} />
      </div>

      <button
        className="mt-4 min-h-11 w-full rounded-xl bg-emerald-800 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-900"
        onClick={() => onSelect(job.id)}
        type="button"
      >
        {isSelected ? 'Selected Job' : 'Open Job'}
      </button>
    </article>
  );
}

export function AssignedJobsPanel({
  className = '',
  jobs,
  jobsUnavailable,
  onSelectJob,
  recovery,
  selectedJobId,
  statusMessage,
}: {
  className?: string;
  jobs: YardCareJob[];
  jobsUnavailable: boolean;
  onSelectJob: (jobId: string) => void;
  recovery?: ReactNode;
  selectedJobId: string | null;
  statusMessage: string;
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<YardCareJob['status'] | 'all'>('all');
  const visibleJobs = useMemo(
    () => filterAssignedJobs(jobs, search, statusFilter),
    [jobs, search, statusFilter],
  );

  return (
    <section className={className}>
      <div className="mb-4 mt-0 scroll-mt-16 lg:mt-6" id="assigned-jobs">
        <h2 className="text-xl font-bold text-slate-950 sm:text-2xl">Assigned jobs</h2>
        <p className="mt-1 text-sm text-slate-600" role="status">{statusMessage}</p>
        {jobsUnavailable ? (
          <WorkspaceStatusNotice
            className="mt-2"
            compact
            detail="Assigned jobs remain hidden until API readiness recovers."
            title="Persisted field work could not be loaded."
            tone="danger"
          />
        ) : null}
        {recovery}
        <div className="mt-4 grid gap-2 rounded-2xl border border-slate-200 bg-paper p-3 sm:grid-cols-[minmax(0,1fr)_12rem_auto] sm:items-center">
          <label className="text-xs font-black uppercase tracking-wide text-slate-600">
            Search
            <input
              aria-label="Search assigned jobs"
              className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-slate-900"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Customer or address"
              type="search"
              value={search}
            />
          </label>
          <label className="text-xs font-black uppercase tracking-wide text-slate-600">
            Status
            <select
              aria-label="Filter assigned jobs by status"
              className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-slate-900"
              onChange={(event) => setStatusFilter(event.target.value as YardCareJob['status'] | 'all')}
              value={statusFilter}
            >
              <option value="all">All jobs</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
            </select>
          </label>
          <WorkspaceStatusBadge className="justify-self-start sm:mt-5" tone="neutral">
            {visibleJobs.length} shown
          </WorkspaceStatusBadge>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {visibleJobs.map((job) => (
          <AssignedJobCard
            key={job.id}
            job={job}
            isSelected={job.id === selectedJobId}
            onSelect={onSelectJob}
            position={jobs.findIndex((item) => item.id === job.id) + 1}
          />
        ))}
        {visibleJobs.length === 0 ? (
          <WorkspaceStatusNotice
            className="md:col-span-2"
            detail="Clear or change the search and status filters to see other assignments."
            title="No assigned jobs match these filters."
            tone="neutral"
          />
        ) : null}
      </div>
    </section>
  );
}
