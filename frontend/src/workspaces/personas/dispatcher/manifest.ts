import type { WorkspacePersonaManifest } from '../../core/types';
import { homeDefinition, managerNavigation } from '../shared';

export const dispatcherManifest = {
  id: 'dispatcher',
  status: 'proposed',
  eligibleRoles: ['Dispatcher'],
  priority: 70,
  label: 'Dispatcher',
  description: 'Route risk, crew workload, assignments, and schedule changes',
  defaultView: 'home',
  navigation: managerNavigation,
  surfaces: { fieldOperations: true, customerCare: false, management: true },
  home: homeDefinition(
    'Keep crews and schedules aligned.',
    'Give every crew a clear route and every customer a reliable day.',
  ),
  rollout: [
    { unit: 'd1', capability: 'dispatch_readiness' },
    { unit: 'd2', capability: 'dispatch_planning' },
    { unit: 'd3', capability: 'dispatch_oversight' },
    { unit: 'd4', capability: 'dispatch_recovery' },
  ],
  viewRequirements: {
    manager: 'dispatch_readiness',
    route: 'dispatch_oversight',
    jobs: 'dispatch_oversight',
    job: 'dispatch_oversight',
  },
  managerTools: {
    'day-plan': 'dispatch_readiness',
    'dispatch-workload': 'dispatch_readiness',
  },
} satisfies WorkspacePersonaManifest;
