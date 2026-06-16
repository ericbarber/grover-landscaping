import { describe, expect, it } from 'vitest';
import type { ManagerDraftRoutePlanningMetrics } from './managerDraftRoutePlanningMetrics';
import { getManagerDraftRoutePublishActionState } from './managerDraftRoutePublishActionState';

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
});
