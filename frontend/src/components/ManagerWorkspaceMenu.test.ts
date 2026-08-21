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
    expect(managerWorkspaceTools.team).toHaveLength(3);
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
    expect(managerWorkspaceToolsForPersona('support', 'reports').map(({ id }) => id))
      .toContain('marketing-leads');
  });
});
