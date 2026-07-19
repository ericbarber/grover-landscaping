import { useState, type ChangeEvent, type FormEvent } from 'react';
import { createDraftDayPlanWithFallback, type DayPlanMutationResponse } from '../api/dayPlansClient';
import type { YardCareJob } from '../domain/jobs';
import {
  canCreateManagerDayPlanDraft,
  normalizeManagerDayPlanDraftTarget,
} from '../domain/managerDayPlanDraftTarget';
import { defaultManagerServiceDate } from '../domain/managerDayPlans';
import type { ManagerDraftRoutePublishGuard } from '../domain/managerDraftRoutePublishGuard';
import { getManagerRoutePlanningSeedJobs } from '../domain/managerRoutePlanningSeedJobs';
import { ManagerDraftDayPlanActions } from './ManagerDraftDayPlanActions';
import { ManagerLocalRoutePlanner } from './ManagerLocalRoutePlanner';
import { ManagerAmendmentReviewPanel } from './ManagerAmendmentReviewPanel';

type ManagerDayPlanPanelProps = {
  jobs: YardCareJob[];
  onDayPlanPublished?: (dayPlan: DayPlanMutationResponse) => void;
};

const emptyRoutePublishGuard: ManagerDraftRoutePublishGuard = {
  canPublish: false,
  disabledReason: 'Add at least one synced stop before publishing this route.',
};

export function ManagerDayPlanPanel({ jobs, onDayPlanPublished }: ManagerDayPlanPanelProps) {
  const [crewId, setCrewId] = useState('crew_1001');
  const [serviceDate, setServiceDate] = useState(() => defaultManagerServiceDate());
  const [draftPlan, setDraftPlan] = useState<DayPlanMutationResponse | null>(null);
  const [routePublishGuard, setRoutePublishGuard] = useState<ManagerDraftRoutePublishGuard>(emptyRoutePublishGuard);
  const [isCreating, setIsCreating] = useState(false);
  const planningJobs = getManagerRoutePlanningSeedJobs(jobs);
  const draftTarget = normalizeManagerDayPlanDraftTarget({ crewId, serviceDate });
  const isDraftPlanPublished = draftPlan?.status === 'published';
  const isPublishedDraftTarget = Boolean(
    isDraftPlanPublished
      && draftPlan?.crewId === draftTarget.crewId
      && draftPlan.serviceDate === draftTarget.serviceDate,
  );
  const canCreateDraft = canCreateManagerDayPlanDraft(draftTarget) && !isCreating && !isPublishedDraftTarget;
  const publishDisabledReason = routePublishGuard.disabledReason ?? 'Review this route before publishing.';

  function createDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canCreateDraft) {
      return;
    }

    setIsCreating(true);

    void createDraftDayPlanWithFallback(draftTarget)
      .then((dayPlan) => {
        setDraftPlan(dayPlan);
        setRoutePublishGuard(emptyRoutePublishGuard);
      })
      .finally(() => setIsCreating(false));
  }

  function handleCrewIdChange(event: ChangeEvent<HTMLInputElement>) {
    setCrewId(event.target.value);
    setDraftPlan(null);
    setRoutePublishGuard(emptyRoutePublishGuard);
  }

  function handleServiceDateChange(event: ChangeEvent<HTMLInputElement>) {
    setServiceDate(event.target.value);
    setDraftPlan(null);
    setRoutePublishGuard(emptyRoutePublishGuard);
  }

  function handleDraftPlanUpdated(dayPlan: DayPlanMutationResponse) {
    setDraftPlan(dayPlan);

    if (dayPlan.status === 'published' && dayPlan.persisted) {
      onDayPlanPublished?.(dayPlan);
    }
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
          <input
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
            disabled={isCreating}
            required
            value={crewId}
            onChange={handleCrewIdChange}
          />
        </label>

        <label className="block text-sm font-semibold text-slate-700">
          Service date
          <input
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
            disabled={isCreating}
            required
            type="date"
            value={serviceDate}
            onChange={handleServiceDateChange}
          />
        </label>

        <button className="w-full rounded-xl bg-slate-950 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60" disabled={!canCreateDraft} type="submit">
          {isCreating ? 'Creating draft...' : isPublishedDraftTarget ? 'Route already published' : 'Create draft day plan'}
        </button>
      </form>

      {draftPlan ? (
        <div className="mt-5 space-y-5">
          <dl className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Service area</dt>
              <dd className="mt-1 font-semibold text-slate-900">{draftPlan.serviceAreaLabel ?? 'Not set'}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Stop capacity</dt>
              <dd className="mt-1 font-semibold text-slate-900">{draftPlan.stopCapacity} stops</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Planning timezone</dt>
              <dd className="mt-1 break-words font-semibold text-slate-900">{draftPlan.timeZone}</dd>
            </div>
          </dl>
          <ManagerDraftDayPlanActions
            draftPlan={draftPlan}
            onUpdated={handleDraftPlanUpdated}
            canPublishRoute={routePublishGuard.canPublish}
            publishDisabledReason={publishDisabledReason}
          />
          {isDraftPlanPublished ? (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
              Published route is locked for crew dispatch. Change the crew or service date to start a new draft.
            </p>
          ) : (
            <ManagerLocalRoutePlanner
              jobs={planningJobs}
              dayPlanId={draftPlan.id}
              canPersist={draftPlan.persisted}
              onPublishGuardChanged={setRoutePublishGuard}
            />
          )}
        </div>
      ) : null}

      <ManagerAmendmentReviewPanel crewId={draftTarget.crewId || crewId} />
    </section>
  );
}
