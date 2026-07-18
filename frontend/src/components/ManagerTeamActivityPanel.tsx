import { useEffect, useState } from 'react';
import {
  fetchTeamAdministrationActivity,
  type TeamAdministrationActivity,
  type TeamAdministrationEventKind,
} from '../api/client';

export function teamActivityLabel(eventKind: TeamAdministrationEventKind): string {
  switch (eventKind) {
    case 'invite_accepted':
      return 'Invitation accepted';
    case 'invitation_revoked':
      return 'Invitation revoked';
    case 'role_changed':
      return 'Membership role changed';
    case 'membership_suspended':
      return 'Membership suspended';
    case 'membership_reactivated':
      return 'Membership reactivated';
  }
}

export function ManagerTeamActivityPanel({
  organizationId,
  refreshSignal = 0,
}: {
  organizationId: string;
  refreshSignal?: number;
}) {
  const [activity, setActivity] = useState<TeamAdministrationActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function refresh() {
    if (!organizationId) return;
    setIsLoading(true);
    try {
      setActivity(await fetchTeamAdministrationActivity(organizationId));
      setMessage(null);
    } catch {
      setMessage('Team activity requires organization-owner access.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [organizationId, refreshSignal]);

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
      <ol className="mt-4 space-y-2">
        {activity.map((item) => (
          <li className="rounded-lg bg-slate-50 p-3 text-sm" key={item.id}>
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold text-slate-900">{teamActivityLabel(item.eventKind)}</p>
              <time className="shrink-0 text-xs text-slate-500" dateTime={item.occurredAt}>
                {new Date(item.occurredAt).toLocaleDateString()}
              </time>
            </div>
            <p className="mt-1 break-all text-xs text-slate-600">
              {item.targetId} · by {item.actorUserId}
            </p>
          </li>
        ))}
      </ol>
      {!isLoading && activity.length === 0 ? (
        <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          No persisted team access activity yet.
        </p>
      ) : null}
    </section>
  );
}
