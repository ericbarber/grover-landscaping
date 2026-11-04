import type { WorkspacePersonaManifest } from '../../core/types';
import { homeDefinition, homeNavigation } from '../shared';

export const generalManifest = {
  id: 'general',
  status: 'system',
  eligibleRoles: [],
  priority: 100,
  label: 'Team member',
  description: 'No active organization role is assigned to this account',
  defaultView: 'home',
  navigation: [homeNavigation],
  surfaces: { fieldOperations: false, customerCare: false, management: false },
  home: homeDefinition(
    'Everything you need for today.',
    'Bring every property, person, and promise into one clear view.',
  ),
  rollout: [{ unit: 'g1', capability: 'access_resolution' }],
} satisfies WorkspacePersonaManifest;
