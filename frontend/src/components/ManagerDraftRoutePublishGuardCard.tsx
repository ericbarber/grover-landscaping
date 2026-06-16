import type { DayPlanStop } from '../domain/dayPlans';
import type { YardCareJob } from '../domain/jobs';
import { getManagerDraftRoutePublishGuard } from '../domain/managerDraftRoutePublishGuard';
import { getManagerDraftRoutePublishMessage } from '../domain/managerDraftRoutePublishMessage';

type ManagerDraftRoutePublishGuardCardProps = {
  jobs: YardCareJob[];
  stops: DayPlanStop[];
};

export function ManagerDraftRoutePublishGuardCard({ jobs, stops }: ManagerDraftRoutePublishGuardCardProps) {
  const guard = getManagerDraftRoutePublishGuard(jobs, stops);
  const message = getManagerDraftRoutePublishMessage(guard.disabledReason);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Publish guard</p>
          <h3 className="mt-1 text-xl font-bold text-slate-950">
            {guard.canPublish ? 'Publish ready' : 'Publish blocked'}
          </h3>
          <p className="mt-2 text-sm text-slate-600">{message}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
          {guard.canPublish ? 'Enabled' : 'Disabled'}
        </span>
      </div>
    </section>
  );
}
