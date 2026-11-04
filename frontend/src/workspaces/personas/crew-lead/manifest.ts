import type { WorkspacePersonaManifest } from '../../core/types';
import { fieldNavigation, fieldProgress, homeDefinition } from '../shared';

export const crewLeadManifest = {
  id: 'crew-lead',
  status: 'authoritative',
  eligibleRoles: ['CrewLead'],
  priority: 40,
  label: 'Crew lead',
  description: 'Crew route, stop progress, field work, and exceptions',
  defaultView: 'home',
  navigation: fieldNavigation,
  surfaces: { fieldOperations: true, customerCare: false, management: false },
  home: homeDefinition(
    'A clear plan for the work ahead.',
    'The right details at every stop, from arrival to finished work.',
    fieldProgress,
  ),
  rollout: [
    { unit: 'c1', capability: 'day_plan_visibility' },
    { unit: 'c2', capability: 'stop_execution' },
    { unit: 'c3', capability: 'field_proof' },
    { unit: 'c4', capability: 'changes_and_recovery' },
  ],
  viewRequirements: {
    route: 'day_plan_visibility', jobs: 'stop_execution', job: 'stop_execution',
  },
} satisfies WorkspacePersonaManifest;
