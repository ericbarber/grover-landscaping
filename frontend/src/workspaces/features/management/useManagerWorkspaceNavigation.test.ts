import { describe, expect, it } from 'vitest';
import type { WorkspaceCapability } from '../../core/types';
import {
  managerWorkspaceSectionSelection,
  resolveManagerWorkspaceNavigation,
} from './useManagerWorkspaceNavigation';

const companyCapabilities = new Set<WorkspaceCapability>([
  'company_readiness',
  'customers_and_team',
]);

describe('manager workspace navigation coordination', () => {
  it('fails closed when the requested section is unavailable', () => {
    expect(resolveManagerWorkspaceNavigation(
      { section: 'recovery', tool: 'photo-processing' },
      {
        personaId: 'company-owner',
        rolloutUnit: 'o1',
        capabilities: companyCapabilities,
      },
    )).toEqual({ section: null, tool: null });
  });

  it('keeps an authorized section but clears a mismatched tool', () => {
    expect(resolveManagerWorkspaceNavigation(
      { section: 'overview', tool: 'team-overview' },
      {
        personaId: 'company-owner',
        rolloutUnit: 'o3',
        capabilities: companyCapabilities,
      },
    )).toEqual({ section: 'overview', tool: null });
  });

  it('opens company-owner team navigation on its overview', () => {
    expect(managerWorkspaceSectionSelection('team', {
      personaId: 'company-owner',
      rolloutUnit: 'o3',
      capabilities: companyCapabilities,
    })).toEqual({ section: 'team', tool: 'team-overview' });
  });

  it('does not infer a default team tool without server capability', () => {
    expect(managerWorkspaceSectionSelection('team', {
      personaId: 'company-owner',
      rolloutUnit: 'o3',
      capabilities: new Set<WorkspaceCapability>(),
    })).toEqual({ section: null, tool: null });
  });

  it('preserves an exact authorized section and tool pair', () => {
    expect(resolveManagerWorkspaceNavigation(
      { section: 'team', tool: 'team-overview' },
      {
        personaId: 'company-owner',
        rolloutUnit: 'o3',
        capabilities: companyCapabilities,
      },
    )).toEqual({ section: 'team', tool: 'team-overview' });
  });
});
