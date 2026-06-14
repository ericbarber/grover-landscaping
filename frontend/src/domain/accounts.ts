export type BillingModel = 'per_job' | 'monthly_plan' | 'prepaid_package' | 'manual_account';
export type PaymentStatus = 'not_required' | 'pending' | 'paid' | 'past_due' | 'waived' | 'manager_review';
export type ServiceApprovalStatus = 'approved' | 'blocked' | 'manager_review';

export interface CustomerAccountSummary {
  jobId: string;
  billingModel: BillingModel;
  paymentStatus: PaymentStatus;
  serviceApprovalStatus: ServiceApprovalStatus;
  contractedServicesPerPeriod: number;
  completedServicesThisPeriod: number;
  billingNotes: string;
}

const accountSummaries: CustomerAccountSummary[] = [
  {
    jobId: 'job_1001',
    billingModel: 'per_job',
    paymentStatus: 'pending',
    serviceApprovalStatus: 'approved',
    contractedServicesPerPeriod: 1,
    completedServicesThisPeriod: 0,
    billingNotes: 'Payment can be marked complete after service.',
  },
  {
    jobId: 'job_1002',
    billingModel: 'monthly_plan',
    paymentStatus: 'paid',
    serviceApprovalStatus: 'approved',
    contractedServicesPerPeriod: 4,
    completedServicesThisPeriod: 2,
    billingNotes: 'Monthly plan is current.',
  },
];

export function getAccountSummaryForJob(jobId: string): CustomerAccountSummary {
  return (
    accountSummaries.find((account) => account.jobId === jobId) ?? {
      jobId,
      billingModel: 'manual_account',
      paymentStatus: 'manager_review',
      serviceApprovalStatus: 'manager_review',
      contractedServicesPerPeriod: 0,
      completedServicesThisPeriod: 0,
      billingNotes: 'Account requires manager review.',
    }
  );
}

export function paymentStatusLabel(status: PaymentStatus): string {
  return status.replace('_', ' ');
}

export function billingModelLabel(model: BillingModel): string {
  return model.replace('_', ' ');
}
