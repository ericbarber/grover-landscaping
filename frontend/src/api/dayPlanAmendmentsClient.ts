import type {
  DayPlanAmendmentRequest,
  DayPlanAmendmentType,
  ServiceCatalogItem,
} from '../domain/stopProgress';
import { API_BASE_URL } from './baseUrl';
import { authenticatedFetch } from './authenticatedFetch';
import { apiRequestError } from './apiError';

export interface ApiAmendmentService {
  id: string;
  name: string;
  description?: string | null;
  default_duration_minutes?: number | null;
  default_price_cents?: number | null;
  requires_manager_approval: boolean;
}

export interface ApiDayPlanAmendment {
  id: string;
  day_plan_id: string;
  amendment_type: DayPlanAmendmentType;
  status: DayPlanAmendmentRequest['status'];
  requested_by_crew_id: string;
  stop_id?: string | null;
  service?: ApiAmendmentService | null;
  note?: string | null;
  requires_bid: boolean;
  manager_note?: string | null;
  persisted: boolean;
}

export type DayPlanAmendmentReviewDecision = 'approve' | 'reject' | 'send_to_bid_review';

export interface ApiDayPlanAmendmentReview {
  id: string;
  day_plan_id: string;
  status: DayPlanAmendmentRequest['status'];
  manager_note?: string | null;
  persisted: boolean;
}

export interface DayPlanAmendmentReviewResult {
  id: string;
  dayPlanId: string;
  status: DayPlanAmendmentRequest['status'];
  managerNote?: string;
  persisted: boolean;
}

export interface CreateDayPlanAmendmentInput {
  amendmentType: DayPlanAmendmentType;
  requestedByCrewId: string;
  stopId?: string;
  service?: ServiceCatalogItem;
  note?: string;
}

function toService(service: ApiAmendmentService): ServiceCatalogItem {
  return {
    id: service.id,
    name: service.name,
    description: service.description ?? undefined,
    defaultDurationMinutes: service.default_duration_minutes ?? undefined,
    defaultPriceCents: service.default_price_cents ?? undefined,
    requiresManagerApproval: service.requires_manager_approval,
  };
}

export function toDayPlanAmendment(
  amendment: ApiDayPlanAmendment,
): DayPlanAmendmentRequest {
  return {
    id: amendment.id,
    dayPlanId: amendment.day_plan_id,
    amendmentType: amendment.amendment_type,
    status: amendment.status,
    requestedByCrewId: amendment.requested_by_crew_id,
    stopId: amendment.stop_id ?? undefined,
    service: amendment.service ? toService(amendment.service) : undefined,
    note: amendment.note ?? undefined,
    requiresBid: amendment.requires_bid,
    managerNote: amendment.manager_note ?? undefined,
    persisted: amendment.persisted,
  };
}

export async function fetchDayPlanAmendments(
  dayPlanId: string,
): Promise<DayPlanAmendmentRequest[]> {
  const response = await authenticatedFetch(`${API_BASE_URL}/day-plans/${dayPlanId}/amendments`);
  if (!response.ok) {
    throw new Error(`Day-plan amendment request failed with status ${response.status}`);
  }

  const amendments = (await response.json()) as ApiDayPlanAmendment[];
  return amendments.map(toDayPlanAmendment);
}

export async function createDayPlanAmendment(
  dayPlanId: string,
  input: CreateDayPlanAmendmentInput,
  clientMutationId?: string,
): Promise<DayPlanAmendmentRequest> {
  const service = input.service;
  const response = await authenticatedFetch(`${API_BASE_URL}/day-plans/${dayPlanId}/amendments`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      amendment_type: input.amendmentType,
      requested_by_crew_id: input.requestedByCrewId,
      stop_id: input.stopId,
      service: service
        ? {
            id: service.id,
            name: service.name,
            description: service.description,
            default_duration_minutes: service.defaultDurationMinutes,
            default_price_cents: service.defaultPriceCents,
            requires_manager_approval: service.requiresManagerApproval,
          }
        : undefined,
      note: input.note,
      ...(clientMutationId ? { client_mutation_id: clientMutationId } : {}),
    }),
  });
  if (!response.ok) {
    throw await apiRequestError(
      response,
      `Create amendment request failed with status ${response.status}`,
    );
  }

  return toDayPlanAmendment((await response.json()) as ApiDayPlanAmendment);
}

export function toDayPlanAmendmentReview(
  review: ApiDayPlanAmendmentReview,
): DayPlanAmendmentReviewResult {
  return {
    id: review.id,
    dayPlanId: review.day_plan_id,
    status: review.status,
    managerNote: review.manager_note ?? undefined,
    persisted: review.persisted,
  };
}

export async function reviewDayPlanAmendment(
  dayPlanId: string,
  amendmentId: string,
  decision: DayPlanAmendmentReviewDecision,
  managerNote?: string,
): Promise<DayPlanAmendmentReviewResult> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/day-plans/${dayPlanId}/amendments/${amendmentId}/review`,
    {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ decision, manager_note: managerNote }),
    },
  );
  if (!response.ok) {
    throw await apiRequestError(
      response,
      `Review amendment request failed with status ${response.status}`,
    );
  }

  return toDayPlanAmendmentReview((await response.json()) as ApiDayPlanAmendmentReview);
}
