import { describe, expect, it } from 'vitest';
import { workspacePersonasForRoles } from '../domain/workspacePersona';
import { workspaceHomeActions } from './WorkspaceHomePanel';

describe('workspace home actions', () => {
  it('shows field shortcuts for crew without duplicating Home', () => {
    const persona = workspacePersonasForRoles(['CrewLead'])[0];
    expect(workspaceHomeActions(persona, true).map((action) => action.view)).toEqual([
      'route',
      'jobs',
      'job',
    ]);
  });

  it('hides job detail until a job is selected', () => {
    const persona = workspacePersonasForRoles(['CrewMember'])[0];
    expect(workspaceHomeActions(persona, false).map((action) => action.view)).toEqual([
      'route',
      'jobs',
    ]);
  });

  it('keeps yard-owner shortcuts customer focused', () => {
    const persona = workspacePersonasForRoles(['PropertyOwner'])[0];
    expect(workspaceHomeActions(persona, false).map((action) => action.view)).toEqual([
      'customer',
    ]);
  });
});
