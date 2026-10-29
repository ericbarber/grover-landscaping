import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  WorkspaceCapability,
  WorkspacePersonaId,
} from '../../core/types';
import {
  managerWorkspaceSectionsForPersona,
  managerWorkspaceToolsForPersona,
  type ManagerWorkspaceSection,
  type ManagerWorkspaceTool,
} from './managerWorkspace';

export interface ManagerWorkspaceNavigationState {
  section: ManagerWorkspaceSection | null;
  tool: ManagerWorkspaceTool | null;
}

export const initialManagerWorkspaceNavigationState: ManagerWorkspaceNavigationState = {
  section: null,
  tool: null,
};

interface ManagerWorkspaceNavigationAccess {
  personaId: WorkspacePersonaId;
  rolloutUnit?: string | null;
  capabilities: ReadonlySet<WorkspaceCapability>;
}

export function resolveManagerWorkspaceNavigation(
  state: ManagerWorkspaceNavigationState,
  access: ManagerWorkspaceNavigationAccess,
): ManagerWorkspaceNavigationState {
  if (!state.section) return initialManagerWorkspaceNavigationState;

  const sectionIsAvailable = managerWorkspaceSectionsForPersona(
    access.personaId,
    access.rolloutUnit,
    access.capabilities,
  ).some(({ id }) => id === state.section);
  if (!sectionIsAvailable) return initialManagerWorkspaceNavigationState;

  if (!state.tool) return state;
  const toolIsAvailable = managerWorkspaceToolsForPersona(
    access.personaId,
    state.section,
    access.rolloutUnit,
    access.capabilities,
  ).some(({ id }) => id === state.tool);

  return toolIsAvailable ? state : { section: state.section, tool: null };
}

export function managerWorkspaceSectionSelection(
  section: ManagerWorkspaceSection,
  access: ManagerWorkspaceNavigationAccess,
): ManagerWorkspaceNavigationState {
  const defaultTool = section === 'team' && access.personaId === 'company-owner'
    && managerWorkspaceToolsForPersona(
      access.personaId,
      section,
      access.rolloutUnit,
      access.capabilities,
    ).some(({ id }) => id === 'team-overview')
    ? 'team-overview'
    : null;

  return resolveManagerWorkspaceNavigation(
    { section, tool: defaultTool },
    access,
  );
}

export function useManagerWorkspaceNavigation(
  access: ManagerWorkspaceNavigationAccess,
) {
  const [requested, setRequested] = useState(initialManagerWorkspaceNavigationState);
  const resolved = useMemo(
    () => resolveManagerWorkspaceNavigation(requested, access),
    [access.capabilities, access.personaId, access.rolloutUnit, requested],
  );

  useEffect(() => {
    if (requested.section === resolved.section && requested.tool === resolved.tool) return;
    setRequested(resolved);
  }, [requested.section, requested.tool, resolved]);

  const openRoot = useCallback(() => {
    setRequested(initialManagerWorkspaceNavigationState);
  }, []);

  const openSection = useCallback((section: ManagerWorkspaceSection) => {
    setRequested(managerWorkspaceSectionSelection(section, access));
  }, [access.capabilities, access.personaId, access.rolloutUnit]);

  const openTool = useCallback((
    section: ManagerWorkspaceSection,
    tool: ManagerWorkspaceTool,
  ) => {
    setRequested(resolveManagerWorkspaceNavigation({ section, tool }, access));
  }, [access.capabilities, access.personaId, access.rolloutUnit]);

  const selectTool = useCallback((tool: ManagerWorkspaceTool | null) => {
    setRequested((current) => resolveManagerWorkspaceNavigation(
      { section: current.section, tool },
      access,
    ));
  }, [access.capabilities, access.personaId, access.rolloutUnit]);

  return {
    ...resolved,
    openRoot,
    openSection,
    openTool,
    selectTool,
  };
}
