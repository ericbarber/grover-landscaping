import assert from 'node:assert/strict';
import test from 'node:test';
import { buildPreparedManifest } from './prepare-manifest.mjs';
import {
  buildOwnerFoundationPlan,
  resolveOwnerPropertyRecovery,
  resolveOwnerReadyBriefRecovery,
  resolveOwnerWorkspaceRecovery,
} from './owner-foundation-plan.mjs';
import { recordGeneratedId } from './fixture-state.mjs';

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
    createdAt: '2026-10-03T12:00:00.000Z',
  });
}

function propertyResponse(plan, overrides = {}) {
  return {
    property_id: 'owner_property_canyon123',
    owner_user_id: plan.ownerUserId,
    ...plan.requests.createProperty.body,
    status: 'active',
    version: 1,
    persisted: true,
    ...overrides,
  };
}

function workspaceResponse(plan, overrides = {}) {
  return {
    owner_user_id: plan.ownerUserId,
    verified_email: `property.owner.${plan.recordKey}.local@example.test`,
    display_name: `${plan.recordKey === 'canyon' ? 'Canyon' : 'Sage'} Study Owner`,
    status: 'active',
    persisted: true,
    ...overrides,
  };
}

function journalWorkspace(manifest, plan) {
  return recordGeneratedId(manifest, {
    recordKey: plan.recordKey,
    table: 'owner_workspaces',
    id: plan.ownerUserId,
  });
}

function journalProperty(manifest, plan, id = 'owner_property_canyon123') {
  return recordGeneratedId(journalWorkspace(manifest, plan), {
    recordKey: plan.recordKey,
    table: 'owner_properties',
    id,
  });
}

function briefResponse(plan, overrides = {}) {
  return {
    brief_id: 'owner_brief_canyon123',
    owner_user_id: plan.ownerUserId,
    property_id: 'owner_property_canyon123',
    version: 1,
    ...plan.requests.saveReadyBrief.body,
    author_source: 'yard_owner',
    persisted: true,
    ...overrides,
  };
}

test('builds separate supported owner-foundation request plans', () => {
  const plans = buildOwnerFoundationPlan(preparedManifest());
  assert.deepEqual(plans.map((plan) => plan.recordKey), ['canyon', 'sage']);
  assert.notEqual(plans[0].reviewerId, plans[1].reviewerId);
  assert.notEqual(
    plans[0].requests.createProperty.body.address_line_1,
    plans[1].requests.createProperty.body.address_line_1,
  );

  for (const plan of plans) {
    assert.equal(
      plan.requests.createProperty.headers['x-yardfolio-local-reviewer'],
      plan.reviewerId,
    );
    assert.equal(plan.requests.saveWorkspace.journal.table, 'owner_workspaces');
    assert.equal(plan.requests.createProperty.journal.table, 'owner_properties');
    assert.equal(plan.requests.saveReadyBrief.body.status, 'ready');
    assert.equal(
      plan.requests.createProviderInvitation.body.idempotency_key,
      `${plan.requestNamespace}invitation`,
    );
    assert.equal(
      plan.requests.createProviderInvitation.tokenHandling,
      'memory_only_same_process',
    );
  }
});

test('recovers an exact workspace before any non-idempotent property write', () => {
  const manifest = preparedManifest();
  const [plan] = buildOwnerFoundationPlan(manifest);
  assert.deepEqual(
    resolveOwnerWorkspaceRecovery(manifest, 'canyon', null),
    { action: 'save' },
  );
  assert.deepEqual(
    resolveOwnerWorkspaceRecovery(manifest, 'canyon', workspaceResponse(plan)),
    { action: 'recover_unjournaled', workspaceId: plan.ownerUserId },
  );
  const journaled = recordGeneratedId(manifest, {
    recordKey: 'canyon',
    table: 'owner_workspaces',
    id: plan.ownerUserId,
  });
  assert.deepEqual(
    resolveOwnerWorkspaceRecovery(journaled, 'canyon', workspaceResponse(plan)),
    { action: 'reuse_journaled', workspaceId: plan.ownerUserId },
  );
  assert.throws(
    () => resolveOwnerWorkspaceRecovery(journaled, 'canyon', null),
    /journaled workspace is missing/,
  );
  assert.throws(
    () => resolveOwnerWorkspaceRecovery(manifest, 'canyon', workspaceResponse(plan, {
      display_name: 'Unexpected owner',
    })),
    /does not exactly match/,
  );
});

