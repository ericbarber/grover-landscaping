import type {
  CustomerAccountOnboardingProgress,
  CustomerAccountRecord,
} from '../api/client';

const headers = [
  'customer_name',
  'relationship',
  'primary_contact',
  'contact_email',
  'contact_phone',
  'customer_details_ready',
  'property_count',
  'service_ready_property_count',
  'active_property_count',
  'attention_count',
  'onboarding_complete',
] as const;

function csvCell(value: string | number | boolean): string {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function customerOnboardingCsv(
  accounts: CustomerAccountRecord[],
  progress: Record<string, CustomerAccountOnboardingProgress>,
): string {
  const rows = accounts.map((account) => {
    const accountProgress = progress[account.accountId];
    return [
      account.customerName,
      account.relationshipType ?? 'service_provider',
      account.primaryContactName,
      account.contactEmail,
      account.contactPhone,
      accountProgress?.customerDetailsReady ?? false,
      accountProgress?.propertyCount ?? 0,
      accountProgress?.serviceReadyPropertyCount ?? 0,
      accountProgress?.activePropertyCount ?? 0,
      accountProgress?.propertiesNeedingAttention.length ?? 0,
      accountProgress?.complete ?? false,
    ].map(csvCell).join(',');
  });
  return [headers.join(','), ...rows].join('\r\n');
}
