import { useEffect, useState } from 'react';
import {
  fetchOrganizationCrews,
  fetchOrganizationInvitations,
  fetchOrganizationMemberships,
  fetchServiceTerritories,
  type CrewRecord,
  type OrganizationInvitationSummary,
  type OrganizationMembership,
  type ServiceTerritoryRecord,
} from '../api/client';
import { WorkspaceIcon, type WorkspaceIconName } from './WorkspaceIcon';
import { WorkspaceStatusBadge, WorkspaceStatusNotice } from './WorkspaceStatus';

export type TeamOrganizationSummary = {
  activeMembers: number;
  pendingInvitations: number;
  activeCrews: number;
  unstaffedTerritories: number;
  crewsWithoutLead: number;
};

export function summarizeTeamOrganization(
  memberships: OrganizationMembership[],
  invitations: OrganizationInvitationSummary[],
  crews: CrewRecord[],
  territories: ServiceTerritoryRecord[],
): TeamOrganizationSummary {
  const activeCrews = crews.filter((crew) => crew.status === 'active');
  const staffedTerritoryIds = new Set(
    activeCrews.map((crew) => crew.territoryId).filter((id): id is string => Boolean(id)),
  );

  return {
    activeMembers: memberships.filter((membership) => membership.status === 'active').length,
    pendingInvitations: invitations.filter((invitation) => invitation.status === 'pending').length,
    activeCrews: activeCrews.length,
    unstaffedTerritories: territories.filter((territory) => (
      territory.status === 'active'
      && !staffedTerritoryIds.has(territory.id)
    )).length,
    crewsWithoutLead: activeCrews.filter((crew) => !crew.leadMembershipId).length,
  };
}

type TeamAction = {
  title: string;
  description: string;
  action: string;
  icon: WorkspaceIconName;
  onOpen: () => void;
};

export function TeamOrganizationOverviewPanel({
  organizationId,
  onOpenMembers,
  onOpenInvitations,
  onOpenCrews,
  onOpenActivity,
  refreshSignal = 0,
}: {
  organizationId: string;
  onOpenMembers: () => void;
  onOpenInvitations: () => void;
  onOpenCrews: () => void;
  onOpenActivity: () => void;
  refreshSignal?: number;
}) {
  const [summary, setSummary] = useState<TeamOrganizationSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnavailable, setIsUnavailable] = useState(false);
  const [reloadSignal, setReloadSignal] = useState(0);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setIsUnavailable(false);
    void Promise.all([
      fetchOrganizationMemberships(organizationId),
      fetchOrganizationInvitations(organizationId),
      fetchOrganizationCrews(organizationId),
      fetchServiceTerritories(),
    ]).then(([memberships, invitations, crews, allTerritories]) => {
      if (!active) return;
      const territories = allTerritories.filter((territory) => (
        territory.organizationId === organizationId
      ));
      setSummary(summarizeTeamOrganization(
        memberships,
        invitations,
        crews,
        territories,
      ));
    }).catch(() => {
      if (!active) return;
      setSummary(null);
      setIsUnavailable(true);
    }).finally(() => {
      if (active) setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, [organizationId, refreshSignal, reloadSignal]);

  const actions: TeamAction[] = [
    {
      title: 'Member directory',
      description: 'Review names, roles, access status, and immutable support IDs.',
      action: 'Open member directory',
      icon: 'customer',
      onOpen: onOpenMembers,
    },
    {
      title: 'Invitations',
      description: 'Invite, reissue, revoke, and recover teammate access.',
      action: 'Open invitations',
      icon: 'forward',
      onOpen: onOpenInvitations,
    },
    {
      title: 'Crew administration',
      description: 'Set crew leads, capacity, lifecycle, branch, and territory.',
      action: 'Open crew administration',
      icon: 'jobs',
      onOpen: onOpenCrews,
    },
    {
      title: 'Team activity',
      description: 'Trace access and hierarchy changes with actor and audit details.',
      action: 'Open team activity',
      icon: 'job',
      onOpen: onOpenActivity,
    },
  ];

  const metrics = [
    { label: 'Active', value: summary?.activeMembers },
    { label: 'Invited', value: summary?.pendingInvitations },
    { label: 'Crews', value: summary?.activeCrews },
    { label: 'Unstaffed', value: summary?.unstaffedTerritories },
  ];

  return (
    <section aria-labelledby="team-organization-heading" className="space-y-5" id="team-organization-overview">
      <div className="overflow-hidden rounded-2xl bg-forest px-5 py-6 text-white shadow-grover-md sm:px-7">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-gold">Organization operations</p>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-3xl font-black" id="team-organization-heading">Team and access</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-200">
              Build the operating team, keep every territory staffed, and trace material access changes.
            </p>
          </div>
          <WorkspaceStatusBadge className="border-white/15 bg-white/10 text-white" tone="neutral">
            Live organization data
          </WorkspaceStatusBadge>
        </div>
      </div>

      {isUnavailable ? (
        <WorkspaceStatusNotice
          detail="No team counts are being inferred while membership or hierarchy data is unavailable. The administration tools remain available."
          title="Team overview could not be refreshed."
          tone="warning"
        >
          <button
            className="min-h-11 rounded-xl border border-amber-500 bg-white px-4 text-sm font-black text-amber-950"
            onClick={() => setReloadSignal((current) => current + 1)}
            type="button"
          >
            Retry overview
          </button>
        </WorkspaceStatusNotice>
      ) : null}

      <div aria-busy={isLoading} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metrics.map((metric, index) => (
          <article
            aria-label={`${metric.label} team summary`}
            className={`grover-card p-4 ${index === 2 ? 'bg-gold/20' : ''}`}
            key={metric.label}
          >
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{metric.label}</p>
            <p className="mt-2 text-3xl font-black text-forest">
              {isLoading ? <span aria-label={`Loading ${metric.label.toLocaleLowerCase()}`}>—</span> : metric.value ?? '—'}
            </p>
          </article>
        ))}
      </div>

      {summary && (summary.unstaffedTerritories > 0 || summary.crewsWithoutLead > 0) ? (
        <WorkspaceStatusNotice
          detail={`${summary.unstaffedTerritories} active ${summary.unstaffedTerritories === 1 ? 'territory has' : 'territories have'} no active crew · ${summary.crewsWithoutLead} active ${summary.crewsWithoutLead === 1 ? 'crew has' : 'crews have'} no lead.`}
          title="Staffing needs attention."
          tone="warning"
        />
      ) : summary ? (
        <WorkspaceStatusNotice
          detail="Every active territory has an active crew, and every active crew has a lead."
          title="Operating structure is staffed."
          tone="success"
        />
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        {actions.map((item, index) => (
          <article className="grover-card flex min-h-48 flex-col p-5" key={item.title}>
            <div className="flex items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sage text-forest">
                <WorkspaceIcon className="size-5" name={item.icon} />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">{index + 1}</p>
                <h3 className="text-lg font-black text-forest">{item.title}</h3>
              </div>
            </div>
            <p className="mt-4 flex-1 text-sm leading-6 text-slate-600">{item.description}</p>
            <button
              className="mt-4 inline-flex min-h-11 items-center justify-between gap-3 rounded-xl border border-emerald-800 bg-white px-4 text-left text-sm font-black text-emerald-900"
              onClick={item.onOpen}
              type="button"
            >
              {item.action}
              <WorkspaceIcon className="size-4" name="forward" />
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
