import { describe, expect, it } from 'vitest';
import {
  fieldJobNavigationReducer,
  initialFieldJobNavigationState,
} from './useFieldJobNavigation';

describe('field job navigation coordination', () => {
  it('targets an exact job workflow', () => {
    expect(fieldJobNavigationReducer(initialFieldJobNavigationState, {
      jobId: ' job-42 ',
      workflow: 'report',
    })).toEqual({
      requestedJobId: 'job-42',
      requestedWorkflow: 'report',
      requestedWorkflowSignal: 1,
    });
  });

  it('advances the signal for a repeated request to the same job workflow', () => {
    const requested = fieldJobNavigationReducer(initialFieldJobNavigationState, {
      jobId: 'job-42',
      workflow: 'overview',
    });

    expect(fieldJobNavigationReducer(requested, {
      jobId: 'job-42',
      workflow: 'overview',
    })).toEqual({
      requestedJobId: 'job-42',
      requestedWorkflow: 'overview',
      requestedWorkflowSignal: 2,
    });
  });

  it('ignores an empty job request without discarding current context', () => {
    const requested = fieldJobNavigationReducer(initialFieldJobNavigationState, {
      jobId: 'job-42',
      workflow: 'checklist',
    });

    expect(fieldJobNavigationReducer(requested, {
      jobId: '   ',
      workflow: 'report',
    })).toBe(requested);
  });
});
