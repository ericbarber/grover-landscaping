import { useEffect, useState } from 'react';
import {
  fetchTeamAdministrationActivity,
  type TeamAdministrationActivity,
  type TeamAdministrationEventKind,
} from '../api/client';

export function teamActivityLabel(eventKind: TeamAdministrationEventKind): string {
  switch (eventKind) {
    case 'organization_profile_updated':
      return 'Organization profile updated';
    case 'invite_accepted':
      return 'Invitation accepted';
    case 'invitation_revoked':
      return 'Invitation revoked';
    case 'invitation_reissued':
      return 'Invitation reissued';
    case 'role_changed':
      return 'Membership role changed';
    case 'membership_suspended':
      return 'Membership suspended';
    case 'membership_reactivated':
      return 'Membership reactivated';
    case 'membership_profile_updated':
      return 'Member display name updated';
    case 'crew_profile_updated':
      return 'Crew profile updated';
    case 'crew_deactivated':
      return 'Crew deactivated';
    case 'crew_reactivated':
      return 'Crew reactivated';
  }
}

const eventKinds: TeamAdministrationEventKind[] = [
  'organization_profile_updated',
  'invite_accepted',
  'invitation_revoked',
  'invitation_reissued',
  'role_changed',
  'membership_suspended',
  'membership_reactivated',
  'membership_profile_updated',
  'crew_profile_updated',
  'crew_deactivated',
  'crew_reactivated',
];

export function filterTeamActivity(
  activity: TeamAdministrationActivity[],
  actorQuery: string,
  targetQuery: string,
  eventKind: TeamAdministrationEventKind | 'all',
): TeamAdministrationActivity[] {
  const normalizedQuery = actorQuery.trim().toLocaleLowerCase();
  const normalizedTarget = targetQuery.trim().toLocaleLowerCase();
  return activity.filter((item) => {
    const matchesActor = !normalizedQuery || [
      item.actorLabel,
      item.actorUserId,
    ].some((value) => value.toLocaleLowerCase().includes(normalizedQuery));
    const matchesTarget = !normalizedTarget || [
      item.targetLabel,
      item.targetId,
    ].some((value) => value.toLocaleLowerCase().includes(normalizedTarget));
    return matchesActor
      && matchesTarget
      && (eventKind === 'all' || item.eventKind === eventKind);
  });
}

export function teamActivityActiveFilterCount(
  actorQuery: string,
  targetQuery: string,
  eventKind: TeamAdministrationEventKind | 'all',
): number {
  return Number(Boolean(actorQuery.trim()))
    + Number(Boolean(targetQuery.trim()))
    + Number(eventKind !== 'all');
}

export function summarizeTeamActivity(activity: TeamAdministrationActivity[]) {
  return activity.reduce(
    (summary, item) => {
      if (item.eventKind.startsWith('crew_')) summary.crew += 1;
      else if (item.eventKind === 'organization_profile_updated') summary.organization += 1;
      else summary.access += 1;
      summary.total += 1;
      return summary;
    },
    { total: 0, access: 0, crew: 0, organization: 0 },
  );
}

