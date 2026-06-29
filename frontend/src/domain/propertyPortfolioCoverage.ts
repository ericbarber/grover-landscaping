import type { CustomerAccountProfile, CustomerPropertyProfile } from './jobs';
import type { PortfolioPropertyLink } from './propertyPortfolios';

export function filterCustomerPropertiesWithoutPortfolio(
  properties: CustomerPropertyProfile[],
  links: PortfolioPropertyLink[],
  customer: CustomerAccountProfile,
): CustomerPropertyProfile[] {
  const linkedPropertyIds = new Set(
    links.filter((link) => link.organizationId === customer.organizationId).map((link) => link.propertyId),
  );

  return properties.filter(
    (property) =>
      property.customerId === customer.id &&
      property.organizationId === customer.organizationId &&
      !linkedPropertyIds.has(property.id),
  );
}

export function getCustomerPortfolioCoverageCounts(
  properties: CustomerPropertyProfile[],
  links: PortfolioPropertyLink[],
  customer: CustomerAccountProfile,
): { totalPropertyCount: number; linkedPropertyCount: number; unlinkedPropertyCount: number } {
  const customerProperties = properties.filter(
    (property) => property.customerId === customer.id && property.organizationId === customer.organizationId,
  );
  const unlinkedPropertyCount = filterCustomerPropertiesWithoutPortfolio(properties, links, customer).length;

  return {
    totalPropertyCount: customerProperties.length,
    linkedPropertyCount: customerProperties.length - unlinkedPropertyCount,
    unlinkedPropertyCount,
  };
}
