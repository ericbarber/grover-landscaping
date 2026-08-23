import type { FirstOwnerSetupProgress } from '../api/client';
import {
  providerReadinessFacts,
  providerReadinessStateLabel,
  providerSuppliedFactProgress,
  type ProviderReadinessFactState,
} from '../domain/providerReadiness';

const stateClasses: Record<ProviderReadinessFactState, string> = {
  supplied: 'bg-sky-100 text-sky-900',
  recorded: 'bg-emerald-100 text-emerald-900',
  operational: 'bg-emerald-100 text-emerald-900',
  missing: 'bg-amber-100 text-amber-950',
  not_collected: 'bg-slate-200 text-slate-800',
  not_evaluated: 'bg-slate-200 text-slate-800',
};

export function ProviderIdentityReadinessPanel({
  displayName,
  contactEmail,
  contactPhone,
  websiteUrl,
  timeZone,
  serviceAreaLabel,
  defaultDailyStopCapacity,
  setupProgress,
  onEditProfile,
}: {
  displayName: string;
  contactEmail: string;
  contactPhone: string;
  websiteUrl: string;
  timeZone: string;
  serviceAreaLabel: string;
  defaultDailyStopCapacity: number;
  setupProgress: FirstOwnerSetupProgress | null;
  onEditProfile: () => void;
}) {
  const facts = providerReadinessFacts({
    displayName, contactEmail, contactPhone, websiteUrl, timeZone,
    serviceAreaLabel, defaultDailyStopCapacity, setupProgress,
  });
  const progress = providerSuppliedFactProgress(facts);

  return (
    <section className="mt-4 overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50" data-provider-identity-readiness>
      <div className="grid gap-4 border-b border-emerald-200 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-800">Provider identity and readiness</p>
          <h3 className="mt-2 text-2xl font-black text-emerald-950">Preparation facts, without a broad verified badge.</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-emerald-900">{progress.completed} of {progress.total} currently collected preparation facts are present. Each fact keeps its actual source and meaning.</p>
        </div>
        <button className="min-h-11 rounded-xl border border-emerald-700 bg-white px-4 text-sm font-black text-emerald-900" onClick={onEditProfile} type="button">Edit provider profile</button>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
        {facts.map((fact) => (
          <article className="rounded-xl border border-emerald-100 bg-white p-4" key={fact.id}>
            <div className="flex flex-wrap items-start justify-between gap-2"><h4 className="font-black text-forest">{fact.label}</h4><span className={`rounded-full px-2 py-1 text-[.68rem] font-black uppercase tracking-wide ${stateClasses[fact.state]}`}>{providerReadinessStateLabel(fact.state)}</span></div>
            <p className="mt-2 text-sm leading-6 text-slate-600">{fact.detail}</p>
          </article>
        ))}
      </div>
      <p className="border-t border-emerald-200 bg-paper px-5 py-4 text-xs font-bold leading-5 text-slate-600">These records prepare internal operations only. They do not publish this provider, establish legal eligibility, validate credentials, rank the business, or guarantee service opportunities.</p>
    </section>
  );
}
