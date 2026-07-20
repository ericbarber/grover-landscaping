import { describe, expect, it } from 'vitest';
import type { CustomerAccountRecord } from '../api/client';
import {
  customerAccountDraftError,
  emptyCustomerAccountDraft,
  findMatchingCustomerAccount,
} from './customerAccountDraft';

const account: CustomerAccountRecord = {
  accountId: 'acct_1',
  organizationId: 'org_1',
  customerName: 'Desert HOA',
  billingModel: 'per_job',
  paymentStatus: 'pending',
  serviceApprovalStatus: 'approved',
  contractedServicesPerPeriod: 1,
  completedServicesThisPeriod: 0,
  billingNotes: '',
  primaryContactName: 'Sam Lee',
  contactEmail: 'sam@example.com',
  contactPhone: '+14805550123',
  emailNotificationsEnabled: true,
  smsNotificationsEnabled: false,
  quietHoursStart: '',
  quietHoursEnd: '',
  persisted: true,
};

describe('customerAccountDraftError', () => {
  it('requires a name, primary contact, and communication destination', () => {
    expect(customerAccountDraftError(emptyCustomerAccountDraft)).toContain('customer name');
    expect(customerAccountDraftError({
      ...emptyCustomerAccountDraft,
      customerName: 'Desert HOA',
    })).toContain('primary contact');
    expect(customerAccountDraftError({
      ...emptyCustomerAccountDraft,
      customerName: 'Desert HOA',
      primaryContactName: 'Sam Lee',
    })).toContain('email or mobile');
  });

  it('accepts either a valid email or E.164 phone', () => {
    expect(customerAccountDraftError({
      ...emptyCustomerAccountDraft,
      customerName: 'Desert HOA',
      primaryContactName: 'Sam Lee',
      contactEmail: 'sam@example.com',
    })).toBeNull();
    expect(customerAccountDraftError({
      ...emptyCustomerAccountDraft,
      customerName: 'Desert HOA',
      primaryContactName: 'Sam Lee',
      contactPhone: '+14805550123',
    })).toBeNull();
  });

  it('rejects malformed contact destinations', () => {
    expect(customerAccountDraftError({
      ...emptyCustomerAccountDraft,
      customerName: 'Desert HOA',
      primaryContactName: 'Sam Lee',
      contactEmail: 'sam.example.com',
    })).toContain('valid contact email');
    expect(customerAccountDraftError({
      ...emptyCustomerAccountDraft,
      customerName: 'Desert HOA',
      primaryContactName: 'Sam Lee',
      contactPhone: '480-555-0123',
    })).toContain('E.164');
  });

  it('preserves explicit opt-in only with its matching destination', () => {
    expect(customerAccountDraftError({
      ...emptyCustomerAccountDraft,
      customerName: 'Desert HOA',
      primaryContactName: 'Sam Lee',
      contactPhone: '+14805550123',
      emailNotificationsEnabled: true,
    })).toContain('contact email');
    expect(customerAccountDraftError({
      ...emptyCustomerAccountDraft,
      customerName: 'Desert HOA',
      primaryContactName: 'Sam Lee',
      contactEmail: 'sam@example.com',
      smsNotificationsEnabled: true,
    })).toContain('mobile phone');
  });

  it('finds exact normalized name, email, or phone matches', () => {
    expect(findMatchingCustomerAccount([account], {
      ...emptyCustomerAccountDraft,
      customerName: ' desert hoa ',
    })).toBe(account);
    expect(findMatchingCustomerAccount([account], {
      ...emptyCustomerAccountDraft,
      customerName: 'Different account',
      contactEmail: 'SAM@EXAMPLE.COM',
    })).toBe(account);
    expect(findMatchingCustomerAccount([account], {
      ...emptyCustomerAccountDraft,
      customerName: 'Different account',
      contactPhone: '+14805550123',
    })).toBe(account);
    expect(findMatchingCustomerAccount([account], {
      ...emptyCustomerAccountDraft,
      customerName: 'Different account',
      contactEmail: 'different@example.com',
    })).toBeUndefined();
  });
});
