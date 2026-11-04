import { describe, expect, it } from 'vitest';
import {
  customerHistoryNavigationReducer,
  initialCustomerHistoryNavigationState,
} from './useCustomerHistoryNavigation';

describe('customer history navigation coordination', () => {
  it('clears property detail state when switching history views', () => {
    const propertyDetail = {
      activeView: 'properties' as const,
      selectedPropertyId: 'property-1',
      expandedReportPropertyId: 'property-1',
    };

    expect(customerHistoryNavigationReducer(propertyDetail, {
      type: 'change_view',
      view: 'bids',
    })).toEqual({
      activeView: 'bids',
      selectedPropertyId: null,
      expandedReportPropertyId: null,
    });
  });

  it('selects one property with its reports initially collapsed', () => {
    const selected = customerHistoryNavigationReducer(
      {
        ...initialCustomerHistoryNavigationState,
        expandedReportPropertyId: 'property-2',
      },
      { type: 'select_property', propertyId: 'property-1' },
    );

    expect(selected.selectedPropertyId).toBe('property-1');
    expect(selected.expandedReportPropertyId).toBeNull();
  });

  it('toggles older reports for only the requested property', () => {
    const expanded = customerHistoryNavigationReducer(
      initialCustomerHistoryNavigationState,
      { type: 'toggle_older_reports', propertyId: 'property-1' },
    );
    const collapsed = customerHistoryNavigationReducer(expanded, {
      type: 'toggle_older_reports',
      propertyId: 'property-1',
    });

    expect(expanded.expandedReportPropertyId).toBe('property-1');
    expect(collapsed.expandedReportPropertyId).toBeNull();
  });

  it('returns to the property list without retaining report expansion', () => {
    expect(customerHistoryNavigationReducer(
      {
        activeView: 'properties',
        selectedPropertyId: 'property-1',
        expandedReportPropertyId: 'property-1',
      },
      { type: 'show_all_properties' },
    )).toEqual(initialCustomerHistoryNavigationState);
  });
});
