import { useCallback, useEffect, useMemo, useState } from 'react';
import type { WorkspaceRolloutProjection } from '../../api/client';
import { resolveWorkspace, workspacePersonasForRoles } from './resolveWorkspace';
import type {
  ResolvedWorkspace,
  WorkspacePersona,
  WorkspacePersonaId,
} from './types';

export function selectAvailableWorkspacePersona(
  availablePersonas: WorkspacePersona[],
  requestedPersonaId: WorkspacePersonaId,
): WorkspacePersona {
  return availablePersonas.find(({ id }) => id === requestedPersonaId)
    ?? availablePersonas[0];
}

export interface WorkspaceSelection {
  activeWorkspace: ResolvedWorkspace;
  availablePersonas: WorkspacePersona[];
  selectPersona: (personaId: WorkspacePersonaId) => WorkspacePersona | null;
}

export function useWorkspaceSelection(
  roles: string[],
  rollout: WorkspaceRolloutProjection | null,
): WorkspaceSelection {
  const availablePersonas = useMemo(
    () => workspacePersonasForRoles(roles),
    [roles],
  );
  const [requestedPersonaId, setRequestedPersonaId] = useState<WorkspacePersonaId>(
    () => availablePersonas[0].id,
  );
  const selectedPersona = selectAvailableWorkspacePersona(
    availablePersonas,
    requestedPersonaId,
  );
  const activeWorkspace = useMemo(
    () => resolveWorkspace(selectedPersona.id, rollout),
    [rollout, selectedPersona.id],
  );

  useEffect(() => {
    if (requestedPersonaId === selectedPersona.id) return;
    setRequestedPersonaId(selectedPersona.id);
  }, [requestedPersonaId, selectedPersona.id]);

  const selectPersona = useCallback((personaId: WorkspacePersonaId) => {
    const persona = availablePersonas.find(({ id }) => id === personaId);
    if (!persona) return null;
    setRequestedPersonaId(persona.id);
    return persona;
  }, [availablePersonas]);

  return { activeWorkspace, availablePersonas, selectPersona };
}
