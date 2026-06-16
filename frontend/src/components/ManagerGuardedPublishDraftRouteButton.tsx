import type { DayPlanStop } from '../domain/dayPlans';
import type { YardCareJob } from '../domain/jobs';
import { getManagerDraftRoutePublishGuard } from '../domain/managerDraftRoutePublishGuard';
import { getManagerDraftRoutePublishMessage } from '../domain/managerDraftRoutePublishMessage';

type ManagerGuardedPublishDraftRouteButtonProps = {
  jobs: YardCareJob[];
  stops: DayPlanStop[];
  isPublishing?: boolean;
  onPublish?: () => void;
};

export function ManagerGuardedPublishDraftRouteButton({
  jobs,
  stops,
  isPublishing = false,
  onPublish,
}: ManagerGuardedPublishDraftRouteButtonProps) {
  const guard = getManagerDraftRoutePublishGuard(jobs, stops);
  const isDisabled = !guard.canPublish || isPublishing || !onPublish;
  const message = getManagerDraftRoutePublishMessage(guard.disabledReason);

  return (
    <div className="space-y-2">
      <button
        className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isDisabled}
        onClick={() => onPublish?.()}
        type="button"
      >
        {isPublishing ? 'Publishing draft route...' : 'Publish draft route'}
      </button>
      <p className="text-xs text-slate-600">{message}</p>
    </div>
  );
}
