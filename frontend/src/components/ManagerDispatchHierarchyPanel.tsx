import { type FormEvent, useEffect, useState } from 'react';
import {
  createOrganizationBranch,
  createServiceTerritory,
  fetchOrganizationBranches,
  fetchServiceTerritories,
  updateOrganizationBranchStatus,
  updateServiceTerritoryStatus,
  type OrganizationBranchRecord,
  type ServiceTerritoryRecord,
} from '../api/client';

type ManagerDispatchHierarchyPanelProps = {
  organizationId: string;
  onChanged: () => void;
};

const timeZones = [
  'America/Phoenix',
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
];

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

export function ManagerDispatchHierarchyPanel({
  organizationId,
  onChanged,
}: ManagerDispatchHierarchyPanelProps) {
  const [branches, setBranches] = useState<OrganizationBranchRecord[]>([]);
  const [territories, setTerritories] = useState<ServiceTerritoryRecord[]>([]);
  const [branchName, setBranchName] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [timeZone, setTimeZone] = useState('America/Phoenix');
  const [serviceArea, setServiceArea] = useState('');
  const [territoryBranchId, setTerritoryBranchId] = useState('');
  const [territoryName, setTerritoryName] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingLifecycleAction, setPendingLifecycleAction] = useState<string | null>(null);
  const summary = summarizeDispatchHierarchy(branches, territories);

  async function refreshHierarchy() {
    const [branchItems, territoryItems] = await Promise.all([
      fetchOrganizationBranches(),
      fetchServiceTerritories(),
    ]);
    const scopedBranches = branchItems.filter(
      (branch) => branch.organizationId === organizationId,
    );
    const active = scopedBranches.filter((branch) => branch.status === 'active');
    setBranches(scopedBranches);
    setTerritories(territoryItems.filter(
      (territory) => territory.organizationId === organizationId,
    ));
    setTerritoryBranchId((current) => (
      active.some((branch) => branch.id === current) ? current : active[0]?.id || ''
    ));
  }

  useEffect(() => {
    void refreshHierarchy().catch(() => setStatus('Hierarchy choices could not be loaded.'));
  }, [organizationId]);

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
          <div className="mt-2 space-y-2">
            {branches.map((branch) => {
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
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 p-3">
          <p className="text-sm font-bold text-slate-900">Territory lifecycle</p>
          <div className="mt-2 space-y-2">
            {territories.map((territory) => {
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
          </div>
        </div>
      </div>
    </section>
  );
}
