export type InitialServiceProposalStatus = 'sent' | 'superseded' | 'accepted'
  | 'declined' | 'expired';

export type InitialServiceCadence = 'weekly' | 'every_two_weeks' | 'monthly'
  | 'one_time' | 'custom';

export type InitialServicePriceBasis = 'per_visit' | 'monthly' | 'fixed';

export type InitialServiceProposalDecisionAction = 'accept' | 'decline';

export type InitialServiceProposalMessageKind = 'owner_question'
  | 'owner_change_request' | 'provider_response';

export interface InitialServiceProposal {
  proposalId: string;
  assessmentId: string;
  invitationId: string;
  propertyId: string;
  organizationId: string;
  disclosureGrantId: string;
  proposalVersion: number;
  status: InitialServiceProposalStatus;
  title: string;
  customerSummary: string;
  includedScope: string[];
  exclusions: string[];
  cadenceCode: InitialServiceCadence;
  cadenceDetail: string;
  arrivalPolicy: string;
  weatherPolicy: string;
  cancellationPolicy: string;
  proofExpectation: string;
  priceAmountMinor: number;
  priceBasis: InitialServicePriceBasis;
  currencyCode: string;
  annualizedMonthlyMinor?: number;
  revisionNote?: string;
  issuedAtEpochSeconds: number;
  expiresAtEpochSeconds: number;
  persisted: boolean;
}

export interface InitialServiceProposalDecision {
  decisionId: string;
  proposalId: string;
  action: InitialServiceProposalDecisionAction;
  reasonCode?: string;
  customerSafeNote?: string;
  proposalVersion: number;
  affirmationTextVersion?: string;
  decidedAtEpochSeconds: number;
  acceptanceSnapshotId?: string;
  acceptanceSnapshotSha256?: string;
  persisted: boolean;
}

export interface InitialServiceProposalMessage {
  messageId: string;
  proposalId: string;
  assessmentId: string;
  authorRole: 'owner' | 'provider';
  messageKind: InitialServiceProposalMessageKind;
  customerSafeBody: string;
  proposalVersionSnapshot: number;
  seriesVersionSnapshot: number;
  inReplyToMessageId?: string;
  relatedProposalId?: string;
  createdAtEpochSeconds: number;
  persisted: boolean;
}

export interface OwnerProviderRelationshipActivation {
  activationId: string;
  ownerPropertyId: string;
  invitationId: string;
  organizationId: string;
  proposalId: string;
  proposalVersion: number;
  acceptanceSnapshotId: string;
  acceptanceSnapshotSha256: string;
  customerAccountId: string;
  customerPropertyId: string;
  ownerMembershipId: string;
  portalAccessId: string;
  status: 'provider_setup';
  closedCompetingInvitationCount: number;
  activatedAtEpochSeconds: number;
  persisted: boolean;
}

export interface PublishInitialServiceProposalInput {
  expectedProposalVersion: number;
  title: string;
  customerSummary: string;
  includedScope: string[];
  exclusions: string[];
  cadenceCode: InitialServiceCadence;
  cadenceDetail: string;
  arrivalPolicy: string;
  weatherPolicy: string;
  cancellationPolicy: string;
  proofExpectation: string;
  priceAmountMinor: number;
  priceBasis: InitialServicePriceBasis;
  currencyCode: string;
  revisionNote?: string;
  expiresAtEpochSeconds: number;
}

export const INITIAL_SERVICE_PROPOSAL_ACCEPTANCE_VERSION =
  'initial_service_proposal_acceptance_v1';

export const INITIAL_SERVICE_PROPOSAL_ACCEPTANCE_TEXT =
  'I accept this exact proposal for provider setup. I understand that acceptance does not schedule service, collect payment, or assign a crew.';

export const OWNER_PROVIDER_ACTIVATION_AFFIRMATION_VERSION =
  'owner_provider_relationship_activation_v1';

export const OWNER_PROVIDER_ACTIVATION_AFFIRMATION_TEXT =
  'I want Grover to create this provider relationship and my provider-facing customer and property setup from the accepted proposal. I understand that this does not confirm a first visit, collect payment, create a schedule, or assign a crew.';

export function formatProposalMoney(amountMinor: number, currencyCode: string): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currencyCode,
  }).format(amountMinor / 100);
}

export function proposalPriceLabel(proposal: Pick<InitialServiceProposal,
  'priceAmountMinor' | 'currencyCode' | 'priceBasis'>): string {
  const suffix = {
    per_visit: 'per visit',
    monthly: 'per month',
    fixed: 'fixed price',
  }[proposal.priceBasis];
  return `${formatProposalMoney(proposal.priceAmountMinor, proposal.currencyCode)} ${suffix}`;
}

export function proposalCadenceLabel(cadence: InitialServiceCadence): string {
  return {
    weekly: 'Weekly',
    every_two_weeks: 'Every two weeks',
    monthly: 'Monthly',
    one_time: 'One time',
    custom: 'Custom cadence',
  }[cadence];
}

export function canDecideInitialServiceProposal(proposal: InitialServiceProposal): boolean {
  return proposal.status === 'sent'
    && proposal.expiresAtEpochSeconds > Math.floor(Date.now() / 1000);
}

export function proposalLines(value: string): string[] {
  return value.split('\n').map((line) => line.trim()).filter(Boolean);
}
