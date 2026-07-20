import { type FormEvent, useEffect, useRef, useState } from 'react';
import {
  createOrganizationBranch,
  createServiceTerritory,
  fetchOrganizationBranches,
  fetchOrganizationCrews,
  fetchServiceTerritories,
  updateOrganizationBranchStatus,
  updateServiceTerritoryStatus,
  type OrganizationBranchRecord,
  type CrewRecord,
  type ServiceTerritoryRecord,
} from '../api/client';

type ManagerDispatchHierarchyPanelProps = {
  organizationId: string;
  onChanged: () => void;
  onOpenCrewAdministration?: (crewId?: string) => void;
  refreshSignal?: number;
};

const timeZones = [
  'America/Phoenix',
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
];

type DispatchHierarchyFilters = {
  query: string;
  status: 'all' | 'active' | 'inactive';
  assignment: 'all' | 'staffed' | 'unstaffed';
};

const defaultDispatchHierarchyFilters: DispatchHierarchyFilters = {
  query: '',
  status: 'all',
  assignment: 'all',
};

export function parseDispatchHierarchyFilters(value: string | null): DispatchHierarchyFilters {
  if (!value) return defaultDispatchHierarchyFilters;
  try {
    const parsed = JSON.parse(value) as Partial<DispatchHierarchyFilters>;
    return {
      query: typeof parsed.query === 'string' ? parsed.query.slice(0, 120) : '',
      status: parsed.status === 'active' || parsed.status === 'inactive' ? parsed.status : 'all',
      assignment: parsed.assignment === 'staffed' || parsed.assignment === 'unstaffed'
        ? parsed.assignment
        : 'all',
    };
  } catch {
    return defaultDispatchHierarchyFilters;
  }
}

function dispatchHierarchyFilterStorageKey(organizationId: string) {
  return `grover.dispatch-hierarchy-filters.v1.${organizationId}`;
}

function loadDispatchHierarchyFilters(organizationId: string): DispatchHierarchyFilters {
  try {
    return parseDispatchHierarchyFilters(
      window.localStorage.getItem(dispatchHierarchyFilterStorageKey(organizationId)),
    );
  } catch {
    return defaultDispatchHierarchyFilters;
  }
}

export function summarizeDispatchHierarchy(
  branches: OrganizationBranchRecord[],
  territories: ServiceTerritoryRecord[],
) {
  return {
    activeBranches: branches.filter((branch) => branch.status === 'active').length,
    inactiveBranches: branches.filter((branch) => branch.status === 'inactive').length,
    activeTerritories: territories.filter((territory) => territory.status === 'active').length,
    inactiveTerritories: territories.filter((territory) => territory.status === 'inactive').length,
  };
}

export function filterDispatchHierarchy(
  branches: OrganizationBranchRecord[],
  territories: ServiceTerritoryRecord[],
  query: string,
  status: 'all' | 'active' | 'inactive' = 'all',
  assignment: 'all' | 'staffed' | 'unstaffed' = 'all',
  crews: CrewRecord[] = [],
) {
  let statusBranches = status === 'all'
    ? branches
    : branches.filter((branch) => branch.status === status);
  let statusTerritories = status === 'all'
    ? territories
    : territories.filter((territory) => territory.status === status);
  if (assignment !== 'all') {
    const activeBranchIds = new Set(
      crews.filter((crew) => crew.status === 'active').map((crew) => crew.branchId),
    );
    const activeTerritoryIds = new Set(
      crews.filter((crew) => crew.status === 'active').map((crew) => crew.territoryId),
    );
    const keepStaffed = assignment === 'staffed';
    statusBranches = statusBranches.filter(
      (branch) => activeBranchIds.has(branch.id) === keepStaffed,
    );
    statusTerritories = statusTerritories.filter(
      (territory) => activeTerritoryIds.has(territory.id) === keepStaffed,
    );
  }
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return { branches: statusBranches, territories: statusTerritories };
  return {
    branches: statusBranches.filter((branch) => (
      branch.name.toLocaleLowerCase().includes(normalized)
      || branch.code.toLocaleLowerCase().includes(normalized)
      || branch.serviceAreaLabel?.toLocaleLowerCase().includes(normalized)
    )),
    territories: statusTerritories.filter((territory) => {
      const branch = branches.find((item) => item.id === territory.branchId);
      return territory.name.toLocaleLowerCase().includes(normalized)
        || branch?.name.toLocaleLowerCase().includes(normalized)
        || branch?.code.toLocaleLowerCase().includes(normalized);
    }),
  };
}

