import type { WorkspacePersonaManifest } from '../../core/types';
import { homeDefinition, homeNavigation } from '../shared';

export const propertyManagerManifest = {
  id: 'property-manager',
  status: 'authoritative',
  eligibleRoles: ['PropertyManager'],
  priority: 30,
  label: 'Property manager',
  description: 'Portfolio service, vendor work, reports, and approvals',
  defaultView: 'home',
  navigation: [
    homeNavigation,
    { view: 'customer', label: 'Portfolio', icon: 'customer' },
    { view: 'manager', label: 'Manage', icon: 'manage' },
  ],
  surfaces: { fieldOperations: false, customerCare: true, management: true },
  home: homeDefinition(
    'Keep every property moving.',
    'One clear view from service plans to property-ready proof.',
    {
      eyebrow: 'Portfolio progress', completed: 'services complete', total: 'scheduled',
      itemSingular: 'service', itemPlural: 'services',
    },
  ),
  rollout: [
    { unit: 'p1', capability: 'portfolio_readiness' },
    { unit: 'p2', capability: 'property_coverage_and_proof' },
    { unit: 'p3', capability: 'approvals_and_questions' },
    { unit: 'p4', capability: 'portfolio_administration' },
  ],
  viewRequirements: {
    customer: 'portfolio_readiness',
    manager: 'portfolio_administration',
  },
  managerTools: {
    'customer-portal': 'portfolio_administration',
    'customer-portfolios': 'portfolio_administration',
  },
} satisfies WorkspacePersonaManifest;
