import type { DayPlanStop } from '../domain/dayPlans';
import type { YardCareJob } from '../domain/jobs';
import { ManagerAssignableJobsList } from './ManagerAssignableJobsList';
import { ManagerAssignableJobsSummary } from './ManagerAssignableJobsSummary';

type ManagerAssignableJobsPanelProps = {
  jobs: YardCareJob[];
  stops: Pick<DayPlanStop, 'jobId'>[];
};

export function ManagerAssignableJobsPanel({ jobs, stops }: ManagerAssignableJobsPanelProps) {
  return (
    <div className="space-y-3">
      <ManagerAssignableJobsSummary jobs={jobs} stops={stops} />
      <ManagerAssignableJobsList jobs={jobs} stops={stops} />
    </div>
  );
}
