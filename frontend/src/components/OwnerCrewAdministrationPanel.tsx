import { useEffect, useState } from 'react';
import {
  fetchOrganizationCrews,
  updateOrganizationCrew,
  type CrewRecord,
} from '../api/client';

type Props = {
  organizationId: string;
  refreshSignal?: number;
  onCrewChanged?: (crew: CrewRecord) => void;
};

export function OwnerCrewAdministrationPanel({
  organizationId,
  refreshSignal = 0,
  onCrewChanged,
}: Props) {
  const [crews, setCrews] = useState<CrewRecord[]>([]);
  const [selectedCrewId, setSelectedCrewId] = useState('');
  const [name, setName] = useState('');
  const [pendingStatus, setPendingStatus] = useState<CrewRecord['status'] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const selectedCrew = crews.find((crew) => crew.id === selectedCrewId);

  async function refresh() {
    setIsLoading(true);
    try {
      const nextCrews = await fetchOrganizationCrews(organizationId);
      setCrews(nextCrews);
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
    setName(selectedCrew?.name ?? '');
    setPendingStatus(null);
  }, [selectedCrewId, selectedCrew?.name]);

  async function save(nextStatus = selectedCrew?.status) {
    if (!selectedCrew || !nextStatus || name.trim().length < 2 || name.trim().length > 120) {
      setMessage('Enter a crew name from 2 to 120 characters.');
      return;
    }
    setIsLoading(true);
    try {
      const updated = await updateOrganizationCrew(
        organizationId,
        selectedCrew.id,
        name,
        nextStatus,
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
    <div className="mt-4 rounded-xl border border-slate-200 p-4">
      <h3 className="font-bold text-slate-950">Crew administration</h3>
      <p className="mt-1 text-xs text-slate-600">Rename crews or remove inactive crews from new scheduling.</p>
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
          <button
            className="min-h-11 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-800 disabled:opacity-60"
            disabled={isLoading || name.trim() === selectedCrew?.name}
            onClick={() => void save()}
            type="button"
          >
            Save crew name
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
