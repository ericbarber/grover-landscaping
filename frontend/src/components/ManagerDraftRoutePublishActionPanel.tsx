import type { DayPlanStop } from '../domain/dayPlans';
import type { YardCareJob } from '../domain/jobs';
import { ManagerDraftRoutePublishGuardCard } from './ManagerDraftRoutePublishGuardCard';
import { ManagerGuardedPublishDraftRouteButton } from './ManagerGuardedPublishDraftRouteButton';

type ManagerDraftRoutePublishActionPanelProps = {
  jobs: YardCareJob[];
  stops: DayPlanStop[];
  isPublishing?: boolean;
  onPublish?: () => void;
};

export function ManagerDraftRoutePublishActionPanel({
  jobs,
  stops,
  isPublishing = false,
  onPublish,
}: ManagerDraftRoutePublishActionPanelProps) {
  return (
    <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <ManagerDraftRoutePublishGuardCard jobs={jobs} stops={stops} />
      <ManagerGuardedPublishDraftRouteButton
        jobs={jobs}
        stops={stops}
        isPublishing={isPublishing}
        onPublish={onPublish}
      />
    </section>
  );
}
