import { describe, expect, it } from 'vitest';
import {
  customerVisitStatusLabel,
  visitsForPortalProperty,
  type CustomerPortalVisitSummary,
} from './customerPortalVisits';

const visits: CustomerPortalVisitSummary[] = [
  {
    id: 'later', customerId: 'customer_1', organizationId: 'org_1', propertyId: 'property_1',
    scheduledDate: '2026-09-02', arrivalWindow: '8–10 AM', serviceTitle: 'Yard care', scope: ['Mow'],
    status: 'confirmed', preparationMessage: 'Unlock the gate.', nextUpdateMessage: 'We will update you.',
  },
  {
    id: 'other-property', customerId: 'customer_1', organizationId: 'org_1', propertyId: 'property_2',
    scheduledDate: '2026-08-24', arrivalWindow: '8–10 AM', serviceTitle: 'Tree care', scope: ['Trim'],
    status: 'confirmed', preparationMessage: 'No action needed.', nextUpdateMessage: 'We will update you.',
  },
  {
    id: 'next', customerId: 'customer_1', organizationId: 'org_1', propertyId: 'property_1',
    scheduledDate: '2026-08-27', arrivalWindow: '8–10 AM', serviceTitle: 'Yard care', scope: ['Mow'],
    status: 'en_route', preparationMessage: 'Unlock the gate.', nextUpdateMessage: 'Arrival is next.',
  },
];

describe('customer portal visit summaries', () => {
  it('keeps portal visits scoped to customer, organization, and property in date order', () => {
    expect(visitsForPortalProperty(visits, 'customer_1', 'org_1', 'property_1').map(({ id }) => id))
      .toEqual(['next', 'later']);
  });

  it('uses customer-facing lifecycle language', () => {
    expect(customerVisitStatusLabel('en_route')).toBe('On the way');
    expect(customerVisitStatusLabel('complete_proof_pending')).toBe('Visit complete · proof pending');
  });
});
