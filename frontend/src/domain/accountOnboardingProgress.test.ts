import { describe, expect, it } from 'vitest';
import type { CustomerAccountRecord, CustomerPropertyRecord } from '../api/client';
import {
  deriveAccountOnboardingProgress,
  customerRelationshipCounts,
  filterAccountsByRelationship,
  filterAccountsByOnboardingProgress,
  propertyAttentionReasonLabel,
  propertyAttentionWorkspace,
  searchCustomerAccounts,
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
  primaryContactName: 'Pat Customer',
  contactEmail: 'pat@example.com',
  contactPhone: '',
  emailNotificationsEnabled: true,
  smsNotificationsEnabled: false,
  quietHoursStart: '20:00',
  quietHoursEnd: '07:00',
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
    expect(deriveAccountOnboardingProgress({
      ...account,
      primaryContactName: '',
      contactEmail: '',
    }, [property('active')])).toMatchObject({
      customerDetailsReady: false,
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

  it('labels property attention reasons as manager actions', () => {
    expect(propertyAttentionReasonLabel('operational_profile_incomplete')).toBe(
      'Finish operational profile',
    );
    expect(propertyAttentionReasonLabel('crew_unassigned')).toBe('Assign service crew');
    expect(propertyAttentionReasonLabel('property_blocked')).toBe('Resolve blocked status');
    expect(propertyAttentionReasonLabel('activation_pending')).toBe('Activate property');
  });

  it('searches customer, contact, and property details case-insensitively', () => {
    const otherAccount = {
      ...account,
      accountId: 'acct_2',
      customerName: 'Desert HOA',
      primaryContactName: 'Sam Lee',
      contactEmail: 'sam@desert.example',
      contactPhone: '+14805550123',
    };
    const accounts = [account, otherAccount];
    const properties = {
      acct_1: [property('active')],
      acct_2: [{
        ...property('active'),
        propertyId: 'property_desert',
        accountId: 'acct_2',
        displayName: 'North Courtyard',
        serviceAddress: '900 Cactus Avenue',
      }],
    };
    expect(searchCustomerAccounts(accounts, properties, 'DESERT')).toEqual([otherAccount]);
    expect(searchCustomerAccounts(accounts, properties, 'sam@')).toEqual([otherAccount]);
    expect(searchCustomerAccounts(accounts, properties, 'Cactus')).toEqual([otherAccount]);
    expect(searchCustomerAccounts(accounts, properties, '  ')).toEqual(accounts);
  });

  it('filters and counts customer relationship types with legacy service-provider fallback', () => {
    const owner = { ...account, relationshipType: 'owner' as const };
    const manager = { ...account, accountId: 'acct_2', relationshipType: 'property_manager' as const };
    const legacy = { ...account, accountId: 'acct_3', relationshipType: undefined };
    const accounts = [owner, manager, legacy];
    expect(filterAccountsByRelationship(accounts, 'property_manager')).toEqual([manager]);
    expect(filterAccountsByRelationship(accounts, 'service_provider')).toEqual([legacy]);
    expect(customerRelationshipCounts(accounts)).toEqual({
      all: 3,
      owner: 1,
      property_manager: 1,
      service_provider: 1,
    });
  });

  it('routes property attention to the relevant setup workspace', () => {
    expect(propertyAttentionWorkspace('operational_profile_incomplete')).toBe('operational-profile');
    expect(propertyAttentionWorkspace('crew_unassigned')).toBe('service-setup');
    expect(propertyAttentionWorkspace('property_blocked')).toBe('service-setup');
    expect(propertyAttentionWorkspace('activation_pending')).toBe('service-setup');
  });
});
