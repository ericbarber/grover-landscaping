import type {
  CustomerAccountOnboardingProgress,
  CustomerAccountRecord,
  CustomerPropertyRecord,
} from '../api/client';

export function deriveAccountOnboardingProgress(
  account: CustomerAccountRecord,
  properties: CustomerPropertyRecord[],
): CustomerAccountOnboardingProgress {
  const currentProperties = properties.filter((property) => property.status !== 'archived');
  const activePropertyCount = currentProperties.filter(
    (property) => property.status === 'active',
  ).length;
  const customerDetailsReady = account.serviceApprovalStatus === 'approved'
    && account.contractedServicesPerPeriod > 0;
  return {
    accountId: account.accountId,
    customerDetailsReady,
    propertyCount: currentProperties.length,
    serviceReadyPropertyCount: activePropertyCount,
    activePropertyCount,
    complete: customerDetailsReady
      && currentProperties.length > 0
      && activePropertyCount === currentProperties.length,
    persisted: false,
  };
}
