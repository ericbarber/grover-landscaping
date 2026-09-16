import { useEffect, useState } from 'react';
import {
  customerVisitStatusLabel,
  visitsForPortalProperty,
  type CustomerPortalPropertySummary,
  type CustomerPortalVisitSummary,
} from '../domain/customerPortalVisits';
import type { PortalHomeReadState } from './WorkspaceHomePanel';
import { CustomerVisitQuestions } from './YardOwnerPortalPanel';
import { propertyManagerPortfolioCapabilities } from './PropertyManagerPortfolioPanel';
import { WorkspaceStatusNotice } from './WorkspaceStatus';

type Props = {
  properties: CustomerPortalPropertySummary[];
  visits: CustomerPortalVisitSummary[];
  readState: PortalHomeReadState;
  rolloutUnit?: string | null;
  onRetry: () => void;
  onReturnHome: () => void;
};

function serviceDateLabel(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

const readFailure: Record<Exclude<PortalHomeReadState, 'loading' | 'ready'>, {
  title: string;
  detail: string;
}> = {
  access_required: {
    title: 'Property portfolio access is not active.',
    detail: 'No authorized property or visit can be shown for this account. Ask the provider to review your property access.',
  },
  inconsistent: {
    title: 'Property access needs provider review.',
    detail: 'Your account, property grant, and membership could not be reconciled. Property details remain hidden.',
  },
  unavailable: {
    title: 'Portfolio visits could not be loaded.',
    detail: 'The protected read is unavailable. No property or service detail is shown until it succeeds.',
  },
};

export function PropertyManagerAuthorizedPortfolioPanel({
  properties,
  visits,
  readState,
  rolloutUnit,
  onRetry,
  onReturnHome,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const capabilities = propertyManagerPortfolioCapabilities(rolloutUnit);
  const selected = properties.find((property) => property.id === selectedId) ?? null;
  const filtered = properties.filter((property) => (
    property.displayName.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())
  ));

  useEffect(() => {
    if (readState === 'ready') return;
    setSelectedId(null);
    setQuery('');
  }, [readState]);

  useEffect(() => {
    if (!selected) return;
    document.getElementById('authorized-property-title')?.focus();
  }, [selected]);

  if (!capabilities.portfolioRead) {
    return (
      <section className="grover-card p-6" data-property-manager-portfolio>
        <h1 className="font-display text-3xl font-black text-forest">Property portfolio</h1>
        <WorkspaceStatusNotice
          className="mt-4"
          title="Portfolio access is not enabled for this account."
          detail="Ask an organization administrator to confirm your workspace rollout assignment."
          tone="neutral"
        />
      </section>
    );
  }

  if (readState !== 'ready') {
    const failure = readState === 'loading' ? null : readFailure[readState];
    return (
      <section className="grover-card p-6" data-property-manager-portfolio>
        <p className="grover-eyebrow">Property portfolio · protected read</p>
        <h1 className="mt-2 font-display text-3xl font-black text-forest">Your authorized properties</h1>
        <WorkspaceStatusNotice
          className="mt-5"
          title={failure?.title ?? 'Checking your property access.'}
          detail={failure?.detail ?? 'Property and visit details will appear after account access is checked.'}
          tone={failure ? 'warning' : 'info'}
        />
        <div className="mt-5 flex flex-wrap gap-3">
          {failure ? <button className="grover-button-primary" onClick={onRetry} type="button">Retry protected read</button> : null}
          <button className="grover-button-secondary" onClick={onReturnHome} type="button">Return Home</button>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-paper shadow-grover-md" data-property-manager-portfolio>
      <header className="bg-forest p-5 text-white sm:p-7">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-sand">Property portfolio · protected read</p>
        <h1 className="mt-2 font-display text-3xl font-black">Your authorized properties</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-200">
          {properties.length} {properties.length === 1 ? 'property' : 'properties'} in your current access scope. Service updates are customer-safe and tied to the exact property.
        </p>
      </header>
      <div className="grid gap-5 p-5 sm:p-7 lg:grid-cols-[minmax(15rem,.38fr)_minmax(0,1fr)]">
        <div>
          <label className="block text-sm font-bold text-forest">
            Find a property
            <input
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-950"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search authorized names"
              type="search"
              value={query}
            />
          </label>
          {properties.length === 0 ? (
            <WorkspaceStatusNotice
              className="mt-4"
              title="No property is in your current access scope."
              detail="Ask the provider to review your property assignment before relying on a service summary."
              tone="neutral"
            />
          ) : filtered.length === 0 ? (
            <p className="mt-4 rounded-xl bg-slate-100 p-4 text-sm text-slate-700">No authorized property matches that search.</p>
          ) : (
            <div className="mt-4 grid gap-2" aria-label="Authorized properties">
              {filtered.map((property) => {
                const propertyVisits = visitsForPortalProperty(
                  visits, property.customerId, property.organizationId, property.id,
                );
                const latest = propertyVisits[propertyVisits.length - 1];
                return (
                  <button
                    aria-pressed={selectedId === property.id}
                    className={`min-h-16 rounded-xl border p-4 text-left ${selectedId === property.id ? 'border-emerald-700 bg-emerald-50' : 'border-slate-200 bg-white hover:border-emerald-400'}`}
                    key={property.id}
                    onClick={() => setSelectedId(property.id)}
                    type="button"
                  >
                    <strong className="block text-base text-forest">{property.displayName}</strong>
                    <span className="mt-1 block text-xs text-slate-600">
                      {latest ? `${customerVisitStatusLabel(latest.status)} · ${serviceDateLabel(latest.scheduledDate)}` : 'No confirmed visit in this read'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="min-w-0">
          {selected ? (
            <div>
              <p className="grover-eyebrow">Exact property</p>
              <h2 className="mt-2 font-display text-3xl font-black text-forest" id="authorized-property-title" tabIndex={-1}>{selected.displayName}</h2>
              {visitsForPortalProperty(visits, selected.customerId, selected.organizationId, selected.id).length === 0 ? (
                <WorkspaceStatusNotice
                  className="mt-4"
                  title="No confirmed visit is available for this property."
                  detail="This protected read does not include a service to review or respond to."
                  tone="neutral"
                />
              ) : visitsForPortalProperty(visits, selected.customerId, selected.organizationId, selected.id).map((visit) => (
                <article className="mt-4 rounded-2xl border border-slate-200 bg-white p-5" key={visit.id}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="font-display text-2xl font-black text-forest">{visit.serviceTitle}</h3>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-950">{customerVisitStatusLabel(visit.status)}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-700">{serviceDateLabel(visit.scheduledDate)} · {visit.arrivalWindow}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-700">{visit.statusReason ?? visit.preparationMessage}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Next update: {visit.nextUpdateMessage}</p>
                  {capabilities.questionsAndDecisions ? <CustomerVisitQuestions visit={visit} /> : null}
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="font-display text-2xl font-black text-forest">Choose a property to see its service.</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Only property and visit details returned for your current access are available here.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
