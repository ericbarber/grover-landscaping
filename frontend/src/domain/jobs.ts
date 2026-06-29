export type YardCareJobStatus = 'scheduled' | 'in_progress' | 'completed';
export type CustomerOnboardingStatus = 'invited' | 'active' | 'incomplete' | 'suspended' | 'archived';
export type PropertyServiceFrequency = 'one_time' | 'weekly' | 'biweekly' | 'monthly' | 'seasonal';

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

export function getContractedServiceCount(property: CustomerPropertyProfile): number {
  return property.contractedServiceIds.length;
}
