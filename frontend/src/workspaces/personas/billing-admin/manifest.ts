import type { WorkspacePersonaManifest } from '../../core/types';
import { homeDefinition, homeNavigation } from '../shared';

export const billingAdminManifest = {
  id: 'billing-admin',
  status: 'proposed',
  eligibleRoles: ['BillingAdmin'],
  priority: 80,
  label: 'Billing administrator',
  description: 'Customer accounts, bids, approvals, and billing readiness',
  defaultView: 'home',
  navigation: [
    homeNavigation,
    { view: 'manager', label: 'Billing', icon: 'manage' },
    { view: 'customer', label: 'Accounts', icon: 'customer' },
  ],
  surfaces: { fieldOperations: false, customerCare: true, management: true },
  home: homeDefinition(
    'Keep completed work revenue-ready.',
    'Move verified work from the field to revenue with confidence.',
    {
      eyebrow: 'Revenue readiness', completed: 'jobs complete', total: 'to review',
      itemSingular: 'job', itemPlural: 'jobs',
    },
  ),
  rollout: [
    { unit: 'b1', capability: 'billing_readiness' },
    { unit: 'b2', capability: 'account_review' },
    { unit: 'b3', capability: 'completion_readiness' },
  ],
  viewRequirements: {
    customer: 'billing_readiness', manager: 'account_review',
  },
  managerTools: {
    'customer-accounts': 'billing_readiness',
    'customer-portal': 'billing_readiness',
    'completion-reports': 'account_review',
  },
} satisfies WorkspacePersonaManifest;
