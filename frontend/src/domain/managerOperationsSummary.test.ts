import { describe, expect, it } from 'vitest';
import type { CrewRecord } from '../api/client';
import type { YardCareJob } from './jobs';
import { summarizeManagerOperations } from './managerOperationsSummary';

const crews: CrewRecord[] = [
  {
    id: 'crew_north',
    name: 'North crew',
    organizationId: 'org_demo',
    status: 'active',
    dailyStopCapacity: 8,
    leadMembershipId: 'member_lead',
    persisted: true,
  },
  {
    id: 'crew_south',
    name: 'South crew',
    organizationId: 'org_demo',
    status: 'active',
    dailyStopCapacity: 8,
    leadMembershipId: null,
    persisted: true,
  },
  {
    id: 'crew_spare',
    name: 'Spare crew',
    organizationId: 'org_demo',
    status: 'inactive',
    dailyStopCapacity: 6,
    leadMembershipId: null,
    persisted: true,
  },
];

function job(overrides: Partial<YardCareJob>): YardCareJob {
  return {
    id: 'job_1',
    customerName: 'Oak Street Residence',
    propertyAddress: '123 Oak Street',
    scheduledDate: '2026-08-22',
    status: 'scheduled',
    beforePhotos: 0,
    afterPhotos: 0,
    checklistItems: 4,
    completedChecklistItems: 0,
    ...overrides,
  };
}

describe('summarizeManagerOperations', () => {
  it('summarizes only active work on the selected service date', () => {
    const summary = summarizeManagerOperations(crews, [
      job({ id: 'assigned', assignedCrewId: 'crew_north' }),
      job({ id: 'unassigned' }),
      job({ id: 'complete', status: 'completed' }),
      job({ id: 'tomorrow', scheduledDate: '2026-08-23' }),
    ], '2026-08-22');

    expect(summary).toEqual({
      activeCrews: 2,
      totalCrews: 3,
      scheduledWork: 2,
      unassignedWork: 1,
      crewsMissingLead: 1,
    });
  });
});
