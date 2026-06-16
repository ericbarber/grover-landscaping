import { describe, expect, it } from 'vitest';
import {
  getManagerDraftRoutePublishGuard,
  getManagerDraftRoutePublishGuardFromMetrics,
} from './managerDraftRoutePublishGuard';

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

describe('manager draft route publish guard', () => {
  it('allows publishing ready routes', () => {
    expect(getManagerDraftRoutePublishGuard([job], [stop])).toEqual({
      canPublish: true,
      disabledReason: null,
    });
  });

  it('blocks empty routes', () => {
    expect(getManagerDraftRoutePublishGuard([job], [])).toEqual({
      canPublish: false,
      disabledReason: 'Add at least one job before reviewing this route.',
    });
  });

  it('allows publishing when precomputed metrics are ready', () => {
    expect(
      getManagerDraftRoutePublishGuardFromMetrics({
        summary: {
          stopCount: 1,
          estimatedMinutes: 57,
          assignableJobCount: 0,
          hasStops: true,
          hasAssignableJobs: false,
        },
        workload: {
          driveMinutes: 12,
          serviceMinutes: 45,
          totalMinutes: 57,
        },
        isReadyToReview: true,
        needsMoreJobs: false,
      }),
    ).toEqual({
      canPublish: true,
      disabledReason: null,
    });
  });
});
