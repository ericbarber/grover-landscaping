import type { DayPlanMutationResponse } from '../api/dayPlansClient';
import { draftPlanPersistenceLabel } from '../domain/managerDayPlans';

type ManagerDraftDayPlanCardProps = {
  draftPlan: DayPlanMutationResponse;
};

export function ManagerDraftDayPlanCard({ draftPlan }: ManagerDraftDayPlanCardProps) {
  return (
    <article className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
      <p className="font-semibold text-slate-950">{draftPlan.id}</p>
      <p className="mt-1">Crew: {draftPlan.crewId}</p>
      <p>Service date: {draftPlan.serviceDate}</p>
      <p>Status: {draftPlan.status}</p>
      <p>Route mode: {draftPlan.routeStatus}</p>
      <p className="mt-2 text-xs text-slate-500">{draftPlanPersistenceLabel(draftPlan.persisted)}</p>
    </article>
  );
}
