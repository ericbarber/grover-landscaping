import type { CustomerPortalVisitSummary } from '../../../domain/customerPortalVisits';
import type { YardCareJob } from '../../../domain/jobs';
import type { WorkspacePersonaId } from '../../core/types';

export type CustomerPortalReadState =
  | 'loading'
  | 'ready'
  | 'access_required'
  | 'inconsistent'
  | 'unavailable';

export type CustomerWorkspaceMode = 'yard' | 'portfolio' | 'unavailable';

export function customerWorkspaceModeForPersona(
  personaId: WorkspacePersonaId,
): CustomerWorkspaceMode {
  if (personaId === 'yard-owner') return 'yard';
  if (personaId === 'property-manager') return 'portfolio';
  return 'unavailable';
}

export function personaUsesAuthorizedCustomerRead(
  personaId: WorkspacePersonaId,
): boolean {
  return personaId === 'yard-owner' || personaId === 'property-manager';
}

export function personaUsesManagerCustomerPreview(
  personaId: WorkspacePersonaId,
  previewCapabilityEnabled: boolean,
): boolean {
  return previewCapabilityEnabled && !personaUsesAuthorizedCustomerRead(personaId);
}

export function customerHomeWorkSummary(
  personaId: WorkspacePersonaId,
  customerVisits: CustomerPortalVisitSummary[],
  jobs: YardCareJob[],
): { assigned: number; completed: number } {
  if (personaUsesAuthorizedCustomerRead(personaId)) {
    return {
      assigned: customerVisits.length,
      completed: customerVisits.filter((visit) => (
        visit.status === 'complete_proof_pending' || visit.deliveredProofAvailable
      )).length,
    };
  }

  return {
    assigned: jobs.length,
    completed: jobs.filter(({ status }) => status === 'completed').length,
  };
}
