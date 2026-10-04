import assert from 'node:assert/strict';
import test from 'node:test';
import { buildPreparedManifest } from './prepare-manifest.mjs';
import {
  buildOwnerFoundationPlan,
  resolveOwnerPropertyRecovery,
} from './owner-foundation-plan.mjs';

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
      plan.requests.createProperty.headers['x-grover-local-reviewer'],
      plan.reviewerId,
    );
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

test('recovers an exact unjournaled property after an uncertain create response', () => {
  const manifest = preparedManifest();
  const [plan] = buildOwnerFoundationPlan(manifest);
  assert.deepEqual(resolveOwnerPropertyRecovery(manifest, 'canyon', []), { action: 'create' });
  assert.deepEqual(
    resolveOwnerPropertyRecovery(manifest, 'canyon', [propertyResponse(plan)]),
    { action: 'recover_unjournaled', propertyId: 'owner_property_canyon123' },
  );
  assert.deepEqual(
    resolveOwnerPropertyRecovery(
      manifest,
      'canyon',
      [propertyResponse(plan)],
      ['owner_property_canyon123'],
    ),
    { action: 'reuse_journaled', propertyId: 'owner_property_canyon123' },
  );
});

test('fails closed on scope leaks, collisions, duplicates, and stale journal IDs', () => {
  const manifest = preparedManifest();
  const [plan] = buildOwnerFoundationPlan(manifest);
  assert.throws(
    () => resolveOwnerPropertyRecovery(manifest, 'canyon', [propertyResponse(plan, {
      owner_user_id: 'local-review-property-owner-sage',
    })]),
    /crossed its owner scope/,
  );
  assert.throws(
    () => resolveOwnerPropertyRecovery(manifest, 'canyon', [propertyResponse(plan, {
      address_line_1: 'Unexpected address',
    })]),
    /collides with a property/,
  );
  assert.throws(
    () => resolveOwnerPropertyRecovery(manifest, 'canyon', [
      propertyResponse(plan),
      propertyResponse(plan, { property_id: 'owner_property_canyon456' }),
    ]),
    /multiple matching properties/,
  );
  assert.throws(
    () => resolveOwnerPropertyRecovery(
      manifest,
      'canyon',
      [propertyResponse(plan)],
      ['owner_property_missing123'],
    ),
    /journaled property is missing/,
  );
  assert.throws(
    () => resolveOwnerPropertyRecovery(manifest, 'canyon', [propertyResponse(plan, {
      property_id: 'not-an-owner-property-id',
    })]),
    /invalid API-generated ID/,
  );
});

test('rejects reset manifests and never embeds an invitation token value', () => {
  const manifest = preparedManifest();
  manifest.phase = 'reset';
  manifest.records[0].generatedRecordIds.owner_properties = ['owner_property_canyon123'];
  manifest.resetVerification = {
    attemptedAt: '2026-10-03T13:00:00.000Z',
    remainingManifestRecords: 0,
  };
  assert.throws(() => buildOwnerFoundationPlan(manifest), /cannot plan new writes/);

  const serialized = JSON.stringify(buildOwnerFoundationPlan(preparedManifest()));
  assert.match(serialized, /x-grover-local-fixture-invitation-token/);
  assert.doesNotMatch(serialized, /"(?:delivery_)?token":/);
});
