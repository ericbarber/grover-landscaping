import { describe, expect, it } from 'vitest';
import {
  companyNeedsOnboardingAttention,
  companySupportsMultipleCrews,
  customerNeedsOnboardingAttention,
  filterCrewsForCompany,
  filterPropertiesForOrganization,
  getCompletionProgress,
  getContractedServiceCount,
  getCustomerPropertyCount,
  getEnabledCrewCapacityMinutes,
  getEnabledCrewCount,
  type CompanyProfile,
  type CrewProfile,
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

const testCrews: CrewProfile[] = [
  {
    id: 'crew_test_1',
    companyId: 'company_test_1',
    displayName: 'North crew',
    serviceArea: 'North valley',
    defaultCapacityMinutes: 420,
    enabled: true,
  },
  {
    id: 'crew_test_2',
    companyId: 'company_test_1',
    displayName: 'South crew',
    serviceArea: 'South valley',
    defaultCapacityMinutes: 360,
    enabled: true,
  },
  {
    id: 'crew_test_3',
    companyId: 'company_test_2',
    displayName: 'Dormant crew',
    serviceArea: 'East valley',
    defaultCapacityMinutes: 300,
    enabled: false,
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

describe('company crew helpers', () => {
  it('flags invited or incomplete companies for onboarding attention', () => {
    const incompleteCompany: CompanyProfile = {
      id: 'company_incomplete',
      displayName: 'Incomplete Company',
      companyType: 'landscaping_company',
      onboardingStatus: 'incomplete',
    };
    const activeCompany: CompanyProfile = {
      id: 'company_active',
      displayName: 'Active Company',
      companyType: 'landscaping_company',
      onboardingStatus: 'active',
    };

    expect(companyNeedsOnboardingAttention(incompleteCompany)).toBe(true);
    expect(companyNeedsOnboardingAttention(activeCompany)).toBe(false);
  });

  it('filters crews to one company boundary', () => {
    expect(filterCrewsForCompany(testCrews, 'company_test_1')).toHaveLength(2);
  });

  it('counts enabled crews', () => {
    expect(getEnabledCrewCount(testCrews)).toBe(2);
  });

  it('sums enabled crew capacity only', () => {
    expect(getEnabledCrewCapacityMinutes(testCrews)).toBe(780);
  });

  it('supports multiple crews for property manager companies', () => {
    const company: CompanyProfile = {
      id: 'company_test_2',
      displayName: 'Property Manager Company',
      companyType: 'property_manager',
      onboardingStatus: 'active',
    };

    expect(companySupportsMultipleCrews(company, [testCrews[2]])).toBe(true);
  });

  it('supports multiple crews for landscaping companies with multiple enabled crews', () => {
    const company: CompanyProfile = {
      id: 'company_test_1',
      displayName: 'Multi Crew Landscaping',
      companyType: 'landscaping_company',
      onboardingStatus: 'active',
    };

    expect(companySupportsMultipleCrews(company, filterCrewsForCompany(testCrews, company.id))).toBe(true);
  });
});
