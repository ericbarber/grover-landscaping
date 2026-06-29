import { describe, expect, it } from 'vitest';
import type { CustomerAccountProfile, CustomerPropertyProfile } from './jobs';
import type { PortfolioPropertyLink } from './propertyPortfolios';
import {
  filterCustomerPropertiesWithoutPortfolio,
  getCustomerPortfolioCoverageCounts,
} from './propertyPortfolioCoverage';

const customer: CustomerAccountProfile = {
  id: 'customer_1',
  displayName: 'Customer One',
  onboardingStatus: 'active',
  organizationId: 'service_company_1',
};

const properties: CustomerPropertyProfile[] = [
  {
    id: 'property_1',
    customerId: 'customer_1',
    organizationId: 'service_company_1',
    displayName: 'First yard',
    address: '100 First Lane',
    serviceFrequency: 'weekly',
    contractedServiceIds: ['service_standard_yard_care'],
  },
  {
    id: 'property_2',
    customerId: 'customer_1',
    organizationId: 'service_company_1',
    displayName: 'Second yard',
    address: '200 Second Lane',
    serviceFrequency: 'monthly',
    contractedServiceIds: ['service_cleanup'],
  },
  {
    id: 'property_3',
    customerId: 'customer_2',
    organizationId: 'service_company_1',
    displayName: 'Third yard',
    address: '300 Third Lane',
    serviceFrequency: 'biweekly',
    contractedServiceIds: ['service_standard_yard_care'],
  },
];

const links: PortfolioPropertyLink[] = [
  {
    id: 'link_1',
    portfolioId: 'portfolio_1',
    propertyId: 'property_1',
    organizationId: 'service_company_1',
  },
];

describe('property portfolio coverage helpers', () => {
  it('finds customer properties that are not in a portfolio yet', () => {
    expect(filterCustomerPropertiesWithoutPortfolio(properties, links, customer).map((property) => property.id)).toEqual([
      'property_2',
    ]);
  });

  it('counts total, linked, and pending customer properties', () => {
    expect(getCustomerPortfolioCoverageCounts(properties, links, customer)).toEqual({
      totalPropertyCount: 2,
      linkedPropertyCount: 1,
      unlinkedPropertyCount: 1,
    });
  });
});
