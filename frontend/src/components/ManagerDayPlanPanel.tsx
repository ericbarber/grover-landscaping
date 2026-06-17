import { useState, type FormEvent } from 'react';
import { createDraftDayPlanWithFallback, type DayPlanMutationResponse } from '../api/dayPlansClient';
import type { YardCareJob } from '../domain/jobs';
import { getManagerRoutePlanningSeedJobs } from '../domain/managerRoutePlanningSeedJobs';
import { ManagerDraftDayPlanActions } from './ManagerDraftDayPlanActions';
import { ManagerLocalRoutePlanner } from './ManagerLocalRoutePlanner';

type ManagerDayPlanPanelProps = {
  jobs: YardCareJob[];
};

export function ManagerDayPlanPanel({ jobs }: ManagerDayPlanPanelProps) {
  const [crewId, setCrewId] = useState('crew_1001');
  const [serviceDate, setServiceDate] = useState('2026-06-18');
  const [draftPlan, setDraftPlan] = useState<DayPlanMutationResponse | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const planningJobs = getManagerRoutePlanningSeedJobs(jobs);

  function createDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreating(true);

    void createDraftDayPlanWithFallback({ crewId, serviceDate })
      .then(setDraftPlan)
      .finally(() => setIsCreating(false));
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Manager scheduling</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-950">Create day plan</h2>
        <p className="mt-1 text-sm text-slate-600">Draft a crew route before assigning and ordering stops.</p>
      </div>

      <form className="mt-5 space-y-4" onSubmit={createDraft}>
        <label className="block text-sm font-semibold text-slate-700">
          Crew ID
          <input className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-950" value={crewId} onChange={(event) => setCrewId(event.target.value)} />
        </label>

        <label className="block text-sm font-semibold text-slate-700">
          Service date
          <input className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-950" type="date" value={serviceDate} onChange={(event) => setServiceDate(event.target.value)} />
        </label>

        <button className="w-full rounded-xl bg-slate-950 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60" disabled={isCreating} type="submit">
          {isCreating ? 'Creating draft...' : 'Create draft day plan'}
        </button>
      </form>

      {draftPlan ? (
        <div className="mt-5 space-y-5">
          <ManagerDraftDayPlanActions draftPlan={draftPlan} onUpdated={setDraftPlan} />
          <ManagerLocalRoutePlanner
            jobs={planningJobs}
            dayPlanId={draftPlan.id}
            canPersist={draftPlan.persisted}
          />
        </div>
      ) : null}
    </section>
  );
}
