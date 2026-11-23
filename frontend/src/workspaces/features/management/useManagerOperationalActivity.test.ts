import { describe, expect, it } from 'vitest';
import type { OperationalActivity } from '../../../api/client';
import {
  appendUniqueOperationalActivity,
  operationalActivityPageOptions,
} from './useManagerOperationalActivity';

function activity(id: string, occurredAt: string): OperationalActivity {
  return {
    id,
    organizationId: 'organization-1',
    eventKind: 'route_published',
    targetId: `target-${id}`,
    actorUserId: 'manager-1',
    occurredAt,
  };
}

describe('manager operational activity coordination', () => {
  it('uses bounded initial and cursor reads', () => {
    expect(operationalActivityPageOptions()).toEqual({ limit: 25 });
    expect(operationalActivityPageOptions('2026-10-14T12:00:00Z')).toEqual({
      before: '2026-10-14T12:00:00Z',
      limit: 25,
    });
  });

  it('appends older activity without duplicating an existing event', () => {
    const newest = activity('activity-1', '2026-10-14T12:00:00Z');
    const older = activity('activity-2', '2026-10-13T12:00:00Z');

    expect(appendUniqueOperationalActivity(
      [newest],
      [newest, older],
    )).toEqual([newest, older]);
  });

  it('preserves page order when every older event is new', () => {
    const first = activity('activity-1', '2026-10-14T12:00:00Z');
    const second = activity('activity-2', '2026-10-13T12:00:00Z');
    const third = activity('activity-3', '2026-10-12T12:00:00Z');

    expect(appendUniqueOperationalActivity([first], [second, third])).toEqual([
      first,
      second,
      third,
    ]);
  });
});
