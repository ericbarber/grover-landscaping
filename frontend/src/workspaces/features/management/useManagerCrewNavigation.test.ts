import { describe, expect, it } from 'vitest';
import type { TeamAdministrationActivity } from '../../../api/client';
import {
  crewAdministrationInspectionFromActivity,
  initialManagerCrewNavigationState,
  managerCrewNavigationReducer,
} from './useManagerCrewNavigation';

const moveActivity: TeamAdministrationActivity = {
  id: 'audit-42',
  actorUserId: 'manager-1',
  actorLabel: 'Manager One',
  organizationId: 'organization-1',
  eventKind: 'crew_hierarchy_updated',
  targetId: 'crew-7',
  targetLabel: 'North Crew',
  sourceBranchLabel: 'Phoenix',
  sourceTerritoryLabel: 'North',
  destinationBranchLabel: 'Mesa',
  destinationTerritoryLabel: 'East',
  destinationBranchId: 'branch-2',
  destinationTerritoryId: 'territory-4',
  crossBranchMove: true,
  occurredAt: '2026-10-17T16:05:00Z',
};

describe('manager crew navigation coordination', () => {
  it('builds bounded inspection context from an audited hierarchy move', () => {
    expect(crewAdministrationInspectionFromActivity(
      moveActivity,
      '10/17/2026, 9:05:00 AM',
    )).toEqual({
      summary: 'Cross-branch audited move: Phoenix · North → Mesa · East',
      auditLabel: 'Audit audit-42 · 10/17/2026, 9:05:00 AM',
      auditId: 'audit-42',
      destinationBranchId: 'branch-2',
      destinationTerritoryId: 'territory-4',
    });
  });

  it('returns to the exact inspected audit and clears stale inspection context', () => {
    const inspecting = managerCrewNavigationReducer(
      initialManagerCrewNavigationState,
      {
        type: 'inspect_crew_move',
        crewId: moveActivity.targetId,
        inspection: crewAdministrationInspectionFromActivity(moveActivity, 'occurred'),
      },
    );

    const returned = managerCrewNavigationReducer(inspecting, {
      type: 'return_from_inspection',
    });

    expect(returned.inspection).toBeUndefined();
    expect(returned.returnedAuditId).toBe('audit-42');
    expect(returned.returnedAuditSignal).toBe(1);
  });

  it('clears prior inspection when dispatch opens ordinary crew administration', () => {
    const inspecting = managerCrewNavigationReducer(
      initialManagerCrewNavigationState,
      {
        type: 'inspect_crew_move',
        crewId: moveActivity.targetId,
        inspection: crewAdministrationInspectionFromActivity(moveActivity, 'occurred'),
      },
    );

    const opened = managerCrewNavigationReducer(inspecting, {
      type: 'open_crew_administration',
      request: { crewId: 'crew-9', branchId: 'branch-3' },
    });

    expect(opened.inspection).toBeUndefined();
    expect(opened.crewRequest).toEqual({ crewId: 'crew-9', branchId: 'branch-3' });
    expect(opened.crewSelectionSignal).toBe(2);
  });

  it('opens the full crew list without retaining a prior crew or audit', () => {
    const inspecting = managerCrewNavigationReducer(
      initialManagerCrewNavigationState,
      {
        type: 'inspect_crew_move',
        crewId: moveActivity.targetId,
        inspection: crewAdministrationInspectionFromActivity(moveActivity, 'occurred'),
      },
    );

    const opened = managerCrewNavigationReducer(inspecting, {
      type: 'open_crew_list',
    });

    expect(opened.crewRequest).toEqual({});
    expect(opened.inspection).toBeUndefined();
    expect(opened.crewSelectionSignal).toBe(2);
  });

  it('requests the latest move with exact crew hierarchy scope', () => {
    const requested = managerCrewNavigationReducer(
      initialManagerCrewNavigationState,
      {
        type: 'request_latest_move',
        crew: {
          id: 'crew-9',
          branchId: 'branch-3',
          territoryId: 'territory-8',
        },
      },
    );

    expect(requested.teamActivityRequest).toEqual({
      crewId: 'crew-9',
      branchId: 'branch-3',
      territoryId: 'territory-8',
    });
    expect(requested.teamActivityRequestSignal).toBe(1);
  });
});
