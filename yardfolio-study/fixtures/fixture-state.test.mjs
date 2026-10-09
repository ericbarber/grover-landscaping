import assert from 'node:assert/strict';
import { mkdtemp, open, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { buildPreparedManifest } from './prepare-manifest.mjs';
import {
  recordGeneratedId,
  recordManagerDelegationStatus,
  recordResetVerification,
  recordVerifiedSnapshot,
  updateFixtureManifest,
  withFixtureOperationLock,
} from './fixture-state.mjs';

const preparedManifest = () => buildPreparedManifest({
  target: {
    apiMode: 'local_review',
    persistence: 'postgres',
    databaseName: 'yardfolio_study',
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

function seedBothRecords(manifest = preparedManifest()) {
  const canyonWorkspace = recordGeneratedId(manifest, {
    recordKey: 'canyon',
    table: 'owner_workspaces',
    id: 'local-review-property-owner-canyon',
  });
  const canyon = recordGeneratedId(canyonWorkspace, {
    recordKey: 'canyon',
    table: 'owner_properties',
    id: 'owner_property_canyon123',
  });
  const sageWorkspace = recordGeneratedId(canyon, {
    recordKey: 'sage',
    table: 'owner_workspaces',
    id: 'local-review-property-owner-sage',
  });
  return recordGeneratedId(sageWorkspace, {
    recordKey: 'sage',
    table: 'owner_properties',
    id: 'owner_property_sage123',
  });
}

test('journals generated IDs idempotently and rejects invalid ownership metadata', () => {
  const seeded = seedBothRecords();
  const repeated = recordGeneratedId(seeded, {
    recordKey: 'canyon',
    table: 'owner_properties',
    id: 'owner_property_canyon123',
  });
  assert.equal(repeated.phase, 'seeded');
  assert.deepEqual(
    repeated.records[0].generatedRecordIds.owner_properties,
    ['owner_property_canyon123'],
  );
  assert.throws(
    () => recordGeneratedId(preparedManifest(), {
      recordKey: 'canyon',
      table: 'owner_properties',
      id: 'property_wrong_prefix',
    }),
    /does not match the API prefix/,
  );
  const workspace = recordGeneratedId(preparedManifest(), {
    recordKey: 'canyon',
    table: 'owner_workspaces',
    id: 'local-review-property-owner-canyon',
  });
  assert.equal(workspace.phase, 'seeded');
  assert.throws(
    () => recordGeneratedId(preparedManifest(), {
      recordKey: 'canyon',
      table: 'owner_workspaces',
      id: 'local-review-property-owner-sage',
    }),
    /workspace ownership/,
  );
});

test('promotes to verified only after both records have validated snapshots', () => {
  const seeded = seedBothRecords();
  const canyonVerified = recordVerifiedSnapshot(seeded, {
    recordKey: 'canyon',
    snapshot: 'open_customer_decision',
  });
  assert.equal(canyonVerified.phase, 'seeded');
  const verified = recordVerifiedSnapshot(canyonVerified, {
    recordKey: 'sage',
    snapshot: 'open_customer_decision',
  });
  assert.equal(verified.phase, 'verified');
  assert.throws(
    () => recordVerifiedSnapshot(preparedManifest(), {
      recordKey: 'canyon',
      snapshot: 'open_customer_decision',
    }),
    /only after generated records/,
  );
});

test('tracks delegation state and accepts only a complete reset receipt', () => {
  const seeded = recordGeneratedId(seedBothRecords(), {
    recordKey: 'canyon',
    table: 'customer_property_manager_invitations',
    id: 'customer_pm_invitation_canyon123',
  });
  const pending = recordManagerDelegationStatus(seeded, {
    recordKey: 'canyon',
    status: 'pending',
  });
  const delegated = recordManagerDelegationStatus(pending, {
    recordKey: 'canyon',
    status: 'accepted',
  });
  assert.equal(delegated.records[0].managerDelegationStatus, 'accepted');
  assert.throws(
    () => recordManagerDelegationStatus(delegated, {
      recordKey: 'canyon',
      status: 'pending',
    }),
    /cannot move from accepted to pending/,
  );
  assert.throws(
    () => recordResetVerification(delegated, {
      attemptedAt: '2026-10-03T13:00:00.000Z',
      remainingManifestRecords: 1,
    }),
    /zero remainingManifestRecords/,
  );
  const reset = recordResetVerification(delegated, {
    attemptedAt: '2026-10-03T13:00:00.000Z',
    remainingManifestRecords: 0,
  });
  assert.equal(reset.phase, 'reset');
  assert.equal(recordResetVerification(reset, {
    attemptedAt: '2026-10-03T14:00:00.000Z',
    remainingManifestRecords: 0,
  }).resetVerification.attemptedAt, '2026-10-03T13:00:00.000Z');
  assert.throws(
    () => recordResetVerification(reset, {
      attemptedAt: '2026-10-03T14:00:00.000Z',
      remainingManifestRecords: 1,
    }),
    /zero remainingManifestRecords/,
  );
});

test('updates the private manifest atomically and refuses a concurrent writer', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'yardfolio-fixture-state-'));
  const manifestPath = join(directory, 'fixture-manifest.json');
  try {
    await writeFile(manifestPath, `${JSON.stringify(preparedManifest(), null, 2)}\n`, { mode: 0o600 });
    await updateFixtureManifest(
      manifestPath,
      (manifest) => recordGeneratedId(manifest, {
        recordKey: 'canyon',
        table: 'owner_workspaces',
        id: 'local-review-property-owner-canyon',
      }),
    );
    const updated = await updateFixtureManifest(
      manifestPath,
      (manifest) => recordGeneratedId(manifest, {
        recordKey: 'canyon',
        table: 'owner_properties',
        id: 'owner_property_canyon123',
      }),
    );
    assert.equal(updated.phase, 'seeded');
    assert.equal(JSON.parse(await readFile(manifestPath, 'utf8')).phase, 'seeded');
    assert.equal((await stat(manifestPath)).mode & 0o777, 0o600);
    await assert.rejects(stat(`${manifestPath}.lock`), { code: 'ENOENT' });

    const lock = await open(`${manifestPath}.lock`, 'wx', 0o600);
    try {
      await assert.rejects(
        updateFixtureManifest(manifestPath, (manifest) => manifest),
        /another fixture operation owns/,
      );
    } finally {
      await lock.close();
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('holds an operation lock across a complete seed or reset workflow', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'yardfolio-fixture-operation-'));
  const manifestPath = join(directory, 'fixture-manifest.json');
  try {
    await writeFile(manifestPath, '{}\n', { mode: 0o600 });
    let nestedAttempt;
    const result = await withFixtureOperationLock(manifestPath, 'seed', async () => {
      nestedAttempt = withFixtureOperationLock(manifestPath, 'seed', async () => 'nested');
      await assert.rejects(nestedAttempt, /another seed operation owns/);
      assert.equal((await stat(`${manifestPath}.seed.lock`)).mode & 0o777, 0o600);
      return 'complete';
    });
    assert.equal(result, 'complete');
    await assert.rejects(stat(`${manifestPath}.seed.lock`), { code: 'ENOENT' });
    await assert.rejects(
      withFixtureOperationLock(manifestPath, '../unsafe', async () => undefined),
      /lock name is invalid/,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
