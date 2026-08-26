import type {
  CustomerPortalPropertySummary,
  CustomerPortalVisitCollection,
  CustomerPortalVisitSummary,
  CustomerVisitStatus,
} from '../domain/customerPortalVisits';
import { API_BASE_URL } from './baseUrl';
import { apiRequestError } from './apiError';
import { authenticatedFetch } from './authenticatedFetch';

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
  service_date: string;
  window_start_epoch_seconds: number;
  window_end_epoch_seconds: number;
  time_zone: string;
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
  return {
    id: `${visit.organization_id}:${visit.property_id}:${visit.window_start_epoch_seconds}`,
    customerId: visit.account_id,
    organizationId: visit.organization_id,
    propertyId: visit.property_id,
    scheduledDate: visit.service_date,
    arrivalWindow: `${arrivalTimeLabel(visit.window_start_epoch_seconds, visit.time_zone)}–${arrivalTimeLabel(visit.window_end_epoch_seconds, visit.time_zone)}`,
    serviceTitle: visit.service_title,
    scope: visit.service_scope,
    status: visit.status,
    preparationMessage: visit.preparation_message
      ?? 'No preparation is requested for this visit.',
    ...(visit.customer_safe_reason ? { statusReason: visit.customer_safe_reason } : {}),
    nextUpdateMessage: visit.next_update_message,
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
