import { describe, expect, it } from 'vitest';
import type { CustomerAccountRecord, CustomerPropertyRecord } from '../api/client';
import {
  deriveAccountOnboardingProgress,
  filterAccountsByOnboardingProgress,
} from './accountOnboardingProgress';

const account: CustomerAccountRecord = {
  accountId: 'acct_1',
  organizationId: 'org_1',
  customerName: 'Test customer',
  billingModel: 'per_job',
  paymentStatus: 'pending',
  serviceApprovalStatus: 'approved',
  contractedServicesPerPeriod: 2,
  completedServicesThisPeriod: 0,
  billingNotes: '',
  persisted: false,
};

const property = (status: CustomerPropertyRecord['status']): CustomerPropertyRecord => ({
  propertyId: `property_${status}`,
  accountId: 'acct_1',
  organizationId: 'org_1',
  displayName: `${status} yard`,
  serviceAddress: '123 Test Street',
  status,
  persisted: false,
});

describe('account onboarding progress', () => {
  it('requires customer details and every current property to be active', () => {
    expect(deriveAccountOnboardingProgress(account, [property('active')])).toMatchObject({
      customerDetailsReady: true,
      propertyCount: 1,
      activePropertyCount: 1,
      complete: true,
    });
    expect(deriveAccountOnboardingProgress(account, [
      property('active'),
      property('onboarding'),
      property('archived'),
    ])).toMatchObject({
      propertyCount: 2,
      activePropertyCount: 1,
      complete: false,
    });
  });

  it('filters complete and incomplete accounts while treating missing progress as incomplete', () => {
    const completeAccount = account;
    const incompleteAccount = { ...account, accountId: 'acct_2', customerName: 'Needs setup' };
    const missingProgressAccount = { ...account, accountId: 'acct_3', customerName: 'Loading' };
    const progress = {
      acct_1: deriveAccountOnboardingProgress(completeAccount, [property('active')]),
      acct_2: deriveAccountOnboardingProgress(incompleteAccount, [property('onboarding')]),
    };
    expect(filterAccountsByOnboardingProgress(
      [completeAccount, incompleteAccount, missingProgressAccount],
      progress,
      'complete',
    ).map((item) => item.accountId)).toEqual(['acct_1']);
    expect(filterAccountsByOnboardingProgress(
      [completeAccount, incompleteAccount, missingProgressAccount],
      progress,
      'incomplete',
    ).map((item) => item.accountId)).toEqual(['acct_2', 'acct_3']);
  });
});
