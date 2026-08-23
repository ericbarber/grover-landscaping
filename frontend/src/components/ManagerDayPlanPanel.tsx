import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { fetchCrews, type CrewRecord } from '../api/client';
import {
  createDraftDayPlanWithFallback,
  DayPlanRequestError,
  type DayPlanMutationResponse,
} from '../api/dayPlansClient';
import type { YardCareJob } from '../domain/jobs';
import {
  canCreateManagerDayPlanDraft,
  normalizeManagerDayPlanDraftTarget,
} from '../domain/managerDayPlanDraftTarget';
import {
  defaultManagerServiceDate,
  managerCrewPlanningGuidance,
  managerCrewPlanningLabel,
  preferredManagerCrewId,
} from '../domain/managerDayPlans';
import type { ManagerDraftRoutePublishGuard } from '../domain/managerDraftRoutePublishGuard';
import { getManagerRoutePlanningSeedJobs } from '../domain/managerRoutePlanningSeedJobs';
import { ManagerDraftDayPlanActions } from './ManagerDraftDayPlanActions';
import { ManagerLocalRoutePlanner } from './ManagerLocalRoutePlanner';
import { ManagerAmendmentReviewPanel } from './ManagerAmendmentReviewPanel';
import { WorkspaceStatusBadge, WorkspaceStatusNotice } from './WorkspaceStatus';
import { summarizeManagerOperations } from '../domain/managerOperationsSummary';

type ManagerDayPlanPanelProps = {
  jobs: YardCareJob[];
  onDayPlanPublished?: (dayPlan: DayPlanMutationResponse) => void;
  crewRefreshSignal?: number;
};

const emptyRoutePublishGuard: ManagerDraftRoutePublishGuard = {
  canPublish: false,
  disabledReason: 'Add at least one synced stop before publishing this route.',
};

