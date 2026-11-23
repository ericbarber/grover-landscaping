import {
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { ApiRequestError } from '../../../api/apiError';
import { fetchJobs } from '../../../api/client';
import { seedJobs, type YardCareJob } from '../../../domain/jobs';

export type FieldJobsRead =
  | { state: 'ready'; jobs: YardCareJob[] }
  | { state: 'fallback'; jobs: YardCareJob[] }
  | { state: 'unavailable'; jobs: [] };

export async function readFieldJobs(
  load: () => Promise<YardCareJob[]> = fetchJobs,
): Promise<FieldJobsRead> {
  try {
    return { state: 'ready', jobs: await load() };
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return { state: 'unavailable', jobs: [] };
    }
    return { state: 'fallback', jobs: seedJobs };
  }
}

export interface FieldJobs {
  jobs: YardCareJob[];
  setJobs: Dispatch<SetStateAction<YardCareJob[]>>;
  selectedJobId: string | null;
  setSelectedJobId: Dispatch<SetStateAction<string | null>>;
  readState: 'loading' | FieldJobsRead['state'];
  isLoadingJobs: boolean;
  jobsUnavailable: boolean;
}

export function useFieldJobs(): FieldJobs {
  const [jobs, setJobs] = useState<YardCareJob[]>(seedJobs);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(seedJobs[0]?.id ?? null);
  const [readState, setReadState] = useState<FieldJobs['readState']>('loading');
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);

  useEffect(() => {
    let active = true;

    void readFieldJobs()
      .then((result) => {
        if (!active) return;
        setJobs(result.jobs);
        setReadState(result.state);
        if (result.state === 'unavailable') {
          setSelectedJobId(null);
        } else {
          setSelectedJobId((current) => current ?? result.jobs[0]?.id ?? null);
        }
      })
      .finally(() => {
        if (active) setIsLoadingJobs(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return {
    jobs,
    setJobs,
    selectedJobId,
    setSelectedJobId,
    readState,
    isLoadingJobs,
    jobsUnavailable: readState === 'unavailable',
  };
}
