import { useEffect, useState } from 'react';
import {
  fetchOrganizationCrews,
  fetchOrganizationBranches,
  fetchOrganizationMemberships,
  fetchServiceTerritories,
  updateOrganizationCrew,
  type CrewRecord,
  type OrganizationBranchRecord,
  type OrganizationMembership,
  type ServiceTerritoryRecord,
} from '../api/client';

type Props = {
  organizationId: string;
  refreshSignal?: number;
  onCrewChanged?: (crew: CrewRecord) => void;
  requestedCrewId?: string;
  requestedBranchId?: string;
  requestedTerritoryId?: string;
  selectionSignal?: number;
};

export function crewLeadOptionLabel(membership: OrganizationMembership): string {
  const role = membership.role === 'CrewLead' ? 'crew lead' : 'owner';
  return `${membership.displayName ?? membership.userId} · ${role}`;
}

export function OwnerCrewAdministrationPanel({
  organizationId,
  refreshSignal = 0,
  onCrewChanged,
  requestedCrewId,
  requestedBranchId,
  requestedTerritoryId,
  selectionSignal = 0,
}: Props) {
  const [crews, setCrews] = useState<CrewRecord[]>([]);
  const [selectedCrewId, setSelectedCrewId] = useState('');
  const [name, setName] = useState('');
  const [dailyStopCapacity, setDailyStopCapacity] = useState(10);
  const [leadMembershipId, setLeadMembershipId] = useState('');
  const [leadCandidates, setLeadCandidates] = useState<OrganizationMembership[]>([]);
  const [branches, setBranches] = useState<OrganizationBranchRecord[]>([]);
  const [territories, setTerritories] = useState<ServiceTerritoryRecord[]>([]);
  const [branchId, setBranchId] = useState('');
  const [territoryId, setTerritoryId] = useState('');
  const [dismissedDestinationSignal, setDismissedDestinationSignal] = useState(0);
  const [pendingStatus, setPendingStatus] = useState<CrewRecord['status'] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const selectedCrew = crews.find((crew) => crew.id === selectedCrewId);

  async function refresh() {
    setIsLoading(true);
    try {
      const [nextCrews, memberships, nextBranches, nextTerritories] = await Promise.all([
        fetchOrganizationCrews(organizationId),
        fetchOrganizationMemberships(organizationId),
        fetchOrganizationBranches(),
        fetchServiceTerritories(),
      ]);
      setCrews(nextCrews);
      setBranches(nextBranches.filter((branch) => (
        branch.organizationId === organizationId && branch.status === 'active'
      )));
      setTerritories(nextTerritories.filter((territory) => (
        territory.organizationId === organizationId && territory.status === 'active'
      )));
      setLeadCandidates(memberships.filter((membership) => (
        membership.status === 'active'
        && (membership.role === 'CrewLead' || membership.role === 'OrganizationOwner')
      )));
      setSelectedCrewId((current) => (
        nextCrews.some((crew) => crew.id === current) ? current : nextCrews[0]?.id ?? ''
      ));
      setMessage(null);
    } catch {
      setMessage('Crew administration could not be loaded. Confirm organization-owner access.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [organizationId, refreshSignal]);

  useEffect(() => {
    if (requestedCrewId && crews.some((crew) => crew.id === requestedCrewId)) {
      setSelectedCrewId(requestedCrewId);
    }
  }, [requestedCrewId, selectionSignal, crews]);

  useEffect(() => {
    setName(selectedCrew?.name ?? '');
    setDailyStopCapacity(selectedCrew?.dailyStopCapacity ?? 10);
    setLeadMembershipId(selectedCrew?.leadMembershipId ?? '');
    setBranchId(selectedCrew?.branchId ?? '');
    setTerritoryId(selectedCrew?.territoryId ?? '');
    setPendingStatus(null);
  }, [
    selectedCrewId,
    selectedCrew?.name,
    selectedCrew?.dailyStopCapacity,
    selectedCrew?.leadMembershipId,
    selectedCrew?.branchId,
    selectedCrew?.territoryId,
  ]);

  useEffect(() => {
    if (
      selectionSignal > 0
      && requestedBranchId
      && requestedTerritoryId
      && selectionSignal !== dismissedDestinationSignal
      && branches.some((branch) => branch.id === requestedBranchId)
      && territories.some((territory) => (
        territory.id === requestedTerritoryId && territory.branchId === requestedBranchId
      ))
    ) {
      setBranchId(requestedBranchId);
      setTerritoryId(requestedTerritoryId);
    }
  }, [
    selectionSignal,
    dismissedDestinationSignal,
    selectedCrewId,
    requestedBranchId,
    requestedTerritoryId,
    branches,
    territories,
  ]);

  const branchTerritories = territories.filter((territory) => territory.branchId === branchId);
  const preparedBranch = branches.find((branch) => branch.id === requestedBranchId);
  const preparedTerritory = territories.find((territory) => (
    territory.id === requestedTerritoryId && territory.branchId === requestedBranchId
  ));
  const savedBranch = branches.find((branch) => branch.id === selectedCrew?.branchId);
  const savedTerritory = territories.find((territory) => territory.id === selectedCrew?.territoryId);
  const hasPreparedDestination = Boolean(
    selectionSignal > 0
    && selectionSignal !== dismissedDestinationSignal
    && preparedBranch
    && preparedTerritory
    && branchId === requestedBranchId
    && territoryId === requestedTerritoryId,
  );

  function resetPreparedDestination() {
    setBranchId(selectedCrew?.branchId ?? '');
    setTerritoryId(selectedCrew?.territoryId ?? '');
    setDismissedDestinationSignal(selectionSignal);
    setMessage('Prepared destination cleared. The crew’s saved hierarchy assignment is restored.');
  }

  async function save(nextStatus = selectedCrew?.status) {
    if (
      !selectedCrew
      || !nextStatus
      || name.trim().length < 2
      || name.trim().length > 120
      || dailyStopCapacity < 1
      || dailyStopCapacity > 100
      || !branchId
      || !territoryId
      || !branchTerritories.some((territory) => territory.id === territoryId)
    ) {
      setMessage(
        'Enter a 2–120 character name, a daily capacity from 1 to 100 stops, and a valid territory.',
      );
      return;
    }
    setIsLoading(true);
    try {
      const updated = await updateOrganizationCrew(
        organizationId,
        selectedCrew.id,
        name,
        nextStatus,
        dailyStopCapacity,
        leadMembershipId || null,
        branchId,
        territoryId,
      );
      setCrews((current) => current.map((crew) => crew.id === updated.id ? updated : crew));
      setPendingStatus(null);
      setMessage(
        updated.status === 'active'
          ? `${updated.name} is active and available for scheduling.`
          : `${updated.name} is inactive and hidden from new assignments.`,
      );
      onCrewChanged?.(updated);
    } catch {
      setMessage(
        nextStatus === 'inactive'
          ? 'This crew cannot be deactivated while it has active properties or current routes.'
          : 'The crew could not be updated. Use a unique name and try again.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (crews.length === 0 && !isLoading && !message) return null;

  return (
    <div
      className="mt-4 scroll-mt-20 rounded-xl border border-slate-200 p-4"
      id="crew-administration"
      tabIndex={-1}
    >
      <h3 className="font-bold text-slate-950">Crew administration</h3>
      <p className="mt-1 text-xs text-slate-600">Set crew leadership and route capacity, or remove inactive crews from new scheduling.</p>
      {message ? <p className="mt-3 rounded-lg bg-slate-50 p-3 text-xs font-medium text-slate-700" role="status">{message}</p> : null}
      {crews.length > 0 ? (
        <div className="mt-3 space-y-3">
          <label className="block text-sm font-semibold text-slate-700">
            Crew
            <select
              className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal"
              disabled={isLoading}
              onChange={(event) => setSelectedCrewId(event.target.value)}
              value={selectedCrewId}
            >
              {crews.map((crew) => (
                <option key={crew.id} value={crew.id}>
                  {crew.name} · {crew.status}
                </option>
              ))}
            </select>
          </label>
          {hasPreparedDestination ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs font-bold text-amber-950">Prepared hierarchy destination</p>
              <p className="mt-1 text-sm font-semibold text-amber-950">
                {selectedCrew?.name ?? 'Selected crew'}
              </p>
              <p className="mt-1 text-xs text-amber-900">
                From {savedBranch?.name ?? 'unassigned branch'} ·{' '}
                {savedTerritory?.name ?? 'unassigned territory'}
              </p>
              <p className="text-xs text-amber-900">
                To {preparedBranch?.name} · {preparedTerritory?.name}
              </p>
              {selectedCrew?.branchId !== requestedBranchId ? (
                <p className="mt-2 rounded-lg bg-amber-100 p-2 text-xs font-bold text-amber-950">
                  Cross-branch move: future scheduling and hierarchy reporting will use the new branch.
                </p>
              ) : null}
              <p className="mt-1 text-xs text-amber-800">
                This assignment is not saved yet. Review the crew, then save its profile.
              </p>
              <button
                className="mt-2 min-h-11 rounded-lg border border-amber-300 bg-white px-3 text-xs font-bold text-amber-950"
                disabled={isLoading}
                onClick={resetPreparedDestination}
                type="button"
              >
                Reset destination
              </button>
            </div>
          ) : null}
          <label className="block text-sm font-semibold text-slate-700">
            Crew name
            <input
              className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
              disabled={isLoading}
              maxLength={120}
              onChange={(event) => setName(event.target.value)}
              value={name}
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Daily stop capacity
            <input
              className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
              disabled={isLoading}
              max={100}
              min={1}
              onChange={(event) => setDailyStopCapacity(Number(event.target.value))}
              type="number"
              value={dailyStopCapacity}
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Branch
            <select
              className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal"
              disabled={isLoading}
              onChange={(event) => {
                const nextBranchId = event.target.value;
                setBranchId(nextBranchId);
                setTerritoryId(
                  territories.find((territory) => territory.branchId === nextBranchId)?.id ?? '',
                );
              }}
              value={branchId}
            >
              <option value="">Select branch</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Territory
            <select
              className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal"
              disabled={isLoading || !branchId}
              onChange={(event) => setTerritoryId(event.target.value)}
              value={territoryId}
            >
              <option value="">Select territory</option>
              {branchTerritories.map((territory) => (
                <option key={territory.id} value={territory.id}>{territory.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Crew lead
            <select
              className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal"
              disabled={isLoading}
              onChange={(event) => setLeadMembershipId(event.target.value)}
              value={leadMembershipId}
            >
              <option value="">Unassigned</option>
              {leadCandidates.map((membership) => (
                <option key={membership.id} value={membership.id}>
                  {crewLeadOptionLabel(membership)}
                </option>
              ))}
            </select>
          </label>
          <button
            className="min-h-11 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-800 disabled:opacity-60"
            disabled={
              isLoading
              || (
                name.trim() === selectedCrew?.name
                && dailyStopCapacity === selectedCrew.dailyStopCapacity
                && (leadMembershipId || null) === selectedCrew.leadMembershipId
                && branchId === selectedCrew.branchId
                && territoryId === selectedCrew.territoryId
              )
            }
            onClick={() => void save()}
            type="button"
          >
            Save crew profile
          </button>
          {selectedCrew ? (
            pendingStatus ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs font-medium text-amber-900">
                  Confirm {pendingStatus === 'inactive' ? 'deactivation' : 'reactivation'} for {selectedCrew.name}.
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button className="min-h-11 rounded-lg border border-amber-300 bg-white text-sm font-semibold" onClick={() => setPendingStatus(null)} type="button">Cancel</button>
                  <button className="min-h-11 rounded-lg bg-amber-900 text-sm font-semibold text-white" disabled={isLoading} onClick={() => void save(pendingStatus)} type="button">Confirm</button>
                </div>
              </div>
            ) : (
              <button
                className="min-h-11 w-full rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                disabled={isLoading}
                onClick={() => setPendingStatus(selectedCrew.status === 'active' ? 'inactive' : 'active')}
                type="button"
              >
                {selectedCrew.status === 'active' ? 'Deactivate crew' : 'Reactivate crew'}
              </button>
            )
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
