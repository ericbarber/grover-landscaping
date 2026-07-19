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
  eventKind: TeamAdministrationEventKind | 'all',
): TeamAdministrationActivity[] {
  const normalizedQuery = actorQuery.trim().toLocaleLowerCase();
  return activity.filter((item) => {
    const matchesActor = !normalizedQuery || [
      item.actorLabel,
      item.actorUserId,
    ].some((value) => value.toLocaleLowerCase().includes(normalizedQuery));
    return matchesActor && (eventKind === 'all' || item.eventKind === eventKind);
  });
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
  const [eventFilter, setEventFilter] = useState<TeamAdministrationEventKind | 'all'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [hasOlder, setHasOlder] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const filteredActivity = filterTeamActivity(activity, actorQuery, eventFilter);

  async function refresh() {
    if (!organizationId) return;
    setIsLoading(true);
    try {
      const loaded = await fetchTeamAdministrationActivity(organizationId, {
        eventKind: eventFilter === 'all' ? undefined : eventFilter,
        actor: actorQuery.trim() || undefined,
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
    const timeout = window.setTimeout(() => void refresh(), actorQuery ? 300 : 0);
    return () => window.clearTimeout(timeout);
  }, [organizationId, refreshSignal, eventFilter, actorQuery]);

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
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
      <p className="mt-3 text-xs text-slate-500" aria-live="polite">
        Showing {filteredActivity.length} of {activity.length} events
      </p>
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
