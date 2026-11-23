import { useCallback, useReducer } from 'react';

export interface ManagerOperationalExceptionNavigationState {
  requestedExceptionId?: string;
  requestedExceptionSignal: number;
}

export const initialManagerOperationalExceptionNavigationState:
  ManagerOperationalExceptionNavigationState = {
  requestedExceptionSignal: 0,
};

export function managerOperationalExceptionNavigationReducer(
  state: ManagerOperationalExceptionNavigationState,
  exceptionId: string,
): ManagerOperationalExceptionNavigationState {
  const requestedExceptionId = exceptionId.trim();
  if (!requestedExceptionId) return state;
  return {
    requestedExceptionId,
    requestedExceptionSignal: state.requestedExceptionSignal + 1,
  };
}

export function useManagerOperationalExceptionNavigation() {
  const [state, requestException] = useReducer(
    managerOperationalExceptionNavigationReducer,
    initialManagerOperationalExceptionNavigationState,
  );

  const openException = useCallback((exceptionId: string) => {
    requestException(exceptionId);
  }, []);

  return {
    ...state,
    openException,
  };
}
