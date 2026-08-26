export type CustomerVisitStatus =
  | 'confirmed'
  | 'en_route'
  | 'care_in_progress'
  | 'weather_delay'
  | 'rescheduled'
  | 'complete_proof_pending';

export interface CustomerPortalVisitSummary {
  id: string;
  customerId: string;
  organizationId: string;
  propertyId: string;
  customerVisitReference?: string;
  scheduledDate: string;
  arrivalWindow: string;
  originalScheduledDate?: string;
  originalArrivalWindow?: string;
  serviceTitle: string;
  scope: string[];
  status: CustomerVisitStatus;
  preparationMessage: string;
  statusReason?: string;
  nextUpdateMessage: string;
  deliveredProofAvailable: boolean;
}

export interface CustomerPortalPropertySummary {
  id: string;
  customerId: string;
  organizationId: string;
  displayName: string;
}

export interface CustomerPortalVisitCollection {
  properties: CustomerPortalPropertySummary[];
  visits: CustomerPortalVisitSummary[];
}

export function visitsForPortalProperty(
  visits: CustomerPortalVisitSummary[],
  customerId: string,
  organizationId: string,
  propertyId: string,
): CustomerPortalVisitSummary[] {
  return visits
    .filter((visit) => visit.customerId === customerId
      && visit.organizationId === organizationId
      && visit.propertyId === propertyId)
    .sort((left, right) => left.scheduledDate.localeCompare(right.scheduledDate));
}

export function customerVisitStatusLabel(status: CustomerVisitStatus): string {
  return {
    confirmed: 'Confirmed',
    en_route: 'On the way',
    care_in_progress: 'Care in progress',
    weather_delay: 'Weather delay',
    rescheduled: 'Rescheduled',
    complete_proof_pending: 'Visit complete · proof pending',
  }[status];
}
