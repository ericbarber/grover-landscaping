import type { CustomerAccountProfile, CustomerPropertyProfile } from './jobs';

export type PropertyPortfolioType = 'individual_owner' | 'property_management_company' | 'hoa' | 'commercial_client';

export interface PropertyPortfolio {
  id: string;
  accountId: string;
  organizationId: string;
  displayName: string;
  portfolioType: PropertyPortfolioType;
}

export interface PortfolioPropertyLink {
  id: string;
  portfolioId: string;
  propertyId: string;
  organizationId: string;
}

export function filterPortfoliosForCustomer(
  portfolios: PropertyPortfolio[],
  customer: CustomerAccountProfile,
): PropertyPortfolio[] {
  return portfolios.filter(
    (portfolio) => portfolio.accountId === customer.id && portfolio.organizationId === customer.organizationId,
  );
}

export function portfolioCanGroupProperty(
  portfolio: PropertyPortfolio,
  property: CustomerPropertyProfile,
): boolean {
  return property.customerId === portfolio.accountId && property.organizationId === portfolio.organizationId;
}

export function filterPropertiesForPortfolio(
  properties: CustomerPropertyProfile[],
  links: PortfolioPropertyLink[],
  portfolio: PropertyPortfolio,
): CustomerPropertyProfile[] {
  const linkedPropertyIds = new Set(
    links
      .filter((link) => link.portfolioId === portfolio.id && link.organizationId === portfolio.organizationId)
      .map((link) => link.propertyId),
  );

  return properties.filter((property) => linkedPropertyIds.has(property.id) && portfolioCanGroupProperty(portfolio, property));
}

export function getPortfolioPropertyCount(
  properties: CustomerPropertyProfile[],
  links: PortfolioPropertyLink[],
  portfolio: PropertyPortfolio,
): number {
  return filterPropertiesForPortfolio(properties, links, portfolio).length;
}
