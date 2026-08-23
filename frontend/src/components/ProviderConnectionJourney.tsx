import type {
  ProviderDisclosureAccess,
  ProviderInvitationProgress,
} from '../api/providerInvitationClient';
import type { OwnerProviderFirstVisit } from '../domain/initialServiceProposals';
import {
  providerConnectionJourney,
  type ProviderConnectionStageStatus,
} from '../domain/providerConnectionJourney';

const statusClasses: Record<ProviderConnectionStageStatus, string> = {
  complete: 'border-emerald-300 bg-emerald-50 text-emerald-950',
  current: 'border-sky-400 bg-sky-50 text-sky-950 ring-2 ring-sky-100',
  upcoming: 'border-slate-200 bg-white text-slate-600',
  closed: 'border-slate-300 bg-slate-100 text-slate-600',
};

export function ProviderConnectionJourney({
  progress,
  disclosure,
  firstVisit,
}: {
  progress: ProviderInvitationProgress;
  disclosure: ProviderDisclosureAccess | null;
  firstVisit: OwnerProviderFirstVisit | null;
}) {
  const stages = providerConnectionJourney(progress, disclosure, firstVisit);
  const current = stages.find(({ status }) => status === 'current');

  return (
    <nav aria-label="Provider connection lifecycle" className="mt-5 rounded-2xl border border-slate-200 bg-paper p-4" data-provider-connection-journey>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-800">Connection lifecycle</p><h3 className="mt-1 text-lg font-black text-forest">{current ? `Current: ${current.label}` : 'Lifecycle status'}</h3></div>
        <p className="text-xs font-bold text-slate-500">Customer approval and provider operations remain separate.</p>
      </div>
      <ol className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {stages.map((stage, index) => {
          const content = <><span className="text-[.68rem] font-black uppercase tracking-wide opacity-70">{index + 1} · {stage.status}</span><strong className="mt-1 block text-sm">{stage.label}</strong><span className="mt-1 block text-xs leading-5 opacity-80">{stage.detail}</span></>;
          return <li key={stage.id}>{stage.href && stage.status !== 'upcoming' ? <a className={`block min-h-24 rounded-xl border p-3 focus:outline-none focus:ring-4 focus:ring-sky-200 ${statusClasses[stage.status]}`} href={stage.href}>{content}</a> : <div className={`min-h-24 rounded-xl border p-3 ${statusClasses[stage.status]}`}>{content}</div>}</li>;
        })}
      </ol>
    </nav>
  );
}
