import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { CustomerAccountProfile, CustomerPropertyProfile } from '../domain/jobs';
import { PropertyManagerPortfolioPanel } from './PropertyManagerPortfolioPanel';

const customer: CustomerAccountProfile = {
  id: 'customer_1',
  displayName: 'Red Rock Management',
  onboardingStatus: 'active',
  organizationId: 'org_1',
};

const properties: CustomerPropertyProfile[] = [
  {
    id: 'property_1',
    customerId: 'customer_1',
    organizationId: 'org_1',
    displayName: 'Roosevelt Courtyard',
    address: '825 E Roosevelt St',
    serviceFrequency: 'weekly',
    contractedServiceIds: [],
  },
  {
    id: 'property_private',
    customerId: 'another_customer',
    organizationId: 'org_1',
    displayName: 'Private Route Depot',
    address: 'Hidden address',
    serviceFrequency: 'weekly',
    contractedServiceIds: [],
  },
];

function renderPortfolio(overrides: Partial<Parameters<typeof PropertyManagerPortfolioPanel>[0]> = {}) {
  return renderToStaticMarkup(
    <PropertyManagerPortfolioPanel
      customer={customer}
      portfolios={[{
        id: 'portfolio_1',
        accountId: customer.id,
        organizationId: customer.organizationId,
        displayName: 'Phoenix residential',
        portfolioType: 'property_management_company',
      }]}
      properties={properties}
      links={[{
        id: 'link_1',
        portfolioId: 'portfolio_1',
        propertyId: 'property_1',
        organizationId: customer.organizationId,
      }]}
      visits={[{
        id: 'visit_1',
        customerId: customer.id,
        organizationId: customer.organizationId,
        propertyId: 'property_1',
        scheduledDate: '2026-08-27',
        arrivalWindow: '8:00–10:00 AM',
        serviceTitle: 'Weekly care',
        scope: [],
        status: 'confirmed',
        preparationMessage: 'Gate access is on file.',
        nextUpdateMessage: 'We will update this visit when the provider is on the way.',
      }]}
      completionReportsByProperty={{}}
      isLoadingReportHistory={false}
      hasReportHistoryError={false}
      projectBids={[]}
      isLoadingProjectBids={false}
      hasProjectBidHistoryError={false}
      providerDisplayName="Desert Bloom Landscaping"
      {...overrides}
    />,
  );
}

describe('PropertyManagerPortfolioPanel', () => {
  it('renders the connected customer-safe hierarchy using only scoped properties', () => {
    const markup = renderPortfolio();

    expect(markup).toContain('Service confidence across every location.');
    expect(markup).toContain('Local review data boundary');
    expect(markup).toContain('No portfolio actions need attention.');
    expect(markup).toContain('Provider routes, crew notes, cost basis, margins');
    expect(markup).not.toContain('Private Route Depot');
    expect(markup).not.toContain('Hidden address');
  });

  it('distinguishes partial protected history from a zero value', () => {
    const markup = renderPortfolio({ hasProjectBidHistoryError: true });

    expect(markup).toContain('Some portfolio updates are unavailable.');
    expect(markup).toContain('missing values are not treated as zero');
    expect(markup).toContain('>—<');
  });

  it('renders a new-portfolio state when no scoped properties exist', () => {
    const markup = renderPortfolio({ properties: properties.slice(1) });

    expect(markup).toContain('No active property is connected yet.');
    expect(markup).toContain('without changing its service ownership or crew assignment');
  });
});
