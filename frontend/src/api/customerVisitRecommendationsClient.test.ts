import { afterEach, describe, expect, it, vi } from 'vitest';
import { configureApiAuthentication } from './authenticatedFetch';
import {
  decideCustomerVisitRecommendation,
  fetchCustomerVisitRecommendation,
  fetchCustomerVisitRecommendations,
} from './customerVisitRecommendationsClient';

afterEach(() => {
  configureApiAuthentication(false, async () => null);
  vi.unstubAllGlobals();
});

const visitReference = 'customer_visit_0123456789abcdef0123456789abcdef';
const recommendationReference = 'customer_recommendation_0123456789abcdef0123456789abcdef';
const publication = {
  proposal_version: 2,
  customer_safe_reason: 'The hedge is blocking the walkway.',
  currency_code: 'USD',
  line_items: [{
    service_name: 'Hedge trim',
    service_description: 'Trim the front hedge clear of the walkway.',
    quantity: 2,
    unit_price_cents: 4500,
  }],
  total_cents: 9000,
  published_at_epoch_seconds: 1_800_000_000,
  expires_at_epoch_seconds: 1_800_604_800,
};

describe('customer visit recommendation client', () => {
  it('maps current recommendations from the exact authenticated visit', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      customer_visit_reference: visitReference,
      recommendations: [{
        customer_recommendation_reference: recommendationReference,
        current_version: 2,
        lifecycle_status: 'pending',
        current_publication: publication,
      }],
    }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchCustomerVisitRecommendations(visitReference)).resolves.toEqual({
      customerVisitReference: visitReference,
      recommendations: [{
        customerRecommendationReference: recommendationReference,
        currentVersion: 2,
        lifecycleStatus: 'pending',
        currentPublication: {
          proposalVersion: 2,
          customerSafeReason: 'The hedge is blocking the walkway.',
          currencyCode: 'USD',
          lineItems: [{
            serviceName: 'Hedge trim',
            serviceDescription: 'Trim the front hedge clear of the walkway.',
            quantity: 2,
            unitPriceCents: 4500,
          }],
          totalCents: 9000,
          publishedAtEpochSeconds: 1_800_000_000,
          expiresAtEpochSeconds: 1_800_604_800,
        },
      }],
    });
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain(
      `/customer-portal/visits/${visitReference}/recommendations`,
    );
  });

  it('loads immutable version history through both opaque references', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      customer_visit_reference: visitReference,
      customer_recommendation_reference: recommendationReference,
      current_version: 2,
      lifecycle_status: 'pending',
      versions: [{ ...publication, proposal_version: 1 }, publication],
    }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchCustomerVisitRecommendation(
      visitReference,
      recommendationReference,
    )).resolves.toMatchObject({
      currentVersion: 2,
      lifecycleStatus: 'pending',
      versions: [{ proposalVersion: 1 }, { proposalVersion: 2 }],
    });
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain(
      `/recommendations/${recommendationReference}`,
    );
  });

  it('posts only the exact version, customer decision fields, and retry key', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      customer_recommendation_reference: recommendationReference,
      proposal_version: 2,
      action: 'request_revision',
      lifecycle_status: 'revision_requested',
      decided_at_epoch_seconds: 1_800_000_100,
      replayed: false,
    }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(decideCustomerVisitRecommendation(
      visitReference,
      recommendationReference,
      {
        expectedProposalVersion: 2,
        action: 'request_revision',
        reasonCode: 'scope_change',
        customerSafeNote: 'Please quote only one hedge.',
        idempotencyKey: 'recommendation-decision-001',
      },
    )).resolves.toMatchObject({
      proposalVersion: 2,
      lifecycleStatus: 'revision_requested',
      replayed: false,
    });
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(String(request.body))).toEqual({
      expected_proposal_version: 2,
      action: 'request_revision',
      reason_code: 'scope_change',
      customer_safe_note: 'Please quote only one hedge.',
      idempotency_key: 'recommendation-decision-001',
    });
  });

  it('preserves a conflict code so the page can reload authoritative state', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      error: 'customer_visit_recommendation_decision_conflict',
      message: 'The recommendation changed before this decision was recorded.',
    }), { status: 409 })));

    await expect(decideCustomerVisitRecommendation(
      visitReference,
      recommendationReference,
      {
        expectedProposalVersion: 1,
        action: 'approve',
        affirmationTextVersion: 'customer_recommendation_approval_v1',
        idempotencyKey: 'recommendation-decision-002',
      },
    )).rejects.toMatchObject({
      status: 409,
      code: 'customer_visit_recommendation_decision_conflict',
    });
  });
});
