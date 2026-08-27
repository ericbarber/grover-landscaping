import { useEffect, useState } from 'react';
import { isApiErrorCode } from '../api/apiError';
import {
  fetchCustomerVisitRecommendation,
  fetchCustomerVisitRecommendations,
} from '../api/customerVisitRecommendationsClient';
import type {
  CustomerRecommendationCollection,
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

export function CustomerRecommendationSummaryCard({
  detail,
  historyError,
  historyLoading = false,
  onToggleHistory,
  recommendation,
  showHistory = false,
}: {
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
