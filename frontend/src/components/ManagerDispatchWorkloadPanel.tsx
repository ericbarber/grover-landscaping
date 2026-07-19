import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { fetchCrews, type CrewRecord } from '../api/client';
import type { YardCareJob } from '../domain/jobs';
import { buildDispatchWorkload } from '../domain/managerDispatchWorkload';

type ManagerDispatchWorkloadPanelProps = {
  jobs: YardCareJob[];
  onSelectJob: (jobId: string) => void;
  onReassign: (jobId: string, crewId: string, scheduledDate: string) => Promise<void>;
};

export function ManagerDispatchWorkloadPanel({
  jobs,
  onSelectJob,
  onReassign,
}: ManagerDispatchWorkloadPanelProps) {
  const dates = useMemo(
    () => Array.from(new Set(jobs.map((job) => job.scheduledDate))).sort(),
    [jobs],
  );
  const [scheduledDate, setScheduledDate] = useState('');
  const [crews, setCrews] = useState<CrewRecord[]>([]);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [targetCrewId, setTargetCrewId] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const groups = useMemo(
    () => buildDispatchWorkload(jobs).filter(
      (group) => !scheduledDate || group.scheduledDate === scheduledDate,
    ),
    [jobs, scheduledDate],
  );
  const editingJob = jobs.find((job) => job.id === editingJobId);
  const hasDispatchChange = Boolean(
    editingJob
    && targetCrewId
    && targetDate
    && (editingJob.assignedCrewId !== targetCrewId || editingJob.scheduledDate !== targetDate),
  );

  useEffect(() => {
    void fetchCrews()
      .then((items) => setCrews(items.filter((crew) => crew.status === 'active')))
      .catch(() => setActionStatus('Crew choices could not be loaded.'));
  }, []);

  function beginMove(job: YardCareJob) {
    setEditingJobId(job.id);
    setTargetCrewId(job.assignedCrewId ?? '');
    setTargetDate(job.scheduledDate);
    setActionStatus(null);
  }

  async function submitMove(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingJobId || !targetCrewId || !targetDate || !hasDispatchChange) return;
    setIsSaving(true);
    setActionStatus(null);
    try {
      await onReassign(editingJobId, targetCrewId, targetDate);
      setActionStatus('Dispatch assignment saved and audited.');
      setEditingJobId(null);
    } catch {
      setActionStatus('Dispatch assignment could not be saved. Confirm the job is still scheduled.');
    } finally {
      setIsSaving(false);
    }
  }

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
      {actionStatus ? <p className="mt-3 text-xs font-semibold text-slate-600">{actionStatus}</p> : null}

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
                  <div className="flex rounded-lg border border-slate-300 bg-white" key={job.id}>
                    <button
                      className="px-3 py-2 text-left text-xs font-semibold text-slate-800 hover:bg-slate-100"
                      onClick={() => onSelectJob(job.id)}
                      type="button"
                    >
                      {job.customerName}
                    </button>
                    {job.status === 'scheduled' ? (
                      <button
                        className="border-l border-slate-300 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-50"
                        onClick={() => beginMove(job)}
                        type="button"
                      >
                        Move
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
              {editingJobId && group.jobs.some((job) => job.id === editingJobId) ? (
                <form className="mt-3 grid gap-2 rounded-lg border border-emerald-200 bg-white p-3 sm:grid-cols-3" onSubmit={submitMove}>
                  <label className="text-xs font-semibold text-slate-600">
                    Destination crew
                    <select
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-2 py-2 text-sm font-normal"
                      onChange={(event) => setTargetCrewId(event.target.value)}
                      required
                      value={targetCrewId}
                    >
                      <option value="">Select crew</option>
                      {crews
                        .filter((crew) => !group.jobs[0].organizationId || crew.organizationId === group.jobs[0].organizationId)
                        .map((crew) => <option key={crew.id} value={crew.id}>{crew.name}</option>)}
                    </select>
                  </label>
                  <label className="text-xs font-semibold text-slate-600">
                    Service date
                    <input
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-2 py-2 text-sm font-normal"
                      onChange={(event) => setTargetDate(event.target.value)}
                      required
                      type="date"
                      value={targetDate}
                    />
                  </label>
                  <div className="flex items-end gap-2">
                    <button
                      className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
                      disabled={isSaving || !hasDispatchChange}
                      type="submit"
                    >
                      {isSaving ? 'Saving' : 'Save move'}
                    </button>
                    <button
                      className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700"
                      onClick={() => setEditingJobId(null)}
                      type="button"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
