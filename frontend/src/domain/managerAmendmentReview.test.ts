import { describe, expect, it } from 'vitest';
import {
  amendmentNeedsManagerDecision,
  amendmentReviewPrimaryDecision,
  amendmentReviewPrimaryLabel,
  amendmentReviewStatusLabel,
  pendingAmendmentCount,
} from './managerAmendmentReview';
import type { DayPlanAmendmentRequest } from './stopProgress';

const standardRequest: DayPlanAmendmentRequest = {
  id: 'amendment_standard',
  dayPlanId: 'day_plan_1001',
  amendmentType: 'remove_stop',
  status: 'submitted',
  requestedByCrewId: 'crew_1001',
};

const bidRequest: DayPlanAmendmentRequest = {
  ...standardRequest,
  id: 'amendment_bid',
  amendmentType: 'add_service',
  requiresBid: true,
};

describe('manager amendment review helpers', () => {
  it('routes priced extra services to bid review', () => {
    expect(amendmentReviewPrimaryDecision(bidRequest)).toBe('send_to_bid_review');
    expect(amendmentReviewPrimaryLabel(bidRequest)).toBe('Send to bid review');
  });

  it('approves requests that do not need bid preparation', () => {
    expect(amendmentReviewPrimaryDecision(standardRequest)).toBe('approve');
    expect(amendmentReviewPrimaryLabel(standardRequest)).toBe('Approve request');
  });

  it('counts only submitted requests as awaiting a decision', () => {
    const reviewed = { ...bidRequest, status: 'bid_review' as const };

    expect(pendingAmendmentCount([standardRequest, reviewed])).toBe(1);
    expect(amendmentNeedsManagerDecision(reviewed)).toBe(false);
    expect(amendmentReviewStatusLabel(reviewed.status)).toBe('Bid review');
  });
});
