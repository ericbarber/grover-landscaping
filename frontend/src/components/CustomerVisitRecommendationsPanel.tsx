import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { isApiErrorCode } from '../api/apiError';
import {
  decideCustomerVisitRecommendation,
  fetchCustomerVisitRecommendation,
  fetchCustomerVisitRecommendations,
} from '../api/customerVisitRecommendationsClient';
import type {
  CustomerRecommendationCollection,
  CustomerRecommendationDecisionAction,
  CustomerRecommendationDecisionInput,
  CustomerRecommendationDecisionReceipt,
  CustomerRecommendationDetail,
  CustomerRecommendationLifecycleStatus,
  CustomerRecommendationPublication,
  CustomerRecommendationSummary,
} from '../domain/customerVisitRecommendations';
import { WorkspaceStatusBadge, WorkspaceStatusNotice, type WorkspaceStatusTone } from './WorkspaceStatus';

function currencyLabel(cents: number, currencyCode: string): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currencyCode,
  }).format(cents / 100);
}

function dateTimeLabel(epochSeconds: number): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(epochSeconds * 1000));
}

function statusPresentation(status: CustomerRecommendationLifecycleStatus): {
  label: string;
  tone: WorkspaceStatusTone;
} {
  const presentations: Record<CustomerRecommendationLifecycleStatus, {
    label: string;
    tone: WorkspaceStatusTone;
  }> = {
    draft: { label: 'Not published', tone: 'neutral' },
    pending: { label: 'Decision needed', tone: 'warning' },
    approved: { label: 'Approved', tone: 'success' },
    declined: { label: 'Declined', tone: 'neutral' },
    revision_requested: { label: 'Revision requested', tone: 'info' },
    expired: { label: 'Expired', tone: 'neutral' },
    withdrawn: { label: 'Withdrawn', tone: 'neutral' },
    scheduled: { label: 'Scheduled', tone: 'info' },
    completed: { label: 'Completed', tone: 'success' },
  };
  return presentations[status];
}

