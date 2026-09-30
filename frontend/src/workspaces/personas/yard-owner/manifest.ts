import type { WorkspacePersonaManifest } from '../../core/types';
import { homeDefinition, homeNavigation } from '../shared';

export const yardOwnerManifest = {
  id: 'yard-owner',
  status: 'authoritative',
  eligibleRoles: ['PropertyOwner'],
  priority: 60,
  label: 'Yard owner',
  description: 'Properties, upcoming service, reports, photos, and bids',
  defaultView: 'home',
  navigation: [homeNavigation, { view: 'customer', label: 'My yard', icon: 'customer' }],
  surfaces: { fieldOperations: false, customerCare: true, management: false },
  home: homeDefinition(
    'Your yard, all in one place.',
    'See the care behind every visit—and the difference it makes.',
    {
      eyebrow: 'Service progress', completed: 'visits complete', total: 'scheduled',
      itemSingular: 'visit', itemPlural: 'visits',
    },
  ),
  rollout: [
    { unit: 'u1', capability: 'care_visibility' },
    { unit: 'u2', capability: 'visit_tracking' },
    { unit: 'u3', capability: 'delivered_proof' },
    { unit: 'u4', capability: 'questions_and_decisions' },
  ],
  viewRequirements: { customer: 'visit_tracking' },
} satisfies WorkspacePersonaManifest;
