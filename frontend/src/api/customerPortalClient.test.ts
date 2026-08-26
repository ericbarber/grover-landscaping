import { afterEach, describe, expect, it, vi } from 'vitest';
import { configureApiAuthentication } from './authenticatedFetch';
import { fetchCustomerPortalVisits } from './customerPortalClient';

afterEach(() => {
  configureApiAuthentication(false, async () => null);
  vi.unstubAllGlobals();
});

describe('customer portal visit client', () => {
  it('maps the minimized property and confirmed-visit response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      properties: [{
        organization_id: 'org_1', account_id: 'account_1', property_id: 'property_1',
        property_display_name: 'Home',
      }],
      visits: [{
        organization_id: 'org_1', account_id: 'account_1', property_id: 'property_1',
        service_date: '2026-08-29', window_start_epoch_seconds: 1788015600,
        window_end_epoch_seconds: 1788022800, time_zone: 'America/Phoenix',
        service_title: 'Initial yard care', service_scope: ['Mow and edge turf'],
        status: 'confirmed', preparation_message: 'Unlock the side gate.',
        next_update_message: 'Your provider will share an update here.',
        delivered_proof_available: false,
      }],
    }), { status: 200 })));

    await expect(fetchCustomerPortalVisits()).resolves.toEqual({
      properties: [{
        id: 'property_1', customerId: 'account_1', organizationId: 'org_1', displayName: 'Home',
      }],
      visits: [{
        id: 'org_1:property_1:1788015600', customerId: 'account_1', organizationId: 'org_1',
        propertyId: 'property_1', scheduledDate: '2026-08-29',
        arrivalWindow: '8:00 AM–10:00 AM', serviceTitle: 'Initial yard care',
        scope: ['Mow and edge turf'], status: 'confirmed',
        preparationMessage: 'Unlock the side gate.',
        nextUpdateMessage: 'Your provider will share an update here.',
      }],
    });
  });

  it('preserves the server authorization state for UI recovery', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      error: 'customer_portal_access_inconsistent',
      message: 'Customer portal access needs provider review.',
    }), { status: 409 })));

    await expect(fetchCustomerPortalVisits()).rejects.toMatchObject({
      status: 409,
      code: 'customer_portal_access_inconsistent',
    });
  });
});
