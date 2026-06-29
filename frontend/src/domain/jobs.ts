export type YardCareJobStatus = 'scheduled' | 'in_progress' | 'completed';
export type CustomerOnboardingStatus = 'invited' | 'active' | 'incomplete' | 'suspended' | 'archived';
export type CompanyType = 'landscaping_company' | 'property_manager';
export type PropertyServiceFrequency = 'one_time' | 'weekly' | 'biweekly' | 'monthly' | 'seasonal';
export type CustomerPortalWorkStatus = 'scheduled' | 'in_progress' | 'completed' | 'bid_review';
export type CustomerPortalNextActionKind = 'review_bid' | 'view_report' | 'track_visit';

export interface YardCareJob {
  id: string;
  customerName: string;
  propertyAddress: string;
  scheduledDate: string;
  status: YardCareJobStatus;
  beforePhotos: number;
  afterPhotos: number;
  checklistItems: number;
  completedChecklistItems: number;
}

export interface CompanyProfile {
  id: string;
  displayName: string;
  companyType: CompanyType;
  onboardingStatus: CustomerOnboardingStatus;
}

export interface CrewProfile {
  id: string;
  companyId: string;
  displayName: string;
  serviceArea: string;
  defaultCapacityMinutes: number;
  enabled: boolean;
}

export interface CustomerAccountProfile {
  id: string;
  displayName: string;
  onboardingStatus: CustomerOnboardingStatus;
  organizationId: string;
}

export interface CustomerPropertyProfile {
  id: string;
  customerId: string;
  organizationId: string;
  displayName: string;
  address: string;
  serviceFrequency: PropertyServiceFrequency;
  contractedServiceIds: string[];
}

export interface PropertyCrewAssignment {
  id: string;
  propertyId: string;
  crewId: string;
  organizationId: string;
  active: boolean;
  assignedAt: string;
  endedAt?: string;
}

export interface PropertyCrewAssignmentSummary {
  propertyId: string;
  activeCrewId?: string;
  availableCrewCount: number;
  canSwitchCrews: boolean;
}

export interface CustomerPortalWorkSummary {
  id: string;
  customerId: string;
  organizationId: string;
  propertyId: string;
  title: string;
  status: CustomerPortalWorkStatus;
  reportReady: boolean;
  bidReviewRequired: boolean;
}

export interface CustomerPortalNextAction {
  id: string;
  workSummaryId: string;
  label: string;
  actionKind: CustomerPortalNextActionKind;
}

export const seedJobs: YardCareJob[] = [
  {
    id: 'job_1001',
    customerName: 'Sample Customer',
    propertyAddress: '123 Oak Street',
    scheduledDate: '2026-06-15',
    status: 'scheduled',
    beforePhotos: 0,
    afterPhotos: 0,
    checklistItems: 4,
    completedChecklistItems: 0,
  },
  {
    id: 'job_1002',
    customerName: 'Demo Property Owner',
    propertyAddress: '456 Maple Avenue',
    scheduledDate: '2026-06-15',
    status: 'in_progress',
    beforePhotos: 3,
    afterPhotos: 1,
    checklistItems: 4,
    completedChecklistItems: 2,
  },
];

export function getCompletionProgress(job: YardCareJob): number {
  if (job.checklistItems === 0) {
    return 0;
  }

  return Math.round((job.completedChecklistItems / job.checklistItems) * 100);
}

export function customerNeedsOnboardingAttention(customer: CustomerAccountProfile): boolean {
  return customer.onboardingStatus === 'invited' || customer.onboardingStatus === 'incomplete';
}

export function companyNeedsOnboardingAttention(company: CompanyProfile): boolean {
  return company.onboardingStatus === 'invited' || company.onboardingStatus === 'incomplete';
}

export function getCustomerPropertyCount(
  properties: CustomerPropertyProfile[],
  customerId: string,
): number {
  return properties.filter((property) => property.customerId === customerId).length;
}

export function filterPropertiesForOrganization(
  properties: CustomerPropertyProfile[],
  organizationId: string,
): CustomerPropertyProfile[] {
  return properties.filter((property) => property.organizationId === organizationId);
}

export function customerCanAccessProperty(
  customer: CustomerAccountProfile,
  property: CustomerPropertyProfile,
): boolean {
  return property.customerId === customer.id && property.organizationId === customer.organizationId;
}

export function filterPropertiesForCustomerPortal(
  properties: CustomerPropertyProfile[],
  customer: CustomerAccountProfile,
): CustomerPropertyProfile[] {
  return properties.filter((property) => customerCanAccessProperty(customer, property));
}

export function crewCanServeProperty(crew: CrewProfile, property: CustomerPropertyProfile): boolean {
  return crew.enabled && crew.companyId === property.organizationId;
}

