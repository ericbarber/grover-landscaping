import { billingAdminManifest } from './billing-admin/manifest';
import { companyManagerManifest } from './company-manager/manifest';
import { companyOwnerManifest } from './company-owner/manifest';
import { crewLeadManifest } from './crew-lead/manifest';
import { crewMemberManifest } from './crew-member/manifest';
import { dispatcherManifest } from './dispatcher/manifest';
import { generalManifest } from './general/manifest';
import { propertyManagerManifest } from './property-manager/manifest';
import { supportManifest } from './support/manifest';
import type { WorkspacePersonaId, WorkspacePersonaManifest } from '../core/types';
import { yardOwnerManifest } from './yard-owner/manifest';

export const workspacePersonaManifests = {
  'yard-owner': yardOwnerManifest,
  'property-manager': propertyManagerManifest,
  'crew-lead': crewLeadManifest,
  'crew-member': crewMemberManifest,
  'company-owner': companyOwnerManifest,
  'company-manager': companyManagerManifest,
  dispatcher: dispatcherManifest,
  'billing-admin': billingAdminManifest,
  support: supportManifest,
  general: generalManifest,
} satisfies Record<WorkspacePersonaId, WorkspacePersonaManifest>;

export function workspacePersonaManifest(
  personaId: WorkspacePersonaId,
): WorkspacePersonaManifest {
  return workspacePersonaManifests[personaId];
}

export const orderedWorkspacePersonaManifests = Object.values(workspacePersonaManifests)
  .sort((left, right) => left.priority - right.priority);
