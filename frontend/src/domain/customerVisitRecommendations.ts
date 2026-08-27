export type CustomerRecommendationLifecycleStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'declined'
  | 'revision_requested'
  | 'expired'
  | 'withdrawn'
  | 'scheduled'
  | 'completed';

export type CustomerRecommendationDecisionAction =
  | 'approve'
  | 'decline'
  | 'request_revision';

export interface CustomerRecommendationLineItem {
  serviceName: string;
  serviceDescription?: string;
  quantity: number;
  unitPriceCents: number;
}

export interface CustomerRecommendationPublication {
  proposalVersion: number;
  customerSafeReason?: string;
  currencyCode: string;
  lineItems: CustomerRecommendationLineItem[];
  totalCents: number;
  publishedAtEpochSeconds: number;
  expiresAtEpochSeconds: number;
}

export interface CustomerRecommendationSummary {
  customerRecommendationReference: string;
  currentVersion: number;
  lifecycleStatus: CustomerRecommendationLifecycleStatus;
  currentPublication: CustomerRecommendationPublication;
}

export interface CustomerRecommendationCollection {
  customerVisitReference: string;
  recommendations: CustomerRecommendationSummary[];
}

export interface CustomerRecommendationDetail {
  customerVisitReference: string;
  customerRecommendationReference: string;
  currentVersion: number;
  lifecycleStatus: CustomerRecommendationLifecycleStatus;
  versions: CustomerRecommendationPublication[];
}

export interface CustomerRecommendationDecisionInput {
  expectedProposalVersion: number;
  action: CustomerRecommendationDecisionAction;
  reasonCode?: string;
  customerSafeNote?: string;
  affirmationTextVersion?: string;
  idempotencyKey: string;
}

export interface CustomerRecommendationDecisionReceipt {
  customerRecommendationReference: string;
  proposalVersion: number;
  action: CustomerRecommendationDecisionAction;
  lifecycleStatus: CustomerRecommendationLifecycleStatus;
  decidedAtEpochSeconds: number;
  replayed: boolean;
}
