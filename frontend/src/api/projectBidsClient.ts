import type {
  CustomerProjectBid,
  ProjectBid,
  ProjectBidLineItem,
  ProjectBidStatus,
} from '../domain/stopProgress';
import { API_BASE_URL, toBrowserUrl } from './baseUrl';
import { authenticatedFetch } from './authenticatedFetch';
import { apiRequestError } from './apiError';

export interface ApiProjectBidLineItem {
  id: string;
  service_id: string;
  service_name: string;
  service_description?: string | null;
  quantity: number;
  unit_price_cents: number;
  note?: string | null;
}

export interface ApiProjectBid {
  id: string;
  day_plan_id: string;
  customer_account_id: string;
  source_amendment_id: string;
  status: ProjectBidStatus;
  line_items: ApiProjectBidLineItem[];
  customer_message?: string | null;
  total_cents: number;
  share_url?: string | null;
  sent_at?: string | null;
  responded_at?: string | null;
  share_expires_at?: string | null;
  share_revoked_at?: string | null;
  delivery_status?: string | null;
  delivery_channel?: 'email' | 'sms' | null;
  delivery_recipient?: string | null;
  converted_job_id?: string | null;
  converted_at?: string | null;
  persisted: boolean;
}

export interface ApiCustomerProjectBid {
  id: string;
  status: CustomerProjectBid['status'];
  line_items: ApiProjectBidLineItem[];
  customer_message?: string | null;
  total_cents: number;
  sent_at?: string | null;
  responded_at?: string | null;
  expires_at?: string | null;
}

export interface SaveProjectBidLineItemInput {
  serviceId: string;
  serviceName: string;
  serviceDescription?: string;
  quantity: number;
  unitPriceCents: number;
  note?: string;
}

export interface SaveProjectBidInput {
  customerMessage?: string;
  lineItems: SaveProjectBidLineItemInput[];
}

function toProjectBidLineItem(item: ApiProjectBidLineItem): ProjectBidLineItem {
  return {
    id: item.id,
    service: {
      id: item.service_id,
      name: item.service_name,
      description: item.service_description ?? undefined,
      requiresManagerApproval: true,
    },
    quantity: item.quantity,
    unitPriceCents: item.unit_price_cents,
    note: item.note ?? undefined,
  };
}

export function toProjectBid(bid: ApiProjectBid): ProjectBid {
  return {
    id: bid.id,
    customerId: bid.customer_account_id,
    dayPlanId: bid.day_plan_id,
    sourceAmendmentId: bid.source_amendment_id,
    status: bid.status,
    lineItems: bid.line_items.map(toProjectBidLineItem),
    customerMessage: bid.customer_message ?? undefined,
    shareUrl: bid.share_url ? toBrowserUrl(bid.share_url) : undefined,
    sentAt: bid.sent_at ?? undefined,
    respondedAt: bid.responded_at ?? undefined,
    shareExpiresAt: bid.share_expires_at ?? undefined,
    shareRevokedAt: bid.share_revoked_at ?? undefined,
    deliveryStatus: bid.delivery_status ?? undefined,
    deliveryChannel: bid.delivery_channel ?? undefined,
    deliveryRecipient: bid.delivery_recipient ?? undefined,
    convertedJobId: bid.converted_job_id ?? undefined,
    convertedAt: bid.converted_at ?? undefined,
    persisted: bid.persisted,
  };
}

export function toCustomerProjectBid(bid: ApiCustomerProjectBid): CustomerProjectBid {
  return {
    id: bid.id,
    status: bid.status,
    lineItems: bid.line_items.map(toProjectBidLineItem),
    customerMessage: bid.customer_message ?? undefined,
    totalCents: bid.total_cents,
    sentAt: bid.sent_at ?? undefined,
    respondedAt: bid.responded_at ?? undefined,
    expiresAt: bid.expires_at ?? undefined,
  };
}

export async function fetchProjectBids(dayPlanId: string): Promise<ProjectBid[]> {
  const response = await authenticatedFetch(`${API_BASE_URL}/day-plans/${dayPlanId}/bids`);
  if (!response.ok) {
    throw new Error(`Project bids request failed with status ${response.status}`);
  }

  return ((await response.json()) as ApiProjectBid[]).map(toProjectBid);
}

export function accountProjectBidsPath(accountId: string): string {
  return `/accounts/${encodeURIComponent(accountId)}/bids`;
}

export async function fetchAccountProjectBids(accountId: string): Promise<ProjectBid[]> {
  const response = await authenticatedFetch(`${API_BASE_URL}${accountProjectBidsPath(accountId)}`);
  if (!response.ok) {
    throw new Error(`Account project bids request failed with status ${response.status}`);
  }

  return ((await response.json()) as ApiProjectBid[]).map(toProjectBid);
}

export async function saveProjectBidDraft(
  dayPlanId: string,
  amendmentId: string,
  input: SaveProjectBidInput,
): Promise<ProjectBid> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/day-plans/${dayPlanId}/amendments/${amendmentId}/bid`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        customer_message: input.customerMessage,
        line_items: input.lineItems.map((item) => ({
          service_id: item.serviceId,
          service_name: item.serviceName,
          service_description: item.serviceDescription,
          quantity: item.quantity,
          unit_price_cents: item.unitPriceCents,
          note: item.note,
        })),
      }),
    },
  );
  if (!response.ok) {
    throw await apiRequestError(response, `Save project bid failed with status ${response.status}`);
  }

  return toProjectBid((await response.json()) as ApiProjectBid);
}

export async function sendProjectBid(
  dayPlanId: string,
  bidId: string,
  channel: 'email' | 'sms',
  recipient: string,
): Promise<ProjectBid> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/day-plans/${dayPlanId}/bids/${bidId}/send`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ channel, recipient }),
    },
  );
  if (!response.ok) {
    throw await apiRequestError(response, `Send project bid failed with status ${response.status}`);
  }

  return toProjectBid((await response.json()) as ApiProjectBid);
}

export async function revokeProjectBid(dayPlanId: string, bidId: string): Promise<ProjectBid> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/day-plans/${dayPlanId}/bids/${bidId}/revoke`,
    { method: 'POST' },
  );
  if (!response.ok) {
    throw await apiRequestError(response, `Revoke project bid failed with status ${response.status}`);
  }

  return toProjectBid((await response.json()) as ApiProjectBid);
}

export async function convertProjectBid(dayPlanId: string, bidId: string): Promise<ProjectBid> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/day-plans/${dayPlanId}/bids/${bidId}/convert`,
    { method: 'POST' },
  );
  if (!response.ok) {
    throw await apiRequestError(response, `Convert project bid failed with status ${response.status}`);
  }

  return toProjectBid((await response.json()) as ApiProjectBid);
}

export async function fetchSharedProjectBid(shareToken: string): Promise<CustomerProjectBid> {
  const response = await fetch(`${API_BASE_URL}/shared-bids/${encodeURIComponent(shareToken)}`);
  if (!response.ok) {
    throw await apiRequestError(response, `Shared project bid request failed with status ${response.status}`);
  }

  return toCustomerProjectBid((await response.json()) as ApiCustomerProjectBid);
}

export async function decideSharedProjectBid(
  shareToken: string,
  decision: 'approve' | 'reject',
): Promise<CustomerProjectBid> {
  const response = await fetch(
    `${API_BASE_URL}/shared-bids/${encodeURIComponent(shareToken)}/decision`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ decision }),
    },
  );
  if (!response.ok) {
    throw await apiRequestError(response, `Project bid decision failed with status ${response.status}`);
  }

  return toCustomerProjectBid((await response.json()) as ApiCustomerProjectBid);
}
