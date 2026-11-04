import type { WorkspacePersonaManifest } from '../../core/types';
import { homeDefinition, homeNavigation } from '../shared';

export const supportManifest = {
  id: 'support',
  status: 'authoritative',
  eligibleRoles: ['SupportAdmin'],
  priority: 90,
  label: 'Support administrator',
  description: 'Tenant support, access review, recovery, and diagnostics',
  defaultView: 'home',
  navigation: [homeNavigation, { view: 'manager', label: 'Support', icon: 'manage' }],
  surfaces: { fieldOperations: false, customerCare: false, management: true },
  home: homeDefinition(
    'Resolve what needs attention.',
    'Find the full story quickly and keep every relationship strong.',
  ),
  rollout: [
    { unit: 's1', capability: 'support_triage' },
    { unit: 's2', capability: 'access_and_delivery_support' },
    { unit: 's3', capability: 'evidence_and_exception_recovery' },
    { unit: 's4', capability: 'privacy_and_erasure_recovery' },
  ],
  viewRequirements: { manager: 'support_triage' },
  managerTools: {
    'operations-activity': 'support_triage',
    'team-members': 'access_and_delivery_support',
    'team-invitations': 'access_and_delivery_support',
    'team-activity': 'access_and_delivery_support',
    notifications: 'access_and_delivery_support',
    'completion-reports': 'evidence_and_exception_recovery',
    'marketing-leads': 'evidence_and_exception_recovery',
    'conversion-dashboard': 'evidence_and_exception_recovery',
    'photo-processing': 'evidence_and_exception_recovery',
    'operational-exceptions': 'evidence_and_exception_recovery',
    'customer-privacy': 'privacy_and_erasure_recovery',
    'photo-erasure': 'privacy_and_erasure_recovery',
  },
} satisfies WorkspacePersonaManifest;
