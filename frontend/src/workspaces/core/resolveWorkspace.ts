import type { WorkspaceRolloutProjection } from '../../api/client';
import {
  orderedWorkspacePersonaManifests,
  workspacePersonaManifest,
} from '../personas/registry';
import type {
  ResolvedWorkspace,
  WorkspaceCapability,
  WorkspaceFieldControlAvailability,
  WorkspacePersona,
  WorkspacePersonaId,
  WorkspacePersonaManifest,
  WorkspaceRoleId,
} from './types';

function personaFromManifest(
  manifest: WorkspacePersonaManifest,
  capabilities?: ReadonlySet<WorkspaceCapability>,
): WorkspacePersona {
  const navigation = capabilities
    ? manifest.navigation.filter(({ view }) => {
      const requirement = manifest.viewRequirements?.[view];
      return !requirement || capabilities.has(requirement);
    })
    : [...manifest.navigation];

  return {
    id: manifest.id,
    label: manifest.label,
    description: manifest.description,
    defaultView: navigation.some(({ view }) => view === manifest.defaultView)
      ? manifest.defaultView
      : 'home',
    navigation: [...navigation],
    home: manifest.home,
  };
}

function isWorkspaceRole(role: string): role is WorkspaceRoleId {
  return orderedWorkspacePersonaManifests.some((manifest) => (
    manifest.eligibleRoles.some((candidate) => candidate === role)
  ));
}

export function workspacePersonasForRoles(roles: string[]): WorkspacePersona[] {
  const eligibleRoles = new Set(roles.filter(isWorkspaceRole));
  const personas = orderedWorkspacePersonaManifests
    .filter((manifest) => manifest.id !== 'general')
    .filter((manifest) => manifest.eligibleRoles.some((role) => eligibleRoles.has(role)))
    .map((manifest) => personaFromManifest(manifest));

  return personas.length > 0
    ? personas
    : [personaFromManifest(workspacePersonaManifest('general'))];
}

export function workspaceEnabledUnitForPersona(
  personaId: WorkspacePersonaId,
  rollout: WorkspaceRolloutProjection,
): string | null {
  const order = workspacePersonaManifest(personaId).rollout.map(({ unit }) => unit);
  return rollout.personas
    .filter((candidate) => (
      candidate.personaId === personaId
      && candidate.enabledUnit
      && order.includes(candidate.enabledUnit)
    ))
    .map((candidate) => candidate.enabledUnit as string)
    .sort((left, right) => order.indexOf(right) - order.indexOf(left))[0] ?? null;
}

export function workspaceCapabilitiesForUnit(
  personaId: WorkspacePersonaId,
  rolloutUnit: string | null | undefined,
): ReadonlySet<WorkspaceCapability> | null {
  if (rolloutUnit === undefined) return null;
  const rollout = workspacePersonaManifest(personaId).rollout;
  const unitIndex = rollout.findIndex(({ unit }) => unit === rolloutUnit);
  if (unitIndex < 0) return new Set();
  return new Set(rollout.slice(0, unitIndex + 1).map(({ capability }) => capability));
}

function projectionForPersona(
  personaId: WorkspacePersonaId,
  rollout: WorkspaceRolloutProjection,
  enabledUnit: string | null,
): WorkspaceRolloutProjection['personas'][number] | null {
  if (!enabledUnit) return null;
  return rollout.personas.find((candidate) => (
    candidate.personaId === personaId && candidate.enabledUnit === enabledUnit
  )) ?? null;
}

function capabilitiesForProjection(
  manifest: WorkspacePersonaManifest,
  projection: WorkspaceRolloutProjection['personas'][number] | null,
  enabledUnit: string | null,
): ReadonlySet<WorkspaceCapability> {
  const supported = new Set<WorkspaceCapability>(
    manifest.rollout.map(({ capability }) => capability),
  );
  const projectedCapabilities = projection?.capabilities ?? {};
  const projected = Object.entries(projectedCapabilities)
    .filter(([, enabled]) => enabled)
    .map(([capability]) => capability as WorkspaceCapability)
    .filter((capability) => supported.has(capability));

  // Version 2 is capability-shaped. The unit fallback retains compatibility
  // with older/local fixtures that provide an empty capability object.
  return Object.keys(projectedCapabilities).length > 0
    ? new Set(projected)
    : workspaceCapabilitiesForUnit(manifest.id, enabledUnit) ?? new Set();
}

export function workspaceFieldControlsForCapabilities(
  personaId: WorkspacePersonaId,
  capabilities: ReadonlySet<WorkspaceCapability> | null,
): WorkspaceFieldControlAvailability {
  if (capabilities === null) {
    return {
      jobDetails: true,
      stopProgress: true,
      routeChanges: true,
      fieldEvidence: true,
      report: true,
    };
  }

  if (personaId === 'crew-lead') {
    return {
      jobDetails: capabilities.has('stop_execution'),
      stopProgress: capabilities.has('stop_execution'),
      routeChanges: capabilities.has('changes_and_recovery'),
      fieldEvidence: capabilities.has('field_proof'),
      report: capabilities.has('field_proof'),
    };
  }
  if (personaId === 'crew-member') {
    return {
      jobDetails: capabilities.has('job_execution'),
      stopProgress: capabilities.has('job_execution'),
      routeChanges: false,
      fieldEvidence: capabilities.has('field_evidence'),
      report: capabilities.has('field_evidence'),
    };
  }

  const jobDetails = capabilities.has('daily_operations')
    || capabilities.has('schedule_and_field_coordination')
    || capabilities.has('dispatch_oversight');
  return {
    jobDetails,
    stopProgress: false,
    routeChanges: false,
    fieldEvidence: false,
    report: capabilities.has('reports_and_recovery')
      || capabilities.has('reports_and_operational_recovery'),
  };
}

export function resolveWorkspace(
  personaId: WorkspacePersonaId,
  rollout: WorkspaceRolloutProjection | null,
): ResolvedWorkspace {
  const manifest = workspacePersonaManifest(personaId);
  const legacy = !rollout || rollout.enforcementMode === 'legacy';
  const rolloutUnit = legacy
    ? undefined
    : workspaceEnabledUnitForPersona(personaId, rollout);
  const projection = legacy || !rollout
    ? null
    : projectionForPersona(personaId, rollout, rolloutUnit ?? null);
  const capabilities = legacy
    ? null
    : capabilitiesForProjection(manifest, projection, rolloutUnit ?? null);

  return {
    manifest,
    persona: personaFromManifest(manifest, capabilities ?? undefined),
    capabilities: capabilities
      ?? new Set(manifest.rollout.map(({ capability }) => capability)),
    rolloutUnit,
    rolloutScope: projection?.scope ?? null,
    surfaces: manifest.surfaces,
    fieldControls: workspaceFieldControlsForCapabilities(personaId, capabilities),
  };
}

export function workspacePersonaForRollout(
  persona: WorkspacePersona,
  rollout: WorkspaceRolloutProjection | null,
): WorkspacePersona {
  return resolveWorkspace(persona.id, rollout).persona;
}

export function workspaceFieldControlsForPersona(
  personaId: WorkspacePersonaId,
  rolloutUnit: string | null | undefined,
): WorkspaceFieldControlAvailability {
  return workspaceFieldControlsForCapabilities(
    personaId,
    workspaceCapabilitiesForUnit(personaId, rolloutUnit),
  );
}
