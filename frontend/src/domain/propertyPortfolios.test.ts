import { describe, expect, it } from 'vitest';
import type { CustomerAccountProfile, CustomerPropertyProfile } from './jobs';
import {
  filterPortfoliosForCustomer,
  filterPropertiesForPortfolio,
  getPortfolioPropertyCount,
  portfolioCanGroupProperty,
  type PortfolioPropertyLink,
  type PropertyPortfolio,
} from './propertyPortfolios';

const individualOwner: CustomerAccountProfile = {
  id: 'account_owner_1',
  displayName: 'Individual Owner',
  onboardingStatus: 'active',
  organizationId: 'service_company_1',
};

const propertyManager: CustomerAccountProfile = {
  id: 'account_pm_1',
  displayName: 'Property Management Co.',
  onboardingStatus: 'active',
  organizationId: 'service_company_1',
};

const portfolios: PropertyPortfolio[] = [
  {
    id: 'portfolio_owner_homes',
    accountId: 'account_owner_1',
    organizationId: 'service_company_1',
    displayName: 'My Homes',
    portfolioType: 'individual_owner',
  },
  {
    id: 'portfolio_pm_hoa',
    accountId: 'account_pm_1',
    organizationId: 'service_company_1',
    displayName: 'Desert Ridge HOA',
    portfolioType: 'property_management_company',
  },
  {
    id: 'portfolio_other_org',
    accountId: 'account_owner_1',
    organizationId: 'service_company_2',
    displayName: 'Other Organization Homes',
    portfolioType: 'individual_owner',
  },
];

const properties: CustomerPropertyProfile[] = [
  {
    id: 'property_owner_1',
    customerId: 'account_owner_1',
    organizationId: 'service_company_1',
    displayName: 'Owner front yard',
    address: '100 Owner Lane',
    serviceFrequency: 'weekly',
    contractedServiceIds: ['service_standard_yard_care'],
  },
  {
    id: 'property_owner_2',
    customerId: 'account_owner_1',
    organizationId: 'service_company_1',
    displayName: 'Owner rental yard',
    address: '200 Owner Lane',
    serviceFrequency: 'monthly',
    contractedServiceIds: ['service_cleanup'],
  },
  {
    id: 'property_pm_1',
    customerId: 'account_pm_1',
    organizationId: 'service_company_1',
    displayName: 'HOA lot 1',
    address: '300 HOA Lane',
    serviceFrequency: 'weekly',
    contractedServiceIds: ['service_standard_yard_care'],
  },
  {
    id: 'property_other_org',
    customerId: 'account_owner_1',
    organizationId: 'service_company_2',
    displayName: 'Other organization yard',
    address: '400 Other Lane',
    serviceFrequency: 'biweekly',
    contractedServiceIds: ['service_standard_yard_care'],
  },
];

const links: PortfolioPropertyLink[] = [
  {
    id: 'link_owner_1',
    portfolioId: 'portfolio_owner_homes',
    propertyId: 'property_owner_1',
    organizationId: 'service_company_1',
  },
  {
    id: 'link_owner_2',
    portfolioId: 'portfolio_owner_homes',
    propertyId: 'property_owner_2',
    organizationId: 'service_company_1',
  },
  {
    id: 'link_pm_1',
    portfolioId: 'portfolio_pm_hoa',
    propertyId: 'property_pm_1',
    organizationId: 'service_company_1',
  },
  {
    id: 'link_blocked_cross_org',
    portfolioId: 'portfolio_owner_homes',
    propertyId: 'property_other_org',
    organizationId: 'service_company_2',
  },
];

describe('property portfolio helpers', () => {
  it('filters portfolios to the current account and organization', () => {
    expect(filterPortfoliosForCustomer(portfolios, individualOwner)).toEqual([portfolios[0]]);
  });

  it('groups multiple yards under an individual owner portfolio', () => {
    expect(filterPropertiesForPortfolio(properties, links, portfolios[0]).map((property) => property.id)).toEqual([
      'property_owner_1',
      'property_owner_2',
    ]);
  });

  it('groups managed yards under a property management company portfolio', () => {
    expect(getPortfolioPropertyCount(properties, links, portfolios[1])).toBe(1);
  });

  it('does not let a portfolio group another account or organization property', () => {
    expect(portfolioCanGroupProperty(portfolios[0], properties[2])).toBe(false);
    expect(portfolioCanGroupProperty(portfolios[0], properties[3])).toBe(false);
  });

  it('keeps portfolio grouping separate from crew ownership', () => {
    expect(filterPortfoliosForCustomer(portfolios, propertyManager)[0].portfolioType).toBe('property_management_company');
    expect(filterPropertiesForPortfolio(properties, links, portfolios[1])[0].customerId).toBe(propertyManager.id);
  });
});
