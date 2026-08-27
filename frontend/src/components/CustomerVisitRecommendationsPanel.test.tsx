import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { CustomerRecommendationSummary } from '../domain/customerVisitRecommendations';
import { CustomerRecommendationSummaryCard } from './CustomerVisitRecommendationsPanel';

const recommendation: CustomerRecommendationSummary = {
  customerRecommendationReference: 'customer_recommendation_private',
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
};

describe('customer visit recommendation presentation', () => {
  it('shows the current one-time scope, total, reason, version, and status', () => {
    const markup = renderToStaticMarkup(
      <CustomerRecommendationSummaryCard recommendation={recommendation} />,
    );

    expect(markup).toContain('Provider recommendation');
    expect(markup).toContain('Decision needed');
    expect(markup).toContain('Hedge trim');
    expect(markup).toContain('Trim the front hedge clear of the walkway.');
    expect(markup).toContain('Quantity 2');
    expect(markup).toContain('$90.00');
    expect(markup).toContain('One-time total');
    expect(markup).toContain('Version 2');
    expect(markup).not.toContain('customer_recommendation_private');
  });

  it('labels immutable history separately from current status and total', () => {
    const markup = renderToStaticMarkup(
      <CustomerRecommendationSummaryCard
        detail={{
          customerVisitReference: 'customer_visit_private',
          customerRecommendationReference: recommendation.customerRecommendationReference,
          currentVersion: 2,
          lifecycleStatus: 'pending',
          versions: [{
            ...recommendation.currentPublication,
            proposalVersion: 1,
            totalCents: 7500,
          }, recommendation.currentPublication],
        }}
        recommendation={recommendation}
        showHistory
      />,
    );

    expect(markup).toContain('Published version history');
    expect(markup).toContain('Earlier versions are preserved for context');
    expect(markup).toContain('$75.00');
    expect(markup).not.toContain('customer_visit_private');
  });
});
