import type { DayPlanStop } from '../domain/dayPlans';
import { ManagerRemoveDraftStopButton } from './ManagerRemoveDraftStopButton';

type ManagerDraftRouteStopCardProps = {
  stop: DayPlanStop;
  onRemoveJob?: (jobId: string) => void;
};

export function ManagerDraftRouteStopCard({ stop, onRemoveJob }: ManagerDraftRouteStopCardProps) {
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
        <ManagerRemoveDraftStopButton jobId={stop.jobId} onRemoveJob={onRemoveJob} />
      </div>
    </article>
  );
}
