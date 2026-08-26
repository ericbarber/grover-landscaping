import type {
  CustomerPortalPropertySummary,
  CustomerPortalVisitCollection,
  CustomerPortalVisitSummary,
  CustomerVisitStatus,
} from '../domain/customerPortalVisits';
import { API_BASE_URL } from './baseUrl';
import { apiRequestError } from './apiError';
import { authenticatedFetch } from './authenticatedFetch';
import {
  toCustomerCompletionReport,
  type ApiCustomerCompletionReport,
  type CustomerCompletionReport,
} from './client';

interface ApiCustomerPortalPropertySummary {
  organization_id: string;
  account_id: string;
  property_id: string;
  property_display_name: string;
}

interface ApiCustomerPortalVisitSummary {
  organization_id: string;
  account_id: string;
  property_id: string;
  customer_visit_reference?: string;
  service_date: string;
  window_start_epoch_seconds: number;
  window_end_epoch_seconds: number;
  time_zone: string;
  original_service_date?: string;
  original_window_start_epoch_seconds?: number;
  original_window_end_epoch_seconds?: number;
  original_time_zone?: string;
  service_title: string;
  service_scope: string[];
  status: CustomerVisitStatus;
  preparation_message?: string;
  customer_safe_reason?: string;
  next_update_message: string;
  delivered_proof_available: boolean;
}

interface ApiCustomerPortalVisitCollection {
  properties: ApiCustomerPortalPropertySummary[];
  visits: ApiCustomerPortalVisitSummary[];
}

function arrivalTimeLabel(epochSeconds: number, timeZone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(epochSeconds * 1000));
}

export function toCustomerPortalPropertySummary(
  property: ApiCustomerPortalPropertySummary,
): CustomerPortalPropertySummary {
  return {
    id: property.property_id,
    customerId: property.account_id,
    organizationId: property.organization_id,
    displayName: property.property_display_name,
  };
}

export function toCustomerPortalVisitSummary(
  visit: ApiCustomerPortalVisitSummary,
): CustomerPortalVisitSummary {
  const originalServiceDate = visit.original_service_date;
  const originalWindowStart = visit.original_window_start_epoch_seconds;
  const originalWindowEnd = visit.original_window_end_epoch_seconds;
  const originalTimeZone = visit.original_time_zone;
  const originalWindow = originalServiceDate
    && originalWindowStart !== undefined
    && originalWindowEnd !== undefined
    && originalTimeZone
    ? {
      originalScheduledDate: originalServiceDate,
      originalArrivalWindow: `${arrivalTimeLabel(originalWindowStart, originalTimeZone)}–${arrivalTimeLabel(originalWindowEnd, originalTimeZone)}`,
    }
    : {};
  return {
    id: `${visit.organization_id}:${visit.property_id}:${visit.window_start_epoch_seconds}`,
    customerId: visit.account_id,
    organizationId: visit.organization_id,
    propertyId: visit.property_id,
    ...(visit.customer_visit_reference
      ? { customerVisitReference: visit.customer_visit_reference }
      : {}),
    scheduledDate: visit.service_date,
    arrivalWindow: `${arrivalTimeLabel(visit.window_start_epoch_seconds, visit.time_zone)}–${arrivalTimeLabel(visit.window_end_epoch_seconds, visit.time_zone)}`,
    ...originalWindow,
    serviceTitle: visit.service_title,
    scope: visit.service_scope,
    status: visit.status,
    preparationMessage: visit.preparation_message
      ?? 'No preparation is requested for this visit.',
    ...(visit.customer_safe_reason ? { statusReason: visit.customer_safe_reason } : {}),
    nextUpdateMessage: visit.next_update_message,
    deliveredProofAvailable: visit.delivered_proof_available,
  };
}

export async function fetchCustomerPortalVisits(): Promise<CustomerPortalVisitCollection> {
  const response = await authenticatedFetch(`${API_BASE_URL}/customer-portal/visits`, {
    headers: { accept: 'application/json' },
  });
  if (!response.ok) {
    throw await apiRequestError(response, 'Customer visit details could not be loaded.');
  }

  const collection = await response.json() as ApiCustomerPortalVisitCollection;
  return {
    properties: collection.properties.map(toCustomerPortalPropertySummary),
    visits: collection.visits.map(toCustomerPortalVisitSummary),
  };
}

export async function fetchCustomerVisitProof(
  customerVisitReference: string,
): Promise<CustomerCompletionReport> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/customer-portal/visits/${encodeURIComponent(customerVisitReference)}/proof`,
    { headers: { accept: 'application/json' } },
  );
  if (!response.ok) {
    throw await apiRequestError(response, 'Delivered proof could not be loaded.');
  }
  return toCustomerCompletionReport(await response.json() as ApiCustomerCompletionReport);
}
