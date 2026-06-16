import { describe, expect, it } from 'vitest';
import { getManagerDraftRoutePlanningMetrics } from './managerDraftRoutePlanningMetrics';

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

describe('manager draft route planning metrics', () => {
  it('marks routes with stops and workload ready to review', () => {
    expect(getManagerDraftRoutePlanningMetrics([job], [stop]).isReadyToReview).toBe(true);
  });

  it('does not mark empty routes ready to review', () => {
    expect(getManagerDraftRoutePlanningMetrics([job], []).isReadyToReview).toBe(false);
  });
});
