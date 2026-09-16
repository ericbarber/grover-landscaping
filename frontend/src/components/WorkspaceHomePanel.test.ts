import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { workspacePersonasForRoles } from '../domain/workspacePersona';
import {
  homeGreeting,
  homeContinuityStatus,
  homePriorityStatus,
  personaHomeHeadline,
  personaHomePromise,
  personaProgressLanguage,
  workspaceHomeActions,
  WorkspaceHomePanel,
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

  it('connects each major audience to a relevant product promise', () => {
    expect(personaHomePromise(workspacePersonasForRoles(['PropertyOwner'])[0]))
      .toContain('care behind every visit');
    expect(personaHomePromise(workspacePersonasForRoles(['CrewLead'])[0]))
      .toContain('every stop');
    expect(personaHomePromise(workspacePersonasForRoles(['OrganizationOwner'])[0]))
      .toContain('business customers trust');
  });

  it('describes progress in language that matches the active persona', () => {
    expect(personaProgressLanguage(workspacePersonasForRoles(['PropertyOwner'])[0]))
      .toEqual({
        eyebrow: 'Service progress', completed: 'visits complete', total: 'scheduled',
        itemSingular: 'visit', itemPlural: 'visits',
      });
    expect(personaProgressLanguage(workspacePersonasForRoles(['CrewLead'])[0]).eyebrow)
      .toBe('Route progress');
    expect(personaProgressLanguage(workspacePersonasForRoles(['OrganizationOwner'])[0]).eyebrow)
      .toBe('Field delivery');
  });

  it('prioritizes unsynced changes over routine progress', () => {
    expect(homePriorityStatus({
      assignedJobCount: 4,
      completedJobCount: 2,
      pendingChangeCount: 1,
    })).toMatchObject({
      tone: 'attention',
      title: 'Sync needs attention',
    });
  });

  it('distinguishes work remaining, a clear schedule, and a completed day', () => {
    expect(homePriorityStatus({
      assignedJobCount: 4,
      completedJobCount: 2,
      pendingChangeCount: 0,
    }).title).toBe('2 jobs remaining');
    expect(homePriorityStatus({
      assignedJobCount: 0,
      completedJobCount: 0,
      pendingChangeCount: 0,
    }).title).toBe('You’re clear for now');
    expect(homePriorityStatus({
      assignedJobCount: 3,
      completedJobCount: 3,
      pendingChangeCount: 0,
    }).tone).toBe('complete');
  });

  it('uses persona language for remaining work', () => {
    expect(homePriorityStatus({
      assignedJobCount: 3,
      completedJobCount: 1,
      itemPlural: 'visits',
      itemSingular: 'visit',
      pendingChangeCount: 0,
    }).title).toBe('2 visits remaining');
  });

  it('does not turn denied portal access into an empty, clear schedule', () => {
    const routeOverview = { source: 'loading' as const, totalStops: 0, completedStops: 0 };
    expect(homeContinuityStatus('yard-owner', 'access_required', routeOverview)).toMatchObject({
      title: 'Customer portal access is not active', progressAvailable: false,
    });
    const markup = renderToStaticMarkup(createElement(WorkspaceHomePanel, {
      assignedJobCount: 0, completedJobCount: 0, hasSelectedJob: false,
      hasWorkspaceRole: true, onOpen: () => undefined, pendingChangeCount: 0,
      persona: workspacePersonasForRoles(['PropertyOwner'])[0],
      portalReadState: 'access_required', signedInName: 'Yard Owner',
    }));
    expect(markup).toContain('Customer portal access is not active');
    expect(markup).toContain('Status unverified');
    expect(markup).not.toContain('You’re clear for now');
  });

  it('withholds Property Manager progress when the protected portfolio read fails', () => {
    const routeOverview = { source: 'loading' as const, totalStops: 0, completedStops: 0 };
    expect(homeContinuityStatus('property-manager', 'access_required', routeOverview)).toMatchObject({
      title: 'Property portfolio access is not active', progressAvailable: false,
    });
    const markup = renderToStaticMarkup(createElement(WorkspaceHomePanel, {
      assignedJobCount: 0, completedJobCount: 0, hasSelectedJob: false,
      hasWorkspaceRole: true, onOpen: () => undefined, pendingChangeCount: 0,
      persona: workspacePersonasForRoles(['PropertyManager'])[0],
      portalReadState: 'access_required', signedInName: 'Property Manager',
    }));
    expect(markup).toContain('Property portfolio access is not active');
    expect(markup).toContain('Status unverified');
    expect(markup).not.toContain('You’re clear for now');
  });

  it('uses the loaded route date and stop count instead of assigned-job count', () => {
    const routeOverview = {
      source: 'api' as const, serviceDate: '2026-06-15', totalStops: 2, completedStops: 0,
    };
    expect(homeContinuityStatus('crew-lead', 'ready', routeOverview)).toMatchObject({
      tone: 'attention', progressAvailable: true,
    });
    const markup = renderToStaticMarkup(createElement(WorkspaceHomePanel, {
      assignedJobCount: 3, completedJobCount: 0, hasSelectedJob: false,
      hasWorkspaceRole: true, onOpen: () => undefined, pendingChangeCount: 0,
      persona: workspacePersonasForRoles(['CrewLead'])[0], routeOverview,
      signedInName: 'Crew Lead',
    }));
    expect(markup).toContain('Past route');
    expect(markup).toContain('0 of 2');
    expect(markup).not.toContain('3 stops');
  });
});
