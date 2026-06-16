import { describe, expect, it } from 'vitest';
import type { ManagerDraftRoutePlanningMetrics } from './managerDraftRoutePlanningMetrics';
import {
  getManagerDraftRoutePublishActionState,
  getManagerDraftRoutePublishActionStateForDraftRoute,
} from './managerDraftRoutePublishActionState';

const job = {
  id: 'job_1001',
  customerName: 'Customer',
  propertyAddress: '123 Oak Street',
  scheduledDate: '2026-06-16',
  status: 'scheduled' as const,
  beforePhotos: 0,
  afterPhotos: 0,
  checklistItems: 4,
  completedChecklistItems: 0,
};

const stop = {
  id: 'stop_1001',
  jobId: 'job_1001',
  customerName: 'Customer',
  propertyAddress: '123 Oak Street',
  stopOrder: 1,
  jobStatus: 'scheduled' as const,
  stopStatus: 'pending' as const,
  estimatedDriveMinutes: 12,
  estimatedServiceMinutes: 45,
};

function metrics(isReadyToReview: boolean, hasStops: boolean, totalMinutes: number): ManagerDraftRoutePlanningMetrics {
  return {
    summary: {
      stopCount: hasStops ? 1 : 0,
      estimatedMinutes: totalMinutes,
      assignableJobCount: 0,
      hasStops,
      hasAssignableJobs: false,
    },
    workload: {
      driveMinutes: totalMinutes,
      serviceMinutes: 0,
      totalMinutes,
    },
    isReadyToReview,
    needsMoreJobs: false,
  };
}

describe('manager draft route publish action state', () => {
  it('returns enabled publish state for ready metrics', () => {
    const state = getManagerDraftRoutePublishActionState(metrics(true, true, 45), false, true);

    expect(state.guard.canPublish).toBe(true);
    expect(state.button.isDisabled).toBe(false);
    expect(state.message).toBe('This draft route has the minimum review details needed for publishing.');
  });

  it('returns disabled publish state for empty metrics', () => {
    const state = getManagerDraftRoutePublishActionState(metrics(false, false, 0), false, true);

    expect(state.guard.canPublish).toBe(false);
    expect(state.button.isDisabled).toBe(true);
    expect(state.message).toBe('Add at least one job before reviewing this route.');
  });

  it('returns enabled publish state from draft route inputs', () => {
    const state = getManagerDraftRoutePublishActionStateForDraftRoute([job], [stop], false, true);

    expect(state.guard.canPublish).toBe(true);
    expect(state.button.label).toBe('Publish draft route');
  });
});
