import { useCallback, useReducer } from 'react';
import type { JobWorkflowSection } from './fieldWorkspace';

export interface FieldJobNavigationState {
  requestedJobId?: string;
  requestedWorkflow: JobWorkflowSection;
  requestedWorkflowSignal: number;
}

export const initialFieldJobNavigationState: FieldJobNavigationState = {
  requestedWorkflow: 'overview',
  requestedWorkflowSignal: 0,
};

export interface FieldJobNavigationRequest {
  jobId: string;
  workflow: JobWorkflowSection;
}

export function fieldJobNavigationReducer(
  state: FieldJobNavigationState,
  request: FieldJobNavigationRequest,
): FieldJobNavigationState {
  const requestedJobId = request.jobId.trim();
  if (!requestedJobId) return state;
  return {
    requestedJobId,
    requestedWorkflow: request.workflow,
    requestedWorkflowSignal: state.requestedWorkflowSignal + 1,
  };
}

export function useFieldJobNavigation({
  selectedJobId,
  selectJob,
  openJobView,
}: {
  selectedJobId: string | null;
  selectJob: (jobId: string) => void;
  openJobView: (resetDestination: boolean) => void;
}) {
  const [state, requestJob] = useReducer(
    fieldJobNavigationReducer,
    initialFieldJobNavigationState,
  );

  const openJob = useCallback((
    jobId: string,
    workflow: JobWorkflowSection = 'overview',
    resetDestination = jobId.trim() !== selectedJobId,
  ) => {
    const requestedJobId = jobId.trim();
    if (!requestedJobId) return;
    requestJob({ jobId: requestedJobId, workflow });
    selectJob(requestedJobId);
    openJobView(resetDestination);
  }, [openJobView, selectJob, selectedJobId]);

  return { ...state, openJob };
}
