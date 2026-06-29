import { describe, expect, it } from 'vitest';
import {
  customerNeedsOnboardingAttention,
  filterPropertiesForOrganization,
  getCompletionProgress,
  getContractedServiceCount,
  getCustomerPropertyCount,
  type CustomerAccountProfile,
  type CustomerPropertyProfile,
  type YardCareJob,
} from './jobs';

function makeJob(overrides: Partial<YardCareJob>): YardCareJob {
  return {
    id: 'job_test',
    customerName: 'Test Customer',
    propertyAddress: '100 Test Lane',
    scheduledDate: '2026-06-15',
    status: 'scheduled',
    beforePhotos: 0,
    afterPhotos: 0,
    checklistItems: 4,
    completedChecklistItems: 0,
    ...overrides,
  };
}

const testProperties: CustomerPropertyProfile[] = [
  {
    id: 'property_test_1',
    customerId: 'customer_test_1',
    organizationId: 'org_test_1',
    displayName: 'Primary property',
    address: '100 Test Lane',
    serviceFrequency: 'weekly',
    contractedServiceIds: ['service_standard_yard_care', 'service_cleanup'],
  },
  {
    id: 'property_test_2',
    customerId: 'customer_test_1',
    organizationId: 'org_test_1',
    displayName: 'Second property',
    address: '200 Test Lane',
    serviceFrequency: 'monthly',
    contractedServiceIds: ['service_standard_yard_care'],
  },
  {
    id: 'property_test_3',
    customerId: 'customer_test_2',
    organizationId: 'org_test_2',
    displayName: 'Other organization property',
    address: '300 Test Lane',
    serviceFrequency: 'biweekly',
    contractedServiceIds: [],
  },
];

describe('getCompletionProgress', () => {
  it('returns a rounded percentage for checklist completion', () => {
    const job = makeJob({ checklistItems: 4, completedChecklistItems: 3 });

    expect(getCompletionProgress(job)).toBe(75);
  });

  it('returns zero when a job has no checklist items', () => {
    const job = makeJob({ checklistItems: 0, completedChecklistItems: 0 });

    expect(getCompletionProgress(job)).toBe(0);
  });
});

describe('customer property helpers', () => {
  it('flags invited or incomplete customers for onboarding attention', () => {
    const invitedCustomer: CustomerAccountProfile = {
      id: 'customer_invited',
      displayName: 'Invited Customer',
      onboardingStatus: 'invited',
      organizationId: 'org_test_1',
    };
    const activeCustomer: CustomerAccountProfile = {
      id: 'customer_active',
      displayName: 'Active Customer',
      onboardingStatus: 'active',
      organizationId: 'org_test_1',
    };

    expect(customerNeedsOnboardingAttention(invitedCustomer)).toBe(true);
    expect(customerNeedsOnboardingAttention(activeCustomer)).toBe(false);
  });

  it('counts properties for a customer', () => {
    expect(getCustomerPropertyCount(testProperties, 'customer_test_1')).toBe(2);
  });

  it('filters properties to one organization boundary', () => {
    expect(filterPropertiesForOrganization(testProperties, 'org_test_1')).toHaveLength(2);
  });

  it('counts contracted services for a property', () => {
    expect(getContractedServiceCount(testProperties[0])).toBe(2);
  });
});
