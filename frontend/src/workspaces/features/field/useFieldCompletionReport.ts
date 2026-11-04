import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import {
  fetchCompletionReport,
  type CompletionReportSnapshot,
} from '../../../api/client';

export type FieldCompletionReportRead =
  | { state: 'ready'; report: CompletionReportSnapshot }
  | { state: 'fallback'; report: null };

export async function readFieldCompletionReport(
  jobId: string,
  load: (jobId: string) => Promise<CompletionReportSnapshot> = fetchCompletionReport,
): Promise<FieldCompletionReportRead> {
  try {
    return { state: 'ready', report: await load(jobId) };
  } catch {
    return { state: 'fallback', report: null };
  }
}

export interface FieldCompletionReportCallbacks {
  onLoaded: (report: CompletionReportSnapshot) => void;
  onFallback: (jobId: string) => void;
}

export interface FieldCompletionReport {
  selectedCompletionReport: CompletionReportSnapshot | null;
  setSelectedCompletionReport: Dispatch<SetStateAction<CompletionReportSnapshot | null>>;
}

export function useFieldCompletionReport(
  selectedJobId: string | null,
  callbacks: FieldCompletionReportCallbacks,
): FieldCompletionReport {
  const [selectedCompletionReport, setSelectedCompletionReport] =
    useState<CompletionReportSnapshot | null>(null);
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    if (!selectedJobId) {
      setSelectedCompletionReport(null);
      return;
    }

    let active = true;
    setSelectedCompletionReport(null);

    void readFieldCompletionReport(selectedJobId).then((result) => {
      if (!active) return;
      if (result.report) {
        setSelectedCompletionReport(result.report);
        callbacksRef.current.onLoaded(result.report);
      } else {
        callbacksRef.current.onFallback(selectedJobId);
      }
    });

    return () => {
      active = false;
    };
  }, [selectedJobId]);

  return { selectedCompletionReport, setSelectedCompletionReport };
}
