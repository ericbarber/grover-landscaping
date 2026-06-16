import type { DayPlanStop } from '../domain/dayPlans';
import type { YardCareJob } from '../domain/jobs';
import { ManagerAssignableJobsPanel } from './ManagerAssignableJobsPanel';
import { ManagerDraftRoutePanel } from './ManagerDraftRoutePanel';

type ManagerDraftRouteWorkspaceProps = {
  jobs: YardCareJob[];
  stops: DayPlanStop[];
  onAddJob?: (jobId: string) => void;
};

export function ManagerDraftRouteWorkspace({ jobs, stops, onAddJob }: ManagerDraftRouteWorkspaceProps) {
  return (
    <div className="space-y-4">
      <ManagerDraftRoutePanel stops={stops} />
      <ManagerAssignableJobsPanel jobs={jobs} stops={stops} onAddJob={onAddJob} />
    </div>
  );
}
