import type { CrewRecord } from '../api/client';
import type { YardCareJob } from './jobs';

export type ManagerOperationsSummary = {
  activeCrews: number;
  totalCrews: number;
  scheduledWork: number;
  unassignedWork: number;
  crewsMissingLead: number;
};

export function summarizeManagerOperations(
  crews: CrewRecord[],
  jobs: YardCareJob[],
  serviceDate: string,
): ManagerOperationsSummary {
  const activeCrews = crews.filter((crew) => crew.status === 'active');
  const scheduledWork = jobs.filter((job) => (
    job.scheduledDate === serviceDate && job.status !== 'completed'
  ));

  return {
    activeCrews: activeCrews.length,
    totalCrews: crews.length,
    scheduledWork: scheduledWork.length,
    unassignedWork: scheduledWork.filter((job) => !job.assignedCrewId).length,
    crewsMissingLead: activeCrews.filter((crew) => !crew.leadMembershipId).length,
  };
}
