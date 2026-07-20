import { describe, expect, it } from 'vitest';
import type { OrganizationBranchRecord, ServiceTerritoryRecord } from '../api/client';
import { summarizeDispatchHierarchy } from './ManagerDispatchHierarchyPanel';

describe('dispatch hierarchy summaries', () => {
  it('counts active and inactive branches and territories independently', () => {
    const branches = [
      { id: 'branch_1', status: 'active' },
      { id: 'branch_2', status: 'inactive' },
    ] as OrganizationBranchRecord[];
    const territories = [
      { id: 'territory_1', status: 'active' },
      { id: 'territory_2', status: 'active' },
      { id: 'territory_3', status: 'inactive' },
    ] as ServiceTerritoryRecord[];

    expect(summarizeDispatchHierarchy(branches, territories)).toEqual({
      activeBranches: 1,
      inactiveBranches: 1,
      activeTerritories: 2,
      inactiveTerritories: 1,
    });
  });
});
