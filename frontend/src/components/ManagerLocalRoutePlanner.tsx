import { useEffect, useState } from 'react';
import {
  assignDayPlanStop,
  removeDayPlanStop,
  reorderDayPlanStops,
} from '../api/dayPlansClient';
import type { DayPlanStop } from '../domain/dayPlans';
import type { YardCareJob } from '../domain/jobs';
import { getManagerDraftRoutePublishGuard } from '../domain/managerDraftRoutePublishGuard';
import {
  draftStopsRemoverForSelectedJob,
  moveDraftStopDown,
  moveDraftStopUp,
  nextDraftStopsForSelectedJob,
  removeJobIdFromDraftStops,
} from '../domain/managerJobAssignment';
import { getManagerNextWorkflowStep } from '../domain/managerNextWorkflowStep';
import { syncStatusFromPersistence, syncStatusLabel, type RouteProgressSyncStatus } from '../domain/stopProgress';
import { ManagerDraftRouteWorkloadCard } from './ManagerDraftRouteWorkloadCard';
import { ManagerDraftRouteWorkspace } from './ManagerDraftRouteWorkspace';

type ManagerLocalRoutePlannerProps = {
  jobs: YardCareJob[];
  initialStops?: DayPlanStop[];
  dayPlanId?: string;
  canPersist?: boolean;
};

const nextStepCopy = {
  create_plan: 'Create a draft day plan before adding route stops.',
  add_stops: 'Add scheduled jobs to build this crew route.',
  publish_plan: 'Route looks ready. Publish it when the crew plan is final.',
};

export function ManagerLocalRoutePlanner({
  jobs,
  initialStops = [],
  dayPlanId,
  canPersist = false,
}: ManagerLocalRoutePlannerProps) {
  const [draftStops, setDraftStops] = useState<DayPlanStop[]>(initialStops);
  const [syncStatus, setSyncStatus] = useState<RouteProgressSyncStatus>(canPersist ? 'synced' : 'local');
  const [mutationNotice, setMutationNotice] = useState<string | null>(null);
  const publishGuard = getManagerDraftRoutePublishGuard(jobs, draftStops);
  const nextStep = getManagerNextWorkflowStep(Boolean(dayPlanId), draftStops.length > 0, publishGuard.canPublish);
  const nextStepMessage = nextStep === 'review_route'
    ? `Review route before publishing: ${publishGuard.disabledReason ?? 'check workload and stop order.'}`
    : nextStepCopy[nextStep];

  useEffect(() => {
    setDraftStops(initialStops);
    setSyncStatus(canPersist ? 'synced' : 'local');
    setMutationNotice(null);
  }, [canPersist, dayPlanId]);

  async function addJob(jobId: string) {
    const nextStops = nextDraftStopsForSelectedJob(draftStops, jobs, jobId);
    const addedStop = nextStops.find((stop) => stop.jobId === jobId);

    if (nextStops === draftStops || !addedStop) {
      return;
    }

    if (!dayPlanId || !canPersist) {
      setDraftStops(nextStops);
      setSyncStatus('local');
      setMutationNotice('Added locally because backend persistence is unavailable. Review the draft before publishing.');
      return;
    }

    setSyncStatus('syncing');
    setMutationNotice(null);

    try {
      const response = await assignDayPlanStop(dayPlanId, {
        jobId,
        estimatedDriveMinutes: addedStop.estimatedDriveMinutes,
        estimatedServiceMinutes: addedStop.estimatedServiceMinutes,
      });

      setDraftStops(
        nextStops.map((stop) =>
          stop.jobId === response.jobId
            ? { ...stop, id: response.stopId, stopOrder: response.stopOrder }
            : stop,
        ),
      );
      setSyncStatus(syncStatusFromPersistence(response.persisted));
      setMutationNotice(response.persisted ? null : 'Added locally. Review the draft before publishing.');
    } catch {
      setDraftStops(nextStops);
      setSyncStatus('local');
      setMutationNotice('Added locally after backend sync failed. Review the draft before publishing.');
    }
  }

  async function persistReorderedStops(nextStops: DayPlanStop[]) {
    if (!dayPlanId || !canPersist) {
      setDraftStops(nextStops);
      setSyncStatus('local');
      setMutationNotice('Reordered locally because backend persistence is unavailable. Review the stop order before publishing.');
      return;
    }

    setSyncStatus('syncing');
    setMutationNotice(null);

    try {
      const response = await reorderDayPlanStops(
        dayPlanId,
        nextStops.map((stop) => stop.id),
      );
      setDraftStops(nextStops);
      setSyncStatus(syncStatusFromPersistence(response.persisted));
      setMutationNotice(response.persisted ? null : 'Reordered locally. Review the stop order before publishing.');
    } catch {
      setDraftStops(nextStops);
      setSyncStatus('local');
      setMutationNotice('Reordered locally after backend sync failed. Review the stop order before publishing.');
    }
  }

  function moveJobUp(jobId: string) {
    const nextStops = moveDraftStopUp(draftStops, jobId);

    if (nextStops !== draftStops) {
      void persistReorderedStops(nextStops);
    }
  }

  function moveJobDown(jobId: string) {
    const nextStops = moveDraftStopDown(draftStops, jobId);

    if (nextStops !== draftStops) {
      void persistReorderedStops(nextStops);
    }
  }

  async function removeJob(jobId: string) {
    const stop = draftStops.find((candidate) => candidate.jobId === jobId);
    const nextStops = removeJobIdFromDraftStops(draftStops, jobId);

    if (nextStops === draftStops || !stop) {
      return;
    }

    if (!dayPlanId || !canPersist) {
      setDraftStops(nextStops);
      setSyncStatus('local');
      setMutationNotice('Removed locally because backend persistence is unavailable. Review the draft before publishing.');
      return;
    }

    setSyncStatus('syncing');
    setMutationNotice(null);

    try {
      const response = await removeDayPlanStop(dayPlanId, stop.id);
      setDraftStops(nextStops);
      setSyncStatus(syncStatusFromPersistence(response.persisted));
      setMutationNotice(response.persisted ? null : 'Removed locally. Review the draft before publishing.');
    } catch {
      setDraftStops(draftStopsRemoverForSelectedJob(jobId));
      setSyncStatus('local');
      setMutationNotice('Removed locally after backend sync failed. Review the draft before publishing.');
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Plan changes: {syncStatusLabel(syncStatus)}
      </p>
      <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700">
        Next step: {nextStepMessage}
      </p>
      {mutationNotice ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
          {mutationNotice}
        </p>
      ) : null}
      <ManagerDraftRouteWorkloadCard stops={draftStops} />
      <ManagerDraftRouteWorkspace
        jobs={jobs}
        stops={draftStops}
        onAddJob={(jobId) => void addJob(jobId)}
        onMoveUp={moveJobUp}
        onMoveDown={moveJobDown}
        onRemoveJob={(jobId) => void removeJob(jobId)}
      />
    </div>
  );
}
