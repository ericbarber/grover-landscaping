import { useEffect, useState } from 'react';
import {
  fetchOrganizationMemberships,
  updateOrganizationMembershipProfile,
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

export type MembershipStatusFilter = 'all' | 'active' | 'suspended';
export type MembershipSort = 'name' | 'role' | 'status';

export function filterTeamMemberships(
  memberships: OrganizationMembership[],
  query: string,
  role: AccessRole | 'all',
  status: MembershipStatusFilter,
): OrganizationMembership[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  return memberships.filter((membership) => {
    const matchesQuery = !normalizedQuery || [
      membership.displayName,
      membership.userId,
    ].some((value) => value?.toLocaleLowerCase().includes(normalizedQuery));
    const matchesRole = role === 'all' || membership.role === role;
    const matchesStatus = status === 'all' || membership.status === status;
    return matchesQuery && matchesRole && matchesStatus;
  });
}

export function teamMembershipActiveFilterCount(
  query: string,
  role: AccessRole | 'all',
  status: MembershipStatusFilter,
): number {
  return Number(Boolean(query.trim())) + Number(role !== 'all') + Number(status !== 'all');
}

export function sortTeamMemberships(
  memberships: OrganizationMembership[],
  sort: MembershipSort,
): OrganizationMembership[] {
  const value = (membership: OrganizationMembership) => {
    if (sort === 'role') return membership.role;
    if (sort === 'status') return membership.status;
    return membership.displayName ?? membership.userId;
  };
  return [...memberships].sort((left, right) => (
    value(left).localeCompare(value(right), undefined, { sensitivity: 'base' })
      || left.userId.localeCompare(right.userId)
  ));
}

export function summarizeTeamMemberships(memberships: OrganizationMembership[]) {
  return {
    active: memberships.filter((membership) => membership.status === 'active').length,
    suspended: memberships.filter((membership) => membership.status === 'suspended').length,
    owners: memberships.filter((membership) => membership.role === 'OrganizationOwner').length,
    managers: memberships.filter((membership) => membership.role === 'Manager').length,
    fieldTeam: memberships.filter((membership) => (
      membership.role === 'CrewLead' || membership.role === 'CrewMember'
    )).length,
  };
}

export function teamMembershipsCsv(memberships: OrganizationMembership[]): string {
  const cell = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const header = [
    'display_name',
    'membership_id',
    'identity_id',
    'role',
    'status',
    'scope_type',
    'scope_id',
  ];
  const rows = memberships.map((membership) => [
    membership.displayName ?? membership.userId,
    membership.id,
    membership.userId,
    membership.role,
    membership.status,
    membership.scopeType,
    membership.scopeId ?? '',
  ]);
  return [header, ...rows].map((row) => row.map(cell).join(',')).join('\n');
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
  const [draftNames, setDraftNames] = useState<Record<string, string>>({});
  const [confirmingMembershipId, setConfirmingMembershipId] = useState('');
  const [confirmingLifecycleId, setConfirmingLifecycleId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<AccessRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<MembershipStatusFilter>('all');
  const [membershipSort, setMembershipSort] = useState<MembershipSort>('name');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const activeOwnerCount = memberships.filter(
    (membership) => membership.status === 'active'
      && membership.role === 'OrganizationOwner',
  ).length;
  const filteredMemberships = sortTeamMemberships(
    filterTeamMemberships(memberships, searchQuery, roleFilter, statusFilter),
    membershipSort,
  );
  const activeFilterCount = teamMembershipActiveFilterCount(
    searchQuery,
    roleFilter,
    statusFilter,
  );
  const summary = summarizeTeamMemberships(memberships);

  async function refresh() {
    if (!organizationId) return;
    setIsLoading(true);
    try {
      const loaded = await fetchOrganizationMemberships(organizationId);
      setMemberships(loaded);
      setDraftRoles(Object.fromEntries(loaded.map((item) => [item.id, item.role])));
      setDraftNames(Object.fromEntries(loaded.map((item) => [
        item.id,
        item.displayName ?? item.userId,
      ])));
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

  async function saveDisplayName(membership: OrganizationMembership) {
    const displayName = (draftNames[membership.id] ?? membership.displayName ?? membership.userId).trim();
    if (Array.from(displayName).length < 2 || Array.from(displayName).length > 120) return;
    setIsLoading(true);
    try {
      const updated = await updateOrganizationMembershipProfile(
        organizationId,
        membership.id,
        displayName,
      );
      setMemberships((current) => current.map((item) => (
        item.id === updated.id ? updated : item
      )));
      setDraftNames((current) => ({ ...current, [updated.id]: updated.displayName ?? updated.userId }));
      setMessage(`Display name updated for ${updated.userId}.`);
      onTeamChanged?.();
    } catch {
      setMessage('The team member display name could not be updated.');
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

  function exportFilteredMemberships() {
    const url = URL.createObjectURL(new Blob(
      [teamMembershipsCsv(filteredMemberships)],
      { type: 'text/csv;charset=utf-8' },
    ));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `team-members-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function copyMemberIdentifier(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setMessage(`${label} copied.`);
    } catch {
      setMessage(`Copy is unavailable. Select the ${label.toLowerCase()} text instead.`);
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
        <div className="grid gap-2">
          <button
            className="min-h-11 rounded-lg border border-slate-300 px-3 text-xs font-semibold disabled:opacity-60"
            disabled={isLoading}
            onClick={() => void refresh()}
            type="button"
          >
            {isLoading ? 'Loading…' : 'Refresh'}
          </button>
          <button
            className="min-h-11 rounded-lg border border-slate-300 px-3 text-xs font-semibold disabled:opacity-60"
            disabled={filteredMemberships.length === 0}
            onClick={exportFilteredMemberships}
            type="button"
          >
            Export CSV
          </button>
        </div>
      </div>
      {message ? <p className="mt-3 text-sm text-slate-700" role="status">{message}</p> : null}
      <dl className="mt-4 grid grid-cols-2 gap-2 text-center sm:grid-cols-5">
        {[
          ['Active', summary.active],
          ['Suspended', summary.suspended],
          ['Owners', summary.owners],
          ['Managers', summary.managers],
          ['Field team', summary.fieldTeam],
        ].map(([label, value]) => (
          <div className="rounded-lg bg-slate-50 px-2 py-3" key={label}>
            <dt className="text-xs text-slate-500">{label}</dt>
            <dd className="mt-1 text-lg font-bold text-slate-950">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <label className="text-xs font-semibold text-slate-700">
          Find member
          <input
            className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm font-normal"
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Name or identity"
            type="search"
            value={searchQuery}
          />
        </label>
        <label className="text-xs font-semibold text-slate-700">
          Role
          <select
            className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal"
            onChange={(event) => setRoleFilter(event.target.value as AccessRole | 'all')}
            value={roleFilter}
          >
            <option value="all">All roles</option>
            {roles.map((role) => (
              <option key={role.value} value={role.value}>{role.label}</option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-700">
          Status
          <select
            className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal"
            onChange={(event) => setStatusFilter(event.target.value as MembershipStatusFilter)}
            value={statusFilter}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-700">
          Sort
          <select
            className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal"
            onChange={(event) => setMembershipSort(event.target.value as MembershipSort)}
            value={membershipSort}
          >
            <option value="name">Name</option>
            <option value="role">Role</option>
            <option value="status">Status</option>
          </select>
        </label>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500" aria-live="polite">
          Showing {filteredMemberships.length} of {memberships.length} members
          {activeFilterCount ? ` · ${activeFilterCount} active filter${activeFilterCount === 1 ? '' : 's'}` : ''}
        </p>
        {activeFilterCount ? (
          <button
            className="min-h-11 shrink-0 rounded-lg border border-slate-300 px-3 text-xs font-semibold"
            onClick={() => {
              setSearchQuery('');
              setRoleFilter('all');
              setStatusFilter('all');
            }}
            type="button"
          >
            Clear filters
          </button>
        ) : null}
      </div>
      <ul className="mt-4 space-y-3">
        {filteredMemberships.map((membership) => {
          const canChange = canChangeMembershipRole(membership, activeOwnerCount);
          const canSuspend = canSuspendMembership(membership, activeOwnerCount);
          const draftRole = draftRoles[membership.id] ?? membership.role;
          const draftName = draftNames[membership.id] ?? membership.displayName ?? membership.userId;
          const nameChanged = draftName.trim() !== (membership.displayName ?? membership.userId);
          const changed = draftRole !== membership.role;
          return (
            <li className="rounded-lg bg-slate-50 p-3" key={membership.id}>
              <p className="break-all text-sm font-semibold text-slate-900">
                {membership.displayName ?? membership.userId}
              </p>
              <p className="mt-0.5 break-all text-xs text-slate-500">{membership.userId}</p>
              <button
                className="mt-1 min-h-11 rounded-lg border border-slate-300 px-3 text-xs font-semibold"
                onClick={() => void copyMemberIdentifier(membership.userId, 'Member identity')}
                type="button"
              >
                Copy member identity
              </button>
              <details className="mt-1 text-xs text-slate-500">
                <summary className="min-h-11 cursor-pointer content-center font-semibold">
                  Show membership record ID
                </summary>
                <p className="break-all rounded-lg border border-slate-200 bg-white p-2">
                  {membership.id}
                </p>
                <button
                  className="mt-1 min-h-11 rounded-lg border border-slate-300 px-3 font-semibold"
                  onClick={() => void copyMemberIdentifier(membership.id, 'Membership record ID')}
                  type="button"
                >
                  Copy membership record ID
                </button>
              </details>
              <p className="mt-1 text-xs text-slate-500">
                {membership.status} · {membership.scopeType}
              </p>
              <label className="mt-3 block text-xs font-semibold text-slate-700">
                Display name
                <input
                  className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal disabled:opacity-60"
                  disabled={isLoading}
                  maxLength={120}
                  minLength={2}
                  onChange={(event) => setDraftNames((current) => ({
                    ...current,
                    [membership.id]: event.target.value,
                  }))}
                  value={draftName}
                />
              </label>
              {nameChanged ? (
                <button
                  className="mt-2 min-h-11 w-full rounded-lg bg-emerald-700 px-3 text-xs font-bold text-white disabled:opacity-60"
                  disabled={isLoading || Array.from(draftName.trim()).length < 2}
                  onClick={() => void saveDisplayName(membership)}
                  type="button"
                >
                  Save display name
                </button>
              ) : null}
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
      {!isLoading && memberships.length > 0 && filteredMemberships.length === 0 ? (
        <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          No team members match these filters.
        </p>
      ) : null}
      {!isLoading && memberships.length === 0 ? (
        <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          No active or suspended memberships found.
        </p>
      ) : null}
    </section>
  );
}
