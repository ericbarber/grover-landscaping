import type { YardCareJob } from './jobs';

export interface DispatchWorkloadGroup {
  key: string;
  scheduledDate: string;
  crewId?: string;
  jobs: YardCareJob[];
  scheduled: number;
  inProgress: number;
  completed: number;
  needsAssignment: boolean;
}

export interface DispatchMoveCapacityImpact {
  currentJobs: number;
  projectedJobs: number;
  capacity: number;
  overCapacity: boolean;
}

export function dispatchMoveCapacityImpact(
  jobs: YardCareJob[],
  movingJobId: string,
  crewId: string,
  scheduledDate: string,
  capacity: number,
): DispatchMoveCapacityImpact {
  const currentJobs = jobs.filter((job) =>
    job.id !== movingJobId
    && job.assignedCrewId === crewId
    && job.scheduledDate === scheduledDate
    && job.status !== 'completed').length;
  const projectedJobs = currentJobs + 1;
  return {
    currentJobs,
    projectedJobs,
    capacity,
    overCapacity: projectedJobs > capacity,
  };
}

export function buildDispatchWorkload(jobs: YardCareJob[]): DispatchWorkloadGroup[] {
  const groups = new Map<string, DispatchWorkloadGroup>();
  for (const job of jobs) {
    const crewKey = job.assignedCrewId ?? 'unassigned';
    const key = `${job.scheduledDate}:${crewKey}`;
    const group = groups.get(key) ?? {
      key,
      scheduledDate: job.scheduledDate,
      crewId: job.assignedCrewId,
      jobs: [],
      scheduled: 0,
      inProgress: 0,
      completed: 0,
      needsAssignment: !job.assignedCrewId,
    };
    group.jobs.push(job);
    if (job.status === 'scheduled') group.scheduled += 1;
    if (job.status === 'in_progress') group.inProgress += 1;
    if (job.status === 'completed') group.completed += 1;
    groups.set(key, group);
  }

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      jobs: [...group.jobs].sort((first, second) =>
        first.customerName.localeCompare(second.customerName)),
    }))
    .sort((first, second) =>
      first.scheduledDate.localeCompare(second.scheduledDate)
      || Number(second.needsAssignment) - Number(first.needsAssignment)
      || (first.crewId ?? '').localeCompare(second.crewId ?? ''));
}
