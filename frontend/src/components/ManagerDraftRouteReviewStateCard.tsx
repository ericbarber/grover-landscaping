import type { DayPlanStop } from '../domain/dayPlans';
import type { YardCareJob } from '../domain/jobs';
import { getManagerDraftRoutePlanningMetrics } from '../domain/managerDraftRoutePlanningMetrics';
import { getManagerDraftRouteReviewMessage } from '../domain/managerDraftRouteReviewMessage';

type ManagerDraftRouteReviewStateCardProps = {
  jobs: YardCareJob[];
  stops: DayPlanStop[];
};

export function ManagerDraftRouteReviewStateCard({ jobs, stops }: ManagerDraftRouteReviewStateCardProps) {
  const metrics = getManagerDraftRoutePlanningMetrics(jobs, stops);
  const message = getManagerDraftRouteReviewMessage(
    metrics.isReadyToReview,
    metrics.summary.hasStops,
    metrics.workload.totalMinutes,
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Review state</p>
          <h3 className="mt-1 text-xl font-bold text-slate-950">
            {metrics.isReadyToReview ? 'Ready to review' : 'Needs attention'}
          </h3>
          <p className="mt-2 text-sm text-slate-600">{message}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
          {metrics.needsMoreJobs ? 'More jobs available' : 'All scheduled jobs assigned'}
        </span>
      </div>
    </section>
  );
}
