import { describe, expect, it } from 'vitest';
import { workspacePersonasForRoles } from '../domain/workspacePersona';
import {
  homeGreeting,
  personaHomeHeadline,
  workspaceHomeActions,
} from './WorkspaceHomePanel';

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

  it('uses a time-aware welcome without depending on the current clock', () => {
    expect(homeGreeting(8)).toBe('Good morning');
    expect(homeGreeting(14)).toBe('Good afternoon');
    expect(homeGreeting(20)).toBe('Good evening');
  });

  it('gives major personas a focused first-impression headline', () => {
    expect(personaHomeHeadline(workspacePersonasForRoles(['PropertyOwner'])[0]))
      .toBe('Your yard, all in one place.');
    expect(personaHomeHeadline(workspacePersonasForRoles(['CrewLead'])[0]))
      .toBe('A clear plan for the work ahead.');
    expect(personaHomeHeadline(workspacePersonasForRoles(['OrganizationOwner'])[0]))
      .toBe('Run today with confidence.');
  });
});
