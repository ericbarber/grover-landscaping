import { describe, expect, it } from 'vitest';
import {
  mobileWorkspaceContext,
  mobileWorkspaceScrollTop,
} from './MobileWorkspaceShell';

const baseInput = {
  assignedJobCount: 3,
  pendingChangeCount: 0,
  personaDescription: 'Today’s route and field work',
  personaLabel: 'Crew lead',
};

describe('mobileWorkspaceContext', () => {
  it('keeps route sync and workload context visible', () => {
    expect(mobileWorkspaceContext({ ...baseInput, view: 'route' })).toEqual({
      eyebrow: 'Today',
      title: 'Crew route',
      detail: '3 assigned jobs · Synced',
    });
    expect(mobileWorkspaceContext({
      ...baseInput,
      view: 'route',
      pendingChangeCount: 2,
    }).detail).toBe('2 changes waiting to sync');
  });

  it('identifies the selected job without relying on scroll position', () => {
    expect(mobileWorkspaceContext({
      ...baseInput,
      view: 'job',
      selectedCustomerName: 'Desert Bloom HOA',
      selectedPropertyAddress: '100 Palm Way',
      selectedJobStatus: 'in_progress',
    })).toEqual({
      eyebrow: 'in progress',
      title: 'Desert Bloom HOA',
      detail: '100 Palm Way',
    });
  });

  it('provides manager organization context', () => {
    expect(mobileWorkspaceContext({ ...baseInput, view: 'manager' })).toEqual({
      eyebrow: 'Crew lead',
      title: 'Operations',
      detail: 'Today’s route and field work',
    });
  });

  it('provides customer context for yard owners and property managers', () => {
    expect(mobileWorkspaceContext({
      ...baseInput,
      view: 'customer',
      personaDescription: 'My properties and service',
      personaLabel: 'Yard owner',
    }).title).toBe('My yard');
    expect(mobileWorkspaceContext({
      ...baseInput,
      view: 'customer',
      personaDescription: 'Portfolio service and approvals',
      personaLabel: 'Property manager',
    }).title).toBe('Property portfolio');
  });

  it('restores a saved view position and resets a newly selected job', () => {
    const positions = { jobs: 640, route: 120 };
    expect(mobileWorkspaceScrollTop(positions, 'jobs')).toBe(640);
    expect(mobileWorkspaceScrollTop(positions, 'job', true)).toBe(0);
    expect(mobileWorkspaceScrollTop({ jobs: -20 }, 'jobs')).toBe(0);
  });
});