export function getActiveCrewAssignmentForProperty(
  assignments: PropertyCrewAssignment[],
  propertyId: string,
): PropertyCrewAssignment | undefined {
  return assignments.find((assignment) => assignment.propertyId === propertyId && assignment.active);
}

export function filterCrewAssignmentHistoryForProperty(
  assignments: PropertyCrewAssignment[],
  propertyId: string,
): PropertyCrewAssignment[] {
  return assignments
    .filter((assignment) => assignment.propertyId === propertyId)
    .sort((firstAssignment, secondAssignment) => secondAssignment.assignedAt.localeCompare(firstAssignment.assignedAt));
}

export function getPropertyCrewAssignmentSummary(
  property: CustomerPropertyProfile,
  crews: CrewProfile[],
  assignments: PropertyCrewAssignment[],
): PropertyCrewAssignmentSummary {
  const availableCrews = crews.filter((crew) => crewCanServeProperty(crew, property));
  const activeAssignment = getActiveCrewAssignmentForProperty(assignments, property.id);

  return {
    propertyId: property.id,
    activeCrewId: activeAssignment?.crewId,
    availableCrewCount: availableCrews.length,
    canSwitchCrews: availableCrews.length > 1,
  };
}

export function switchPropertyCrewAssignment(
  assignments: PropertyCrewAssignment[],
  property: CustomerPropertyProfile,
  nextCrew: CrewProfile,
  assignedAt: string,
): PropertyCrewAssignment[] {
  if (!crewCanServeProperty(nextCrew, property)) {
    return assignments;
  }

  const closedAssignments = assignments.map((assignment) =>
    assignment.propertyId === property.id && assignment.active
      ? { ...assignment, active: false, endedAt: assignedAt }
      : assignment,
  );

  return [
    ...closedAssignments,
    {
      id: `assignment_${property.id}_${nextCrew.id}_${assignedAt}`,
      propertyId: property.id,
      crewId: nextCrew.id,
      organizationId: property.organizationId,
      active: true,
      assignedAt,
    },
  ];
}

export function filterWorkSummariesForCustomerPortal(
  workSummaries: CustomerPortalWorkSummary[],
  customer: CustomerAccountProfile,
): CustomerPortalWorkSummary[] {
  return workSummaries.filter(
    (workSummary) => workSummary.customerId === customer.id && workSummary.organizationId === customer.organizationId,
  );
}

export function countReadyCustomerReports(workSummaries: CustomerPortalWorkSummary[]): number {
  return workSummaries.filter((workSummary) => workSummary.reportReady).length;
}

export function countCustomerBidsToReview(workSummaries: CustomerPortalWorkSummary[]): number {
  return workSummaries.filter((workSummary) => workSummary.bidReviewRequired).length;
}

export function getCustomerPortalNextActions(workSummaries: CustomerPortalWorkSummary[]): CustomerPortalNextAction[] {
  const bidActions = workSummaries
    .filter((workSummary) => workSummary.bidReviewRequired)
    .map((workSummary) => ({
      id: `review_bid_${workSummary.id}`,
      workSummaryId: workSummary.id,
      label: `Review bid: ${workSummary.title}`,
      actionKind: 'review_bid' as const,
    }));
  const reportActions = workSummaries
    .filter((workSummary) => workSummary.reportReady)
    .map((workSummary) => ({
      id: `view_report_${workSummary.id}`,
      workSummaryId: workSummary.id,
      label: `View report: ${workSummary.title}`,
      actionKind: 'view_report' as const,
    }));
  const visitActions = workSummaries
    .filter((workSummary) => workSummary.status === 'scheduled' || workSummary.status === 'in_progress')
    .map((workSummary) => ({
      id: `track_visit_${workSummary.id}`,
      workSummaryId: workSummary.id,
      label: `Track visit: ${workSummary.title}`,
      actionKind: 'track_visit' as const,
    }));

  return [...bidActions, ...reportActions, ...visitActions];
}

export function getContractedServiceCount(property: CustomerPropertyProfile): number {
  return property.contractedServiceIds.length;
}

export function filterCrewsForCompany(crews: CrewProfile[], companyId: string): CrewProfile[] {
  return crews.filter((crew) => crew.companyId === companyId);
}

export function getEnabledCrewCount(crews: CrewProfile[]): number {
  return crews.filter((crew) => crew.enabled).length;
}

export function getEnabledCrewCapacityMinutes(crews: CrewProfile[]): number {
  return crews.reduce((total, crew) => total + (crew.enabled ? crew.defaultCapacityMinutes : 0), 0);
}

export function companySupportsMultipleCrews(company: CompanyProfile, crews: CrewProfile[]): boolean {
  return company.companyType === 'property_manager' || getEnabledCrewCount(crews) > 1;
}
