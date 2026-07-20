import { useEffect, useState } from 'react';
import {
  fetchDayPlanAmendments,
  reviewDayPlanAmendment,
  type DayPlanAmendmentReviewDecision,
} from '../api/dayPlanAmendmentsClient';
import { fetchCrewDayPlan } from '../api/dayPlansClient';
import { fetchProjectBids } from '../api/projectBidsClient';
import {
  amendmentNeedsManagerDecision,
  amendmentReviewPrimaryDecision,
  amendmentReviewPrimaryLabel,
  amendmentReviewStatusLabel,
  pendingAmendmentCount,
} from '../domain/managerAmendmentReview';
import {
  dayPlanAmendmentTypeLabel,
  type DayPlanAmendmentRequest,
  type ProjectBid,
} from '../domain/stopProgress';
import { ManagerProjectBidEditor } from './ManagerProjectBidEditor';

type ManagerAmendmentReviewPanelProps = {
  crewId: string;
};

function servicePriceLabel(amendment: DayPlanAmendmentRequest): string | null {
  const price = amendment.service?.defaultPriceCents;
  return price === undefined ? null : `$${(price / 100).toFixed(2)}`;
}

export function ManagerAmendmentReviewPanel({ crewId }: ManagerAmendmentReviewPanelProps) {
  const [dayPlanId, setDayPlanId] = useState<string | null>(null);
  const [amendments, setAmendments] = useState<DayPlanAmendmentRequest[]>([]);
  const [bids, setBids] = useState<ProjectBid[]>([]);
  const [bidsUnavailable, setBidsUnavailable] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('Loading submitted requests...');
  const [refreshSignal, setRefreshSignal] = useState(0);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setBidsUnavailable(false);

    fetchCrewDayPlan(crewId)
      .then((dayPlan) => {
        if (!isMounted) return [[], []] as [DayPlanAmendmentRequest[], ProjectBid[]];
        setDayPlanId(dayPlan.id);
        return Promise.all([
          fetchDayPlanAmendments(dayPlan.id),
          fetchProjectBids(dayPlan.id).catch(() => {
            if (isMounted) setBidsUnavailable(true);
            return [];
          }),
        ]);
      })
      .then(([requests, projectBids]) => {
        if (!isMounted) return;
        setAmendments(requests);
        setBids(projectBids);
        setMessage(requests.length === 0 ? 'No amendment requests for this route.' : 'Review crew requests before changing the route or preparing a bid.');
      })
      .catch(() => {
        if (isMounted) setMessage('Amendment review is unavailable until the API reconnects.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [crewId, refreshSignal]);

  function review(amendment: DayPlanAmendmentRequest, decision: DayPlanAmendmentReviewDecision) {
    if (!dayPlanId) return;

    const managerNote = notes[amendment.id]?.trim() || undefined;
    setReviewingId(amendment.id);

    void reviewDayPlanAmendment(dayPlanId, amendment.id, decision, managerNote)
      .then((result) => {
        setAmendments((current) =>
          current.map((item) =>
            item.id === amendment.id
              ? {
                  ...item,
                  status: result.status,
                  managerNote: result.managerNote,
                  persisted: result.persisted,
                }
              : item,
          ),
        );
        setMessage(result.persisted ? 'Manager decision saved.' : 'Decision is local until the API can persist it.');
      })
      .catch(() => setMessage('Review failed. The request remains submitted.'))
      .finally(() => setReviewingId(null));
  }

  return (
    <div className="mt-6 border-t border-slate-200 pt-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">Manager review</p>
          <h3 className="mt-1 text-lg font-bold text-slate-950">Crew amendments</h3>
          <p className="mt-1 text-xs text-slate-600">{message}</p>
        </div>
        <button
          className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          onClick={() => setRefreshSignal((current) => current + 1)}
          type="button"
        >
          Refresh
        </button>
      </div>

      <div className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-950">
        <span className="font-bold">{pendingAmendmentCount(amendments)}</span> awaiting manager decision
      </div>
      {bidsUnavailable ? (
        <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950" role="alert">
          Persisted project bids could not be loaded. Existing bid context is hidden until API readiness recovers.
        </p>
      ) : null}

      {isLoading ? <p className="mt-4 text-sm text-slate-500">Loading...</p> : null}

      <div className="mt-4 space-y-3">
        {amendments.map((amendment) => {
          const price = servicePriceLabel(amendment);
          const isReviewing = reviewingId === amendment.id;
          const needsDecision = amendmentNeedsManagerDecision(amendment);
          const existingBid = bids.find((bid) => bid.sourceAmendmentId === amendment.id);

          return (
            <article key={amendment.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-950">
                    {amendment.service?.name ?? dayPlanAmendmentTypeLabel(amendment.amendmentType)}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">{amendment.note}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {amendment.requestedByCrewId}
                    {price ? ` · ${price}` : ''}
                    {amendment.service?.defaultDurationMinutes ? ` · ${amendment.service.defaultDurationMinutes} min` : ''}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${amendment.requiresBid ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'}`}>
                  {amendmentReviewStatusLabel(amendment.status)}
                </span>
              </div>

              {amendment.managerNote ? (
                <p className="mt-3 rounded-lg bg-white p-2 text-xs text-slate-600">Manager note: {amendment.managerNote}</p>
              ) : null}

              {needsDecision ? (
                <div className="mt-3 space-y-2">
                  <input
                    aria-label={`Manager note for ${amendment.id}`}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"
                    onChange={(event) => setNotes((current) => ({ ...current, [amendment.id]: event.target.value }))}
                    placeholder="Optional manager note"
                    value={notes[amendment.id] ?? ''}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="rounded-full bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
                      disabled={isReviewing}
                      onClick={() => review(amendment, amendmentReviewPrimaryDecision(amendment))}
                      type="button"
                    >
                      {amendmentReviewPrimaryLabel(amendment)}
                    </button>
                    <button
                      className="rounded-full border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                      disabled={isReviewing}
                      onClick={() => review(amendment, 'reject')}
                      type="button"
                    >
                      Reject request
                    </button>
                  </div>
                </div>
              ) : null}

              {amendment.status === 'bid_review' && dayPlanId ? (
                <ManagerProjectBidEditor
                  amendment={amendment}
                  dayPlanId={dayPlanId}
                  existingBid={existingBid}
                  onSaved={(bid) =>
                    setBids((current) => [
                      bid,
                      ...current.filter((item) => item.sourceAmendmentId !== bid.sourceAmendmentId),
                    ])
                  }
                />
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
