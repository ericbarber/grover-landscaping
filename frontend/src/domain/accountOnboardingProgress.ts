import type {
  CustomerAccountOnboardingProgress,
  CustomerAccountRecord,
  CustomerPropertyAttentionReason,
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
    && account.contractedServicesPerPeriod > 0
    && account.primaryContactName.trim().length > 0
    && (account.contactEmail.trim().length > 0 || account.contactPhone.trim().length > 0);
  return {
    accountId: account.accountId,
    customerDetailsReady,
    propertyCount: currentProperties.length,
    serviceReadyPropertyCount: activePropertyCount,
    activePropertyCount,
    propertiesNeedingAttention: currentProperties.flatMap((property) => {
      if (property.status === 'active') return [];
      return [{
        propertyId: property.propertyId,
        displayName: property.displayName,
        status: property.status,
        reasons: property.status === 'blocked'
          ? ['property_blocked' as const]
          : [
              'operational_profile_incomplete' as const,
              'crew_unassigned' as const,
            ],
      }];
    }),
    complete: customerDetailsReady
      && currentProperties.length > 0
      && activePropertyCount === currentProperties.length,
    persisted: false,
  };
}

export function propertyAttentionReasonLabel(
  reason: CustomerPropertyAttentionReason,
): string {
  switch (reason) {
    case 'operational_profile_incomplete':
      return 'Finish operational profile';
    case 'crew_unassigned':
      return 'Assign service crew';
    case 'property_blocked':
      return 'Resolve blocked status';
    case 'activation_pending':
      return 'Activate property';
  }
}

export function propertyAttentionWorkspace(
  reason: CustomerPropertyAttentionReason,
): 'operational-profile' | 'service-setup' {
  return reason === 'operational_profile_incomplete'
    ? 'operational-profile'
    : 'service-setup';
}

export type AccountOnboardingFilter = 'all' | 'incomplete' | 'complete';

export function filterAccountsByOnboardingProgress(
  accounts: CustomerAccountRecord[],
  progress: Record<string, CustomerAccountOnboardingProgress>,
  filter: AccountOnboardingFilter,
): CustomerAccountRecord[] {
  if (filter === 'all') return accounts;
  return accounts.filter((account) => {
    const complete = progress[account.accountId]?.complete ?? false;
    return filter === 'complete' ? complete : !complete;
  });
}
