import { describe, expect, it } from 'vitest';
import type { CustomerAccountOnboardingProgress, CustomerAccountRecord } from '../api/client';
import { customerOnboardingCsv } from './customerOnboardingExport';

const account = (accountId: string, customerName: string): CustomerAccountRecord => ({
  accountId,
  organizationId: 'org_1',
  relationshipType: 'property_manager',
  customerName,
  billingModel: 'per_job',
  paymentStatus: 'pending',
  serviceApprovalStatus: 'approved',
  contractedServicesPerPeriod: 1,
  completedServicesThisPeriod: 0,
  billingNotes: '',
  primaryContactName: 'Sam "Primary"',
  contactEmail: 'sam@example.com',
  contactPhone: '',
  emailNotificationsEnabled: true,
  smsNotificationsEnabled: false,
  quietHoursStart: '',
  quietHoursEnd: '',
  persisted: true,
});

const progress = (accountId: string): CustomerAccountOnboardingProgress => ({
  accountId,
  customerDetailsReady: true,
  propertyCount: 3,
  serviceReadyPropertyCount: 2,
  activePropertyCount: 2,
  propertiesNeedingAttention: [{
    propertyId: 'property_1',
    displayName: 'North yard',
    status: 'onboarding',
    reasons: ['crew_unassigned'],
  }],
  complete: false,
  persisted: true,
});

describe('customerOnboardingCsv', () => {
  it('exports readiness and relationship fields with CSV escaping', () => {
    const csv = customerOnboardingCsv(
      [account('acct_1', 'Desert, "North" HOA')],
      { acct_1: progress('acct_1') },
    );
    expect(csv).toContain('"Desert, ""North"" HOA",property_manager,"Sam ""Primary"""');
    expect(csv).toContain(',true,3,2,2,1,false');
  });

  it('exports only the accounts supplied by the current filtered view', () => {
    const csv = customerOnboardingCsv(
      [account('acct_2', 'Visible account')],
      { acct_1: progress('acct_1'), acct_2: progress('acct_2') },
    );
    expect(csv).toContain('Visible account');
    expect(csv).not.toContain('acct_1');
    expect(csv.split('\r\n')).toHaveLength(2);
  });
});
