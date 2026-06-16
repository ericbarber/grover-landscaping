import type { DayPlanStop } from '../domain/dayPlans';
import { ManagerBoundedMoveDraftStopButtons } from './ManagerBoundedMoveDraftStopButtons';
import { ManagerRemoveDraftStopButton } from './ManagerRemoveDraftStopButton';

type ManagerDraftRouteStopCardProps = {
  stop: DayPlanStop;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMoveUp?: (jobId: string) => void;
  onMoveDown?: (jobId: string) => void;
  onRemoveJob?: (jobId: string) => void;
};

export function ManagerDraftRouteStopCard({
  stop,
  canMoveUp = true,
  canMoveDown = true,
  onMoveUp,
  onMoveDown,
  onRemoveJob,
}: ManagerDraftRouteStopCardProps) {
  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">
            {stop.stopOrder}
          </span>
          <div>
            <p className="font-semibold text-slate-950">{stop.customerName}</p>
            <p className="mt-1 text-sm text-slate-600">{stop.propertyAddress}</p>
            <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">{stop.stopStatus ?? 'pending'}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <ManagerBoundedMoveDraftStopButtons
            jobId={stop.jobId}
            canMoveUp={canMoveUp}
            canMoveDown={canMoveDown}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
          />
          <ManagerRemoveDraftStopButton jobId={stop.jobId} onRemoveJob={onRemoveJob} />
        </div>
      </div>
    </article>
  );
}
