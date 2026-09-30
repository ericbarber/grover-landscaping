import { describe, expect, it } from 'vitest';
import { workspacePersonasForRoles } from './resolveWorkspace';
import { selectAvailableWorkspacePersona } from './useWorkspaceSelection';

describe('workspace persona selection', () => {
  it('retains an eligible requested persona', () => {
    const personas = workspacePersonasForRoles(['Manager', 'CrewLead']);

    expect(selectAvailableWorkspacePersona(personas, 'crew-lead').id).toBe('crew-lead');
  });

  it('falls back to the highest-priority eligible persona', () => {
    const personas = workspacePersonasForRoles(['Manager', 'CrewLead']);

    expect(selectAvailableWorkspacePersona(personas, 'support').id).toBe('company-manager');
  });

  it('keeps accounts without an active persona on the safe general workspace', () => {
    const personas = workspacePersonasForRoles([]);

    expect(selectAvailableWorkspacePersona(personas, 'company-owner').id).toBe('general');
  });
});
