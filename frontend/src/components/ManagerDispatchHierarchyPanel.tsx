import { type FormEvent, useEffect, useState } from 'react';
import {
  createOrganizationBranch,
  createServiceTerritory,
  fetchOrganizationBranches,
  type OrganizationBranchRecord,
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

export function ManagerDispatchHierarchyPanel({
  organizationId,
  onChanged,
}: ManagerDispatchHierarchyPanelProps) {
  const [branches, setBranches] = useState<OrganizationBranchRecord[]>([]);
  const [branchName, setBranchName] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [timeZone, setTimeZone] = useState('America/Phoenix');
  const [serviceArea, setServiceArea] = useState('');
  const [territoryBranchId, setTerritoryBranchId] = useState('');
  const [territoryName, setTerritoryName] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function refreshBranches() {
    const items = await fetchOrganizationBranches();
    const active = items.filter(
      (branch) => branch.organizationId === organizationId && branch.status === 'active',
    );
    setBranches(active);
    setTerritoryBranchId((current) => current || active[0]?.id || '');
  }

  useEffect(() => {
    void refreshBranches().catch(() => setStatus('Branch choices could not be loaded.'));
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
      await refreshBranches();
      onChanged();
    } catch {
      setStatus('Branch could not be created. Check its code and organization scope.');
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
      {status ? <p className="mt-3 text-xs font-semibold text-slate-600">{status}</p> : null}
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
            {branches.map((branch) => (
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
    </section>
  );
}
