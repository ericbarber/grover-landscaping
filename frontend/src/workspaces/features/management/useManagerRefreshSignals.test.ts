import { describe, expect, it } from 'vitest';
import {
  initialManagerRefreshSignals,
  managerRefreshSignalsReducer,
  type ManagerRefreshEvent,
  type ManagerRefreshSignals,
} from './useManagerRefreshSignals';

function changedSignals(event: ManagerRefreshEvent): Array<keyof ManagerRefreshSignals> {
  const updated = managerRefreshSignalsReducer(initialManagerRefreshSignals, event);
  return Object.entries(updated)
    .filter(([, value]) => value === 1)
    .map(([key]) => key as keyof ManagerRefreshSignals);
}

describe('manager refresh signal coordination', () => {
  it.each<{
    event: ManagerRefreshEvent;
    expected: Array<keyof ManagerRefreshSignals>;
  }>([
    {
      event: { type: 'first_owner_progress_changed' },
      expected: ['firstOwnerProgress'],
    },
    {
      event: { type: 'crew_created' },
      expected: ['crew', 'dispatchHierarchy'],
    },
    {
      event: { type: 'crew_changed' },
      expected: ['teamActivity', 'crew', 'dispatchHierarchy'],
    },
    {
      event: { type: 'day_plan_published' },
      expected: ['dayPlan', 'firstOwnerProgress'],
    },
    {
      event: { type: 'property_onboarding_saved' },
      expected: ['propertyOnboarding', 'customerAccount'],
    },
    {
      event: { type: 'property_setup_changed' },
      expected: ['customerAccount'],
    },
    {
      event: { type: 'team_changed' },
      expected: ['teamActivity', 'firstOwnerProgress'],
    },
    {
      event: { type: 'dispatch_hierarchy_changed' },
      expected: ['teamActivity', 'dispatchHierarchy'],
    },
  ])('refreshes only the dependent views for $event.type', ({ event, expected }) => {
    expect(changedSignals(event)).toEqual(expected);
  });

  it('increments from the current signal values without resetting other domains', () => {
    const current: ManagerRefreshSignals = {
      ...initialManagerRefreshSignals,
      customerAccount: 4,
      crew: 7,
    };

    expect(managerRefreshSignalsReducer(current, { type: 'property_setup_changed' }))
      .toEqual({
        ...current,
        customerAccount: 5,
      });
  });
});
