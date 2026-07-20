import { describe, expect, it } from 'vitest';
import {
  managerWorkspaceSectionLabel,
  managerWorkspaceSections,
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
});
