import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { CustomerAccountProfile, CustomerPropertyProfile } from '../domain/jobs';
import {
  PropertyManagerPortfolioPanel,
  propertyManagerPortfolioCapabilities,
} from './PropertyManagerPortfolioPanel';

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
        deliveredProofAvailable: false,
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
  it('adds portfolio capabilities cumulatively and fails closed', () => {
    expect(propertyManagerPortfolioCapabilities(null)).toEqual({
      portfolioRead: false,
      propertySearch: false,
      serviceHistory: false,
      deliveredProof: false,
      questionsAndDecisions: false,
    });
    expect(propertyManagerPortfolioCapabilities('p1')).toEqual({
      portfolioRead: true,
      propertySearch: false,
      serviceHistory: false,
      deliveredProof: false,
      questionsAndDecisions: false,
    });
    expect(propertyManagerPortfolioCapabilities('p2')).toMatchObject({
      portfolioRead: true,
      propertySearch: true,
      serviceHistory: true,
      deliveredProof: true,
      questionsAndDecisions: false,
    });
    expect(propertyManagerPortfolioCapabilities('p3').questionsAndDecisions).toBe(true);
    expect(propertyManagerPortfolioCapabilities('p4').questionsAndDecisions).toBe(true);
  });

  it('keeps the P1 portfolio focused on readiness and coverage', () => {
    const markup = renderPortfolio({ rolloutUnit: 'p1' });

    expect(markup).toContain('Customer-safe readiness and next service');
    expect(markup).toContain('>Overview<');
    expect(markup).toContain('>Properties<');
    expect(markup).not.toContain('>Proof<');
    expect(markup).not.toContain('>Approvals<');
    expect(markup).not.toContain('Search portfolio properties');
    expect(markup).not.toContain('Waiting on you');
  });

  it('adds proof at P2 and questions and decisions at P3', () => {
    const p2Markup = renderPortfolio({ rolloutUnit: 'p2' });
    const p3Markup = renderPortfolio({ rolloutUnit: 'p3' });

    expect(p2Markup).toContain('>Proof<');
    expect(p2Markup).not.toContain('>Approvals<');
    expect(p3Markup).toContain('>Proof<');
    expect(p3Markup).toContain('>Approvals<');
    expect(p3Markup).toContain('Waiting on you');
  });

  it('withholds all portfolio data for an unknown managed unit', () => {
    const markup = renderPortfolio({ rolloutUnit: null });

    expect(markup).toContain('Portfolio access is not enabled for this account.');
    expect(markup).not.toContain(customer.displayName);
    expect(markup).not.toContain('Roosevelt Courtyard');
  });

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
