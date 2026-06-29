import { describe, expect, it } from 'vitest';
import {
  companyNeedsOnboardingAttention,
  companySupportsMultipleCrews,
  countCustomerBidsToReview,
  countReadyCustomerReports,
  crewCanServeProperty,
  customerCanAccessProperty,
  customerNeedsOnboardingAttention,
  filterCrewAssignmentHistoryForProperty,
  filterCrewsForCompany,
  filterPropertiesForCustomerPortal,
  filterPropertiesForOrganization,
  filterWorkSummariesForCustomerPortal,
  getActiveCrewAssignmentForProperty,
  getCompletionProgress,
  getContractedServiceCount,
  getCustomerPortalNextActions,
  getCustomerPropertyCount,
  getEnabledCrewCapacityMinutes,
  getEnabledCrewCount,
  getPropertyCrewAssignmentSummary,
  switchPropertyCrewAssignment,
  type CompanyProfile,
  type CrewProfile,
  type CustomerAccountProfile,
  type CustomerPortalWorkSummary,
  type CustomerPropertyProfile,
  type PropertyCrewAssignment,
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

const testCustomer: CustomerAccountProfile = {
  id: 'customer_test_1',
  displayName: 'Test Customer',
  onboardingStatus: 'active',
  organizationId: 'company_test_1',
};

const testProperties: CustomerPropertyProfile[] = [
  {
    id: 'property_test_1',
    customerId: 'customer_test_1',
    organizationId: 'company_test_1',
    displayName: 'Primary property',
    address: '100 Test Lane',
    serviceFrequency: 'weekly',
    contractedServiceIds: ['service_standard_yard_care', 'service_cleanup'],
  },
  {
    id: 'property_test_2',
    customerId: 'customer_test_1',
    organizationId: 'company_test_1',
    displayName: 'Second property',
    address: '200 Test Lane',
    serviceFrequency: 'monthly',
    contractedServiceIds: ['service_standard_yard_care'],
  },
  {
    id: 'property_test_3',
    customerId: 'customer_test_2',
    organizationId: 'company_test_2',
    displayName: 'Other property',
    address: '300 Test Lane',
    serviceFrequency: 'biweekly',
    contractedServiceIds: [],
  },
];

const testWorkSummaries: CustomerPortalWorkSummary[] = [
  {
    id: 'work_test_1',
    customerId: 'customer_test_1',
    organizationId: 'company_test_1',
    propertyId: 'property_test_1',
    title: 'Weekly yard care',
    status: 'completed',
    reportReady: true,
    bidReviewRequired: false,
  },
  {
    id: 'work_test_2',
    customerId: 'customer_test_1',
    organizationId: 'company_test_1',
    propertyId: 'property_test_2',
    title: 'Sprinkler repair bid',
    status: 'bid_review',
    reportReady: false,
    bidReviewRequired: true,
  },
  {
    id: 'work_test_3',
    customerId: 'customer_test_2',
    organizationId: 'company_test_2',
    propertyId: 'property_test_3',
    title: 'Other customer work',
    status: 'completed',
    reportReady: true,
    bidReviewRequired: true,
  },
  {
    id: 'work_test_4',
    customerId: 'customer_test_1',
    organizationId: 'company_test_1',
    propertyId: 'property_test_1',
    title: 'Upcoming visit',
    status: 'scheduled',
    reportReady: false,
    bidReviewRequired: false,
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

const testCrewAssignments: PropertyCrewAssignment[] = [
  {
    id: 'assignment_test_0',
    propertyId: 'property_test_1',
    crewId: 'crew_test_2',
    organizationId: 'company_test_1',
    active: false,
    assignedAt: '2026-05-01',
    endedAt: '2026-06-01',
  },
  {
    id: 'assignment_test_1',
    propertyId: 'property_test_1',
    crewId: 'crew_test_1',
    organizationId: 'company_test_1',
    active: true,
    assignedAt: '2026-06-01',
  },
  {
    id: 'assignment_test_2',
    propertyId: 'property_test_2',
    crewId: 'crew_test_2',
    organizationId: 'company_test_1',
    active: true,
    assignedAt: '2026-06-05',
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
      organizationId: 'company_test_1',
    };
    const activeCustomer: CustomerAccountProfile = {
      id: 'customer_active',
      displayName: 'Active Customer',
      onboardingStatus: 'active',
      organizationId: 'company_test_1',
    };

    expect(customerNeedsOnboardingAttention(invitedCustomer)).toBe(true);
    expect(customerNeedsOnboardingAttention(activeCustomer)).toBe(false);
  });

  it('counts properties for a customer', () => {
    expect(getCustomerPropertyCount(testProperties, 'customer_test_1')).toBe(2);
  });

  it('filters properties to one organization boundary', () => {
    expect(filterPropertiesForOrganization(testProperties, 'company_test_1')).toHaveLength(2);
  });

  it('checks customer portal property access', () => {
    expect(customerCanAccessProperty(testCustomer, testProperties[0])).toBe(true);
    expect(customerCanAccessProperty(testCustomer, testProperties[2])).toBe(false);
  });

  it('filters customer portal properties by customer and organization', () => {
    expect(filterPropertiesForCustomerPortal(testProperties, testCustomer)).toHaveLength(2);
  });

  it('keeps customer and property ownership separate from crew assignment', () => {
    const switchedAssignments = switchPropertyCrewAssignment(
      testCrewAssignments,
      testProperties[0],
      testCrews[1],
      '2026-06-15',
    );
    const activeAssignment = getActiveCrewAssignmentForProperty(switchedAssignments, 'property_test_1');

    expect(activeAssignment?.crewId).toBe('crew_test_2');
    expect(testProperties[0].customerId).toBe('customer_test_1');
    expect(testProperties[0].organizationId).toBe('company_test_1');
  });

  it('summarizes active crew assignment and switch options for a property', () => {
    const summary = getPropertyCrewAssignmentSummary(testProperties[0], testCrews, testCrewAssignments);

    expect(summary).toEqual({
      propertyId: 'property_test_1',
      activeCrewId: 'crew_test_1',
      availableCrewCount: 2,
      canSwitchCrews: true,
    });
  });

  it('returns property crew assignment history newest first', () => {
    const history = filterCrewAssignmentHistoryForProperty(testCrewAssignments, 'property_test_1');

    expect(history.map((assignment) => assignment.id)).toEqual(['assignment_test_1', 'assignment_test_0']);
  });

  it('does not assign a property to a disabled or unrelated crew', () => {
    expect(crewCanServeProperty(testCrews[2], testProperties[0])).toBe(false);
    expect(switchPropertyCrewAssignment(testCrewAssignments, testProperties[0], testCrews[2], '2026-06-15')).toEqual(
      testCrewAssignments,
    );
  });

  it('filters customer portal work summaries by customer and organization', () => {
    expect(filterWorkSummariesForCustomerPortal(testWorkSummaries, testCustomer)).toHaveLength(3);
  });

  it('counts ready reports and bid reviews for scoped work summaries', () => {
    const visibleWork = filterWorkSummariesForCustomerPortal(testWorkSummaries, testCustomer);

    expect(countReadyCustomerReports(visibleWork)).toBe(1);
    expect(countCustomerBidsToReview(visibleWork)).toBe(1);
  });

  it('prioritizes next customer portal actions', () => {
    const visibleWork = filterWorkSummariesForCustomerPortal(testWorkSummaries, testCustomer);

    expect(getCustomerPortalNextActions(visibleWork).map((action) => action.actionKind)).toEqual([
      'review_bid',
      'view_report',
      'track_visit',
    ]);
  });

  it('counts contracted services for a property', () => {
    expect(getContractedServiceCount(testProperties[0])).toBe(2);
  });
});

describe('company and crew helpers', () => {
  const company: CompanyProfile = {
    id: 'company_test_1',
    displayName: 'Test Landscaping',
    companyType: 'landscaping_company',
    onboardingStatus: 'active',
  };

  it('filters crews by company', () => {
    expect(filterCrewsForCompany(testCrews, company.id)).toHaveLength(2);
  });

  it('counts enabled crews and capacity', () => {
    const companyCrews = filterCrewsForCompany(testCrews, company.id);

    expect(getEnabledCrewCount(companyCrews)).toBe(2);
    expect(getEnabledCrewCapacityMinutes(companyCrews)).toBe(780);
  });

  it('detects company support for multiple crews', () => {
    const companyCrews = filterCrewsForCompany(testCrews, company.id);

    expect(companySupportsMultipleCrews(company, companyCrews)).toBe(true);
  });
});
