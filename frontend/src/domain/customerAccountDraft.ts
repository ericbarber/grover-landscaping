export type CustomerAccountDraft = {
  customerName: string;
  primaryContactName: string;
  contactEmail: string;
  contactPhone: string;
  emailNotificationsEnabled: boolean;
  smsNotificationsEnabled: boolean;
};

export const emptyCustomerAccountDraft: CustomerAccountDraft = {
  customerName: '',
  primaryContactName: '',
  contactEmail: '',
  contactPhone: '',
  emailNotificationsEnabled: false,
  smsNotificationsEnabled: false,
};

export function customerAccountDraftError(draft: CustomerAccountDraft): string | null {
  if (draft.customerName.trim().length < 2) {
    return 'Enter a customer name with at least two characters.';
  }
  if (draft.primaryContactName.trim().length < 2) {
    return 'Enter the primary contact name.';
  }
  const email = draft.contactEmail.trim();
  const phone = draft.contactPhone.trim();
  if (!email && !phone) {
    return 'Enter a contact email or mobile phone.';
  }
  if (email && (email.length > 254 || !email.includes('@') || email.startsWith('@') || email.endsWith('@'))) {
    return 'Enter a valid contact email.';
  }
  if (phone && (!phone.startsWith('+') || phone.length < 8 || phone.length > 16 || !/^\+\d+$/.test(phone))) {
    return 'Enter the mobile phone in E.164 format, such as +14805550123.';
  }
  if (draft.emailNotificationsEnabled && !email) {
    return 'Add a contact email or turn off email updates.';
  }
  if (draft.smsNotificationsEnabled && !phone) {
    return 'Add a mobile phone or turn off SMS updates.';
  }
  return null;
}

export function findMatchingCustomerAccount(
  accounts: CustomerAccountRecord[],
  draft: CustomerAccountDraft,
): CustomerAccountRecord | undefined {
  const name = draft.customerName.trim().toLocaleLowerCase();
  const email = draft.contactEmail.trim().toLocaleLowerCase();
  const phone = draft.contactPhone.trim();
  return accounts.find((account) =>
    account.customerName.trim().toLocaleLowerCase() === name
    || Boolean(email && account.contactEmail.trim().toLocaleLowerCase() === email)
    || Boolean(phone && account.contactPhone.trim() === phone)
  );
}
import type { CustomerAccountRecord } from '../api/client';
