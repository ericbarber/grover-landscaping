import { describe, expect, it } from 'vitest';
import { customerAccountDraftError, emptyCustomerAccountDraft } from './customerAccountDraft';

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
});
