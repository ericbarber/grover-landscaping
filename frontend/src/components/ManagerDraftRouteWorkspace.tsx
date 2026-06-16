import type { DayPlanStop } from '../domain/dayPlans';
import type { YardCareJob } from '../domain/jobs';
import { ManagerAssignableJobsPanel } from './ManagerAssignableJobsPanel';
import { ManagerEditableDraftRoutePanel } from './ManagerEditableDraftRoutePanel';

type ManagerDraftRouteWorkspaceProps = {
  jobs: YardCareJob[];
  stops: DayPlanStop[];
  onAddJob?: (jobId: string) => void;
  onRemoveJob?: (jobId: string) => void;
};

export function ManagerDraftRouteWorkspace({ jobs, stops, onAddJob, onRemoveJob }: ManagerDraftRouteWorkspaceProps) {
  return (
    <div className="space-y-4">
      <ManagerEditableDraftRoutePanel stops={stops} onRemoveJob={onRemoveJob} />
      <ManagerAssignableJobsPanel jobs={jobs} stops={stops} onAddJob={onAddJob} />
    </div>
  );
}
