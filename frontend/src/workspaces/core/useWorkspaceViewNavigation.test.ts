import { describe, expect, it } from 'vitest';
import {
  resolveAuthorizedWorkspaceView,
  workspaceViewScrollTop,
} from './useWorkspaceViewNavigation';

describe('workspace view navigation policy', () => {
  const availableViews = ['home', 'route', 'jobs', 'job'] as const;

  it('preserves an authorized requested destination', () => {
    expect(resolveAuthorizedWorkspaceView('jobs', availableViews, 'home'))
      .toBe('jobs');
  });

  it('fails closed to the persona default when a destination is unavailable', () => {
    expect(resolveAuthorizedWorkspaceView('manager', availableViews, 'home'))
      .toBe('home');
  });

  it('restores a saved destination position unless a reset is requested', () => {
    const positions = { jobs: 640, route: 120 };
    expect(workspaceViewScrollTop(positions, 'jobs')).toBe(640);
    expect(workspaceViewScrollTop(positions, 'jobs', true)).toBe(0);
  });

  it('clamps missing or invalid saved positions to the top', () => {
    expect(workspaceViewScrollTop({}, 'home')).toBe(0);
    expect(workspaceViewScrollTop({ jobs: -20 }, 'jobs')).toBe(0);
  });
});
