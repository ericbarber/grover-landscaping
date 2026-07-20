import { describe, expect, it } from 'vitest';
import {
  managerWorkspaceSectionLabel,
  managerWorkspaceSections,
  managerWorkspaceTools,
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
    expect(managerWorkspaceTools.recovery).toHaveLength(3);
  });
});
