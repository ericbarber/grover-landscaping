import type { DayPlanStop } from '../domain/dayPlans';
import { canMoveDraftStopDown, canMoveDraftStopUp } from '../domain/managerDraftRouteMoveBounds';
import { getDraftRouteEstimatedMinutes, getDraftRouteStopCount } from '../domain/managerJobAssignment';
import { ManagerDraftRouteStopCard } from './ManagerDraftRouteStopCard';

type ManagerEditableDraftRoutePanelProps = {
  stops: DayPlanStop[];
  onMoveUp?: (jobId: string) => void;
  onMoveDown?: (jobId: string) => void;
  onRemoveJob?: (jobId: string) => void;
};

export function ManagerEditableDraftRoutePanel({ stops, onMoveUp, onMoveDown, onRemoveJob }: ManagerEditableDraftRoutePanelProps) {
  const stopCount = getDraftRouteStopCount(stops);
  const estimatedMinutes = getDraftRouteEstimatedMinutes(stops);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Draft route</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950">Planned stops</h2>
          <p className="mt-1 text-sm text-slate-600">Jobs already added to this draft day plan.</p>
        </div>
        <div className="text-right">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
            {stopCount} stops
          </span>
          <p className="mt-2 text-xs text-slate-500">{estimatedMinutes} estimated minutes</p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {stops.length === 0 ? (
          <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">No jobs have been added to this draft route yet.</p>
        ) : (
          stops.map((stop) => (
            <ManagerDraftRouteStopCard
              key={stop.id}
              stop={stop}
              canMoveUp={canMoveDraftStopUp(stops, stop.jobId)}
              canMoveDown={canMoveDraftStopDown(stops, stop.jobId)}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              onRemoveJob={onRemoveJob}
            />
          ))
        )}
      </div>
    </section>
  );
}
