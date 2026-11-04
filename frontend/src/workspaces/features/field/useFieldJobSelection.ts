import {
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { ApiRequestError } from '../../../api/apiError';
import {
  fetchJobAddOns,
  fetchJobDetail,
  type JobAddOn,
  type JobDetail,
} from '../../../api/client';
import type { YardCareJob } from '../../../domain/jobs';
import { fallbackJobDetail } from './fieldWorkspace';

export type FieldJobDetailRead =
  | { state: 'ready'; detail: JobDetail }
  | { state: 'fallback'; detail: JobDetail | null }
  | { state: 'unavailable'; detail: null };

export interface FieldJobAddOnRead {
  addOns: JobAddOn[];
  unavailable: boolean;
}

export async function readFieldJobDetail(
  jobId: string,
  jobs: YardCareJob[],
  load: (jobId: string) => Promise<JobDetail> = fetchJobDetail,
): Promise<FieldJobDetailRead> {
  try {
    return { state: 'ready', detail: await load(jobId) };
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return { state: 'unavailable', detail: null };
    }

    const fallback = jobs.find((job) => job.id === jobId);
    return {
      state: 'fallback',
      detail: fallback ? fallbackJobDetail(fallback) : null,
    };
  }
}

export async function readFieldJobAddOns(
  jobId: string,
  load: (jobId: string) => Promise<JobAddOn[]> = fetchJobAddOns,
): Promise<FieldJobAddOnRead> {
  try {
    return { addOns: await load(jobId), unavailable: false };
  } catch (error) {
    return {
      addOns: [],
      unavailable: error instanceof ApiRequestError,
    };
  }
}

export interface FieldJobSelection {
  selectedJob: JobDetail | null;
  setSelectedJob: Dispatch<SetStateAction<JobDetail | null>>;
  jobDetailUnavailable: boolean;
  isLoadingDetail: boolean;
  selectedJobAddOns: JobAddOn[];
  setSelectedJobAddOns: Dispatch<SetStateAction<JobAddOn[]>>;
  jobAddOnsUnavailable: boolean;
}

export function useFieldJobSelection(
  selectedJobId: string | null,
  jobs: YardCareJob[],
): FieldJobSelection {
  const [selectedJob, setSelectedJob] = useState<JobDetail | null>(null);
  const [jobDetailUnavailable, setJobDetailUnavailable] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [selectedJobAddOns, setSelectedJobAddOns] = useState<JobAddOn[]>([]);
  const [jobAddOnsUnavailable, setJobAddOnsUnavailable] = useState(false);

  useEffect(() => {
    if (!selectedJobId) {
      setSelectedJob(null);
      setJobDetailUnavailable(false);
      setIsLoadingDetail(false);
      return;
    }

    let active = true;
    setIsLoadingDetail(true);
    setJobDetailUnavailable(false);

    void readFieldJobDetail(selectedJobId, jobs)
      .then((result) => {
        if (!active) return;
        setSelectedJob(result.detail);
        setJobDetailUnavailable(result.state === 'unavailable');
      })
      .finally(() => {
        if (active) setIsLoadingDetail(false);
      });

    return () => {
      active = false;
    };
  }, [jobs, selectedJobId]);

  useEffect(() => {
    if (!selectedJobId) {
      setSelectedJobAddOns([]);
      setJobAddOnsUnavailable(false);
      return;
    }

    let active = true;
    setJobAddOnsUnavailable(false);

    void readFieldJobAddOns(selectedJobId).then((result) => {
      if (!active) return;
      setSelectedJobAddOns(result.addOns);
      setJobAddOnsUnavailable(result.unavailable);
    });

    return () => {
      active = false;
    };
  }, [selectedJobId]);

  return {
    selectedJob,
    setSelectedJob,
    jobDetailUnavailable,
    isLoadingDetail,
    selectedJobAddOns,
    setSelectedJobAddOns,
    jobAddOnsUnavailable,
  };
}
