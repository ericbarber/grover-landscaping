import { useMemo, useState } from 'react';
import type { PropertyCompletionReportSummary } from '../api/client';
import {
  customerVisitStatusLabel,
  visitsForPortalProperty,
  type CustomerPortalPropertySummary,
  type CustomerPortalVisitSummary,
} from '../domain/customerPortalVisits';
import { WorkspaceIcon } from './WorkspaceIcon';
import { WorkspaceStatusNotice } from './WorkspaceStatus';

type PortalDestination = 'home' | 'visits' | 'proof' | 'account';

const destinations: Array<{ id: PortalDestination; label: string }> = [
  { id: 'home', label: 'Home' },
  { id: 'visits', label: 'Visits' },
  { id: 'proof', label: 'Proof' },
  { id: 'account', label: 'Account' },
];

function serviceDateLabel(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

function deliveredDateLabel(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export function YardOwnerPortalPanel({
  customerDisplayName,
  properties,
  visits,
  isLoadingVisits,
  visitReadError,
  onRetryVisits,
  completionReportsByProperty,
  isLoadingReportHistory,
  hasReportHistoryError,
}: {
  customerDisplayName: string;
  properties: CustomerPortalPropertySummary[];
  visits: CustomerPortalVisitSummary[];
  isLoadingVisits: boolean;
  visitReadError: 'access_required' | 'inconsistent' | 'unavailable' | null;
  onRetryVisits: () => void;
  completionReportsByProperty: Record<string, PropertyCompletionReportSummary[]>;
  isLoadingReportHistory: boolean;
  hasReportHistoryError: boolean;
}) {
  const visibleProperties = properties;
  const [destination, setDestination] = useState<PortalDestination>('home');
  const [selectedPropertyId, setSelectedPropertyId] = useState(visibleProperties[0]?.id ?? '');
  const selectedProperty = visibleProperties.find(({ id }) => id === selectedPropertyId)
    ?? visibleProperties[0];
  const propertyVisits = useMemo(
    () => selectedProperty
      ? visitsForPortalProperty(
        visits,
        selectedProperty.customerId,
        selectedProperty.organizationId,
        selectedProperty.id,
      )
      : [],
    [selectedProperty, visits],
  );
  const propertyReports = selectedProperty
    ? completionReportsByProperty[selectedProperty.id] ?? []
    : [];
  const nextVisit = propertyVisits[0];
  const latestProof = propertyReports[0];

  if (isLoadingVisits) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-paper p-6 shadow-grover-md" aria-busy="true">
        <p className="grover-eyebrow">My yard</p>
        <h1 className="mt-2 font-display text-4xl font-black text-forest">Loading your yard</h1>
        <p className="mt-4 text-sm font-semibold text-slate-600" role="status">Checking your protected properties and confirmed visits…</p>
      </section>
    );
  }

  if (visitReadError) {
    const copy = visitReadError === 'access_required'
      ? {
        title: 'No active customer portal access is available.',
        detail: 'Ask your landscaping provider to confirm the account or property access connected to this sign-in.',
      }
      : visitReadError === 'inconsistent'
        ? {
          title: 'Your customer portal access needs provider review.',
          detail: 'Visit details remain protected until the provider repairs the account or property relationship.',
        }
        : {
          title: 'Your visit details are temporarily unavailable.',
          detail: 'Customer information remains protected. Try loading the portal again.',
        };
    return (
      <section className="rounded-3xl border border-slate-200 bg-paper p-6 shadow-grover-md">
        <p className="grover-eyebrow">My yard</p>
        <WorkspaceStatusNotice className="mt-4" detail={copy.detail} title={copy.title} tone="warning" />
        <button className="grover-button-secondary mt-5" onClick={onRetryVisits} type="button">Try again</button>
      </section>
    );
  }

  if (!selectedProperty) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-paper p-6 shadow-grover-md">
        <p className="grover-eyebrow">My yard</p>
        <h1 className="mt-2 font-display text-4xl font-black text-forest">Welcome, {customerDisplayName}</h1>
        <WorkspaceStatusNotice
          className="mt-6"
          detail="Ask your landscaping provider to connect an active property to this account."
          title="No active property is connected yet."
          tone="neutral"
        />
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-paper shadow-grover-md">
      <header className="bg-forest p-5 text-white sm:p-7">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-sand">My yard</p>
            <p className="mt-2 text-sm text-slate-200">Care, proof, and the next thing you need to know.</p>
          </div>
          <label className="text-xs font-black uppercase tracking-wide text-slate-200">
            Property
            <select
              aria-label="Choose portal property"
              className="mt-2 min-h-12 w-full rounded-xl border border-white/30 bg-paper px-3 text-base font-bold normal-case tracking-normal text-forest"
              onChange={(event) => {
                setSelectedPropertyId(event.target.value);
                setDestination('home');
              }}
              value={selectedProperty.id}
            >
              {visibleProperties.map((property) => (
                <option key={property.id} value={property.id}>{property.displayName}</option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <nav aria-label="Yard Owner portal" className="grid grid-cols-4 border-b border-slate-200 bg-slate-50 p-2">
        {destinations.map((item) => (
          <button
            aria-current={destination === item.id ? 'page' : undefined}
            className={`min-h-12 rounded-xl px-2 text-xs font-black sm:text-sm ${destination === item.id ? 'bg-emerald-800 text-white shadow-grover-sm' : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-900'}`}
            key={item.id}
            onClick={() => setDestination(item.id)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-5 sm:p-7">
        {destination === 'home' ? (
          <div>
            <p className="grover-eyebrow">{selectedProperty.displayName}</p>
            <h1 className="mt-2 font-display text-4xl font-black text-forest">
              Welcome back, {customerDisplayName}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">Here is what is next for {selectedProperty.displayName}.</p>

            <div className="mt-7 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
              {nextVisit ? (
                <article className="rounded-2xl bg-emerald-50 p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="grover-eyebrow">Next confirmed visit</p>
                      <h2 className="mt-2 font-display text-3xl font-black text-forest">{serviceDateLabel(nextVisit.scheduledDate)}</h2>
                      <p className="mt-1 font-black text-emerald-900">{nextVisit.arrivalWindow} · {nextVisit.serviceTitle}</p>
                    </div>
                    <span className="rounded-full bg-paper px-3 py-1 text-xs font-black text-emerald-900">
                      {customerVisitStatusLabel(nextVisit.status)}
                    </span>
                  </div>
                  <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                    {nextVisit.scope.map((item) => (
                      <li className="flex gap-2 text-sm font-bold text-slate-700" key={item}>
                        <WorkspaceIcon className="h-4 w-4 shrink-0 text-emerald-700" name="check" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 rounded-xl bg-paper p-4 text-sm leading-6 text-slate-700">
                    <strong className="text-forest">Before we arrive:</strong> {nextVisit.preparationMessage}
                  </div>
                  <p className="mt-3 text-xs font-bold text-emerald-900">{nextVisit.nextUpdateMessage}</p>
                </article>
              ) : (
                <WorkspaceStatusNotice
                  detail="Your provider will update this space when a new visit is confirmed."
                  title="Nothing is currently scheduled for this property."
                  tone="neutral"
                />
              )}

              <article className="rounded-2xl border border-slate-200 p-5 sm:p-6">
                <p className="grover-eyebrow">Latest delivered proof</p>
                {isLoadingReportHistory ? (
                  <p className="mt-4 text-sm font-bold text-slate-600" role="status">Loading delivered care…</p>
                ) : latestProof ? (
                  <>
                    <h2 className="mt-2 font-display text-3xl font-black text-forest">Care completed</h2>
                    <p className="mt-2 text-sm text-slate-600">Delivered {deliveredDateLabel(latestProof.deliveredAt)}</p>
                    <a className="grover-button-secondary mt-5 w-full" href={latestProof.shareUrl}>Open delivered proof</a>
                  </>
                ) : (
                  <p className="mt-4 text-sm leading-6 text-slate-600">Your first proof will appear after your provider completes and delivers a service report.</p>
                )}
              </article>
            </div>
          </div>
        ) : null}

        {destination === 'visits' ? (
          <div>
            <p className="grover-eyebrow">{selectedProperty.displayName}</p>
            <h1 className="mt-2 font-display text-4xl font-black text-forest">Visits</h1>
            <p className="mt-2 text-sm text-slate-600">Upcoming care and customer-visible service-day updates.</p>
            <div className="mt-6 space-y-3">
              {propertyVisits.length > 0 ? propertyVisits.map((visit) => (
                <article className="rounded-2xl border border-slate-200 p-5" key={visit.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-display text-2xl font-black text-forest">{serviceDateLabel(visit.scheduledDate)}</h2>
                      <p className="mt-1 text-sm font-bold text-slate-700">{visit.arrivalWindow} · {visit.serviceTitle}</p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-900">{customerVisitStatusLabel(visit.status)}</span>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-600">{visit.nextUpdateMessage}</p>
                </article>
              )) : (
                <WorkspaceStatusNotice detail="A confirmed visit will appear here when your provider schedules it." title="No upcoming visits." tone="neutral" />
              )}
            </div>
          </div>
        ) : null}

        {destination === 'proof' ? (
          <div>
            <p className="grover-eyebrow">{selectedProperty.displayName}</p>
            <h1 className="mt-2 font-display text-4xl font-black text-forest">Proof</h1>
            <p className="mt-2 text-sm text-slate-600">Delivered care records for this property.</p>
            {hasReportHistoryError ? <WorkspaceStatusNotice className="mt-5" detail="Your protected proof history could not be refreshed. Try again later." title="Delivered proof is temporarily unavailable." tone="warning" /> : null}
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {propertyReports.map((report) => (
                <a className="rounded-2xl border border-slate-200 bg-slate-50 p-5 hover:border-emerald-500" href={report.shareUrl} key={report.reportId}>
                  <p className="text-xs font-black uppercase tracking-wide text-emerald-800">Delivered proof</p>
                  <h2 className="mt-2 font-display text-2xl font-black text-forest">Care completed</h2>
                  <p className="mt-2 text-sm text-slate-600">Delivered {deliveredDateLabel(report.deliveredAt)}</p>
                </a>
              ))}
              {!isLoadingReportHistory && propertyReports.length === 0 && !hasReportHistoryError ? (
                <WorkspaceStatusNotice detail="Proof appears only after your provider delivers a completed service report." title="No delivered proof yet." tone="neutral" />
              ) : null}
            </div>
          </div>
        ) : null}

        {destination === 'account' ? (
          <div>
            <p className="grover-eyebrow">Customer account</p>
            <h1 className="mt-2 font-display text-4xl font-black text-forest">Account</h1>
            <p className="mt-2 text-sm text-slate-600">Choose a connected property.</p>
            <section className="mt-6" aria-labelledby="account-properties-heading">
              <h2 className="text-lg font-black text-forest" id="account-properties-heading">Properties</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {visibleProperties.map((property) => (
                  <button
                    aria-pressed={property.id === selectedProperty.id}
                    className={`min-h-20 rounded-2xl border p-4 text-left ${property.id === selectedProperty.id ? 'border-emerald-700 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}
                    key={property.id}
                    onClick={() => {
                      setSelectedPropertyId(property.id);
                      setDestination('home');
                    }}
                    type="button"
                  >
                    <span className="block font-black text-forest">{property.displayName}</span>
                    <span className="mt-1 block text-sm text-slate-600">Connected property</span>
                  </button>
                ))}
              </div>
            </section>

          </div>
        ) : null}
      </div>
    </section>
  );
}
