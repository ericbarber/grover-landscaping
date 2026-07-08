import type { DayPlanMutationResponse } from '../api/dayPlansClient';
import { draftPlanPersistenceDetail, draftPlanPersistenceLabel } from '../domain/managerDayPlans';

type ManagerDraftDayPlanCardProps = {
  draftPlan: DayPlanMutationResponse;
};

export function ManagerDraftDayPlanCard({ draftPlan }: ManagerDraftDayPlanCardProps) {
  const persistenceClassName = draftPlan.persisted
    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
    : 'border-amber-200 bg-amber-50 text-amber-800';

  return (
    <article className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
      <p className="font-semibold text-slate-950">{draftPlan.id}</p>
      <p className="mt-1">Crew: {draftPlan.crewId}</p>
      <p>Service date: {draftPlan.serviceDate}</p>
      <p>Status: {draftPlan.status}</p>
      <p>Route mode: {draftPlan.routeStatus}</p>
      <div className={`mt-3 rounded-xl border px-3 py-2 text-xs font-medium ${persistenceClassName}`}>
        <p className="font-semibold">{draftPlanPersistenceLabel(draftPlan.persisted)}</p>
        <p className="mt-1">{draftPlanPersistenceDetail(draftPlan.persisted)}</p>
      </div>
    </article>
  );
}
