import { describe, expect, it } from 'vitest';
import type { YardCareJob } from './jobs';
import { buildDispatchWorkload, dispatchMoveCapacityImpact } from './managerDispatchWorkload';

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

  it('projects destination capacity without double-counting the moving job', () => {
    const jobs = [
      job('moving', 'crew_1001', 'scheduled'),
      job('destination', 'crew_2002', 'scheduled'),
      job('completed', 'crew_2002', 'completed'),
    ];
    expect(dispatchMoveCapacityImpact(jobs, 'moving', 'crew_2002', '2026-07-19', 1)).toEqual({
      currentJobs: 1,
      projectedJobs: 2,
      capacity: 1,
      overCapacity: true,
    });
  });
});
