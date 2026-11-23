import type { WorkspacePersonaManifest } from '../../core/types';
import { fieldNavigation, fieldProgress, homeDefinition } from '../shared';

export const crewMemberManifest = {
  id: 'crew-member',
  status: 'authoritative',
  eligibleRoles: ['CrewMember'],
  priority: 50,
  label: 'Crew member',
  description: 'Assigned route, job steps, photos, and completion evidence',
  defaultView: 'home',
  navigation: fieldNavigation,
  surfaces: { fieldOperations: true, customerCare: false, management: false },
  home: homeDefinition(
    'A clear plan for the work ahead.',
    'The right details at every stop, from arrival to finished work.',
    fieldProgress,
  ),
  rollout: [
    { unit: 'cm1', capability: 'assigned_work' },
    { unit: 'cm2', capability: 'job_execution' },
    { unit: 'cm3', capability: 'field_evidence' },
    { unit: 'cm4', capability: 'personal_recovery' },
  ],
  viewRequirements: {
    route: 'assigned_work', jobs: 'job_execution', job: 'job_execution',
  },
} satisfies WorkspacePersonaManifest;
