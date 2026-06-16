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

export function localDraftStopId(jobId: string): string {
  return `local_stop_${jobId}`;
}

export function localDraftStopFromJob(job: YardCareJob, stopOrder: number): DayPlanStop {
  return {
    id: localDraftStopId(job.id),
    jobId: job.id,
    customerName: job.customerName,
    propertyAddress: job.propertyAddress,
    stopOrder,
    jobStatus: job.status,
    stopStatus: 'pending',
    estimatedDriveMinutes: 0,
    estimatedServiceMinutes: 0,
  };
}

export function appendJobToDraftStops(stops: DayPlanStop[], job: YardCareJob): DayPlanStop[] {
  if (stops.some((stop) => stop.jobId === job.id)) {
    return stops;
  }

  return [...stops, localDraftStopFromJob(job, stops.length + 1)];
}
