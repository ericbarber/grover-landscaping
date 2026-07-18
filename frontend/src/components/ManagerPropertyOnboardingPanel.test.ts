import { describe, expect, it } from 'vitest';
import type { SavePropertyOnboardingRequest } from '../api/client';
import { validatePropertyOnboardingForm } from './ManagerPropertyOnboardingPanel';

function validForm(): SavePropertyOnboardingRequest {
  return {
    accountId: 'acct_1001',
    organizationId: 'org_demo_landscaping',
    serviceAddress: '123 Oak Street',
    accessNotes: 'Use the side gate.',
    billingContactName: 'Sample Customer',
    billingContactEmail: 'billing@example.com',
    notificationContactName: 'Sample Customer',
    notificationEmail: 'notify@example.com',
    notificationPhone: '',
    onboardingStatus: 'active',
  };
}

describe('manager property onboarding validation', () => {
  it('accepts a complete profile with an email destination', () => {
    expect(validatePropertyOnboardingForm(validForm())).toBeNull();
  });

  it('requires a notification destination', () => {
    expect(validatePropertyOnboardingForm({
      ...validForm(),
      notificationEmail: '',
      notificationPhone: '',
    })).toBe('Enter a notification email or E.164 phone number.');
  });

  it('validates E.164 notification phones', () => {
    expect(validatePropertyOnboardingForm({
      ...validForm(),
      notificationEmail: '',
      notificationPhone: '602-555-0123',
    })).toContain('E.164');
    expect(validatePropertyOnboardingForm({
      ...validForm(),
      notificationEmail: '',
      notificationPhone: '+16025550123',
    })).toBeNull();
  });
});
