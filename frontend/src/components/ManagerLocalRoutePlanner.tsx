import { useState } from 'react';
import type { DayPlanStop } from '../domain/dayPlans';
import type { YardCareJob } from '../domain/jobs';
import {
  draftStopsMoveDownForSelectedJob,
  draftStopsMoveUpForSelectedJob,
  draftStopsRemoverForSelectedJob,
  draftStopsUpdaterForSelectedJob,
} from '../domain/managerJobAssignment';
import { ManagerDraftRouteWorkspace } from './ManagerDraftRouteWorkspace';

type ManagerLocalRoutePlannerProps = {
  jobs: YardCareJob[];
  initialStops?: DayPlanStop[];
};

export function ManagerLocalRoutePlanner({ jobs, initialStops = [] }: ManagerLocalRoutePlannerProps) {
  const [draftStops, setDraftStops] = useState<DayPlanStop[]>(initialStops);

  function addJob(jobId: string) {
    setDraftStops(draftStopsUpdaterForSelectedJob(jobs, jobId));
  }

  function moveJobUp(jobId: string) {
    setDraftStops(draftStopsMoveUpForSelectedJob(jobId));
  }

  function moveJobDown(jobId: string) {
    setDraftStops(draftStopsMoveDownForSelectedJob(jobId));
  }

  function removeJob(jobId: string) {
    setDraftStops(draftStopsRemoverForSelectedJob(jobId));
  }

  return (
    <ManagerDraftRouteWorkspace
      jobs={jobs}
      stops={draftStops}
      onAddJob={addJob}
      onMoveUp={moveJobUp}
      onMoveDown={moveJobDown}
      onRemoveJob={removeJob}
    />
  );
}
