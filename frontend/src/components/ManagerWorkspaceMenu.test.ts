import { describe, expect, it } from 'vitest';
import {
  managerWorkspaceSectionLabel,
  managerWorkspaceSections,
  managerWorkspaceSectionsForPersona,
  managerWorkspaceTools,
  managerWorkspaceToolsForPersona,
} from './ManagerWorkspaceMenu';

describe('manager workspace menu', () => {
  it('keeps the manager home focused on six task groups', () => {
    expect(managerWorkspaceSections.map((section) => section.id)).toEqual([
      'overview',
      'schedule',
      'customers',
      'team',
      'reports',
      'recovery',
    ]);
  });

  it('provides a readable active category label', () => {
    expect(managerWorkspaceSectionLabel('customers')).toBe('Customers');
    expect(managerWorkspaceSectionLabel('recovery')).toBe('Recovery');
  });

  it('offers focused tools within the longest mobile categories', () => {
    expect(managerWorkspaceTools.customers.map((tool) => tool.id)).toEqual([
      'property-profile',
      'property-service',
      'customer-accounts',
      'customer-portal',
      'customer-portfolios',
    ]);
    expect(managerWorkspaceTools.team.map((tool) => tool.id)).toEqual([
      'team-overview',
      'team-members',
      'team-invitations',
      'team-activity',
    ]);
    expect(managerWorkspaceTools.recovery).toHaveLength(4);
  });

  it('offers only tools relevant to the active role persona', () => {
    expect(managerWorkspaceSectionsForPersona('property-manager').map(({ id }) => id))
      .toEqual(['customers']);
    expect(managerWorkspaceToolsForPersona('property-manager', 'customers').map(({ id }) => id))
      .toEqual(['customer-portal', 'customer-portfolios']);
    expect(managerWorkspaceSectionsForPersona('support').map(({ id }) => id))
      .toEqual(['team', 'reports', 'recovery']);
    expect(managerWorkspaceToolsForPersona('company-owner', 'reports').map(({ id }) => id))
      .not.toContain('marketing-leads');
    expect(managerWorkspaceToolsForPersona('company-owner', 'reports').map(({ id }) => id))
      .toContain('visit-questions');
    expect(managerWorkspaceToolsForPersona('company-manager', 'reports').map(({ id }) => id))
      .toContain('visit-questions');
    expect(managerWorkspaceToolsForPersona('support', 'reports').map(({ id }) => id))
      .toContain('marketing-leads');
    expect(managerWorkspaceToolsForPersona('support', 'reports').map(({ id }) => id))
      .not.toContain('visit-questions');
  });

  it('adds company management categories only with their cumulative unit', () => {
    expect(managerWorkspaceSectionsForPersona('company-owner', 'o1').map(({ id }) => id))
      .toEqual(['overview']);
    expect(managerWorkspaceToolsForPersona('company-owner', 'overview', 'o1').map(({ id }) => id))
      .toEqual(['owner-setup', 'company-readiness']);
    expect(managerWorkspaceSectionsForPersona('company-owner', 'o2').map(({ id }) => id))
      .toEqual(['overview', 'schedule']);
    expect(managerWorkspaceSectionsForPersona('company-owner', 'o3').map(({ id }) => id))
      .toEqual(['overview', 'schedule', 'customers', 'team']);
    expect(managerWorkspaceSectionsForPersona('company-owner', 'o4').map(({ id }) => id))
      .toEqual(['overview', 'schedule', 'customers', 'team', 'reports', 'recovery']);
    expect(managerWorkspaceSectionsForPersona('company-manager', 'm1').map(({ id }) => id))
      .toEqual(['overview']);
    expect(managerWorkspaceSectionsForPersona('company-manager', 'm4').map(({ id }) => id))
      .toEqual(['overview', 'schedule', 'customers', 'team', 'reports', 'recovery']);
  });

  it('keeps support recovery and privacy tools behind later units', () => {
    expect(managerWorkspaceSectionsForPersona('support', 's1').map(({ id }) => id))
      .toEqual(['reports']);
    expect(managerWorkspaceToolsForPersona('support', 'reports', 's1').map(({ id }) => id))
      .toEqual(['operations-activity']);
    expect(managerWorkspaceToolsForPersona('support', 'recovery', 's3').map(({ id }) => id))
      .toEqual(['operational-exceptions', 'photo-processing']);
    expect(managerWorkspaceToolsForPersona('support', 'recovery', 's4').map(({ id }) => id))
      .toEqual([
        'operational-exceptions', 'photo-processing', 'customer-privacy', 'photo-erasure',
      ]);
  });

  it('fails closed for suspended and unknown managed units', () => {
    expect(managerWorkspaceSectionsForPersona('company-owner', null)).toEqual([]);
    expect(managerWorkspaceSectionsForPersona('company-owner', 'unknown')).toEqual([]);
    expect(managerWorkspaceToolsForPersona('company-owner', 'overview', null)).toEqual([]);
  });
});
