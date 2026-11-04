import type { WorkspacePersonaManifest } from '../../core/types';
import { homeDefinition, managerNavigation } from '../shared';

export const companyManagerManifest = {
  id: 'company-manager',
  status: 'authoritative',
  eligibleRoles: ['Manager'],
  priority: 20,
  label: 'Yard-care company manager',
  description: 'Dispatch, schedules, customers, reports, and daily operations',
  defaultView: 'home',
  navigation: managerNavigation,
  surfaces: { fieldOperations: true, customerCare: false, management: true },
  home: homeDefinition(
    'Run today with confidence.',
    'Turn great field work into a business customers trust.',
  ),
  rollout: [
    { unit: 'm1', capability: 'operating_readiness' },
    { unit: 'm2', capability: 'schedule_and_field_coordination' },
    { unit: 'm3', capability: 'customers_and_team' },
    { unit: 'm4', capability: 'reports_and_operational_recovery' },
  ],
  viewRequirements: {
    manager: 'operating_readiness',
    route: 'schedule_and_field_coordination',
    jobs: 'schedule_and_field_coordination',
    job: 'schedule_and_field_coordination',
  },
  managerTools: {
    'company-readiness': 'operating_readiness',
    'day-plan': 'schedule_and_field_coordination',
    'dispatch-workload': 'schedule_and_field_coordination',
    'property-profile': 'customers_and_team',
    'property-service': 'customers_and_team',
    'customer-accounts': 'customers_and_team',
    'customer-portal': 'customers_and_team',
    'customer-portfolios': 'customers_and_team',
    'team-members': 'customers_and_team',
    'team-activity': 'customers_and_team',
    'operations-activity': 'reports_and_operational_recovery',
    notifications: 'reports_and_operational_recovery',
    'completion-reports': 'reports_and_operational_recovery',
    'visit-questions': 'reports_and_operational_recovery',
    'photo-processing': 'reports_and_operational_recovery',
    'operational-exceptions': 'reports_and_operational_recovery',
  },
} satisfies WorkspacePersonaManifest;
