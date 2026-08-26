import { useMemo, useState } from 'react';
import type { PropertyCompletionReportSummary } from '../api/client';
import {
  customerVisitStatusLabel,
  visitsForPortalProperty,
  type CustomerPortalPropertySummary,
  type CustomerPortalVisitSummary,
  type CustomerVisitStatus,
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

const serviceProgressSteps = [
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'en_route', label: 'On the way' },
  { id: 'care_in_progress', label: 'Care' },
  { id: 'complete_proof_pending', label: 'Complete' },
] as const;

function serviceProgressIndex(status: CustomerVisitStatus): number {
  return {
    confirmed: 0,
    weather_delay: 0,
    rescheduled: 0,
    en_route: 1,
    care_in_progress: 2,
    complete_proof_pending: 3,
  }[status];
}

function serviceStatusClass(status: CustomerVisitStatus): string {
  return {
    confirmed: 'bg-paper text-emerald-900',
    en_route: 'bg-sky-100 text-sky-900',
    care_in_progress: 'bg-emerald-800 text-white',
    weather_delay: 'bg-amber-100 text-amber-950',
    rescheduled: 'bg-blue-100 text-blue-950',
    complete_proof_pending: 'bg-violet-100 text-violet-950',
  }[status];
}

function serviceCardClass(status: CustomerVisitStatus): string {
  return {
    confirmed: 'bg-emerald-50',
    en_route: 'bg-sky-50',
    care_in_progress: 'bg-emerald-50',
    weather_delay: 'bg-amber-50',
    rescheduled: 'bg-blue-50',
    complete_proof_pending: 'bg-violet-50',
  }[status];
}

function serviceVisitEyebrow(status: CustomerVisitStatus): string {
  if (status === 'complete_proof_pending') return 'Recent visit';
  if (status === 'confirmed') return 'Next confirmed visit';
  return 'Service-day update';
}

function preparationLabel(status: CustomerVisitStatus): string {
  if (status === 'en_route') return 'Prepare for arrival';
  if (status === 'care_in_progress' || status === 'complete_proof_pending') {
    return 'Recorded preparation';
  }
  if (status === 'weather_delay') return 'Preparation on file';
  return 'Before we arrive';
}

function ServiceProgress({ status }: { status: CustomerVisitStatus }) {
  const currentIndex = serviceProgressIndex(status);
  return (
    <ol aria-label="Service progress" className="mt-5 grid grid-cols-4 gap-2">
      {serviceProgressSteps.map((step, index) => {
        const isDone = index < currentIndex;
        const isCurrent = index === currentIndex;
        return (
          <li
            aria-current={isCurrent ? 'step' : undefined}
            className={`border-t-2 pt-2 text-center text-[0.68rem] font-black ${isDone || isCurrent ? 'border-emerald-700 text-emerald-900' : 'border-slate-200 text-slate-500'}`}
            key={step.id}
          >
            <span className={`mx-auto mb-1 grid h-7 w-7 place-items-center rounded-full ${isDone ? 'bg-emerald-700 text-white' : isCurrent ? 'bg-forest text-white' : 'bg-slate-100 text-slate-500'}`}>
              {isDone ? <WorkspaceIcon className="h-4 w-4" name="check" /> : index + 1}
            </span>
            {step.label}
          </li>
        );
      })}
    </ol>
  );
}

function ServiceStatusDetail({ visit }: { visit: CustomerPortalVisitSummary }) {
  if (visit.status === 'weather_delay' && visit.statusReason) {
    return (
      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        <strong>Weather update:</strong> {visit.statusReason}
      </div>
    );
  }
  if (visit.status === 'rescheduled'
    && visit.originalScheduledDate
    && visit.originalArrivalWindow) {
    return (
      <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-950">
        <strong>New date confirmed.</strong> Moved from {serviceDateLabel(visit.originalScheduledDate)}, {visit.originalArrivalWindow}. The replacement is {serviceDateLabel(visit.scheduledDate)}, {visit.arrivalWindow}.
      </div>
    );
  }
  if (visit.status === 'complete_proof_pending') {
    return (
      <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm leading-6 text-violet-950">
        <strong>Care is complete.</strong> Delivered proof will appear only after provider review. Unpublished evidence remains private.
      </div>
    );
  }
  return null;
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
                <article className={`rounded-2xl p-5 sm:p-6 ${serviceCardClass(nextVisit.status)}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="grover-eyebrow">{serviceVisitEyebrow(nextVisit.status)}</p>
                      <h2 className="mt-2 font-display text-3xl font-black text-forest">{serviceDateLabel(nextVisit.scheduledDate)}</h2>
                      <p className="mt-1 font-black text-emerald-900">{nextVisit.arrivalWindow} · {nextVisit.serviceTitle}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${serviceStatusClass(nextVisit.status)}`}>
                      {customerVisitStatusLabel(nextVisit.status)}
                    </span>
                  </div>
                  <ServiceProgress status={nextVisit.status} />
                  <ServiceStatusDetail visit={nextVisit} />
                  <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                    {nextVisit.scope.map((item) => (
                      <li className="flex gap-2 text-sm font-bold text-slate-700" key={item}>
                        <WorkspaceIcon className="h-4 w-4 shrink-0 text-emerald-700" name="check" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 rounded-xl bg-paper p-4 text-sm leading-6 text-slate-700">
                    <strong className="text-forest">{preparationLabel(nextVisit.status)}:</strong> {nextVisit.preparationMessage}
                  </div>
                  <p className="mt-3 text-sm font-bold text-emerald-950"><strong>Next update:</strong> {nextVisit.nextUpdateMessage}</p>
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
            <p className="mt-2 text-sm text-slate-600">Scheduled care and explicit customer-visible service-day updates.</p>
            <div className="mt-6 space-y-3">
              {propertyVisits.length > 0 ? propertyVisits.map((visit) => (
                <article className="rounded-2xl border border-slate-200 p-5" key={visit.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-display text-2xl font-black text-forest">{serviceDateLabel(visit.scheduledDate)}</h2>
                      <p className="mt-1 text-sm font-bold text-slate-700">{visit.arrivalWindow} · {visit.serviceTitle}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${serviceStatusClass(visit.status)}`}>{customerVisitStatusLabel(visit.status)}</span>
                  </div>
                  <ServiceProgress status={visit.status} />
                  <ServiceStatusDetail visit={visit} />
                  <p className="mt-4 text-sm leading-6 text-slate-700"><strong className="text-forest">Next update:</strong> {visit.nextUpdateMessage}</p>
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
