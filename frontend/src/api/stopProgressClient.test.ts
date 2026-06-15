import { describe, expect, it } from 'vitest';
import { toStopProgress, type ApiStopProgressResponse } from './stopProgressClient';

describe('stop progress API client mapping', () => {
  it('maps API response fields into the frontend model', () => {
    const response: ApiStopProgressResponse = {
      day_plan_id: 'day_plan_1',
      stop_id: 'stop_1',
      status: 'finished',
      persisted: true,
    };

    expect(toStopProgress(response)).toEqual({
      dayPlanId: 'day_plan_1',
      stopId: 'stop_1',
      status: 'finished',
      persisted: true,
    });
  });
});