test('recovers an exact unjournaled property after an uncertain create response', () => {
  const manifest = preparedManifest();
  const [plan] = buildOwnerFoundationPlan(manifest);
  const workspaceJournaled = journalWorkspace(manifest, plan);
  assert.deepEqual(resolveOwnerPropertyRecovery(workspaceJournaled, 'canyon', []), { action: 'create' });
  assert.deepEqual(
    resolveOwnerPropertyRecovery(workspaceJournaled, 'canyon', [propertyResponse(plan)]),
    { action: 'recover_unjournaled', propertyId: 'owner_property_canyon123' },
  );
  assert.deepEqual(
    resolveOwnerPropertyRecovery(
      journalProperty(manifest, plan),
      'canyon',
      [propertyResponse(plan)],
    ),
    { action: 'reuse_journaled', propertyId: 'owner_property_canyon123' },
  );
  assert.throws(
    () => resolveOwnerPropertyRecovery(manifest, 'canyon', []),
    /workspace must be journaled/,
  );
});

test('fails closed on scope leaks, collisions, duplicates, and stale journal IDs', () => {
  const manifest = preparedManifest();
  const [plan] = buildOwnerFoundationPlan(manifest);
  const workspaceJournaled = journalWorkspace(manifest, plan);
  assert.throws(
    () => resolveOwnerPropertyRecovery(workspaceJournaled, 'canyon', [propertyResponse(plan, {
      owner_user_id: 'local-review-property-owner-sage',
    })]),
    /crossed its owner scope/,
  );
  assert.throws(
    () => resolveOwnerPropertyRecovery(workspaceJournaled, 'canyon', [propertyResponse(plan, {
      address_line_1: 'Unexpected address',
    })]),
    /collides with a property/,
  );
  assert.throws(
    () => resolveOwnerPropertyRecovery(workspaceJournaled, 'canyon', [
      propertyResponse(plan),
      propertyResponse(plan, { property_id: 'owner_property_canyon456' }),
    ]),
    /multiple matching properties/,
  );
  assert.throws(
    () => resolveOwnerPropertyRecovery(
      journalProperty(manifest, plan, 'owner_property_missing123'),
      'canyon',
      [propertyResponse(plan)],
    ),
    /journaled property is missing/,
  );
  assert.throws(
    () => resolveOwnerPropertyRecovery(workspaceJournaled, 'canyon', [propertyResponse(plan, {
      property_id: 'not-an-owner-property-id',
    })]),
    /invalid API-generated ID/,
  );
});

test('recovers only the exact ready brief linked to the journaled property', () => {
  const manifest = preparedManifest();
  const [plan] = buildOwnerFoundationPlan(manifest);
  const propertyJournaled = journalProperty(manifest, plan);
  assert.deepEqual(
    resolveOwnerReadyBriefRecovery(
      propertyJournaled,
      'canyon',
      'owner_property_canyon123',
      null,
    ),
    { action: 'save' },
  );
  assert.deepEqual(
    resolveOwnerReadyBriefRecovery(
      propertyJournaled,
      'canyon',
      'owner_property_canyon123',
      briefResponse(plan),
    ),
    { action: 'recover_unjournaled', briefId: 'owner_brief_canyon123' },
  );
  const briefJournaled = recordGeneratedId(propertyJournaled, {
    recordKey: 'canyon',
    table: 'owner_yard_briefs',
    id: 'owner_brief_canyon123',
  });
  assert.deepEqual(
    resolveOwnerReadyBriefRecovery(
      briefJournaled,
      'canyon',
      'owner_property_canyon123',
      briefResponse(plan),
    ),
    { action: 'reuse_journaled', briefId: 'owner_brief_canyon123' },
  );
  assert.throws(
    () => resolveOwnerReadyBriefRecovery(
      propertyJournaled,
      'canyon',
      'owner_property_canyon123',
      briefResponse(plan, { considerations: 'Unexpected gate detail.' }),
    ),
    /does not exactly match/,
  );
  assert.throws(
    () => resolveOwnerReadyBriefRecovery(
      briefJournaled,
      'canyon',
      'owner_property_canyon123',
      null,
    ),
    /journaled yard brief is missing/,
  );
});

test('rejects reset manifests and never embeds an invitation token value', () => {
  const manifest = preparedManifest();
  manifest.phase = 'reset';
  manifest.records[0].generatedRecordIds = {
    owner_workspaces: ['local-review-property-owner-canyon'],
    owner_properties: ['owner_property_canyon123'],
  };
  manifest.resetVerification = {
    attemptedAt: '2026-10-03T13:00:00.000Z',
    remainingManifestRecords: 0,
  };
  assert.throws(() => buildOwnerFoundationPlan(manifest), /cannot plan new writes/);

  const serialized = JSON.stringify(buildOwnerFoundationPlan(preparedManifest()));
  assert.match(serialized, /x-grover-local-fixture-invitation-token/);
  assert.doesNotMatch(serialized, /"(?:delivery_)?token":/);
});