export function ManagerTeamActivityPanel({
  organizationId,
  refreshSignal = 0,
}: {
  organizationId: string;
  refreshSignal?: number;
}) {
  const [activity, setActivity] = useState<TeamAdministrationActivity[]>([]);
  const [actorQuery, setActorQuery] = useState('');
  const [targetQuery, setTargetQuery] = useState('');
  const [eventFilter, setEventFilter] = useState<TeamAdministrationEventKind | 'all'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [hasOlder, setHasOlder] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const filteredActivity = filterTeamActivity(activity, actorQuery, targetQuery, eventFilter);
  const activeFilterCount = teamActivityActiveFilterCount(
    actorQuery,
    targetQuery,
    eventFilter,
  );
  const summary = summarizeTeamActivity(activity);

  async function refresh() {
    if (!organizationId) return;
    setIsLoading(true);
    try {
      const loaded = await fetchTeamAdministrationActivity(organizationId, {
        eventKind: eventFilter === 'all' ? undefined : eventFilter,
        actor: actorQuery.trim() || undefined,
        target: targetQuery.trim() || undefined,
        limit: 25,
      });
      setActivity(loaded);
      setHasOlder(loaded.length === 25);
      setMessage(null);
    } catch {
      setMessage('Team activity requires organization-owner access.');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadOlder() {
    const before = activity[activity.length - 1]?.occurredAt;
    if (!before) return;
    setIsLoading(true);
    try {
      const older = await fetchTeamAdministrationActivity(organizationId, {
        before,
        eventKind: eventFilter === 'all' ? undefined : eventFilter,
        actor: actorQuery.trim() || undefined,
        target: targetQuery.trim() || undefined,
        limit: 25,
      });
      setActivity((current) => [
        ...current,
        ...older.filter((item) => !current.some((existing) => existing.id === item.id)),
      ]);
      setHasOlder(older.length === 25);
      setMessage(null);
    } catch {
      setMessage('Older team activity could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(
      () => void refresh(),
      actorQuery || targetQuery ? 300 : 0,
    );
    return () => window.clearTimeout(timeout);
  }, [organizationId, refreshSignal, eventFilter, actorQuery, targetQuery]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Team administration
          </p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">Recent access activity</h2>
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
      <dl className="mt-4 grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
        {[
          ['Loaded', summary.total],
          ['Access', summary.access],
          ['Crew', summary.crew],
          ['Organization', summary.organization],
        ].map(([label, value]) => (
          <div className="rounded-lg bg-slate-50 px-2 py-3" key={label}>
            <dt className="text-xs text-slate-500">{label}</dt>
            <dd className="mt-1 text-lg font-bold text-slate-950">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="text-xs font-semibold text-slate-700">
          Find actor
          <input
            className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm font-normal"
            onChange={(event) => setActorQuery(event.target.value)}
            placeholder="Name or identity"
            type="search"
            value={actorQuery}
          />
        </label>
        <label className="text-xs font-semibold text-slate-700">
          Find affected item
          <input
            className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm font-normal"
            onChange={(event) => setTargetQuery(event.target.value)}
            placeholder="Member, crew, or ID"
            type="search"
            value={targetQuery}
          />
        </label>
        <label className="text-xs font-semibold text-slate-700">
          Event
          <select
            className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal"
            onChange={(event) => setEventFilter(
              event.target.value as TeamAdministrationEventKind | 'all',
            )}
            value={eventFilter}
          >
            <option value="all">All events</option>
            {eventKinds.map((eventKind) => (
              <option key={eventKind} value={eventKind}>{teamActivityLabel(eventKind)}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500" aria-live="polite">
          Showing {filteredActivity.length} of {activity.length} events
          {activeFilterCount ? ` · ${activeFilterCount} active filter${activeFilterCount === 1 ? '' : 's'}` : ''}
        </p>
        {activeFilterCount ? (
          <button
            className="min-h-11 shrink-0 rounded-lg border border-slate-300 px-3 text-xs font-semibold"
            onClick={() => {
              setActorQuery('');
              setTargetQuery('');
              setEventFilter('all');
            }}
            type="button"
          >
            Clear filters
          </button>
        ) : null}
      </div>
      <ol className="mt-4 space-y-2">
        {filteredActivity.map((item) => (
          <li className="rounded-lg bg-slate-50 p-3 text-sm" key={item.id}>
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold text-slate-900">{teamActivityLabel(item.eventKind)}</p>
              <time className="shrink-0 text-xs text-slate-500" dateTime={item.occurredAt}>
                {new Date(item.occurredAt).toLocaleDateString()}
              </time>
            </div>
            <p className="mt-1 break-all text-xs text-slate-600">
              {item.targetLabel} · by {item.actorLabel}
            </p>
          </li>
        ))}
      </ol>
      {!isLoading && activity.length === 0 ? (
        <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          No persisted team access activity yet.
        </p>
      ) : null}
      {!isLoading && activity.length > 0 && filteredActivity.length === 0 ? (
        <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          No team activity matches these filters.
        </p>
      ) : null}
      {hasOlder ? (
        <button
          className="mt-3 min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm font-semibold disabled:opacity-60"
          disabled={isLoading}
          onClick={() => void loadOlder()}
          type="button"
        >
          {isLoading ? 'Loading…' : 'Load older activity'}
        </button>
      ) : null}
    </section>
  );
}
