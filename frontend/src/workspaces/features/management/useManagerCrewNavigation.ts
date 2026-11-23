import { useCallback, useReducer } from 'react';
import type { TeamAdministrationActivity } from '../../../api/client';

export interface CrewAdministrationRequest {
  crewId?: string;
  branchId?: string;
  territoryId?: string;
}

export interface CrewHierarchySelection {
  id: string;
  branchId?: string | null;
  territoryId?: string | null;
}

export interface CrewAdministrationInspection {
  summary: string;
  auditLabel: string;
  auditId: string;
  destinationBranchId?: string;
  destinationTerritoryId?: string;
}

export interface ManagerCrewNavigationState {
  crewRequest: CrewAdministrationRequest;
  crewSelectionSignal: number;
  inspection?: CrewAdministrationInspection;
  teamActivityRequest: CrewAdministrationRequest;
  teamActivityRequestSignal: number;
  returnedAuditId?: string;
  returnedAuditSignal: number;
}

export const initialManagerCrewNavigationState: ManagerCrewNavigationState = {
  crewRequest: {},
  crewSelectionSignal: 0,
  teamActivityRequest: {},
  teamActivityRequestSignal: 0,
  returnedAuditSignal: 0,
};

type ManagerCrewNavigationAction =
  | { type: 'open_crew_list' }
  | { type: 'open_crew_administration'; request?: CrewAdministrationRequest }
  | {
    type: 'inspect_crew_move';
    crewId: string;
    inspection: CrewAdministrationInspection;
  }
  | { type: 'return_from_inspection' }
  | { type: 'request_latest_move'; crew: CrewHierarchySelection };

export function managerCrewNavigationReducer(
  state: ManagerCrewNavigationState,
  action: ManagerCrewNavigationAction,
): ManagerCrewNavigationState {
  switch (action.type) {
    case 'open_crew_list':
      return {
        ...state,
        crewRequest: {},
        crewSelectionSignal: state.crewSelectionSignal + 1,
        inspection: undefined,
      };
    case 'open_crew_administration':
      return {
        ...state,
        crewRequest: action.request ?? {},
        crewSelectionSignal: state.crewSelectionSignal + 1,
        inspection: undefined,
      };
    case 'inspect_crew_move':
      return {
        ...state,
        crewRequest: { crewId: action.crewId },
        crewSelectionSignal: state.crewSelectionSignal + 1,
        inspection: action.inspection,
      };
    case 'return_from_inspection':
      return {
        ...state,
        inspection: undefined,
        returnedAuditId: state.inspection?.auditId,
        returnedAuditSignal: state.returnedAuditSignal + 1,
      };
    case 'request_latest_move':
      return {
        ...state,
        inspection: undefined,
        teamActivityRequest: {
          crewId: action.crew.id,
          branchId: action.crew.branchId ?? undefined,
          territoryId: action.crew.territoryId ?? undefined,
        },
        teamActivityRequestSignal: state.teamActivityRequestSignal + 1,
      };
  }
}

export function crewAdministrationInspectionFromActivity(
  activity: TeamAdministrationActivity,
  occurredAtLabel = new Date(activity.occurredAt).toLocaleString(),
): CrewAdministrationInspection {
  return {
    summary: `${
      activity.crossBranchMove ? 'Cross-branch' : 'Within-branch'
    } audited move: ${
      activity.sourceBranchLabel ?? 'unknown branch'
    } · ${
      activity.sourceTerritoryLabel ?? 'unknown territory'
    } → ${
      activity.destinationBranchLabel ?? 'unknown branch'
    } · ${
      activity.destinationTerritoryLabel ?? 'unknown territory'
    }`,
    auditLabel: `Audit ${activity.id} · ${occurredAtLabel}`,
    auditId: activity.id,
    destinationBranchId: activity.destinationBranchId,
    destinationTerritoryId: activity.destinationTerritoryId,
  };
}

export function useManagerCrewNavigation() {
  const [state, dispatch] = useReducer(
    managerCrewNavigationReducer,
    initialManagerCrewNavigationState,
  );

  const openCrewList = useCallback(() => {
    dispatch({ type: 'open_crew_list' });
  }, []);

  const openCrewAdministration = useCallback((request?: CrewAdministrationRequest) => {
    dispatch({ type: 'open_crew_administration', request });
  }, []);

  const inspectCrewMove = useCallback((activity: TeamAdministrationActivity) => {
    dispatch({
      type: 'inspect_crew_move',
      crewId: activity.targetId,
      inspection: crewAdministrationInspectionFromActivity(activity),
    });
  }, []);

  const returnFromInspection = useCallback(() => {
    const auditId = state.inspection?.auditId;
    dispatch({ type: 'return_from_inspection' });
    return auditId;
  }, [state.inspection?.auditId]);

  const requestLatestMove = useCallback((crew: CrewHierarchySelection) => {
    dispatch({ type: 'request_latest_move', crew });
  }, []);

  return {
    ...state,
    openCrewList,
    openCrewAdministration,
    inspectCrewMove,
    returnFromInspection,
    requestLatestMove,
  };
}
