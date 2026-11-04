import { useCallback, useReducer } from 'react';

export type CustomerHistoryView = 'properties' | 'bids';

export interface CustomerHistoryNavigationState {
  activeView: CustomerHistoryView;
  selectedPropertyId: string | null;
  expandedReportPropertyId: string | null;
}

export const initialCustomerHistoryNavigationState: CustomerHistoryNavigationState = {
  activeView: 'properties',
  selectedPropertyId: null,
  expandedReportPropertyId: null,
};

type CustomerHistoryNavigationAction =
  | { type: 'change_view'; view: CustomerHistoryView }
  | { type: 'select_property'; propertyId: string }
  | { type: 'show_all_properties' }
  | { type: 'toggle_older_reports'; propertyId: string };

export function customerHistoryNavigationReducer(
  state: CustomerHistoryNavigationState,
  action: CustomerHistoryNavigationAction,
): CustomerHistoryNavigationState {
  switch (action.type) {
    case 'change_view':
      return {
        activeView: action.view,
        selectedPropertyId: null,
        expandedReportPropertyId: null,
      };
    case 'select_property':
      return {
        ...state,
        selectedPropertyId: action.propertyId,
        expandedReportPropertyId: null,
      };
    case 'show_all_properties':
      return {
        ...state,
        selectedPropertyId: null,
        expandedReportPropertyId: null,
      };
    case 'toggle_older_reports':
      return {
        ...state,
        expandedReportPropertyId:
          state.expandedReportPropertyId === action.propertyId
            ? null
            : action.propertyId,
      };
  }
}

export function useCustomerHistoryNavigation() {
  const [state, dispatch] = useReducer(
    customerHistoryNavigationReducer,
    initialCustomerHistoryNavigationState,
  );

  const changeView = useCallback((view: CustomerHistoryView) => {
    dispatch({ type: 'change_view', view });
  }, []);

  const selectProperty = useCallback((propertyId: string) => {
    dispatch({ type: 'select_property', propertyId });
  }, []);

  const showAllProperties = useCallback(() => {
    dispatch({ type: 'show_all_properties' });
  }, []);

  const toggleOlderReports = useCallback((propertyId: string) => {
    dispatch({ type: 'toggle_older_reports', propertyId });
  }, []);

  return {
    ...state,
    changeView,
    selectProperty,
    showAllProperties,
    toggleOlderReports,
  };
}
