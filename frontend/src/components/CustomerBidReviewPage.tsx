import { useEffect, useState } from 'react';
import {
  decideSharedProjectBid,
  fetchSharedProjectBid,
} from '../api/projectBidsClient';
import type { CustomerProjectBid } from '../domain/stopProgress';

type CustomerBidReviewPageProps = {
  shareToken: string;
};

function currencyLabel(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function CustomerBidReviewPage({ shareToken }: CustomerBidReviewPageProps) {
  const [bid, setBid] = useState<CustomerProjectBid | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingDecision, setPendingDecision] = useState<'approve' | 'reject' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    fetchSharedProjectBid(shareToken)
      .then((response) => {
        if (isMounted) setBid(response);
      })
      .catch(() => {
        if (isMounted) setError('This bid link is invalid or no longer available.');
      });

    return () => {
      isMounted = false;
    };
  }, [shareToken]);

  function confirmDecision() {
    if (!pendingDecision) return;

    setIsSubmitting(true);
    setError(null);
    void decideSharedProjectBid(shareToken, pendingDecision)
      .then((response) => {
        setBid(response);
        setPendingDecision(null);
      })
      .catch(() => setError('Your response could not be recorded. Reload the bid before trying again.'))
      .finally(() => setIsSubmitting(false));
  }

  if (error && !bid) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6 py-12">
        <section className="w-full max-w-xl rounded-3xl bg-white p-8 text-center shadow-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-600">Bid unavailable</p>
          <h1 className="mt-3 text-2xl font-bold text-slate-950">Unable to open this proposal</h1>
          <p className="mt-3 text-sm text-slate-600">{error}</p>
        </section>
      </main>
    );
  }

  if (!bid) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12 text-white">
        <p className="font-semibold">Loading project bid…</p>
      </main>
    );
  }

  const answered = bid.status === 'approved' || bid.status === 'rejected' || bid.status === 'converted';

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10">
      <section className="mx-auto max-w-2xl overflow-hidden rounded-3xl bg-white shadow-xl">
        <header className="bg-slate-950 p-7 text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">Grover Landscaping</p>
          <h1 className="mt-3 text-3xl font-bold">Project proposal</h1>
          <p className="mt-2 text-sm text-slate-300">Review the proposed scope and pricing before responding.</p>
        </header>

        <div className="p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-500">Bid {bid.id}</p>
              {bid.customerMessage ? <p className="mt-3 text-sm text-slate-700">{bid.customerMessage}</p> : null}
              {bid.expiresAt && bid.status === 'sent' ? (
                <p className="mt-2 text-xs text-slate-500">Response link expires {new Date(bid.expiresAt).toLocaleString()}.</p>
              ) : null}
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${bid.status === 'approved' || bid.status === 'converted' ? 'bg-emerald-100 text-emerald-800' : bid.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
              {bid.status}
            </span>
          </div>

          <div className="mt-6 space-y-3">
            {bid.lineItems.map((item) => (
              <article key={item.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-slate-950">{item.service.name}</h2>
                    {item.service.description ? <p className="mt-1 text-xs text-slate-600">{item.service.description}</p> : null}
                    {item.note ? <p className="mt-2 text-xs text-slate-500">{item.note}</p> : null}
                  </div>
                  <p className="shrink-0 font-semibold text-slate-950">{currencyLabel(item.quantity * item.unitPriceCents)}</p>
                </div>
                <p className="mt-2 text-xs text-slate-500">{item.quantity} × {currencyLabel(item.unitPriceCents)}</p>
              </article>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between rounded-xl bg-slate-950 p-5 text-white">
            <span className="font-semibold">Proposal total</span>
            <span className="text-2xl font-bold">{currencyLabel(bid.totalCents)}</span>
          </div>

          {answered ? (
            <p className={`mt-6 rounded-xl p-4 text-sm font-semibold ${bid.status === 'approved' || bid.status === 'converted' ? 'bg-emerald-50 text-emerald-900' : 'bg-rose-50 text-rose-900'}`}>
              {bid.status === 'converted'
                ? 'This approved proposal has been converted into scheduled work.'
                : `This proposal was ${bid.status}. The landscaping team has been notified in the application.`}
            </p>
          ) : pendingDecision ? (
            <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-950">
                Confirm that you want to {pendingDecision} this {currencyLabel(bid.totalCents)} proposal.
              </p>
              {error ? <p className="mt-2 text-xs text-rose-700">{error}</p> : null}
              <div className="mt-4 flex gap-2">
                <button className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={isSubmitting} onClick={confirmDecision} type="button">
                  {isSubmitting ? 'Recording response…' : `Confirm ${pendingDecision}`}
                </button>
                <button className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700" disabled={isSubmitting} onClick={() => setPendingDecision(null)} type="button">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button className="rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white hover:bg-emerald-800" onClick={() => setPendingDecision('approve')} type="button">
                Approve proposal
              </button>
              <button className="rounded-xl border border-rose-300 px-4 py-3 font-semibold text-rose-700 hover:bg-rose-50" onClick={() => setPendingDecision('reject')} type="button">
                Reject proposal
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
