import { describe, expect, it } from 'vitest';
import {
  countFinishedStops,
  getNextStopStatus,
  resetStopStates,
  resolveStopStatus,
  syncStatusLabel,
} from './stopProgress';

describe('stop progress helpers', () => {
  it('advances pending stops to in progress', () => {
    expect(getNextStopStatus('pending')).toBe('in_progress');
    expect(getNextStopStatus(undefined)).toBe('in_progress');
  });

  it('advances in-progress and finished stops to finished', () => {
    expect(getNextStopStatus('in_progress')).toBe('finished');
    expect(getNextStopStatus('finished')).toBe('finished');
  });

  it('resolves local status before server status', () => {
    expect(resolveStopStatus('finished', 'in_progress')).toBe('finished');
  });

  it('resolves server status when local status is missing', () => {
    expect(resolveStopStatus(undefined, 'in_progress')).toBe('in_progress');
  });

  it('defaults unresolved stops to pending', () => {
    expect(resolveStopStatus(undefined, undefined)).toBe('pending');
  });

  it('counts finished stops', () => {
    expect(
      countFinishedStops(['stop_1001', 'stop_1002'], {
        stop_1001: 'finished',
        stop_1002: 'in_progress',
      }),
    ).toBe(1);
  });

  it('resets stop state maps', () => {
    expect(resetStopStates()).toEqual({});
  });

  it('formats route progress sync labels', () => {
    expect(syncStatusLabel('local')).toBe('saved locally');
    expect(syncStatusLabel('syncing')).toBe('syncing');
    expect(syncStatusLabel('synced')).toBe('synced');
  });
});
