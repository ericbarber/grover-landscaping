import { useCallback, useEffect, useReducer } from 'react';
import type { CrewRouteOverview } from '../../../domain/dayPlans';

export const initialFieldRouteOverview: CrewRouteOverview = {
  source: 'loading',
  totalStops: 0,
  completedStops: 0,
};

type FieldRouteOverviewAction =
  | { type: 'updated'; contextKey: string | null; overview: CrewRouteOverview }
  | { type: 'reset'; contextKey: string | null };

export interface FieldRouteOverviewState {
  contextKey: string | null;
  overview: CrewRouteOverview;
}

export function fieldRouteOverviewReducer(
  state: FieldRouteOverviewState,
  action: FieldRouteOverviewAction,
): FieldRouteOverviewState {
  switch (action.type) {
    case 'updated':
      return {
        contextKey: action.contextKey,
        overview: action.overview,
      };
    case 'reset':
      return {
        contextKey: action.contextKey,
        overview: initialFieldRouteOverview,
      };
  }
}

export function resolveFieldRouteOverview(
  state: FieldRouteOverviewState,
  contextKey: string | null,
): CrewRouteOverview {
  return state.contextKey === contextKey
    ? state.overview
    : initialFieldRouteOverview;
}

export function useFieldRouteOverview({
  enabled,
  scopeKey,
}: {
  enabled: boolean;
  scopeKey: string;
}) {
  const contextKey = enabled ? scopeKey : null;
  const [state, dispatch] = useReducer(
    fieldRouteOverviewReducer,
    {
      contextKey,
      overview: initialFieldRouteOverview,
    },
  );
  const overview = resolveFieldRouteOverview(state, contextKey);

  useEffect(() => {
    if (state.contextKey === contextKey) return;
    dispatch({ type: 'reset', contextKey });
  }, [contextKey, state.contextKey]);

  const updateOverview = useCallback((nextOverview: CrewRouteOverview) => {
    if (!enabled) return;
    dispatch({ type: 'updated', contextKey, overview: nextOverview });
  }, [contextKey, enabled]);

  return { overview, updateOverview };
}
