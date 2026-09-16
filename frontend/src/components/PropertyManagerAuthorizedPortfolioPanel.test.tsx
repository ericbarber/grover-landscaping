import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type {
  CustomerPortalPropertySummary,
  CustomerPortalVisitSummary,
} from '../domain/customerPortalVisits';
import type { PortalHomeReadState } from './WorkspaceHomePanel';
import { PropertyManagerAuthorizedPortfolioPanel } from './PropertyManagerAuthorizedPortfolioPanel';

const properties: CustomerPortalPropertySummary[] = [
  { id: 'canyon', customerId: 'account_1', organizationId: 'org_1', displayName: 'Canyon View' },
  { id: 'sage', customerId: 'account_1', organizationId: 'org_1', displayName: 'Sage Lane' },
];
const visits: CustomerPortalVisitSummary[] = [{
  id: 'visit_1', customerId: 'account_1', organizationId: 'org_1', propertyId: 'canyon',
  scheduledDate: '2026-09-16', arrivalWindow: '8:00–10:00 AM',
  serviceTitle: 'One-time cleanup and pruning', scope: ['Cleanup', 'Pruning'],
  status: 'confirmed', preparationMessage: 'Prepare the approved entrance.',
  nextUpdateMessage: 'The provider will send an arrival update.',
  deliveredProofAvailable: false,
}];

function render(readState: PortalHomeReadState, rolloutUnit: string | null | undefined = 'p3') {
  return renderToStaticMarkup(createElement(PropertyManagerAuthorizedPortfolioPanel, {
    properties, visits, readState, rolloutUnit,
    onRetry: () => undefined, onReturnHome: () => undefined,
  }));
}

describe('PropertyManagerAuthorizedPortfolioPanel', () => {
  it('shows only protected property summaries after a successful read', () => {
    const markup = render('ready');
    expect(markup).toContain('Canyon View');
    expect(markup).toContain('Sage Lane');
    expect(markup).toContain('2 properties in your current access scope');
    expect(markup).not.toContain('123 Oak Street');
    expect(markup).not.toContain('Grover Demo Landscaping');
  });

  it.each(['loading', 'access_required', 'inconsistent', 'unavailable'] as const)(
    'withholds property and visit details when the read is %s', (readState) => {
      const markup = render(readState);
      expect(markup).not.toContain('Canyon View');
      expect(markup).not.toContain('Sage Lane');
      expect(markup).not.toContain('One-time cleanup and pruning');
      expect(markup).not.toContain('2 properties in your current access scope');
      expect(markup).toContain('Return Home');
      expect(markup.includes('Retry protected read')).toBe(readState !== 'loading');
    },
  );

  it('withholds records when the managed rollout does not grant Portfolio', () => {
    const markup = render('ready', null);
    expect(markup).toContain('Portfolio access is not enabled');
    expect(markup).not.toContain('Canyon View');
  });
});