export function ManagerDayPlanPanel({
  jobs,
  onDayPlanPublished,
  crewRefreshSignal = 0,
}: ManagerDayPlanPanelProps) {
  const [crewId, setCrewId] = useState('');
  const [crews, setCrews] = useState<CrewRecord[]>([]);
  const [isLoadingCrews, setIsLoadingCrews] = useState(true);
  const [crewLoadError, setCrewLoadError] = useState(false);
  const [serviceDate, setServiceDate] = useState(() => defaultManagerServiceDate());
  const [draftPlan, setDraftPlan] = useState<DayPlanMutationResponse | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
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
  const selectedCrew = crews.find((crew) => crew.id === crewId);
  const operationsSummary = useMemo(
    () => summarizeManagerOperations(crews, jobs, serviceDate),
    [crews, jobs, serviceDate],
  );

  useEffect(() => {
    setIsLoadingCrews(true);
    setCrewLoadError(false);
    void fetchCrews()
      .then((nextCrews) => {
        setCrews(nextCrews);
        setCrewId((current) => preferredManagerCrewId(current, nextCrews));
      })
      .catch(() => {
        setCrews([]);
        setCrewId('');
        setCrewLoadError(true);
      })
      .finally(() => setIsLoadingCrews(false));
  }, [crewRefreshSignal]);

  function createDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canCreateDraft) {
      return;
    }

    setIsCreating(true);
    setDraftError(null);

    void createDraftDayPlanWithFallback(draftTarget)
      .then((dayPlan) => {
        setDraftPlan(dayPlan);
        setRoutePublishGuard(emptyRoutePublishGuard);
      })
      .catch((error) => setDraftError(
        error instanceof DayPlanRequestError && error.code === 'day_plan_draft_not_found'
          ? 'The selected crew is no longer available. Refresh the crew list before scheduling.'
          : 'Draft was not saved, so scheduling stayed unchanged. Refresh the crew schedule and try again.',
      ))
      .finally(() => setIsCreating(false));
  }

  function handleCrewIdChange(event: ChangeEvent<HTMLSelectElement>) {
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
    <div className="space-y-5">
      <section className="rounded-2xl bg-forest p-5 text-white shadow-grover-sm sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-sand">Manager scheduling</p>
            <h2 className="mt-2 font-display text-3xl font-black">Today’s operation</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-mist">
              Balance crew readiness, route capacity, and work that still needs an owner before publishing.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <WorkspaceStatusBadge className="border-emerald-500 bg-emerald-950 text-emerald-100" tone="success">
              {serviceDate}
            </WorkspaceStatusBadge>
            <WorkspaceStatusBadge className="border-white/20 bg-white/10 text-white" tone="neutral">
              {draftPlan?.status ?? 'No draft'}
            </WorkspaceStatusBadge>
          </div>
        </div>
      </section>

      <section aria-label="Operation summary" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          ['Crews active', `${operationsSummary.activeCrews} / ${operationsSummary.totalCrews}`, operationsSummary.crewsMissingLead > 0 ? 'Lead coverage needs review' : 'Lead coverage ready'],
          ['Scheduled work', `${operationsSummary.scheduledWork}`, `Open on ${serviceDate}`],
          ['Unassigned', `${operationsSummary.unassignedWork}`, operationsSummary.unassignedWork > 0 ? 'Needs a crew owner' : 'All work has an owner'],
          ['Crew risks', `${operationsSummary.crewsMissingLead}`, operationsSummary.crewsMissingLead > 0 ? 'Active crew missing lead' : 'No lead gaps'],
        ].map(([label, value, detail]) => (
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" key={label}>
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-black text-forest">{value}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">{detail}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-emerald-800">Plan target</p>
          <h3 className="mt-1 text-xl font-black text-slate-950">Create day plan</h3>
          <p className="mt-1 text-sm text-slate-600">Choose the planning target before assigning and ordering stops.</p>
        </div>

        <form className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_13rem_auto] lg:items-end" onSubmit={createDraft}>
          <label className="block text-sm font-semibold text-slate-700">
            Crew
            <select
              className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
              disabled={isCreating || isLoadingCrews || crews.length === 0}
              required
              value={crewId}
              onChange={handleCrewIdChange}
            >
              <option value="">{isLoadingCrews ? 'Loading crews…' : 'Select a crew'}</option>
              {crews.map((crew) => (
                <option key={crew.id} value={crew.id}>{managerCrewPlanningLabel(crew)}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Service date
            <input
              className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
              disabled={isCreating}
              required
              type="date"
              value={serviceDate}
              onChange={handleServiceDateChange}
            />
          </label>
          <button className="min-h-11 rounded-xl bg-forest px-4 py-2 text-sm font-bold text-white hover:bg-emerald-950 disabled:cursor-not-allowed disabled:opacity-60" disabled={!canCreateDraft} type="submit">
            {isCreating ? 'Creating draft...' : isPublishedDraftTarget ? 'Route already published' : 'Create draft day plan'}
          </button>
        </form>

        {selectedCrew ? (
          <WorkspaceStatusNotice
            className="mt-3"
            compact
            detail={managerCrewPlanningGuidance(selectedCrew)}
            tone={selectedCrew.leadMembershipId ? 'success' : 'warning'}
          />
        ) : null}
        {crewLoadError ? (
          <WorkspaceStatusNotice
            className="mt-3"
            compact
            detail="Refresh after confirming your organization access."
            title="Crew options could not be loaded."
            tone="warning"
          />
        ) : !isLoadingCrews && crews.length === 0 ? (
          <WorkspaceStatusNotice
            className="mt-3"
            compact
            detail="Create the organization’s first crew before drafting a day plan."
            title="No crews are ready for scheduling."
            tone="neutral"
          />
        ) : null}
        {draftError ? (
          <WorkspaceStatusNotice className="mt-3" compact detail={draftError} role="alert" tone="danger" />
        ) : null}
      </section>

      {draftPlan ? (
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <section aria-labelledby="crew-schedule-heading" className="min-w-0 rounded-2xl border border-slate-200 bg-paper p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-emerald-800">Crew schedule</p>
                <h3 className="mt-1 text-xl font-black text-slate-950" id="crew-schedule-heading">Route board</h3>
              </div>
              <WorkspaceStatusBadge tone={draftPlan.persisted ? 'success' : 'warning'}>
                {draftPlan.persisted ? 'Persisted plan' : 'Local planning'}
              </WorkspaceStatusBadge>
            </div>
            {isDraftPlanPublished ? (
              <WorkspaceStatusNotice
                detail="Change the crew or service date to start a new draft."
                title="Published route is locked for crew dispatch."
                tone="success"
              />
            ) : (
              <ManagerLocalRoutePlanner
                jobs={planningJobs}
                dayPlanId={draftPlan.id}
                stopCapacity={draftPlan.stopCapacity}
                canPersist={draftPlan.persisted}
                onPublishGuardChanged={setRoutePublishGuard}
              />
            )}
          </section>

          <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-labelledby="planning-inspector-heading">
            <p className="text-xs font-black uppercase tracking-wide text-emerald-800">Selected route</p>
            <h3 className="mt-1 text-xl font-black text-slate-950" id="planning-inspector-heading">Planning inspector</h3>
            <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-paper p-3 text-sm">
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
            <div className="mt-4">
              <ManagerDraftDayPlanActions
                draftPlan={draftPlan}
                onUpdated={handleDraftPlanUpdated}
                canPublishRoute={routePublishGuard.canPublish}
                publishDisabledReason={publishDisabledReason}
              />
            </div>
          </aside>
        </div>
      ) : (
        <WorkspaceStatusNotice
          detail="Choose a crew and service date above to open the route board and planning inspector."
          title="No route is selected."
          tone="neutral"
        />
      )}

      <ManagerAmendmentReviewPanel crewId={draftTarget.crewId || crewId} />
    </div>
  );
}
