/**
 * Compatibility facade for the workspace architecture.
 *
 * New workspace composition belongs under `src/workspaces`. Existing callers
 * import through this module while persona-specific branches are migrated.
 */
import {
  resolveWorkspace,
  workspaceEnabledUnitForPersona,
  workspaceFieldControlsForPersona,
  workspacePersonaForRollout,
  workspacePersonasForRoles,
} from '../workspaces/core/resolveWorkspace';
import { workspacePersonaManifest } from '../workspaces/personas/registry';
import type { WorkspacePersonaId, WorkspaceSurfaces } from '../workspaces/core/types';

export {
  resolveWorkspace,
  workspaceEnabledUnitForPersona,
  workspaceFieldControlsForPersona,
  workspacePersonaForRollout,
  workspacePersonasForRoles,
};

export type {
  ResolvedWorkspace,
  WorkspaceCapability,
  WorkspaceFieldControlAvailability,
  WorkspacePersona,
  WorkspacePersonaId,
  WorkspaceSurfaces,
  WorkspaceView,
} from '../workspaces/core/types';

export function workspaceSurfacesForPersona(
  personaId: WorkspacePersonaId,
): WorkspaceSurfaces {
  return workspacePersonaManifest(personaId).surfaces;
}
