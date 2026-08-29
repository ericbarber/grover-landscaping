import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import type { CustomerCompletionReport } from '../api/client';
import { fetchCustomerVisitProof } from '../api/customerPortalClient';
import {
  createCustomerVisitQuestion,
  fetchCustomerVisitThread,
} from '../api/customerVisitCommunicationClient';
import type {
  CustomerVisitQuestionTopic,
  CustomerVisitThread,
} from '../domain/customerVisitCommunication';
import {
  customerVisitStatusLabel,
  visitsForPortalProperty,
  type CustomerPortalPropertySummary,
  type CustomerPortalVisitSummary,
  type CustomerVisitStatus,
} from '../domain/customerPortalVisits';
import { WorkspaceIcon } from './WorkspaceIcon';
import { WorkspaceStatusNotice } from './WorkspaceStatus';
import { CustomerVisitRecommendationsPanel } from './CustomerVisitRecommendationsPanel';

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

const questionTopics: Array<{ value: CustomerVisitQuestionTopic; label: string }> = [
  { value: 'timing', label: 'Timing' },
  { value: 'preparation', label: 'Preparation' },
  { value: 'access', label: 'Property access' },
  { value: 'service_scope', label: 'Planned service' },
  { value: 'other', label: 'Something else' },
];

function CustomerVisitQuestions({ visit }: { visit: CustomerPortalVisitSummary }) {
  const reference = visit.customerVisitReference;
  const [open, setOpen] = useState(false);
  const [thread, setThread] = useState<CustomerVisitThread | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [topic, setTopic] = useState<CustomerVisitQuestionTopic>('timing');
  const [body, setBody] = useState('');
  const retryKey = useRef<string | null>(null);

  useEffect(() => {
    setOpen(false);
    setThread(null);
    setError(null);
    setBody('');
    retryKey.current = null;
  }, [reference]);

  async function loadThread() {
    if (!reference) return;
    setLoading(true);
    setError(null);
    try {
      setThread(await fetchCustomerVisitThread(reference));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'The visit conversation could not be loaded.');
    } finally {
      setLoading(false);
    }
  }

  function openThread() {
    setOpen(true);
    if (!thread) void loadThread();
  }

  async function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!thread || !body.trim()) return;
    retryKey.current ??= `customer-visit-question-${crypto.randomUUID()}`;
    setSaving(true);
    setError(null);
    try {
      await createCustomerVisitQuestion(thread, topic, body.trim(), retryKey.current);
      retryKey.current = null;
      setBody('');
      try {
        setThread(await fetchCustomerVisitThread(thread.customerVisitReference));
      } catch (reloadError) {
        setError(`${reloadError instanceof Error ? reloadError.message : 'The latest conversation could not be loaded.'} Your question was confirmed; reload the conversation to see it.`);
      }
    } catch (writeError) {
      try {
        setThread(await fetchCustomerVisitThread(thread.customerVisitReference));
      } catch {
        // Keep the last authoritative thread and retry key when reload is unavailable.
      }
      setError(`${writeError instanceof Error ? writeError.message : 'The question could not be confirmed.'} Review the latest conversation before retrying.`);
    } finally {
      setSaving(false);
    }
  }

  if (!reference) {
    return (
      <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs font-semibold leading-5 text-slate-600">
        Visit questions become available after your provider finishes preparing this confirmed visit for service.
      </p>
    );
  }

  if (!open) {
    return <button className="grover-button-secondary mt-4" onClick={openThread} type="button">Ask about this visit</button>;
  }

  return (
    <section aria-label="Visit questions" className="mt-5 rounded-2xl border border-sky-200 bg-sky-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h3 className="font-black text-forest">Visit questions</h3><p className="mt-1 text-xs leading-5 text-slate-600">Messages stay with this visit. Sending does not promise an alert or response time.</p></div>
        <button className="min-h-10 rounded-lg px-3 text-sm font-bold text-sky-900" onClick={() => setOpen(false)} type="button">Close</button>
      </div>
      {loading ? <p className="mt-4 text-sm font-bold text-slate-600" role="status">Loading conversation…</p> : null}
      {error ? <WorkspaceStatusNotice className="mt-4" detail={error} title="Conversation needs attention." tone="warning" /> : null}
      {!loading && !thread ? <button className="grover-button-secondary mt-4" onClick={() => void loadThread()} type="button">Try conversation again</button> : null}
      {thread ? (
        <>
          {thread.messages.length ? <ol className="mt-4 space-y-3">{thread.messages.map((message) => (
            <li className={`rounded-xl p-3 text-sm leading-6 ${message.authorRole === 'customer' ? 'bg-white' : 'bg-emerald-950 text-white'}`} key={message.messageId}>
              <p className={`text-xs font-black uppercase tracking-wide ${message.authorRole === 'customer' ? 'text-sky-800' : 'text-emerald-100'}`}>{message.authorRole === 'customer' ? 'You asked' : 'Provider response'} · {questionTopics.find(({ value }) => value === message.topic)?.label}</p>
              <p className="mt-1">{message.customerSafeBody}</p>
            </li>
          ))}</ol> : <p className="mt-4 rounded-xl bg-white p-3 text-sm text-slate-600">No questions have been asked about this visit.</p>}
          <form className="mt-4 grid gap-3" onSubmit={submitQuestion}>
            <label className="text-sm font-bold text-forest">Topic<select className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal" onChange={(event) => setTopic(event.target.value as CustomerVisitQuestionTopic)} value={topic}>{questionTopics.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
            <label className="text-sm font-bold text-forest">Your question<textarea className="mt-1 min-h-24 w-full rounded-xl border border-slate-300 bg-white p-3 font-normal" maxLength={2000} onChange={(event) => { setBody(event.target.value); retryKey.current = null; }} placeholder="What would help you prepare for this visit?" value={body} /></label>
            <button className="grover-button-primary disabled:opacity-60" disabled={saving || !body.trim()} type="submit">{saving ? 'Confirming question…' : 'Send question'}</button>
          </form>
        </>
      ) : null}
    </section>
  );
}

