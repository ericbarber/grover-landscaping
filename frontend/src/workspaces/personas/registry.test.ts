import { describe, expect, it } from 'vitest';
import type { WorkspacePersonaManifest } from '../core/types';
import { workspacePersonaManifests } from './registry';

describe('workspace persona manifests', () => {
  it('keeps every registry key aligned with its manifest identity', () => {
    for (const [personaId, manifest] of Object.entries(workspacePersonaManifests)) {
      expect(manifest.id).toBe(personaId);
      expect(new Set(manifest.rollout.map(({ unit }) => unit)).size)
        .toBe(manifest.rollout.length);
      expect(new Set(manifest.rollout.map(({ capability }) => capability)).size)
        .toBe(manifest.rollout.length);
    }
  });

  it('requires every view and manager tool to reference a declared capability', () => {
    for (const manifest of Object.values(workspacePersonaManifests) as WorkspacePersonaManifest[]) {
      const declared = new Set(manifest.rollout.map(({ capability }) => capability));
      for (const requirement of Object.values(manifest.viewRequirements ?? {})) {
        expect(declared.has(requirement)).toBe(true);
      }
      for (const requirement of Object.values(manifest.managerTools ?? {})) {
        expect(declared.has(requirement)).toBe(true);
      }
    }
  });

  it('keeps unsupported roles visibly proposed rather than authoritative', () => {
    const proposed = Object.values(workspacePersonaManifests)
      .filter(({ status }) => status === 'proposed')
      .map(({ id }) => id);

    expect(proposed).toEqual(['dispatcher', 'billing-admin']);
    expect(workspacePersonaManifests.general.status).toBe('system');
  });
});
