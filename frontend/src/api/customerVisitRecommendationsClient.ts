import type {
  CustomerRecommendationCollection,
  CustomerRecommendationDecisionAction,
  CustomerRecommendationDecisionInput,
  CustomerRecommendationDecisionReceipt,
  CustomerRecommendationDetail,
  CustomerRecommendationLifecycleStatus,
  CustomerRecommendationPublication,
} from '../domain/customerVisitRecommendations';
import { apiRequestError } from './apiError';
import { authenticatedFetch } from './authenticatedFetch';
import { API_BASE_URL } from './baseUrl';

interface ApiCustomerRecommendationLineItem {
  service_name: string;
  service_description?: string;
  quantity: number;
  unit_price_cents: number;
}

interface ApiCustomerRecommendationPublication {
  proposal_version: number;
  customer_safe_reason?: string;
  currency_code: string;
  line_items: ApiCustomerRecommendationLineItem[];
  total_cents: number;
  published_at_epoch_seconds: number;
  expires_at_epoch_seconds: number;
}

interface ApiCustomerRecommendationSummary {
  customer_recommendation_reference: string;
  current_version: number;
  lifecycle_status: CustomerRecommendationLifecycleStatus;
  current_publication: ApiCustomerRecommendationPublication;
}

interface ApiCustomerRecommendationCollection {
  customer_visit_reference: string;
  recommendations: ApiCustomerRecommendationSummary[];
}

interface ApiCustomerRecommendationDetail {
  customer_visit_reference: string;
  customer_recommendation_reference: string;
  current_version: number;
  lifecycle_status: CustomerRecommendationLifecycleStatus;
  versions: ApiCustomerRecommendationPublication[];
}

interface ApiCustomerRecommendationDecisionReceipt {
  customer_recommendation_reference: string;
  proposal_version: number;
  action: CustomerRecommendationDecisionAction;
  lifecycle_status: CustomerRecommendationLifecycleStatus;
  decided_at_epoch_seconds: number;
  replayed: boolean;
}

function recommendationPath(
  customerVisitReference: string,
  customerRecommendationReference?: string,
): string {
  const visitPath = `${API_BASE_URL}/customer-portal/visits/${encodeURIComponent(customerVisitReference)}/recommendations`;
  return customerRecommendationReference
    ? `${visitPath}/${encodeURIComponent(customerRecommendationReference)}`
    : visitPath;
}

function toPublication(
  publication: ApiCustomerRecommendationPublication,
): CustomerRecommendationPublication {
  return {
    proposalVersion: publication.proposal_version,
    ...(publication.customer_safe_reason
      ? { customerSafeReason: publication.customer_safe_reason }
      : {}),
    currencyCode: publication.currency_code,
    lineItems: publication.line_items.map((item) => ({
      serviceName: item.service_name,
      ...(item.service_description ? { serviceDescription: item.service_description } : {}),
      quantity: item.quantity,
      unitPriceCents: item.unit_price_cents,
    })),
    totalCents: publication.total_cents,
    publishedAtEpochSeconds: publication.published_at_epoch_seconds,
    expiresAtEpochSeconds: publication.expires_at_epoch_seconds,
  };
}

export async function fetchCustomerVisitRecommendations(
  customerVisitReference: string,
): Promise<CustomerRecommendationCollection> {
  const response = await authenticatedFetch(recommendationPath(customerVisitReference), {
    headers: { accept: 'application/json' },
  });
  if (!response.ok) {
    throw await apiRequestError(response, 'Recommendations for this visit could not be loaded.');
  }
  const collection = await response.json() as ApiCustomerRecommendationCollection;
  return {
    customerVisitReference: collection.customer_visit_reference,
    recommendations: collection.recommendations.map((recommendation) => ({
      customerRecommendationReference: recommendation.customer_recommendation_reference,
      currentVersion: recommendation.current_version,
      lifecycleStatus: recommendation.lifecycle_status,
      currentPublication: toPublication(recommendation.current_publication),
    })),
  };
}

export async function fetchCustomerVisitRecommendation(
  customerVisitReference: string,
  customerRecommendationReference: string,
): Promise<CustomerRecommendationDetail> {
  const response = await authenticatedFetch(
    recommendationPath(customerVisitReference, customerRecommendationReference),
    { headers: { accept: 'application/json' } },
  );
  if (!response.ok) {
    throw await apiRequestError(response, 'Recommendation history could not be loaded.');
  }
  const detail = await response.json() as ApiCustomerRecommendationDetail;
  return {
    customerVisitReference: detail.customer_visit_reference,
    customerRecommendationReference: detail.customer_recommendation_reference,
    currentVersion: detail.current_version,
    lifecycleStatus: detail.lifecycle_status,
    versions: detail.versions.map(toPublication),
  };
}

export async function decideCustomerVisitRecommendation(
  customerVisitReference: string,
  customerRecommendationReference: string,
  input: CustomerRecommendationDecisionInput,
): Promise<CustomerRecommendationDecisionReceipt> {
  const response = await authenticatedFetch(
    recommendationPath(customerVisitReference, customerRecommendationReference),
    {
      method: 'POST',
      headers: { accept: 'application/json', 'content-type': 'application/json' },
      body: JSON.stringify({
        expected_proposal_version: input.expectedProposalVersion,
        action: input.action,
        ...(input.reasonCode ? { reason_code: input.reasonCode } : {}),
        ...(input.customerSafeNote ? { customer_safe_note: input.customerSafeNote } : {}),
        ...(input.affirmationTextVersion
          ? { affirmation_text_version: input.affirmationTextVersion }
          : {}),
        idempotency_key: input.idempotencyKey,
      }),
    },
  );
  if (!response.ok) {
    throw await apiRequestError(response, 'Your recommendation decision could not be confirmed.');
  }
  const receipt = await response.json() as ApiCustomerRecommendationDecisionReceipt;
  return {
    customerRecommendationReference: receipt.customer_recommendation_reference,
    proposalVersion: receipt.proposal_version,
    action: receipt.action,
    lifecycleStatus: receipt.lifecycle_status,
    decidedAtEpochSeconds: receipt.decided_at_epoch_seconds,
    replayed: receipt.replayed,
  };
}
