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

export interface PropertyPortfolioSummary {
  portfolioId: string;
  displayName: string;
  portfolioType: PropertyPortfolioType;
  propertyCount: number;
}

export interface PropertyPortfolioDetail extends PropertyPortfolioSummary {
  properties: CustomerPropertyProfile[];
}

export function filterPortfoliosForCustomer(
  portfolios: PropertyPortfolio[],
  customer: CustomerAccountProfile,
): PropertyPortfolio[] {
  return portfolios.filter(
    (portfolio) => portfolio.accountId === customer.id && portfolio.organizationId === customer.organizationId,
  );
}

export function portfolioTypeLabel(portfolioType: PropertyPortfolioType): string {
  if (portfolioType === 'individual_owner') {
    return 'Individual owner';
  }

  if (portfolioType === 'property_management_company') {
    return 'Property management company';
  }

  if (portfolioType === 'hoa') {
    return 'HOA';
  }

  return 'Commercial client';
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

export function buildPropertyPortfolioSummaries(
  portfolios: PropertyPortfolio[],
  properties: CustomerPropertyProfile[],
  links: PortfolioPropertyLink[],
  customer: CustomerAccountProfile,
): PropertyPortfolioSummary[] {
  return filterPortfoliosForCustomer(portfolios, customer).map((portfolio) => ({
    portfolioId: portfolio.id,
    displayName: portfolio.displayName,
    portfolioType: portfolio.portfolioType,
    propertyCount: getPortfolioPropertyCount(properties, links, portfolio),
  }));
}

export function buildPropertyPortfolioDetails(
  portfolios: PropertyPortfolio[],
  properties: CustomerPropertyProfile[],
  links: PortfolioPropertyLink[],
  customer: CustomerAccountProfile,
): PropertyPortfolioDetail[] {
  return filterPortfoliosForCustomer(portfolios, customer).map((portfolio) => {
    const portfolioProperties = filterPropertiesForPortfolio(properties, links, portfolio);

    return {
      portfolioId: portfolio.id,
      displayName: portfolio.displayName,
      portfolioType: portfolio.portfolioType,
      propertyCount: portfolioProperties.length,
      properties: portfolioProperties,
    };
  });
}
