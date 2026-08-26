import { afterEach, describe, expect, it, vi } from 'vitest';
import { configureApiAuthentication } from './authenticatedFetch';
import { fetchCustomerPortalVisits, fetchCustomerVisitProof } from './customerPortalClient';

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
        customer_visit_reference: 'customer_visit_0123456789abcdef0123456789abcdef',
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
        propertyId: 'property_1',
        customerVisitReference: 'customer_visit_0123456789abcdef0123456789abcdef',
        scheduledDate: '2026-08-29',
        arrivalWindow: '8:00 AM–10:00 AM', serviceTitle: 'Initial yard care',
        scope: ['Mow and edge turf'], status: 'confirmed',
        preparationMessage: 'Unlock the side gate.',
        nextUpdateMessage: 'Your provider will share an update here.',
        deliveredProofAvailable: false,
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

  it('maps explicit customer-safe service-day status and reason without internal identifiers', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      properties: [],
      visits: [{
        organization_id: 'org_1', account_id: 'account_1', property_id: 'property_1',
        service_date: '2026-08-30', window_start_epoch_seconds: 1788102000,
        window_end_epoch_seconds: 1788109200, time_zone: 'America/Phoenix',
        service_title: 'Initial yard care', service_scope: ['Mow and edge turf'],
        status: 'weather_delay', customer_safe_reason: 'Lightning is nearby.',
        next_update_message: 'We will post another update by 10:30 AM.',
        delivered_proof_available: false,
      }, {
        organization_id: 'org_1', account_id: 'account_1', property_id: 'property_1',
        service_date: '2026-08-30', window_start_epoch_seconds: 1788102000,
        window_end_epoch_seconds: 1788109200, time_zone: 'America/Phoenix',
        original_service_date: '2026-08-29',
        original_window_start_epoch_seconds: 1788015600,
        original_window_end_epoch_seconds: 1788022800,
        original_time_zone: 'America/Phoenix',
        service_title: 'Initial yard care', service_scope: ['Mow and edge turf'],
        status: 'rescheduled', next_update_message: 'Your new window is confirmed.',
        delivered_proof_available: false,
      }],
    }), { status: 200 })));

    const collection = await fetchCustomerPortalVisits();
    expect(collection.visits[0]).toMatchObject({
      status: 'weather_delay',
      statusReason: 'Lightning is nearby.',
      nextUpdateMessage: 'We will post another update by 10:30 AM.',
    });
    expect(collection.visits[0]).not.toHaveProperty('releaseId');
    expect(collection.visits[0]).not.toHaveProperty('serviceJobId');
    expect(collection.visits[1]).toMatchObject({
      status: 'rescheduled',
      originalScheduledDate: '2026-08-29',
      originalArrivalWindow: '8:00 AM–10:00 AM',
      scheduledDate: '2026-08-30',
      arrivalWindow: '8:00 AM–10:00 AM',
    });
  });

  it('loads minimized delivered proof through the exact authenticated visit reference', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      report_status: 'delivered', checklist_progress: 100,
      before_photos: 1, after_photos: 1, issue_photos: 0,
      service: {
        customer_name: 'Yard Owner', property_address: 'Protected property',
        scheduled_date: '2026-08-30',
        checklist: [{ label: 'Completed approved service', completed: true }],
      },
      photo_evidence: [],
      completed_recommendations: [{
        service_name: 'Approved hedge care',
        service_description: 'Completed with this visit.', quantity: 1,
      }],
      captured_at_epoch_seconds: 1_800_000_000,
    }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchCustomerVisitProof('customer_visit_1')).resolves.toMatchObject({
      reportStatus: 'delivered',
      checklistProgress: 100,
      completedRecommendations: [{ serviceName: 'Approved hedge care', quantity: 1 }],
    });
    expect(String(fetchMock.mock.calls[0]?.[0]))
      .toContain('/customer-portal/visits/customer_visit_1/proof');
  });
});