function CustomerDeliveredProof({ visit }: { visit: CustomerPortalVisitSummary }) {
  const reference = visit.customerVisitReference;
  const [open, setOpen] = useState(false);
  const [proof, setProof] = useState<CustomerCompletionReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadProof() {
    if (!reference) return;
    setOpen(true);
    setLoading(true);
    setError(null);
    try {
      setProof(await fetchCustomerVisitProof(reference));
    } catch (loadError) {
      setProof(null);
      setError(loadError instanceof Error
        ? loadError.message
        : 'Delivered proof could not be loaded.');
    } finally {
      setLoading(false);
    }
  }

  if (!visit.deliveredProofAvailable || !reference) return null;

  if (!open) {
    return (
      <button className="grover-button-secondary mt-4 w-full" onClick={() => void loadProof()} type="button">
        Open delivered proof
      </button>
    );
  }

  return (
    <section aria-label="Delivered proof detail" className="mt-4 rounded-2xl border border-emerald-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-emerald-800">Delivered proof</p>
          <h3 className="mt-1 font-display text-2xl font-black text-forest">{visit.serviceTitle}</h3>
        </div>
        <button className="min-h-10 rounded-lg px-3 text-sm font-bold text-emerald-900" onClick={() => setOpen(false)} type="button">Close</button>
      </div>
      {loading ? <p className="mt-4 text-sm font-bold text-slate-600" role="status">Loading protected proof…</p> : null}
      {error ? (
        <WorkspaceStatusNotice className="mt-4" detail={`${error} No live work data was substituted.`} title="Delivered proof needs attention." tone="warning">
          <button className="grover-button-secondary mt-2" onClick={() => void loadProof()} type="button">Try proof again</button>
        </WorkspaceStatusNotice>
      ) : null}
      {proof ? (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-emerald-50 p-3"><strong className="block text-xl text-forest">{proof.checklistProgress}%</strong><span className="text-xs text-slate-600">Checklist</span></div>
            <div className="rounded-xl bg-emerald-50 p-3"><strong className="block text-xl text-forest">{proof.beforePhotos}</strong><span className="text-xs text-slate-600">Before</span></div>
            <div className="rounded-xl bg-emerald-50 p-3"><strong className="block text-xl text-forest">{proof.afterPhotos}</strong><span className="text-xs text-slate-600">After</span></div>
          </div>
          <div>
            <h4 className="text-sm font-black text-forest">Completed service</h4>
            <ul className="mt-2 space-y-2">{proof.checklist.map((item) => (
              <li className="flex gap-2 text-sm text-slate-700" key={item.label}>
                <span aria-hidden="true" className="font-black text-emerald-700">✓</span>{item.label}
              </li>
            ))}</ul>
          </div>
          {proof.photoEvidence.length ? (
            <div>
              <h4 className="text-sm font-black text-forest">Photo evidence</h4>
              <div className="mt-2 grid grid-cols-2 gap-2">{proof.photoEvidence.map((photo) => (
                <figure className="overflow-hidden rounded-xl border border-slate-200" key={`${photo.photoType}:${photo.imageUrl}`}>
                  <img alt={`${photo.photoType} service evidence`} className="aspect-[4/3] w-full object-cover" src={photo.imageUrl} />
                  <figcaption className="p-2 text-xs font-bold capitalize text-slate-600">{photo.photoType}</figcaption>
                </figure>
              ))}</div>
            </div>
          ) : null}
          {proof.completedRecommendations.length ? (
            <div className="rounded-xl bg-violet-50 p-3">
              <h4 className="text-sm font-black text-violet-950">Completed approved work</h4>
              <ul className="mt-2 space-y-2">{proof.completedRecommendations.map((item) => (
                <li className="text-sm text-violet-950" key={`${item.serviceName}:${item.quantity}`}>
                  <strong>{item.serviceName}</strong>{item.quantity > 1 ? ` · ${item.quantity}` : ''}
                  {item.serviceDescription ? <span className="mt-1 block text-xs leading-5">{item.serviceDescription}</span> : null}
                </li>
              ))}</ul>
              <p className="mt-3 text-xs leading-5 text-violet-900">These are completed outcomes from this visit, not a new recommendation or approval request.</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export function YardOwnerPortalPanel({
  customerDisplayName,
  properties,
  visits,
  isLoadingVisits,
  visitReadError,
  onRetryVisits,
}: {
  customerDisplayName: string;
  properties: CustomerPortalPropertySummary[];
  visits: CustomerPortalVisitSummary[];
  isLoadingVisits: boolean;
  visitReadError: 'access_required' | 'inconsistent' | 'unavailable' | null;
  onRetryVisits: () => void;
}) {
  const visibleProperties = properties;
  const [destination, setDestination] = useState<PortalDestination>('home');
  const [selectedPropertyId, setSelectedPropertyId] = useState(visibleProperties[0]?.id ?? '');
  const [expandedVisitId, setExpandedVisitId] = useState<string | null>(null);
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
  const proofVisits = propertyVisits.filter(
    (visit) => visit.deliveredProofAvailable && visit.customerVisitReference,
  );
  const nextVisit = propertyVisits[0];
  const latestProofVisit = proofVisits[proofVisits.length - 1];

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
                setExpandedVisitId(null);
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
                  <CustomerVisitQuestions visit={nextVisit} />
                  {nextVisit.customerVisitReference ? (
                    <CustomerVisitRecommendationsPanel customerVisitReference={nextVisit.customerVisitReference} />
                  ) : null}
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
                {latestProofVisit ? (
                  <>
                    <h2 className="mt-2 font-display text-3xl font-black text-forest">Care completed</h2>
                    <p className="mt-2 text-sm text-slate-600">{serviceDateLabel(latestProofVisit.scheduledDate)} · {latestProofVisit.serviceTitle}</p>
                    <CustomerDeliveredProof visit={latestProofVisit} />
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
              {propertyVisits.length > 0 ? propertyVisits.map((visit, index) => {
                const isExpanded = expandedVisitId === visit.id;
                const detailId = `customer-visit-detail-${index}`;
                return (
                  <article className={`overflow-hidden rounded-2xl border ${isExpanded ? 'border-emerald-300 bg-emerald-50/40' : 'border-slate-200 bg-white'}`} key={visit.id}>
                    <button
                      aria-controls={detailId}
                      aria-expanded={isExpanded}
                      className="flex min-h-24 w-full items-start justify-between gap-4 p-4 text-left sm:p-5"
                      onClick={() => setExpandedVisitId(isExpanded ? null : visit.id)}
                      type="button"
                    >
                      <span className="min-w-0">
                        <span className="block font-display text-xl font-black text-forest sm:text-2xl">{serviceDateLabel(visit.scheduledDate)}</span>
                        <span className="mt-1 block text-sm font-bold text-slate-700">{visit.arrivalWindow} · {visit.serviceTitle}</span>
                        <span className="mt-2 block text-xs font-semibold text-emerald-800">{isExpanded ? 'Hide visit details' : 'Review visit details'}</span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-black ${serviceStatusClass(visit.status)}`}>{customerVisitStatusLabel(visit.status)}</span>
                        <WorkspaceIcon className={`size-5 text-emerald-800 transition-transform ${isExpanded ? 'rotate-90' : ''}`} name="forward" />
                      </span>
                    </button>
                    {isExpanded ? (
                      <div className="border-t border-emerald-200 bg-paper p-4 sm:p-5" id={detailId}>
                        <ServiceProgress status={visit.status} />
                        <ServiceStatusDetail visit={visit} />
                        <p className="mt-4 text-sm leading-6 text-slate-700"><strong className="text-forest">Next update:</strong> {visit.nextUpdateMessage}</p>
                        <CustomerVisitQuestions visit={visit} />
                        {visit.customerVisitReference ? (
                          <CustomerVisitRecommendationsPanel customerVisitReference={visit.customerVisitReference} />
                        ) : null}
                        <CustomerDeliveredProof visit={visit} />
                      </div>
                    ) : null}
                  </article>
                );
              }) : (
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
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {proofVisits.map((visit) => (
                <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5" key={visit.id}>
                  <p className="text-xs font-black uppercase tracking-wide text-emerald-800">Delivered proof</p>
                  <h2 className="mt-2 font-display text-2xl font-black text-forest">{visit.serviceTitle}</h2>
                  <p className="mt-2 text-sm text-slate-600">{serviceDateLabel(visit.scheduledDate)}</p>
                  <CustomerDeliveredProof visit={visit} />
                </article>
              ))}
              {proofVisits.length === 0 ? (
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
                      setExpandedVisitId(null);
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