export function summarizeHierarchyCrewAssignments(crews: CrewRecord[]) {
  const branchCounts: Record<string, { active: number; total: number }> = {};
  const territoryCounts: Record<string, { active: number; total: number }> = {};
  for (const crew of crews) {
    for (const [scopeId, counts] of [
      [crew.branchId, branchCounts],
      [crew.territoryId, territoryCounts],
    ] as const) {
      if (!scopeId) continue;
      const current = counts[scopeId] ?? { active: 0, total: 0 };
      counts[scopeId] = {
        active: current.active + Number(crew.status === 'active'),
        total: current.total + 1,
      };
    }
  }
  return { branchCounts, territoryCounts };
}

export function countActiveUnstaffedHierarchy(
  branches: OrganizationBranchRecord[],
  territories: ServiceTerritoryRecord[],
  crews: CrewRecord[],
) {
  const unstaffed = filterDispatchHierarchy(
    branches,
    territories,
    '',
    'active',
    'unstaffed',
    crews,
  );
  return {
    branches: unstaffed.branches.length,
    territories: unstaffed.territories.length,
    total: unstaffed.branches.length + unstaffed.territories.length,
  };
}

export function ManagerDispatchHierarchyPanel({
  organizationId,
  onChanged,
  onOpenCrewAdministration,
  refreshSignal = 0,
}: ManagerDispatchHierarchyPanelProps) {
  const initialFilters = loadDispatchHierarchyFilters(organizationId);
  const [branches, setBranches] = useState<OrganizationBranchRecord[]>([]);
  const [territories, setTerritories] = useState<ServiceTerritoryRecord[]>([]);
  const [crews, setCrews] = useState<CrewRecord[]>([]);
  const [branchName, setBranchName] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [timeZone, setTimeZone] = useState('America/Phoenix');
  const [serviceArea, setServiceArea] = useState('');
  const [territoryBranchId, setTerritoryBranchId] = useState('');
  const [territoryName, setTerritoryName] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingLifecycleAction, setPendingLifecycleAction] = useState<string | null>(null);
  const [hierarchyQuery, setHierarchyQuery] = useState(initialFilters.query);
  const [hierarchyStatus, setHierarchyStatus] = useState(initialFilters.status);
  const [hierarchyAssignment, setHierarchyAssignment] = useState(initialFilters.assignment);
  const filterOrganizationRef = useRef(organizationId);
  const summary = summarizeDispatchHierarchy(branches, territories);
  const visibleHierarchy = filterDispatchHierarchy(
    branches,
    territories,
    hierarchyQuery,
    hierarchyStatus,
    hierarchyAssignment,
    crews,
  );
  const crewAssignments = summarizeHierarchyCrewAssignments(crews);
  const activeUnstaffed = countActiveUnstaffedHierarchy(branches, territories, crews);
  const hasHierarchyFilters = Boolean(hierarchyQuery.trim())
    || hierarchyStatus !== 'all'
    || hierarchyAssignment !== 'all';
  const hasVisibleUnstaffed = hierarchyAssignment === 'unstaffed'
    && visibleHierarchy.branches.length + visibleHierarchy.territories.length > 0;

  async function refreshHierarchy() {
    const [branchItems, territoryItems, crewItems] = await Promise.all([
      fetchOrganizationBranches(),
      fetchServiceTerritories(),
      fetchOrganizationCrews(organizationId),
    ]);
    const scopedBranches = branchItems.filter(
      (branch) => branch.organizationId === organizationId,
    );
    const active = scopedBranches.filter((branch) => branch.status === 'active');
    setBranches(scopedBranches);
    setTerritories(territoryItems.filter(
      (territory) => territory.organizationId === organizationId,
    ));
    setCrews(crewItems);
    setTerritoryBranchId((current) => (
      active.some((branch) => branch.id === current) ? current : active[0]?.id || ''
    ));
  }

  useEffect(() => {
    void refreshHierarchy().catch(() => setStatus('Hierarchy choices could not be loaded.'));
  }, [organizationId, refreshSignal]);

  useEffect(() => {
    if (filterOrganizationRef.current !== organizationId) {
      filterOrganizationRef.current = organizationId;
      const loaded = loadDispatchHierarchyFilters(organizationId);
      setHierarchyQuery(loaded.query);
      setHierarchyStatus(loaded.status);
      setHierarchyAssignment(loaded.assignment);
      return;
    }
    try {
      window.localStorage.setItem(
        dispatchHierarchyFilterStorageKey(organizationId),
        JSON.stringify({
          query: hierarchyQuery,
          status: hierarchyStatus,
          assignment: hierarchyAssignment,
        }),
      );
    } catch {
      // Hierarchy filtering remains usable when browser storage is unavailable.
    }
  }, [organizationId, hierarchyQuery, hierarchyStatus, hierarchyAssignment]);

  async function submitBranch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setStatus(null);
    try {
      const branch = await createOrganizationBranch(organizationId, {
        name: branchName,
        code: branchCode,
        timeZone,
        serviceAreaLabel: serviceArea || undefined,
      });
      setBranchName('');
      setBranchCode('');
      setServiceArea('');
      setStatus(`${branch.name} created.`);
      await refreshHierarchy();
      onChanged();
    } catch {
      setStatus('Branch could not be created. Check its code and organization scope.');
    } finally {
      setIsSaving(false);
    }
  }

  async function changeBranchStatus(branch: OrganizationBranchRecord) {
    const nextStatus = branch.status === 'active' ? 'inactive' : 'active';
    const actionId = `branch:${branch.id}:${nextStatus}`;
    if (pendingLifecycleAction !== actionId) {
      setPendingLifecycleAction(actionId);
      setStatus(
        `Confirm ${nextStatus === 'active' ? 'reactivation' : 'deactivation'} for ${branch.name}.`,
      );
      return;
    }
    setIsSaving(true);
    try {
      await updateOrganizationBranchStatus(organizationId, branch.id, nextStatus);
      setStatus(`${branch.name} is now ${nextStatus}.`);
      setPendingLifecycleAction(null);
      await refreshHierarchy();
      onChanged();
    } catch {
      setStatus(
        nextStatus === 'inactive'
          ? 'Move active crews and deactivate this branch’s territories first.'
          : 'The branch could not be reactivated.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function changeTerritoryStatus(territory: ServiceTerritoryRecord) {
    const nextStatus = territory.status === 'active' ? 'inactive' : 'active';
    const actionId = `territory:${territory.id}:${nextStatus}`;
    if (pendingLifecycleAction !== actionId) {
      setPendingLifecycleAction(actionId);
      setStatus(
        `Confirm ${nextStatus === 'active' ? 'reactivation' : 'deactivation'} for ${territory.name}.`,
      );
      return;
    }
    setIsSaving(true);
    try {
      await updateServiceTerritoryStatus(organizationId, territory.id, nextStatus);
      setStatus(`${territory.name} is now ${nextStatus}.`);
      setPendingLifecycleAction(null);
      await refreshHierarchy();
      onChanged();
    } catch {
      setStatus(
        nextStatus === 'inactive'
          ? 'Move active crews out of this territory first.'
          : 'Reactivate the parent branch before this territory.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function submitTerritory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setStatus(null);
    try {
      const territory = await createServiceTerritory(organizationId, {
        branchId: territoryBranchId,
        name: territoryName,
      });
      setTerritoryName('');
      setStatus(`${territory.name} created.`);
      await refreshHierarchy();
      onChanged();
    } catch {
      setStatus('Territory could not be created. Check the selected branch and name.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Owner hierarchy</p>
      <h2 className="mt-1 text-xl font-bold text-slate-950">Branches and territories</h2>
      <p className="mt-1 text-sm text-slate-600">
        Create dispatch scopes before assigning crews across operating areas.
      </p>
      {status ? (
        <p className="mt-3 text-xs font-semibold text-slate-600" role="status">{status}</p>
      ) : null}
      <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
        {[
          ['Active branches', summary.activeBranches],
          ['Inactive branches', summary.inactiveBranches],
          ['Active territories', summary.activeTerritories],
          ['Inactive territories', summary.inactiveTerritories],
        ].map(([label, count]) => (
          <div className="rounded-xl bg-slate-50 p-3" key={label}>
            <p className="text-lg font-bold text-slate-950">{count}</p>
            <p className="text-xs text-slate-600">{label}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <form className="space-y-2 rounded-xl bg-slate-50 p-3" onSubmit={submitBranch}>
          <p className="text-sm font-bold text-slate-900">New branch</p>
          <input
            aria-label="Branch name"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            maxLength={120}
            onChange={(event) => setBranchName(event.target.value)}
            placeholder="Branch name"
            required
            value={branchName}
          />
          <input
            aria-label="Branch code"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm uppercase"
            maxLength={20}
            onChange={(event) => setBranchCode(event.target.value)}
            pattern="[A-Za-z0-9_]+"
            placeholder="Code"
            required
            value={branchCode}
          />
          <select
            aria-label="Branch timezone"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            onChange={(event) => setTimeZone(event.target.value)}
            value={timeZone}
          >
            {timeZones.map((zone) => (
              <option key={zone} value={zone}>{zone}</option>
            ))}
          </select>
          <input
            aria-label="Branch service area"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            maxLength={120}
            onChange={(event) => setServiceArea(event.target.value)}
            placeholder="Service area (optional)"
            value={serviceArea}
          />
          <button
            className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
            disabled={isSaving}
            type="submit"
          >
            Create branch
          </button>
        </form>
        <form className="space-y-2 rounded-xl bg-slate-50 p-3" onSubmit={submitTerritory}>
          <p className="text-sm font-bold text-slate-900">New territory</p>
          <select
            aria-label="Territory branch"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            onChange={(event) => setTerritoryBranchId(event.target.value)}
            required
            value={territoryBranchId}
          >
            <option value="">Select branch</option>
            {branches.filter((branch) => branch.status === 'active').map((branch) => (
              <option key={branch.id} value={branch.id}>{branch.name}</option>
            ))}
          </select>
          <input
            aria-label="Territory name"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            maxLength={120}
            onChange={(event) => setTerritoryName(event.target.value)}
            placeholder="Territory name"
            required
            value={territoryName}
          />
          <button
            className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
            disabled={isSaving || !territoryBranchId}
            type="submit"
          >
            Create territory
          </button>
        </form>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 p-3">
          <p className="text-sm font-bold text-slate-900">Branch lifecycle</p>
          <label className="mt-2 block text-xs font-semibold text-slate-700">
            Search hierarchy
            <input
              className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal"
              onChange={(event) => setHierarchyQuery(event.target.value)}
              placeholder="Branch, code, service area, or territory"
              type="search"
              value={hierarchyQuery}
            />
          </label>
          <label className="mt-2 block text-xs font-semibold text-slate-700">
            Lifecycle status
            <select
              className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal"
              onChange={(event) => setHierarchyStatus(
                event.target.value as 'all' | 'active' | 'inactive',
              )}
              value={hierarchyStatus}
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
          <label className="mt-2 block text-xs font-semibold text-slate-700">
            Crew assignment
            <select
              className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal"
              onChange={(event) => setHierarchyAssignment(
                event.target.value as 'all' | 'staffed' | 'unstaffed',
              )}
              value={hierarchyAssignment}
            >
              <option value="all">All assignments</option>
              <option value="staffed">Has active crew</option>
              <option value="unstaffed">No active crew</option>
            </select>
          </label>
          <button
            className="mt-2 min-h-11 rounded-lg bg-amber-100 px-3 text-xs font-bold text-amber-950 disabled:opacity-60"
            disabled={activeUnstaffed.total === 0}
            onClick={() => {
              setHierarchyQuery('');
              setHierarchyStatus('active');
              setHierarchyAssignment('unstaffed');
            }}
            type="button"
          >
            Review active unstaffed ({activeUnstaffed.branches} branches ·{' '}
            {activeUnstaffed.territories} territories)
          </button>
          {hasHierarchyFilters ? (
            <button
              className="mt-2 min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold"
              onClick={() => {
                setHierarchyQuery('');
                setHierarchyStatus('all');
                setHierarchyAssignment('all');
              }}
              type="button"
            >
              Clear hierarchy filters
            </button>
          ) : null}
          {hasVisibleUnstaffed && onOpenCrewAdministration ? (
              <button
                className="mt-2 min-h-11 rounded-lg bg-slate-900 px-3 text-xs font-bold text-white"
                onClick={() => onOpenCrewAdministration()}
                type="button"
              >
                Open crew administration
              </button>
            ) : null}
          {hasVisibleUnstaffed && crews.some((crew) => crew.status === 'active') ? (
            <div className="mt-2 rounded-lg bg-slate-50 p-3">
              <p className="text-xs font-bold text-slate-800">Active crews available to move</p>
              <div className="mt-2 space-y-2">
                {crews.filter((crew) => crew.status === 'active').map((crew) => {
                  const branch = branches.find((item) => item.id === crew.branchId);
                  const territory = territories.find((item) => item.id === crew.territoryId);
                  return (
                    <button
                      className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-left text-xs"
                      key={crew.id}
                      onClick={() => onOpenCrewAdministration?.(crew.id)}
                      type="button"
                    >
                      <span className="block font-bold text-slate-900">{crew.name}</span>
                      <span className="text-slate-500">
                        {branch?.name ?? 'Unknown branch'} ·{' '}
                        {territory?.name ?? 'Unknown territory'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
          {hasHierarchyFilters ? (
            <p className="mt-2 text-xs text-slate-500">
              Showing {visibleHierarchy.branches.length} of {branches.length} branches and{' '}
              {visibleHierarchy.territories.length} of {territories.length} territories.
            </p>
          ) : null}
          <div className="mt-2 space-y-2">
            {visibleHierarchy.branches.map((branch) => {
              const nextStatus = branch.status === 'active' ? 'inactive' : 'active';
              const actionId = `branch:${branch.id}:${nextStatus}`;
              return (
                <div
                  className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3"
                  key={branch.id}
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{branch.name}</p>
                    <p className="text-xs text-slate-500">{branch.code} · {branch.status}</p>
                    <p className="text-xs text-slate-500">
                      {crewAssignments.branchCounts[branch.id]?.active ?? 0} active ·{' '}
                      {crewAssignments.branchCounts[branch.id]?.total ?? 0} total crews
                    </p>
                  </div>
                  <button
                    className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold"
                    disabled={isSaving}
                    onClick={() => void changeBranchStatus(branch)}
                    type="button"
                  >
                    {pendingLifecycleAction === actionId
                      ? `Confirm ${nextStatus}`
                      : nextStatus === 'active' ? 'Reactivate' : 'Deactivate'}
                  </button>
                </div>
              );
            })}
            {visibleHierarchy.branches.length === 0 ? (
              <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                No branches match this search.
              </p>
            ) : null}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 p-3">
          <p className="text-sm font-bold text-slate-900">Territory lifecycle</p>
          <div className="mt-2 space-y-2">
            {visibleHierarchy.territories.map((territory) => {
              const nextStatus = territory.status === 'active' ? 'inactive' : 'active';
              const actionId = `territory:${territory.id}:${nextStatus}`;
              const branch = branches.find((item) => item.id === territory.branchId);
              return (
                <div
                  className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3"
                  key={territory.id}
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{territory.name}</p>
                    <p className="text-xs text-slate-500">
                      {branch?.name ?? 'Unknown branch'} · {territory.status}
                    </p>
                    <p className="text-xs text-slate-500">
                      {crewAssignments.territoryCounts[territory.id]?.active ?? 0} active ·{' '}
                      {crewAssignments.territoryCounts[territory.id]?.total ?? 0} total crews
                    </p>
                  </div>
                  <button
                    className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold"
                    disabled={isSaving}
                    onClick={() => void changeTerritoryStatus(territory)}
                    type="button"
                  >
                    {pendingLifecycleAction === actionId
                      ? `Confirm ${nextStatus}`
                      : nextStatus === 'active' ? 'Reactivate' : 'Deactivate'}
                  </button>
                </div>
              );
            })}
            {visibleHierarchy.territories.length === 0 ? (
              <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                No territories match this search.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
