import { describe, expect, it } from 'vitest';
import { getCompletionProgress, type YardCareJob } from './jobs';

function makeJob(overrides: Partial<YardCareJob>): YardCareJob {
  return {
    id: 'job_test',
    customerName: 'Test Customer',
    propertyAddress: '100 Test Lane',
    scheduledDate: '2026-06-15',
    status: 'scheduled',
    beforePhotos: 0,
    afterPhotos: 0,
    checklistItems: 4,
    completedChecklistItems: 0,
    ...overrides,
  };
}

describe('getCompletionProgress', () => {
  it('returns a rounded percentage for checklist completion', () => {
    const job = makeJob({ checklistItems: 4, completedChecklistItems: 3 });

    expect(getCompletionProgress(job)).toBe(75);
  });

  it('returns zero when a job has no checklist items', () => {
    const job = makeJob({ checklistItems: 0, completedChecklistItems: 0 });

    expect(getCompletionProgress(job)).toBe(0);
  });
});
