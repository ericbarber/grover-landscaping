import { useEffect, useState } from 'react';
import { isApiErrorCode } from '../api/apiError';
import {
  decideSharedProjectBid,
  fetchSharedProjectBid,
} from '../api/projectBidsClient';
import type { CustomerProjectBid } from '../domain/stopProgress';
import { PublicCustomerLinkHeader, PublicCustomerTrustBoundary } from './PublicCustomerLink';
import { WorkspaceIcon } from './WorkspaceIcon';

type CustomerBidReviewPageProps = {
  shareToken: string;
};

function currencyLabel(cents: number): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

function dateTimeLabel(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function statusLabel(status: CustomerProjectBid['status']): string {
  if (status === 'sent') return 'Response needed';
  if (status === 'converted') return 'Scheduled';
  return status === 'approved' ? 'Approved' : 'Declined';
}

export function CustomerBidReviewPage({ shareToken }: CustomerBidReviewPageProps) {
  const [bid, setBid] = useState<CustomerProjectBid | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingDecision, setPendingDecision] = useState<'approve' | 'reject' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let isMounted = true;
    setBid(null);
    setError(null);
    setPendingDecision(null);
    fetchSharedProjectBid(shareToken)
      .then((response) => {
        if (isMounted) setBid(response);
      })
      .catch((requestError: unknown) => {
        if (isMounted) setError(
          isApiErrorCode(requestError, 'shared_bid_unavailable')
            ? 'Proposal storage is temporarily unavailable. Retry after service readiness recovers.'
            : 'This proposal link is invalid, expired, revoked, or no longer available.',
        );
      });

    return () => {
      isMounted = false;
    };
  }, [loadAttempt, shareToken]);

  function reloadProposal() {
    setPendingDecision(null);
    setLoadAttempt((value) => value + 1);
  }

  function confirmDecision() {
    if (!pendingDecision) return;

    setIsSubmitting(true);
    setError(null);
    void decideSharedProjectBid(shareToken, pendingDecision)
      .then((response) => {
        setBid(response);
        setPendingDecision(null);
      })
      .catch((requestError: unknown) => setError(
        isApiErrorCode(requestError, 'shared_bid_decision_unavailable')
          ? 'Proposal storage is temporarily unavailable. Your response was not recorded.'
          : isApiErrorCode(requestError, 'project_bid_already_answered')
            ? 'This proposal already has a response. Reload it to see the latest decision.'
            : 'Your response could not be recorded. Reload the proposal before trying again.',
      ))
      .finally(() => setIsSubmitting(false));
  }

  if (error && !bid) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bone px-4 py-12 sm:px-6">
        <section className="w-full max-w-xl rounded-3xl border border-slate-200 bg-paper p-7 text-center shadow-grover-md sm:p-9" role="alert">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-rose-100 text-rose-700">
            <WorkspaceIcon className="h-6 w-6" name="attention" />
          </span>
          <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-rose-700">Proposal unavailable</p>
          <h1 className="mt-3 font-display text-3xl font-black text-forest">Unable to open this proposal</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">{error}</p>
          <button className="grover-button-primary mt-6 w-full sm:w-auto" onClick={reloadProposal} type="button">
            Try again
          </button>
          <p className="mt-5 text-xs text-slate-500">Closed links cannot be used to approve or decline work.</p>
        </section>
      </main>
    );
  }

  if (!bid) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-forest px-6 py-12 text-white">
        <div className="text-center" role="status">
          <span className="mx-auto block h-10 w-10 animate-pulse rounded-full border-4 border-sand border-r-transparent" />
          <p className="mt-4 font-bold">Loading project proposal…</p>
          <p className="mt-1 text-sm text-slate-300">Verifying the secure customer link.</p>
        </div>
      </main>
    );
  }

  const answered = bid.status === 'approved' || bid.status === 'rejected' || bid.status === 'converted';
  const positiveStatus = bid.status === 'approved' || bid.status === 'converted';

  return (
    <main className="min-h-screen bg-bone pb-10">
      <PublicCustomerLinkHeader />

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-paper shadow-grover-md">
          <header className="bg-forest p-6 text-white sm:p-8 lg:p-10">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-sand">Customer decision</p>
            <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div>
                <h1 className="font-display text-4xl font-black sm:text-5xl">Project proposal</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200 sm:text-base">
                  Review the proposed scope and pricing before recording your response.
                </p>
              </div>
              <span className={`inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-black ${positiveStatus ? 'bg-emerald-100 text-emerald-900' : bid.status === 'rejected' ? 'bg-rose-100 text-rose-900' : 'bg-amber-100 text-amber-950'}`}>
                <WorkspaceIcon className="h-4 w-4" name={positiveStatus ? 'check' : bid.status === 'rejected' ? 'attention' : 'info'} />
                {statusLabel(bid.status)}
              </span>
            </div>
          </header>

          <div className="space-y-7 p-5 sm:p-8 lg:p-10">
            {bid.customerMessage ? (
              <section className="rounded-2xl bg-emerald-50 p-5" aria-labelledby="proposal-message-heading">
                <p className="grover-eyebrow">From your landscaping team</p>
                <h2 className="sr-only" id="proposal-message-heading">Proposal message</h2>
                <p className="mt-2 text-sm leading-6 text-slate-700">{bid.customerMessage}</p>
              </section>
            ) : null}

            <section aria-labelledby="proposed-scope-heading">
              <p className="grover-eyebrow">Proposed scope</p>
              <h2 className="mt-2 font-display text-3xl font-black text-forest" id="proposed-scope-heading">
                Work and pricing
              </h2>
              <div className="mt-5 space-y-3">
                {bid.lineItems.map((item, index) => (
                  <article className="rounded-2xl border border-slate-200 p-4 sm:p-5" key={`${item.serviceName}-${index}`}>
                    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                      <div>
                        <h3 className="font-black text-forest">{item.serviceName}</h3>
                        {item.serviceDescription ? <p className="mt-1 text-sm leading-6 text-slate-600">{item.serviceDescription}</p> : null}
                        <p className="mt-2 text-xs font-bold text-slate-500">
                          {item.quantity} × {currencyLabel(item.unitPriceCents)}
                        </p>
                      </div>
                      <p className="text-lg font-black text-forest">{currencyLabel(item.quantity * item.unitPriceCents)}</p>
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl bg-forest p-5 text-white sm:p-6">
                <span className="font-black">Proposal total</span>
                <span className="font-display text-3xl font-black">{currencyLabel(bid.totalCents)}</span>
              </div>
              {bid.expiresAt && bid.status === 'sent' ? (
                <p className="mt-3 text-xs text-slate-500">This secure response link expires {dateTimeLabel(bid.expiresAt)}.</p>
              ) : null}
            </section>

            <section aria-labelledby="proposal-decision-heading" className="border-t border-slate-200 pt-7">
              <p className="grover-eyebrow">Your decision</p>
              <h2 className="mt-2 font-display text-3xl font-black text-forest" id="proposal-decision-heading">
                {answered ? 'Response recorded' : 'Approve or decline'}
              </h2>

              {answered ? (
                <div className={`mt-5 rounded-2xl p-5 ${positiveStatus ? 'bg-emerald-50 text-emerald-950' : 'bg-rose-50 text-rose-950'}`} role="status">
                  <div className="flex gap-3">
                    <WorkspaceIcon className="mt-0.5 h-5 w-5 shrink-0" name={positiveStatus ? 'check' : 'attention'} />
                    <div>
                      <p className="font-black">
                        {bid.status === 'converted'
                          ? 'This approved proposal is now scheduled work.'
                          : `This proposal was ${bid.status === 'approved' ? 'approved' : 'declined'}.`}
                      </p>
                      <p className="mt-1 text-sm leading-6">Your landscaping team can see this recorded response in the application.</p>
                    </div>
                  </div>
                </div>
              ) : pendingDecision ? (
                <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-5" role="group" aria-labelledby="confirm-proposal-decision-heading">
                  <h3 className="font-black text-amber-950" id="confirm-proposal-decision-heading">Confirm your response</h3>
                  <p className="mt-2 text-sm leading-6 text-amber-950">
                    Confirm that you want to {pendingDecision === 'approve' ? 'approve' : 'decline'} this {currencyLabel(bid.totalCents)} proposal.
                  </p>
                  {error ? (
                    <div className="mt-3 rounded-xl bg-rose-100 p-3 text-sm font-bold text-rose-900" role="alert">{error}</div>
                  ) : null}
                  <div className="mt-4 grid gap-2 sm:flex">
                    <button className="grover-button-primary" disabled={isSubmitting} onClick={confirmDecision} type="button">
                      {isSubmitting ? 'Recording response…' : `Confirm ${pendingDecision === 'approve' ? 'approval' : 'decline'}`}
                    </button>
                    <button className="grover-button-secondary" disabled={isSubmitting} onClick={() => setPendingDecision(null)} type="button">
                      Cancel
                    </button>
                    {error ? (
                      <button className="grover-button-secondary" disabled={isSubmitting} onClick={reloadProposal} type="button">
                        Reload proposal
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <button className="grover-button-primary" onClick={() => setPendingDecision('approve')} type="button">
                    Approve proposal
                  </button>
                  <button className="inline-flex min-h-12 items-center justify-center rounded-xl border border-rose-300 bg-paper px-5 py-3 text-sm font-extrabold text-rose-800 transition hover:bg-rose-50" onClick={() => setPendingDecision('reject')} type="button">
                    Decline proposal
                  </button>
                </div>
              )}
            </section>

            <PublicCustomerTrustBoundary>
              This secure page contains customer-facing scope, pricing, and decision status only. It excludes manager-only identifiers, internal notes, delivery recipients, and unrelated account data.
            </PublicCustomerTrustBoundary>
          </div>
        </section>
      </div>
    </main>
  );
}
