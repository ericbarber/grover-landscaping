import assert from 'node:assert/strict';
import test from 'node:test';
import { recordGeneratedId } from './fixture-state.mjs';
import { buildPreparedManifest } from './prepare-manifest.mjs';
import { buildFixtureResetPlan } from './reset-plan.mjs';

function preparedManifest() {
  return buildPreparedManifest({
    target: {
      apiMode: 'local_review',
      persistence: 'postgres',
      databaseName: 'grover_modern_study',
      migrationCount: 126,
    },
    authConfig: {
      mode: 'local_review',
      local_reviewers: [
        {
          reviewer_id: 'property-owner-canyon',
          user_id: 'local-review-property-owner-canyon',
          roles: ['PropertyOwner'],
        },
        {
          reviewer_id: 'property-owner-sage',
          user_id: 'local-review-property-owner-sage',
          roles: ['PropertyOwner'],
        },
      ],
    },
    sourceCommit: '0123456789abcdef0123456789abcdef01234567',
    asOfDate: '2026-09-16',
    createdAt: '2026-10-04T12:00:00.000Z',
  });
}

function journal(manifest, recordKey, table, id) {
  return recordGeneratedId(manifest, { recordKey, table, id });
}

function foundationManifest() {
  let manifest = preparedManifest();
  for (const [recordKey, suffix] of [['canyon', 'canyon123'], ['sage', 'sage123']]) {
    manifest = journal(
      manifest,
      recordKey,
      'owner_workspaces',
      `local-review-property-owner-${recordKey}`,
    );
    manifest = journal(manifest, recordKey, 'owner_properties', `owner_property_${suffix}`);
    manifest = journal(manifest, recordKey, 'owner_yard_briefs', `owner_brief_${suffix}`);
    manifest = journal(
      manifest,
      recordKey,
      'owner_provider_invitations',
      `owner_provider_invitation_${suffix}`,
    );
  }
  return manifest;
}

test('orders exact foundation IDs child before parent for both records', () => {
  const plan = buildFixtureResetPlan(foundationManifest());
  assert.equal(plan.executable, false);
  assert.equal(plan.requiresDerivedDependencyCleanup, true);
  assert.deepEqual(
    plan.operations.map(({ recordKey, table, keyColumn }) => ({ recordKey, table, keyColumn })),
    [
      { recordKey: 'canyon', table: 'owner_provider_invitations', keyColumn: 'id' },
      { recordKey: 'sage', table: 'owner_provider_invitations', keyColumn: 'id' },
      { recordKey: 'canyon', table: 'owner_yard_briefs', keyColumn: 'id' },
      { recordKey: 'sage', table: 'owner_yard_briefs', keyColumn: 'id' },
      { recordKey: 'canyon', table: 'owner_properties', keyColumn: 'id' },
      { recordKey: 'sage', table: 'owner_properties', keyColumn: 'id' },
      { recordKey: 'canyon', table: 'owner_workspaces', keyColumn: 'owner_user_id' },
      { recordKey: 'sage', table: 'owner_workspaces', keyColumn: 'owner_user_id' },
    ],
  );
  assert.deepEqual(plan.verification, plan.operations);
  assert.equal(plan.operations.every((operation) => !('where' in operation)), true);
});

test('supports the earliest workspace-only partial run without broad selectors', () => {
  const manifest = journal(
    preparedManifest(),
    'canyon',
    'owner_workspaces',
    'local-review-property-owner-canyon',
  );
  assert.deepEqual(buildFixtureResetPlan(manifest).operations, [{
    recordKey: 'canyon',
    table: 'owner_workspaces',
    keyColumn: 'owner_user_id',
    id: 'local-review-property-owner-canyon',
  }]);
});

test('refuses prepared and already-reset manifests', () => {
  assert.throws(
    () => buildFixtureResetPlan(preparedManifest()),
    /only seeded or verified/,
  );
  const reset = foundationManifest();
  reset.phase = 'reset';
  reset.resetVerification = {
    attemptedAt: '2026-10-04T13:00:00.000Z',
    remainingManifestRecords: 0,
  };
  assert.throws(() => buildFixtureResetPlan(reset), /only seeded or verified/);
});
