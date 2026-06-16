import { describe, expect, it } from 'vitest';
import { getManagerDraftRoutePublishMessage } from './managerDraftRoutePublishMessage';

describe('manager draft route publish message helper', () => {
  it('returns the disabled reason when present', () => {
    expect(getManagerDraftRoutePublishMessage('Add at least one job before reviewing this route.')).toBe(
      'Add at least one job before reviewing this route.',
    );
  });

  it('returns ready copy when there is no disabled reason', () => {
    expect(getManagerDraftRoutePublishMessage(null)).toBe(
      'This draft route has the minimum review details needed for publishing.',
    );
  });
});
