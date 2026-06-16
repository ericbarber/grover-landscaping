import type { DayPlanStop } from './dayPlans';
import type { YardCareJob } from './jobs';

export function getAssignedJobIds(stops: Pick<DayPlanStop, 'jobId'>[]): string[] {
  return stops.map((stop) => stop.jobId);
}

export function getAssignableJobs(jobs: YardCareJob[], stops: Pick<DayPlanStop, 'jobId'>[]): YardCareJob[] {
  const assignedJobIds = new Set(getAssignedJobIds(stops));

  return jobs.filter((job) => job.status === 'scheduled' && !assignedJobIds.has(job.id));
}

export function getAssignableJobCount(jobs: YardCareJob[], stops: Pick<DayPlanStop, 'jobId'>[]): number {
  return getAssignableJobs(jobs, stops).length;
}
