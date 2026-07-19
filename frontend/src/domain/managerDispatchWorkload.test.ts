import { describe, expect, it } from 'vitest';
import type { YardCareJob } from './jobs';
import { buildDispatchWorkload } from './managerDispatchWorkload';

function job(id: string, assignedCrewId: string | undefined, status: YardCareJob['status']): YardCareJob {
  return {
    id,
    assignedCrewId,
    customerName: id,
    propertyAddress: `${id} Palm Avenue`,
    scheduledDate: '2026-07-19',
    status,
    beforePhotos: 0,
    afterPhotos: 0,
    checklistItems: 4,
    completedChecklistItems: 0,
  };
}

describe('manager dispatch workload', () => {
  it('groups day-level workload by crew and prioritizes unassigned work', () => {
    const groups = buildDispatchWorkload([
      job('scheduled', 'crew_1001', 'scheduled'),
      job('active', 'crew_1001', 'in_progress'),
      job('unassigned', undefined, 'scheduled'),
    ]);

    expect(groups.map((group) => group.crewId)).toEqual([undefined, 'crew_1001']);
    expect(groups[0].needsAssignment).toBe(true);
    expect(groups[1]).toMatchObject({ scheduled: 1, inProgress: 1, completed: 0 });
  });
});