function PublicationDetails({
  publication,
  showPublishedAt = false,
}: {
  publication: CustomerRecommendationPublication;
  showPublishedAt?: boolean;
}) {
  return (
    <div className="mt-4">
      {publication.customerSafeReason ? (
        <p className="rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-700">
          <strong className="text-forest">Why this was recommended:</strong>{' '}
          {publication.customerSafeReason}
        </p>
      ) : null}
      <ul className="mt-3 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white px-3">
        {publication.lineItems.map((item, index) => (
          <li className="grid gap-1 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-4" key={`${item.serviceName}:${index}`}>
            <div>
              <p className="text-sm font-black text-forest">{item.serviceName}</p>
              {item.serviceDescription ? <p className="mt-1 text-xs leading-5 text-slate-600">{item.serviceDescription}</p> : null}
              {item.quantity > 1 ? <p className="mt-1 text-xs font-bold text-slate-500">Quantity {item.quantity}</p> : null}
            </div>
            <p className="text-sm font-black text-slate-800">
              {currencyLabel(item.unitPriceCents * item.quantity, publication.currencyCode)}
            </p>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-2">
        <div className="text-xs leading-5 text-slate-500">
          <p>Version {publication.proposalVersion}</p>
          {showPublishedAt ? <p>Published {dateTimeLabel(publication.publishedAtEpochSeconds)}</p> : null}
          <p>Available through {dateTimeLabel(publication.expiresAtEpochSeconds)}</p>
        </div>
        <p className="text-right">
          <span className="block text-xs font-bold uppercase tracking-wide text-slate-500">One-time total</span>
          <strong className="font-display text-2xl text-forest">
            {currencyLabel(publication.totalCents, publication.currencyCode)}
          </strong>
        </p>
      </div>
    </div>
  );
}

const approvalAffirmationTextVersion = 'customer_recommendation_approval_v1';

function decisionKey(): string {
  const identifier = globalThis.crypto?.randomUUID?.()
    ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `customer-recommendation-${identifier}`;
}

function actionLabel(action: CustomerRecommendationDecisionAction): string {
  return {
    approve: 'approved',
    decline: 'declined',
    request_revision: 'sent back for revision',
  }[action];
}

export function CustomerRecommendationDecisionPanel({
  onDecide,
  recommendation,
}: {
  onDecide: (input: CustomerRecommendationDecisionInput) => Promise<CustomerRecommendationDecisionReceipt>;
  recommendation: CustomerRecommendationSummary;
}) {
  const [mode, setMode] = useState<CustomerRecommendationDecisionAction | null>(null);
  const [affirmed, setAffirmed] = useState(false);
  const [revisionNote, setRevisionNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const retryIdentity = useRef<{ fingerprint: string; key: string } | null>(null);

  useEffect(() => {
    if (recommendation.lifecycleStatus !== 'pending') setMode(null);
  }, [recommendation.lifecycleStatus]);

  if (recommendation.lifecycleStatus !== 'pending') {
    return (
      <p className="mt-4 rounded-xl bg-white p-3 text-xs leading-5 text-slate-600">
        This recommendation is {statusPresentation(recommendation.lifecycleStatus).label.toLowerCase()}. Its published scope remains available as a record.
      </p>
    );
  }

  function chooseMode(nextMode: CustomerRecommendationDecisionAction) {
    setMode(nextMode);
    setAffirmed(false);
    setRevisionNote('');
    setMessage(null);
    setError(null);
  }

  async function submitDecision(event: FormEvent) {
    event.preventDefault();
    if (!mode || (mode === 'approve' && !affirmed) || (mode === 'request_revision' && !revisionNote.trim())) return;
    const normalizedNote = revisionNote.trim();
    const fingerprint = [
      recommendation.customerRecommendationReference,
      recommendation.currentVersion,
      mode,
      normalizedNote,
      mode === 'approve' ? approvalAffirmationTextVersion : '',
    ].join(':');
    if (retryIdentity.current?.fingerprint !== fingerprint) {
      retryIdentity.current = { fingerprint, key: decisionKey() };
    }

    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const receipt = await onDecide({
        expectedProposalVersion: recommendation.currentVersion,
        action: mode,
        ...(mode === 'request_revision'
          ? { reasonCode: 'customer_scope_change', customerSafeNote: normalizedNote }
          : {}),
        ...(mode === 'approve'
          ? { affirmationTextVersion: approvalAffirmationTextVersion }
          : {}),
        idempotencyKey: retryIdentity.current.key,
      });
      retryIdentity.current = null;
      setMode(null);
      setAffirmed(false);
      setRevisionNote('');
      setMessage(
        receipt.replayed
          ? `Your earlier decision was found and confirmed: recommendation ${actionLabel(receipt.action)}.`
          : `Recommendation ${actionLabel(receipt.action)}.`,
      );
    } catch (decisionError) {
      if (isApiErrorCode(decisionError, 'customer_visit_recommendation_decision_conflict')) {
        retryIdentity.current = null;
        setMode(null);
        setError('This recommendation changed or was already answered. The latest published state has been loaded; review it before deciding again.');
      } else if (isApiErrorCode(decisionError, 'customer_portal_access_required')
        || isApiErrorCode(decisionError, 'customer_portal_access_inconsistent')) {
        setError('Your access to this recommendation needs provider review before a decision can be recorded.');
      } else {
        setError(decisionError instanceof Error
          ? `${decisionError.message} Retry the same choice to safely confirm whether it was recorded.`
          : 'The decision could not be confirmed. Retry the same choice safely.');
      }
    } finally {
      setSaving(false);
    }
  }

  const publication = recommendation.currentPublication;
  return (
    <section aria-label="Recommendation decision" className="mt-4 border-t border-violet-200 pt-4">
      <h5 className="text-sm font-black text-forest">Choose what happens next</h5>
      <p className="mt-1 text-xs leading-5 text-slate-600">No choice schedules work or charges you automatically.</p>
      {message ? <WorkspaceStatusNotice className="mt-3" compact detail={message} tone="success" /> : null}
      {error ? <WorkspaceStatusNotice className="mt-3" compact detail={error} title="Decision needs attention." tone="warning" /> : null}
      {!mode ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <button className="grover-button-primary" onClick={() => chooseMode('approve')} type="button">Approve</button>
          <button className="grover-button-secondary" onClick={() => chooseMode('request_revision')} type="button">Request revision</button>
          <button className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-black text-slate-700" onClick={() => chooseMode('decline')} type="button">Decline</button>
        </div>
      ) : (
        <form className="mt-3 rounded-xl border border-violet-200 bg-white p-4" onSubmit={submitDecision}>
          {mode === 'approve' ? (
            <label className="flex items-start gap-3 text-sm leading-6 text-slate-700">
              <input checked={affirmed} className="mt-1 size-5 shrink-0 accent-emerald-700" onChange={(event) => setAffirmed(event.target.checked)} type="checkbox" />
              <span>
                I approve version {publication.proposalVersion} for the displayed one-time scope and total of{' '}
                <strong>{currencyLabel(publication.totalCents, publication.currencyCode)}</strong>. I understand this approval does not schedule recurring work, create an invoice, or charge a payment method.
              </span>
            </label>
          ) : null}
          {mode === 'request_revision' ? (
            <label className="text-sm font-black text-forest">
              What should your provider change?
              <textarea className="mt-2 min-h-24 w-full rounded-xl border border-slate-300 p-3 font-normal" maxLength={2000} onChange={(event) => setRevisionNote(event.target.value)} placeholder="Describe the scope, quantity, or timing you want revised." required value={revisionNote} />
            </label>
          ) : null}
          {mode === 'decline' ? (
            <p className="text-sm leading-6 text-slate-700">Decline this exact version? The provider will see that you chose not to proceed with it.</p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="grover-button-primary disabled:opacity-60" disabled={saving || (mode === 'approve' && !affirmed) || (mode === 'request_revision' && !revisionNote.trim())} type="submit">
              {saving ? 'Confirming…' : mode === 'approve' ? 'Confirm approval' : mode === 'request_revision' ? 'Send revision request' : 'Confirm decline'}
            </button>
            <button className="grover-button-secondary" disabled={saving} onClick={() => setMode(null)} type="button">Cancel</button>
          </div>
        </form>
      )}
    </section>
  );
}

export function CustomerRecommendationSummaryCard({
  detail,
  historyError,
  historyLoading = false,
  onToggleHistory,
  recommendation,
  showHistory = false,
  decisionControls,
}: {
  decisionControls?: ReactNode;
  detail?: CustomerRecommendationDetail;
  historyError?: string;
  historyLoading?: boolean;
  onToggleHistory?: () => void;
  recommendation: CustomerRecommendationSummary;
  showHistory?: boolean;
}) {
  const status = statusPresentation(recommendation.lifecycleStatus);
  const firstService = recommendation.currentPublication.lineItems[0]?.serviceName
    ?? 'Additional service';
  return (
    <article className="rounded-2xl border border-violet-200 bg-violet-50/50 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-violet-800">Provider recommendation</p>
          <h4 className="mt-1 font-display text-2xl font-black text-forest">{firstService}</h4>
        </div>
        <WorkspaceStatusBadge tone={status.tone}>{status.label}</WorkspaceStatusBadge>
      </div>
      <PublicationDetails publication={recommendation.currentPublication} />
      {onToggleHistory && recommendation.currentVersion > 1 ? (
        <button className="mt-4 min-h-11 text-sm font-black text-violet-900 underline underline-offset-4" onClick={onToggleHistory} type="button">
          {showHistory ? 'Hide version history' : `View ${recommendation.currentVersion} published versions`}
        </button>
      ) : null}
      {historyLoading ? <p className="mt-3 text-sm font-bold text-slate-600" role="status">Loading recommendation history…</p> : null}
      {historyError ? (
        <WorkspaceStatusNotice className="mt-3" compact detail={historyError} title="Version history could not be loaded." tone="warning" />
      ) : null}
      {showHistory && detail ? (
        <section aria-label="Recommendation version history" className="mt-4 border-t border-violet-200 pt-4">
          <h5 className="text-sm font-black text-forest">Published version history</h5>
          <p className="mt-1 text-xs leading-5 text-slate-600">Earlier versions are preserved for context. The status and total above are current.</p>
          <div className="mt-3 space-y-3">
            {[...detail.versions].reverse().map((publication) => (
              <article className="rounded-xl border border-slate-200 bg-white p-3" key={publication.proposalVersion}>
                <PublicationDetails publication={publication} showPublishedAt />
              </article>
            ))}
          </div>
        </section>
      ) : null}
      {decisionControls}
    </article>
  );
}

function recommendationReadMessage(error: unknown): string {
  if (isApiErrorCode(error, 'customer_portal_access_required')) {
    return 'This visit is no longer available to this customer account.';
  }
  if (isApiErrorCode(error, 'customer_portal_access_inconsistent')) {
    return 'The provider needs to review access before recommendations can be shown.';
  }
  return error instanceof Error ? error.message : 'Recommendations could not be loaded.';
}

export function CustomerVisitRecommendationsPanel({
  customerVisitReference,
}: {
  customerVisitReference: string;
}) {
  const [collection, setCollection] = useState<CustomerRecommendationCollection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [openHistoryReference, setOpenHistoryReference] = useState<string | null>(null);
  const [detail, setDetail] = useState<CustomerRecommendationDetail | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  async function loadRecommendations() {
    setLoading(true);
    setError(null);
    try {
      setCollection(await fetchCustomerVisitRecommendations(customerVisitReference));
    } catch (loadError) {
      setCollection(null);
      setError(recommendationReadMessage(loadError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRecommendations();
  }, [customerVisitReference]);

  async function toggleHistory(recommendation: CustomerRecommendationSummary) {
    if (openHistoryReference === recommendation.customerRecommendationReference) {
      setOpenHistoryReference(null);
      setDetail(null);
      setHistoryError(null);
      return;
    }
    setOpenHistoryReference(recommendation.customerRecommendationReference);
    setDetail(null);
    setHistoryError(null);
    setHistoryLoading(true);
    try {
      setDetail(await fetchCustomerVisitRecommendation(
        customerVisitReference,
        recommendation.customerRecommendationReference,
      ));
    } catch (loadError) {
      setHistoryError(recommendationReadMessage(loadError));
    } finally {
      setHistoryLoading(false);
    }
  }

  async function decide(
    recommendation: CustomerRecommendationSummary,
    input: CustomerRecommendationDecisionInput,
  ): Promise<CustomerRecommendationDecisionReceipt> {
    try {
      const receipt = await decideCustomerVisitRecommendation(
        customerVisitReference,
        recommendation.customerRecommendationReference,
        input,
      );
      await loadRecommendations();
      return receipt;
    } catch (decisionError) {
      if (isApiErrorCode(decisionError, 'customer_visit_recommendation_decision_conflict')) {
        await loadRecommendations();
      }
      throw decisionError;
    }
  }

  return (
    <section aria-label="Visit recommendations" className="mt-5 border-t border-slate-200 pt-5">
      <div>
        <p className="text-xs font-black uppercase tracking-wide text-violet-800">Recommendations</p>
        <p className="mt-1 text-xs leading-5 text-slate-600">Provider-published one-time options tied to this exact visit.</p>
      </div>
      {loading ? <p className="mt-3 text-sm font-bold text-slate-600" role="status">Loading recommendations…</p> : null}
      {error ? (
        <WorkspaceStatusNotice className="mt-3" compact detail={`${error} No draft or live bid data was substituted.`} title="Recommendations need attention." tone="warning">
          <button className="grover-button-secondary mt-1" onClick={() => void loadRecommendations()} type="button">Try recommendations again</button>
        </WorkspaceStatusNotice>
      ) : null}
      {!loading && !error && collection?.recommendations.length === 0 ? (
        <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">No provider recommendations were published for this visit.</p>
      ) : null}
      {collection?.recommendations.length ? (
        <div className="mt-4 space-y-3">
          {collection.recommendations.map((recommendation) => {
            const historyOpen = openHistoryReference === recommendation.customerRecommendationReference;
            return (
              <CustomerRecommendationSummaryCard
                decisionControls={(
                  <CustomerRecommendationDecisionPanel
                    onDecide={(input) => decide(recommendation, input)}
                    recommendation={recommendation}
                  />
                )}
                detail={historyOpen && detail?.customerRecommendationReference === recommendation.customerRecommendationReference ? detail : undefined}
                historyError={historyOpen ? historyError ?? undefined : undefined}
                historyLoading={historyOpen && historyLoading}
                key={recommendation.customerRecommendationReference}
                onToggleHistory={recommendation.currentVersion > 1 ? () => void toggleHistory(recommendation) : undefined}
                recommendation={recommendation}
                showHistory={historyOpen}
              />
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
