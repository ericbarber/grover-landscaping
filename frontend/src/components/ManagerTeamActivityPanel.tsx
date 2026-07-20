import { useEffect, useRef, useState } from 'react';
import {
  fetchTeamAdministrationActivity,
  type TeamAdministrationActivity,
  type TeamAdministrationEventKind,
  type TeamActivityMoveScope,
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
    case 'branch_created':
      return 'Branch created';
    case 'branch_status_updated':
      return 'Branch status updated';
    case 'territory_created':
      return 'Territory created';
    case 'territory_status_updated':
      return 'Territory status updated';
    case 'crew_profile_updated':
      return 'Crew profile updated';
    case 'crew_hierarchy_updated':
      return 'Crew hierarchy updated';
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
  'branch_created',
  'branch_status_updated',
  'territory_created',
  'territory_status_updated',
  'crew_profile_updated',
  'crew_hierarchy_updated',
  'crew_deactivated',
  'crew_reactivated',
];

export type TeamActivitySort = 'newest' | 'oldest';

type TeamActivityReviewFilters = {
  eventFilter: TeamAdministrationEventKind | 'all';
  moveScope: TeamActivityMoveScope | 'all';
  activitySort: TeamActivitySort;
  sourceQuery: string;
  destinationQuery: string;
};

export function parseTeamActivityReviewFilters(raw: string | null): TeamActivityReviewFilters {
  try {
    const value = raw ? JSON.parse(raw) as Record<string, unknown> : {};
    return {
      eventFilter: typeof value.eventFilter === 'string'
        && (value.eventFilter === 'all'
          || eventKinds.includes(value.eventFilter as TeamAdministrationEventKind))
        ? value.eventFilter as TeamAdministrationEventKind | 'all'
        : 'all',
      moveScope: value.moveScope === 'cross_branch' || value.moveScope === 'within_branch'
        ? value.moveScope
        : 'all',
      activitySort: value.activitySort === 'oldest' ? 'oldest' : 'newest',
      sourceQuery: typeof value.sourceQuery === 'string'
        ? value.sourceQuery.slice(0, 120)
        : '',
      destinationQuery: typeof value.destinationQuery === 'string'
        ? value.destinationQuery.slice(0, 120)
        : '',
    };
  } catch {
    return {
      eventFilter: 'all',
      moveScope: 'all',
      activitySort: 'newest',
      sourceQuery: '',
      destinationQuery: '',
    };
  }
}

function teamActivityReviewStorageKey(organizationId: string): string {
  return `grover.team-activity-review-filters.v1.${organizationId}`;
}

function loadTeamActivityReviewFilters(organizationId: string): TeamActivityReviewFilters {
  if (typeof window === 'undefined') return parseTeamActivityReviewFilters(null);
  try {
    return parseTeamActivityReviewFilters(
      window.localStorage.getItem(teamActivityReviewStorageKey(organizationId)),
    );
  } catch {
    return parseTeamActivityReviewFilters(null);
  }
}

export function filterTeamActivity(
  activity: TeamAdministrationActivity[],
  actorQuery: string,
  targetQuery: string,
  auditIdQuery: string,
  eventKind: TeamAdministrationEventKind | 'all',
  moveScope: TeamActivityMoveScope | 'all' = 'all',
  sourceQuery = '',
  destinationQuery = '',
): TeamAdministrationActivity[] {
  const normalizedQuery = actorQuery.trim().toLocaleLowerCase();
  const normalizedTarget = targetQuery.trim().toLocaleLowerCase();
  const normalizedAuditId = auditIdQuery.trim().toLocaleLowerCase();
  const normalizedSource = sourceQuery.trim().toLocaleLowerCase();
  const normalizedDestination = destinationQuery.trim().toLocaleLowerCase();
  return activity.filter((item) => {
    const matchesActor = !normalizedQuery || [
      item.actorLabel,
      item.actorUserId,
    ].some((value) => value.toLocaleLowerCase().includes(normalizedQuery));
    const matchesTarget = !normalizedTarget || [
      item.targetLabel,
      item.targetId,
      item.sourceBranchLabel,
      item.sourceTerritoryLabel,
      item.destinationBranchLabel,
      item.destinationTerritoryLabel,
    ].some((value) => value?.toLocaleLowerCase().includes(normalizedTarget));
    const matchesAuditId = !normalizedAuditId
      || item.id.toLocaleLowerCase().includes(normalizedAuditId);
    const matchesSource = !normalizedSource || [
      item.sourceBranchLabel,
      item.sourceTerritoryLabel,
    ].some((value) => value?.toLocaleLowerCase().includes(normalizedSource));
    const matchesDestination = !normalizedDestination || [
      item.destinationBranchLabel,
      item.destinationTerritoryLabel,
    ].some((value) => value?.toLocaleLowerCase().includes(normalizedDestination));
    return matchesActor
      && matchesTarget
      && matchesAuditId
      && matchesSource
      && matchesDestination
      && (eventKind === 'all' || item.eventKind === eventKind)
      && (
        moveScope === 'all'
        || (
          item.eventKind === 'crew_hierarchy_updated'
          && item.crossBranchMove === (moveScope === 'cross_branch')
        )
      );
  });
}

