import assert from 'node:assert/strict';
import test from 'node:test';
import { validateSessionCheckpoint } from './validate-session-checkpoint.mjs';

function verifiedManifest(checkpoint = 'field_route') {
  const snapshotOrder = [
    'open_customer_decision',
    'accepted_not_scheduled',
    'confirmed_visit',
    'field_route',
    'exception_handoff',
    'proof_review',
    'delivered_outcome',
  ];
  const snapshots = snapshotOrder.slice(0, snapshotOrder.indexOf(checkpoint) + 1);
  return {
    schemaVersion: 2,
    manifestKind: 'local_fixture',
    fixtureRevision: 'yardfolio-study-matched-v1',
    targetDatabaseName: 'yardfolio_study',
    apiMode: 'local_review',
    sourceCommit: '1234567890abcdef1234567890abcdef12345678',
    migrationCount: 127,
    asOfDate: '2026-10-09',
    createdAt: '2026-10-09T12:00:00.000Z',
    phase: 'verified',
    records: [
      {
        key: 'canyon',
        syntheticLabel: 'Canyon View',
        requestNamespace: 'yardfolio_study_canyon_',
        ownerReviewerId: 'property-owner-canyon',
        ownerUserId: 'local-review-property-owner-canyon',
        managerReviewerId: 'property-manager',
        crewReviewerId: 'crew-lead',
        managerDelegationStatus: checkpoint === 'open_customer_decision' ? 'not_created' : 'accepted',
        generatedRecordIds: {
          owner_workspaces: ['local-review-property-owner-canyon'],
          owner_properties: ['owner_property_canyon123'],
        },
        snapshots: [...snapshots],
      },
      {
        key: 'sage',
        syntheticLabel: 'Sage Lane',
        requestNamespace: 'yardfolio_study_sage_',
        ownerReviewerId: 'property-owner-sage',
        ownerUserId: 'local-review-property-owner-sage',
        managerReviewerId: 'property-manager',
        crewReviewerId: 'crew-lead',
        managerDelegationStatus: checkpoint === 'open_customer_decision' ? 'not_created' : 'accepted',
        generatedRecordIds: {
          owner_workspaces: ['local-review-property-owner-sage'],
          owner_properties: ['owner_property_sage123'],
        },
        snapshots: [...snapshots],
      },
    ],
    resetVerification: { attemptedAt: null, remainingManifestRecords: null },
  };
}

test('returns a privacy-minimized receipt for an exact matched checkpoint', () => {
  assert.deepEqual(validateSessionCheckpoint(verifiedManifest(), 'field_route'), {
    checkpoint: 'field_route',
    fixtureRevision: 'yardfolio-study-matched-v1',
    sourceCommit: '1234567890abcdef1234567890abcdef12345678',
    asOfDate: '2026-10-09',
    recordLabels: ['Canyon View', 'Sage Lane'],
  });
});

test('rejects an unsupported, earlier, or incomplete checkpoint claim', () => {
  assert.throws(
    () => validateSessionCheckpoint(verifiedManifest(), 'rewound_proposal'),
    /checkpoint is unsupported/,
  );
  assert.throws(
    () => validateSessionCheckpoint(verifiedManifest(), 'confirmed_visit'),
    /Canyon View is not at the requested checkpoint/,
  );
  const incomplete = verifiedManifest();
  incomplete.phase = 'seeded';
  incomplete.records[1].snapshots.pop();
  assert.throws(
    () => validateSessionCheckpoint(incomplete, 'field_route'),
    /manifest phase must be verified/,
  );
});
