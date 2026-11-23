import { useCallback, useReducer } from 'react';

export interface ManagerRefreshSignals {
  dayPlan: number;
  propertyOnboarding: number;
  customerAccount: number;
  teamActivity: number;
  firstOwnerProgress: number;
  crew: number;
  dispatchHierarchy: number;
}

export const initialManagerRefreshSignals: ManagerRefreshSignals = {
  dayPlan: 0,
  propertyOnboarding: 0,
  customerAccount: 0,
  teamActivity: 0,
  firstOwnerProgress: 0,
  crew: 0,
  dispatchHierarchy: 0,
};

export type ManagerRefreshEvent =
  | { type: 'first_owner_progress_changed' }
  | { type: 'crew_created' }
  | { type: 'crew_changed' }
  | { type: 'day_plan_published' }
  | { type: 'property_onboarding_saved' }
  | { type: 'property_setup_changed' }
  | { type: 'team_changed' }
  | { type: 'dispatch_hierarchy_changed' };

function increment(
  state: ManagerRefreshSignals,
  keys: ReadonlyArray<keyof ManagerRefreshSignals>,
): ManagerRefreshSignals {
  const next = { ...state };
  keys.forEach((key) => {
    next[key] += 1;
  });
  return next;
}

export function managerRefreshSignalsReducer(
  state: ManagerRefreshSignals,
  event: ManagerRefreshEvent,
): ManagerRefreshSignals {
  switch (event.type) {
    case 'first_owner_progress_changed':
      return increment(state, ['firstOwnerProgress']);
    case 'crew_created':
      return increment(state, ['crew', 'dispatchHierarchy']);
    case 'crew_changed':
      return increment(state, ['crew', 'dispatchHierarchy', 'teamActivity']);
    case 'day_plan_published':
      return increment(state, ['dayPlan', 'firstOwnerProgress']);
    case 'property_onboarding_saved':
      return increment(state, ['propertyOnboarding', 'customerAccount']);
    case 'property_setup_changed':
      return increment(state, ['customerAccount']);
    case 'team_changed':
      return increment(state, ['teamActivity', 'firstOwnerProgress']);
    case 'dispatch_hierarchy_changed':
      return increment(state, ['dispatchHierarchy', 'teamActivity']);
  }
}

export function useManagerRefreshSignals() {
  const [signals, dispatch] = useReducer(
    managerRefreshSignalsReducer,
    initialManagerRefreshSignals,
  );

  const markFirstOwnerProgressChanged = useCallback(() => {
    dispatch({ type: 'first_owner_progress_changed' });
  }, []);
  const markCrewCreated = useCallback(() => {
    dispatch({ type: 'crew_created' });
  }, []);
  const markCrewChanged = useCallback(() => {
    dispatch({ type: 'crew_changed' });
  }, []);
  const markDayPlanPublished = useCallback(() => {
    dispatch({ type: 'day_plan_published' });
  }, []);
  const markPropertyOnboardingSaved = useCallback(() => {
    dispatch({ type: 'property_onboarding_saved' });
  }, []);
  const markPropertySetupChanged = useCallback(() => {
    dispatch({ type: 'property_setup_changed' });
  }, []);
  const markTeamChanged = useCallback(() => {
    dispatch({ type: 'team_changed' });
  }, []);
  const markDispatchHierarchyChanged = useCallback(() => {
    dispatch({ type: 'dispatch_hierarchy_changed' });
  }, []);

  return {
    signals,
    markFirstOwnerProgressChanged,
    markCrewCreated,
    markCrewChanged,
    markDayPlanPublished,
    markPropertyOnboardingSaved,
    markPropertySetupChanged,
    markTeamChanged,
    markDispatchHierarchyChanged,
  };
}
