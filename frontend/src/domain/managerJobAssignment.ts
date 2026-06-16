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

export function appendJobIdToDraftStops(stops: DayPlanStop[], jobs: YardCareJob[], jobId: string): DayPlanStop[] {
  const job = jobs.find((candidate) => candidate.id === jobId);

  if (!job) {
    return stops;
  }

  return appendJobToDraftStops(stops, job);
}

export function nextDraftStopsForSelectedJob(
  currentStops: DayPlanStop[],
  jobs: YardCareJob[],
  selectedJobId: string,
): DayPlanStop[] {
  return appendJobIdToDraftStops(currentStops, jobs, selectedJobId);
}

export function draftStopsUpdaterForSelectedJob(
  jobs: YardCareJob[],
  selectedJobId: string,
): (currentStops: DayPlanStop[]) => DayPlanStop[] {
  return (currentStops) => nextDraftStopsForSelectedJob(currentStops, jobs, selectedJobId);
}

export function renumberDraftStops(stops: DayPlanStop[]): DayPlanStop[] {
  return stops.map((stop, index) => ({ ...stop, stopOrder: index + 1 }));
}

export function removeJobIdFromDraftStops(stops: DayPlanStop[], jobId: string): DayPlanStop[] {
  const remainingStops = stops.filter((stop) => stop.jobId !== jobId);

  if (remainingStops.length === stops.length) {
    return stops;
  }

  return renumberDraftStops(remainingStops);
}

export function draftStopsRemoverForSelectedJob(selectedJobId: string): (currentStops: DayPlanStop[]) => DayPlanStop[] {
  return (currentStops) => removeJobIdFromDraftStops(currentStops, selectedJobId);
}

export function getDraftRouteStopCount(stops: DayPlanStop[]): number {
  return stops.length;
}

export function getDraftRouteEstimatedMinutes(stops: DayPlanStop[]): number {
  return stops.reduce((total, stop) => total + stop.estimatedDriveMinutes + stop.estimatedServiceMinutes, 0);
}
