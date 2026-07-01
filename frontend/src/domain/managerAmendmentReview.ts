import type { DayPlanAmendmentRequest, DayPlanAmendmentStatus } from './stopProgress';
import type { DayPlanAmendmentReviewDecision } from '../api/dayPlanAmendmentsClient';

export function amendmentReviewPrimaryDecision(
  amendment: DayPlanAmendmentRequest,
): DayPlanAmendmentReviewDecision {
  return amendment.requiresBid ? 'send_to_bid_review' : 'approve';
}

export function amendmentReviewPrimaryLabel(amendment: DayPlanAmendmentRequest): string {
  return amendment.requiresBid ? 'Send to bid review' : 'Approve request';
}

export function amendmentReviewStatusLabel(status: DayPlanAmendmentStatus): string {
  if (status === 'bid_review') {
    return 'Bid review';
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function amendmentNeedsManagerDecision(amendment: DayPlanAmendmentRequest): boolean {
  return amendment.status === 'submitted';
}

export function pendingAmendmentCount(amendments: DayPlanAmendmentRequest[]): number {
  return amendments.filter(amendmentNeedsManagerDecision).length;
}
