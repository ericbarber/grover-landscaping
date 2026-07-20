import { describe, expect, it } from 'vitest';
import type {
  CrewRecord,
  OrganizationBranchRecord,
  ServiceTerritoryRecord,
} from '../api/client';
import {
  countActiveUnstaffedHierarchy,
  filterDispatchHierarchy,
  parseDispatchHierarchyFilters,
  summarizeHierarchyCrewAssignments,
  summarizeDispatchHierarchy,
} from './ManagerDispatchHierarchyPanel';

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

  it('searches branch identity, service area, territory, and parent branch context', () => {
    const branches = [
      {
        id: 'branch_1',
        name: 'North Branch',
        code: 'NORTH',
        serviceAreaLabel: 'Scottsdale',
      },
      {
        id: 'branch_2',
        name: 'South Branch',
        code: 'SOUTH',
        serviceAreaLabel: null,
      },
    ] as OrganizationBranchRecord[];
    const territories = [
      { id: 'territory_1', branchId: 'branch_1', name: 'Desert Ridge' },
      { id: 'territory_2', branchId: 'branch_2', name: 'Tempe' },
    ] as ServiceTerritoryRecord[];

    expect(filterDispatchHierarchy(branches, territories, 'scottsdale').branches)
      .toEqual([branches[0]]);
    expect(filterDispatchHierarchy(branches, territories, 'desert').territories)
      .toEqual([territories[0]]);
    expect(filterDispatchHierarchy(branches, territories, 'south').territories)
      .toEqual([territories[1]]);
  });

  it('applies lifecycle status with search and clears through all-status inputs', () => {
    const branches = [
      { id: 'branch_1', name: 'North', code: 'N', status: 'active' },
      { id: 'branch_2', name: 'North Archive', code: 'NA', status: 'inactive' },
    ] as OrganizationBranchRecord[];
    const territories = [
      { id: 'territory_1', branchId: 'branch_1', name: 'North', status: 'active' },
      {
        id: 'territory_2',
        branchId: 'branch_2',
        name: 'North Archive',
        status: 'inactive',
      },
    ] as ServiceTerritoryRecord[];

    expect(filterDispatchHierarchy(branches, territories, 'north', 'inactive')).toEqual({
      branches: [branches[1]],
      territories: [territories[1]],
    });
    expect(filterDispatchHierarchy(branches, territories, '', 'all')).toEqual({
      branches,
      territories,
    });
  });

  it('restores bounded supported filters and rejects malformed storage', () => {
    expect(parseDispatchHierarchyFilters(JSON.stringify({
      query: 'North',
      status: 'inactive',
      assignment: 'unstaffed',
    }))).toEqual({ query: 'North', status: 'inactive', assignment: 'unstaffed' });
    expect(parseDispatchHierarchyFilters(JSON.stringify({
      query: 'x'.repeat(200),
      status: 'unknown',
      assignment: 'unknown',
    }))).toEqual({ query: 'x'.repeat(120), status: 'all', assignment: 'all' });
    expect(parseDispatchHierarchyFilters('{bad json')).toEqual({
      query: '',
      status: 'all',
      assignment: 'all',
    });
  });

  it('summarizes active and total crew assignments by both hierarchy levels', () => {
    const crews = [
      {
        id: 'crew_1',
        branchId: 'branch_1',
        territoryId: 'territory_1',
        status: 'active',
      },
      {
        id: 'crew_2',
        branchId: 'branch_1',
        territoryId: 'territory_1',
        status: 'inactive',
      },
      {
        id: 'crew_3',
        branchId: 'branch_1',
        territoryId: 'territory_2',
        status: 'active',
      },
    ] as CrewRecord[];

    expect(summarizeHierarchyCrewAssignments(crews)).toEqual({
      branchCounts: { branch_1: { active: 2, total: 3 } },
      territoryCounts: {
        territory_1: { active: 1, total: 2 },
        territory_2: { active: 1, total: 1 },
      },
    });
  });

  it('finds staffed and unstaffed scopes from active crew assignments', () => {
    const branches = [
      { id: 'branch_1', name: 'North', code: 'N', status: 'active' },
      { id: 'branch_2', name: 'South', code: 'S', status: 'active' },
    ] as OrganizationBranchRecord[];
    const territories = [
      { id: 'territory_1', branchId: 'branch_1', name: 'North', status: 'active' },
      { id: 'territory_2', branchId: 'branch_2', name: 'South', status: 'active' },
    ] as ServiceTerritoryRecord[];
    const crews = [
      {
        id: 'crew_1',
        branchId: 'branch_1',
        territoryId: 'territory_1',
        status: 'active',
      },
      {
        id: 'crew_2',
        branchId: 'branch_2',
        territoryId: 'territory_2',
        status: 'inactive',
      },
    ] as CrewRecord[];

    expect(filterDispatchHierarchy(
      branches,
      territories,
      '',
      'active',
      'unstaffed',
      crews,
    )).toEqual({
      branches: [branches[1]],
      territories: [territories[1]],
    });
    expect(countActiveUnstaffedHierarchy(branches, territories, crews)).toEqual({
      branches: 1,
      territories: 1,
      total: 2,
    });
  });
});