export function teamActivityActiveFilterCount(
  actorQuery: string,
  targetQuery: string,
  auditIdQuery: string,
  eventKind: TeamAdministrationEventKind | 'all',
  moveScope: TeamActivityMoveScope | 'all' = 'all',
  sourceQuery = '',
  destinationQuery = '',
): number {
  return Number(Boolean(actorQuery.trim()))
    + Number(Boolean(targetQuery.trim()))
    + Number(Boolean(auditIdQuery.trim()))
    + Number(eventKind !== 'all')
    + Number(moveScope !== 'all')
    + Number(Boolean(sourceQuery.trim()))
    + Number(Boolean(destinationQuery.trim()));
}

export function sortTeamActivity(
  activity: TeamAdministrationActivity[],
  sort: TeamActivitySort,
): TeamAdministrationActivity[] {
  return [...activity].sort((left, right) => {
    const comparison = left.occurredAt.localeCompare(right.occurredAt)
      || left.id.localeCompare(right.id);
    return sort === 'oldest' ? comparison : -comparison;
  });
}

export function teamActivityTimestampLabel(occurredAt: string): string {
  return new Date(occurredAt).toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function summarizeTeamActivity(activity: TeamAdministrationActivity[]) {
  return activity.reduce(
    (summary, item) => {
      if (item.eventKind.startsWith('crew_')) {
        summary.crew += 1;
        if (item.eventKind === 'crew_hierarchy_updated') {
          if (item.crossBranchMove) summary.crossBranchMoves += 1;
          else summary.withinBranchMoves += 1;
        }
      }
      else if (
        item.eventKind === 'organization_profile_updated'
        || item.eventKind.startsWith('branch_')
        || item.eventKind.startsWith('territory_')
      ) summary.organization += 1;
      else summary.access += 1;
      summary.total += 1;
      return summary;
    },
    {
      total: 0,
      access: 0,
      crew: 0,
      organization: 0,
      crossBranchMoves: 0,
      withinBranchMoves: 0,
    },
  );
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export function teamActivityCsv(activity: TeamAdministrationActivity[]): string {
  const header = [
    'occurred_at',
    'audit_event_id',
    'event',
    'actor_label',
    'actor_id',
    'target_label',
    'target_id',
    'source_branch',
    'source_territory',
    'destination_branch',
    'destination_territory',
    'move_scope',
  ];
  const rows = activity.map((item) => [
    item.occurredAt,
    item.id,
    teamActivityLabel(item.eventKind),
    item.actorLabel,
    item.actorUserId,
    item.targetLabel,
    item.targetId,
    item.sourceBranchLabel ?? '',
    item.sourceTerritoryLabel ?? '',
    item.destinationBranchLabel ?? '',
    item.destinationTerritoryLabel ?? '',
    item.eventKind === 'crew_hierarchy_updated'
      ? item.crossBranchMove ? 'cross_branch' : 'within_branch'
      : '',
  ]);
  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
}

export function ManagerTeamActivityPanel({
  organizationId,
  refreshSignal = 0,
  onOpenCrew,
}: {
  organizationId: string;
  refreshSignal?: number;
  onOpenCrew?: (crewId: string) => void;
}) {
  const initialReviewFilters = useRef(loadTeamActivityReviewFilters(organizationId));
  const [activity, setActivity] = useState<TeamAdministrationActivity[]>([]);
  const [actorQuery, setActorQuery] = useState('');
  const [targetQuery, setTargetQuery] = useState('');
  const [auditIdQuery, setAuditIdQuery] = useState('');
  const [sourceQuery, setSourceQuery] = useState(initialReviewFilters.current.sourceQuery);
  const [destinationQuery, setDestinationQuery] = useState(
    initialReviewFilters.current.destinationQuery,
  );
  const [eventFilter, setEventFilter] = useState<TeamAdministrationEventKind | 'all'>(
    initialReviewFilters.current.eventFilter,
  );
  const [moveScope, setMoveScope] = useState<TeamActivityMoveScope | 'all'>(
    initialReviewFilters.current.moveScope,
  );
  const filterOrganizationRef = useRef(organizationId);
  const [activitySort, setActivitySort] = useState<TeamActivitySort>(
    initialReviewFilters.current.activitySort,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [hasOlder, setHasOlder] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const filteredActivity = sortTeamActivity(
    filterTeamActivity(
      activity,
      actorQuery,
      targetQuery,
      auditIdQuery,
      eventFilter,
      moveScope,
      sourceQuery,
      destinationQuery,
    ),
    activitySort,
  );
  const activeFilterCount = teamActivityActiveFilterCount(
    actorQuery,
    targetQuery,
    auditIdQuery,
    eventFilter,
    moveScope,
    sourceQuery,
    destinationQuery,
  );
  const hasCustomReviewView = activeFilterCount > 0 || activitySort !== 'newest';
  const summary = summarizeTeamActivity(activity);

  async function refresh() {
    if (!organizationId) return;
    setIsLoading(true);
    try {
      const loaded = await fetchTeamAdministrationActivity(organizationId, {
        eventKind: eventFilter === 'all' ? undefined : eventFilter,
        moveScope: moveScope === 'all' ? undefined : moveScope,
        actor: actorQuery.trim() || undefined,
        target: targetQuery.trim() || undefined,
        source: sourceQuery.trim() || undefined,
        destination: destinationQuery.trim() || undefined,
        auditId: auditIdQuery.trim() || undefined,
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
        moveScope: moveScope === 'all' ? undefined : moveScope,
        actor: actorQuery.trim() || undefined,
        target: targetQuery.trim() || undefined,
        source: sourceQuery.trim() || undefined,
        destination: destinationQuery.trim() || undefined,
        auditId: auditIdQuery.trim() || undefined,
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

  function exportFilteredActivity() {
    const url = URL.createObjectURL(new Blob(
      [teamActivityCsv(filteredActivity)],
      { type: 'text/csv;charset=utf-8' },
    ));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `team-activity-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function copyActivityId(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setMessage(`${label} copied.`);
    } catch {
      setMessage(`Copy is unavailable. Select the ${label.toLowerCase()} text instead.`);
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(
      () => void refresh(),
      actorQuery || targetQuery || sourceQuery || destinationQuery || auditIdQuery ? 300 : 0,
    );
    return () => window.clearTimeout(timeout);
  }, [
    organizationId,
    refreshSignal,
    eventFilter,
    moveScope,
    actorQuery,
    targetQuery,
    sourceQuery,
    destinationQuery,
    auditIdQuery,
  ]);

  useEffect(() => {
    if (filterOrganizationRef.current !== organizationId) {
      filterOrganizationRef.current = organizationId;
      const loaded = loadTeamActivityReviewFilters(organizationId);
      setEventFilter(loaded.eventFilter);
      setMoveScope(loaded.moveScope);
      setActivitySort(loaded.activitySort);
      setSourceQuery(loaded.sourceQuery);
      setDestinationQuery(loaded.destinationQuery);
      return;
    }
    try {
      window.localStorage.setItem(
        teamActivityReviewStorageKey(organizationId),
        JSON.stringify({
          eventFilter,
          moveScope,
          activitySort,
          sourceQuery,
          destinationQuery,
        }),
      );
    } catch {
      // Activity review remains usable when browser storage is unavailable.
    }
  }, [
    organizationId,
    eventFilter,
    moveScope,
    activitySort,
    sourceQuery,
    destinationQuery,
  ]);

  return (
    <section
      className="scroll-mt-20 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      id="team-activity-review"
      tabIndex={-1}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Team administration
          </p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">Recent access activity</h2>
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
            disabled={filteredActivity.length === 0}
            onClick={exportFilteredActivity}
            type="button"
          >
            Export CSV
          </button>
        </div>
      </div>
      {message ? <p className="mt-3 text-sm text-slate-700" role="status">{message}</p> : null}
      <div className="mt-4 grid grid-cols-2 gap-2 text-center sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: 'Loaded', value: summary.total },
          { label: 'Access', value: summary.access },
          { label: 'Crew', value: summary.crew },
          { label: 'Organization', value: summary.organization },
          {
            label: 'Cross-branch moves',
            value: summary.crossBranchMoves,
            scope: 'cross_branch' as const,
          },
          {
            label: 'Within-branch moves',
            value: summary.withinBranchMoves,
            scope: 'within_branch' as const,
          },
        ].map(({ label, value, scope }) => (
          scope ? (
            <button
              aria-pressed={moveScope === scope}
              className={`min-h-16 rounded-lg px-2 py-3 ${
                moveScope === scope
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-50 text-slate-950'
              }`}
              disabled={isLoading}
              key={label}
              onClick={() => {
                setEventFilter('crew_hierarchy_updated');
                setMoveScope(scope);
              }}
              type="button"
            >
              <span className={`block text-xs ${
                moveScope === scope ? 'text-slate-200' : 'text-slate-500'
              }`}>{label}</span>
              <span className="mt-1 block text-lg font-bold">{value}</span>
            </button>
          ) : (
            <div className="rounded-lg bg-slate-50 px-2 py-3" key={label}>
              <p className="text-xs text-slate-500">{label}</p>
              <p className="mt-1 text-lg font-bold text-slate-950">{value}</p>
            </div>
          )
        ))}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
          Find move source
          <input
            className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm font-normal"
            onChange={(event) => setSourceQuery(event.target.value)}
            placeholder="Source branch or territory"
            type="search"
            value={sourceQuery}
          />
        </label>
        <label className="text-xs font-semibold text-slate-700">
          Find move destination
          <input
            className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm font-normal"
            onChange={(event) => setDestinationQuery(event.target.value)}
            placeholder="Destination branch or territory"
            type="search"
            value={destinationQuery}
          />
        </label>
        <label className="text-xs font-semibold text-slate-700">
          Find audit ID
          <input
            className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm font-normal"
            onChange={(event) => setAuditIdQuery(event.target.value)}
            placeholder="Audit event ID"
            type="search"
            value={auditIdQuery}
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
        <label className="text-xs font-semibold text-slate-700">
          Crew move scope
          <select
            className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal"
            onChange={(event) => setMoveScope(
              event.target.value as TeamActivityMoveScope | 'all',
            )}
            value={moveScope}
          >
            <option value="all">All move scopes</option>
            <option value="cross_branch">Cross-branch moves</option>
            <option value="within_branch">Within-branch moves</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-700">
          Sort
          <select
            className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal"
            onChange={(event) => setActivitySort(event.target.value as TeamActivitySort)}
            value={activitySort}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </label>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500" aria-live="polite">
          Showing {filteredActivity.length} of {activity.length} events
          {activeFilterCount ? ` · ${activeFilterCount} active filter${activeFilterCount === 1 ? '' : 's'}` : ''}
        </p>
        {hasCustomReviewView ? (
          <button
            className="min-h-11 shrink-0 rounded-lg border border-slate-300 px-3 text-xs font-semibold"
            onClick={() => {
              setActorQuery('');
              setTargetQuery('');
              setSourceQuery('');
              setDestinationQuery('');
              setAuditIdQuery('');
              setEventFilter('all');
              setMoveScope('all');
              setActivitySort('newest');
            }}
            type="button"
          >
            Reset review view
          </button>
        ) : null}
      </div>
      {sourceQuery || destinationQuery ? (
        <div className="mt-2 flex flex-wrap gap-2" aria-label="Directional move filters">
          {sourceQuery ? (
            <button
              aria-label={`Remove source filter ${sourceQuery}`}
              className="min-h-11 max-w-full rounded-full bg-sky-100 px-3 text-left text-xs font-bold text-sky-950"
              onClick={() => setSourceQuery('')}
              type="button"
            >
              <span className="block truncate">Source: {sourceQuery} ×</span>
            </button>
          ) : null}
          {destinationQuery ? (
            <button
              aria-label={`Remove destination filter ${destinationQuery}`}
              className="min-h-11 max-w-full rounded-full bg-emerald-100 px-3 text-left text-xs font-bold text-emerald-950"
              onClick={() => setDestinationQuery('')}
              type="button"
            >
              <span className="block truncate">Destination: {destinationQuery} ×</span>
            </button>
          ) : null}
        </div>
      ) : null}
      <ol className="mt-4 space-y-2">
        {filteredActivity.map((item) => (
          <li className="rounded-lg bg-slate-50 p-3 text-sm" key={item.id}>
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold text-slate-900">{teamActivityLabel(item.eventKind)}</p>
              <time className="shrink-0 text-xs text-slate-500" dateTime={item.occurredAt}>
                {teamActivityTimestampLabel(item.occurredAt)}
              </time>
            </div>
            <p className="mt-1 break-all text-xs text-slate-600">
              {item.targetLabel} · by {item.actorLabel}
            </p>
            {item.eventKind === 'crew_hierarchy_updated'
              && item.sourceBranchLabel
              && item.sourceTerritoryLabel
              && item.destinationBranchLabel
              && item.destinationTerritoryLabel ? (
                <p className="mt-2 rounded-lg bg-white p-2 text-xs text-slate-700">
                  <span className={`mr-2 inline-block rounded-full px-2 py-1 font-bold ${
                    item.crossBranchMove
                      ? 'bg-amber-100 text-amber-950'
                      : 'bg-sky-100 text-sky-950'
                  }`}>
                    {item.crossBranchMove ? 'Cross-branch move' : 'Within-branch move'}
                  </span>
                  <span className="block pt-2">
                  From {item.sourceBranchLabel} · {item.sourceTerritoryLabel}
                  <span aria-hidden="true"> → </span>
                  <span className="sr-only"> to </span>
                  {item.destinationBranchLabel} · {item.destinationTerritoryLabel}
                  </span>
                </p>
              ) : null}
            {item.eventKind === 'crew_hierarchy_updated' && onOpenCrew ? (
              <button
                className="mt-2 min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800"
                onClick={() => onOpenCrew(item.targetId)}
                type="button"
              >
                Open affected crew
              </button>
            ) : null}
            <details className="mt-2 text-xs text-slate-500">
              <summary className="min-h-11 cursor-pointer content-center font-semibold">
                Show immutable IDs
              </summary>
              <dl className="space-y-1 rounded-lg border border-slate-200 bg-white p-2">
                <div>
                  <dt className="font-semibold">Audit event ID</dt>
                  <dd className="break-all">{item.id}</dd>
                  <button
                    className="mt-1 min-h-11 rounded-lg border border-slate-300 px-3 font-semibold"
                    onClick={() => void copyActivityId(item.id, 'Audit event ID')}
                    type="button"
                  >
                    Copy audit event ID
                  </button>
                </div>
                <div>
                  <dt className="font-semibold">Actor ID</dt>
                  <dd className="break-all">{item.actorUserId}</dd>
                  <button
                    className="mt-1 min-h-11 rounded-lg border border-slate-300 px-3 font-semibold"
                    onClick={() => void copyActivityId(item.actorUserId, 'Actor ID')}
                    type="button"
                  >
                    Copy actor ID
                  </button>
                </div>
                <div>
                  <dt className="font-semibold">Target ID</dt>
                  <dd className="break-all">{item.targetId}</dd>
                  <button
                    className="mt-1 min-h-11 rounded-lg border border-slate-300 px-3 font-semibold"
                    onClick={() => void copyActivityId(item.targetId, 'Target ID')}
                    type="button"
                  >
                    Copy target ID
                  </button>
                </div>
              </dl>
            </details>
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
