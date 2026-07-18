import { useEffect, useState } from 'react';
import {
  fetchOrganizationMemberships,
  updateOrganizationMembershipRole,
  updateOrganizationMembershipStatus,
  type AccessRole,
  type OrganizationMembership,
} from '../api/client';

const roles: Array<{ value: AccessRole; label: string }> = [
  { value: 'OrganizationOwner', label: 'Organization owner' },
  { value: 'Manager', label: 'Manager' },
  { value: 'CrewLead', label: 'Crew lead' },
  { value: 'CrewMember', label: 'Crew member' },
  { value: 'PropertyManager', label: 'Property manager' },
  { value: 'PropertyOwner', label: 'Property owner' },
];

export function canChangeMembershipRole(
  membership: OrganizationMembership,
  activeOwnerCount: number,
): boolean {
  return membership.status === 'active'
    && (membership.role !== 'OrganizationOwner' || activeOwnerCount > 1);
}

export function canSuspendMembership(
  membership: OrganizationMembership,
  activeOwnerCount: number,
): boolean {
  return membership.status === 'active'
    && (membership.role !== 'OrganizationOwner' || activeOwnerCount > 1);
}

export function ManagerTeamMembershipsPanel({
  organizationId,
  onTeamChanged,
}: {
  organizationId: string;
  onTeamChanged?: () => void;
}) {
  const [memberships, setMemberships] = useState<OrganizationMembership[]>([]);
  const [draftRoles, setDraftRoles] = useState<Record<string, AccessRole>>({});
  const [confirmingMembershipId, setConfirmingMembershipId] = useState('');
  const [confirmingLifecycleId, setConfirmingLifecycleId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const activeOwnerCount = memberships.filter(
    (membership) => membership.status === 'active'
      && membership.role === 'OrganizationOwner',
  ).length;

  async function refresh() {
    if (!organizationId) return;
    setIsLoading(true);
    try {
      const loaded = await fetchOrganizationMemberships(organizationId);
      setMemberships(loaded);
      setDraftRoles(Object.fromEntries(loaded.map((item) => [item.id, item.role])));
      setMessage(null);
    } catch {
      setMessage('Team membership administration requires organization-owner access.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [organizationId]);

  async function saveRole(membership: OrganizationMembership) {
    const role = draftRoles[membership.id] ?? membership.role;
    setIsLoading(true);
    try {
      const updated = await updateOrganizationMembershipRole(
        organizationId,
        membership.id,
        role,
      );
      setMemberships((current) => current.map((item) => (
        item.id === updated.id ? updated : item
      )));
      setConfirmingMembershipId('');
      setMessage(`Role updated for ${updated.userId}.`);
      onTeamChanged?.();
    } catch {
      setMessage('The role could not be changed. Keep at least one active organization owner.');
    } finally {
      setIsLoading(false);
    }
  }

  async function changeStatus(
    membership: OrganizationMembership,
    status: 'active' | 'suspended',
  ) {
    setIsLoading(true);
    try {
      const updated = await updateOrganizationMembershipStatus(
        organizationId,
        membership.id,
        status,
      );
      setMemberships((current) => current.map((item) => (
        item.id === updated.id ? updated : item
      )));
      setConfirmingLifecycleId('');
      setMessage(`${updated.userId} membership ${status === 'active' ? 'reactivated' : 'suspended'}.`);
      onTeamChanged?.();
    } catch {
      setMessage('The membership status could not be changed. Keep at least one active owner.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Team administration
          </p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">Active memberships</h2>
        </div>
        <button
          className="min-h-11 rounded-lg border border-slate-300 px-3 text-xs font-semibold disabled:opacity-60"
          disabled={isLoading}
          onClick={() => void refresh()}
          type="button"
        >
          {isLoading ? 'Loading…' : 'Refresh'}
        </button>
      </div>
      {message ? <p className="mt-3 text-sm text-slate-700" role="status">{message}</p> : null}
      <ul className="mt-4 space-y-3">
        {memberships.map((membership) => {
          const canChange = canChangeMembershipRole(membership, activeOwnerCount);
          const canSuspend = canSuspendMembership(membership, activeOwnerCount);
          const draftRole = draftRoles[membership.id] ?? membership.role;
          const changed = draftRole !== membership.role;
          return (
            <li className="rounded-lg bg-slate-50 p-3" key={membership.id}>
              <p className="break-all text-sm font-semibold text-slate-900">
                {membership.userId}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {membership.status} · {membership.scopeType}
              </p>
              <label className="mt-3 block text-xs font-semibold text-slate-700">
                Role
                <select
                  className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal disabled:opacity-60"
                  disabled={!canChange || isLoading}
                  onChange={(event) => {
                    setDraftRoles((current) => ({
                      ...current,
                      [membership.id]: event.target.value as AccessRole,
                    }));
                    setConfirmingMembershipId('');
                    setConfirmingLifecycleId('');
                  }}
                  value={draftRole}
                >
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </label>
              {!canChange && membership.role === 'OrganizationOwner' ? (
                <p className="mt-2 text-xs text-amber-800">
                  Assign another owner before changing this role.
                </p>
              ) : null}
              {changed ? (
                confirmingMembershipId === membership.id ? (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      className="min-h-11 rounded-lg border border-slate-300 text-xs font-semibold"
                      disabled={isLoading}
                      onClick={() => {
                        setDraftRoles((current) => ({
                          ...current,
                          [membership.id]: membership.role,
                        }));
                        setConfirmingMembershipId('');
                      }}
                      type="button"
                    >
                      Cancel
                    </button>
                    <button
                      className="min-h-11 rounded-lg bg-slate-950 text-xs font-bold text-white disabled:opacity-60"
                      disabled={isLoading}
                      onClick={() => void saveRole(membership)}
                      type="button"
                    >
                      Confirm role
                    </button>
                  </div>
                ) : (
                  <button
                    className="mt-3 min-h-11 w-full rounded-lg bg-emerald-700 px-3 text-xs font-bold text-white"
                    onClick={() => setConfirmingMembershipId(membership.id)}
                    type="button"
                  >
                    Review role change
                  </button>
                )
              ) : null}
              {membership.status === 'active' && !changed ? (
                canSuspend ? (
                  confirmingLifecycleId === membership.id ? (
                    <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-200 pt-3">
                      <button
                        className="min-h-11 rounded-lg border border-slate-300 text-xs font-semibold"
                        disabled={isLoading}
                        onClick={() => setConfirmingLifecycleId('')}
                        type="button"
                      >
                        Keep active
                      </button>
                      <button
                        className="min-h-11 rounded-lg bg-red-700 text-xs font-bold text-white disabled:opacity-60"
                        disabled={isLoading}
                        onClick={() => void changeStatus(membership, 'suspended')}
                        type="button"
                      >
                        Confirm suspend
                      </button>
                    </div>
                  ) : (
                    <button
                      className="mt-3 min-h-11 w-full rounded-lg border border-red-200 text-xs font-semibold text-red-700"
                      onClick={() => setConfirmingLifecycleId(membership.id)}
                      type="button"
                    >
                      Suspend membership
                    </button>
                  )
                ) : null
              ) : null}
              {membership.status === 'suspended' ? (
                confirmingLifecycleId === membership.id ? (
                  <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-200 pt-3">
                    <button
                      className="min-h-11 rounded-lg border border-slate-300 text-xs font-semibold"
                      disabled={isLoading}
                      onClick={() => setConfirmingLifecycleId('')}
                      type="button"
                    >
                      Keep suspended
                    </button>
                    <button
                      className="min-h-11 rounded-lg bg-emerald-700 text-xs font-bold text-white disabled:opacity-60"
                      disabled={isLoading}
                      onClick={() => void changeStatus(membership, 'active')}
                      type="button"
                    >
                      Confirm reactivate
                    </button>
                  </div>
                ) : (
                  <button
                    className="mt-3 min-h-11 w-full rounded-lg bg-emerald-700 text-xs font-bold text-white"
                    onClick={() => setConfirmingLifecycleId(membership.id)}
                    type="button"
                  >
                    Reactivate membership
                  </button>
                )
              ) : null}
            </li>
          );
        })}
      </ul>
      {!isLoading && memberships.length === 0 ? (
        <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          No active or suspended memberships found.
        </p>
      ) : null}
    </section>
  );
}
