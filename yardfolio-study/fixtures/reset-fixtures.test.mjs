import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { recordGeneratedId, recordVerifiedSnapshot } from './fixture-state.mjs';
import { buildPreparedManifest } from './prepare-manifest.mjs';
import {
  buildFixtureResetSql,
  parseResetOutput,
  resetFixtureManifest,
  resetWithPsql,
} from './reset-fixtures.mjs';
import { buildFixtureResetPlan } from './reset-plan.mjs';

function seededManifest() {
  let manifest = buildPreparedManifest({
    target: {
      apiMode: 'local_review',
      persistence: 'postgres',
      databaseName: 'yardfolio_study',
      migrationCount: 126,
    },
    authConfig: {
      mode: 'local_review',
      local_reviewers: [
        { reviewer_id: 'property-owner-canyon', user_id: 'local-review-property-owner-canyon', roles: ['PropertyOwner'] },
        { reviewer_id: 'property-owner-sage', user_id: 'local-review-property-owner-sage', roles: ['PropertyOwner'] },
      ],
    },
    sourceCommit: '0123456789abcdef0123456789abcdef01234567',
    asOfDate: '2026-09-16',
    createdAt: '2026-10-03T12:00:00.000Z',
  });
  for (const key of ['canyon', 'sage']) {
    for (const [table, id] of [
      ['owner_workspaces', `local-review-property-owner-${key}`],
      ['owner_properties', `owner_property_${key}123`],
      ['owner_yard_briefs', `owner_brief_${key}123`],
      ['owner_provider_invitations', `owner_provider_invitation_${key}123`],
      ['owner_provider_relationship_activations', `owner_provider_activation_${key}123`],
      ['owner_provider_service_releases', `owner_provider_service_release_${key}123`],
      ['service_jobs', `job_${key}123`],
      ['day_plans', `day_plan_${key}123`],
      ['day_plan_stops', `stop_${key}123`],
    ]) {
      manifest = recordGeneratedId(manifest, { recordKey: key, table, id });
    }
    manifest = recordVerifiedSnapshot(manifest, { recordKey: key, snapshot: 'field_route' });
  }
  return manifest;
}

test('builds one fail-closed transaction rooted only in exact manifest IDs', () => {
  const sql = buildFixtureResetSql(buildFixtureResetPlan(seededManifest()));
  assert.match(sql, /^BEGIN;/);
  assert.match(sql, /COMMIT;\n$/);
  assert.match(sql, /local-review-property-owner-canyon/);
  assert.match(sql, /local-review-property-owner-sage/);
  assert.match(sql, /CREATE TEMP TABLE fixture_activations/);
  assert.match(sql, /fixture reset verification failed/);
  assert.match(sql, /remaining_manifest_records=0/);
  assert.doesNotMatch(sql, /yardfolio_study_canyon_%|yardfolio_study_sage_%/);
  assert.equal((sql.match(/\bBEGIN;/g) ?? []).length, 1);
  assert.equal((sql.match(/\bCOMMIT;/g) ?? []).length, 1);
});

test('parses only an exact zero-remaining receipt', () => {
  assert.deepEqual(parseResetOutput('remaining_manifest_records=0\n'), {
    remainingManifestRecords: 0,
  });
  assert.throws(() => parseResetOutput('remaining_manifest_records=1\n'), /left manifest-owned records/);
  assert.throws(() => parseResetOutput('COMMIT\n'), /did not return/);
});

test('withholds psql errors and requires the isolated database name', () => {
  const options = {
    environment: { PGDATABASE: 'yardfolio_study' },
    spawn: () => ({ status: 1, stdout: '', stderr: 'postgres://secret' }),
  };
  assert.throws(
    () => resetWithPsql('BEGIN; ROLLBACK;', options),
    (error) => {
      assert.match(error.message, /transactional PostgreSQL reset failed/);
      assert.doesNotMatch(error.message, /secret|postgres:\/\//);
      return true;
    },
  );
  assert.throws(
    () => resetWithPsql('BEGIN; ROLLBACK;', { ...options, environment: { PGDATABASE: 'yardfolio' } }),
    /PGDATABASE must be exactly yardfolio_study/,
  );
});

test('records reset only after target binding and transactional zero verification succeed', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'yardfolio-reset-fixtures-'));
  const manifestPath = join(directory, 'fixture-manifest.json');
  let capturedSql = '';
  try {
    await writeFile(manifestPath, `${JSON.stringify(seededManifest(), null, 2)}\n`, { mode: 0o600 });
    const reset = await resetFixtureManifest({
      manifestPath,
      apiUrl: 'http://127.0.0.1:8081',
      validateTarget: async () => ({ databaseName: 'yardfolio_study', migrationCount: 126 }),
      executeReset: async (sql) => {
        capturedSql = sql;
        return { remainingManifestRecords: 0 };
      },
      now: () => new Date('2026-10-04T12:00:00.000Z'),
    });
    assert.equal(reset.phase, 'reset');
    assert.deepEqual(reset.resetVerification, {
      attemptedAt: '2026-10-04T12:00:00.000Z',
      remainingManifestRecords: 0,
    });
    assert.match(capturedSql, /DELETE FROM owner_workspaces/);
    assert.equal(JSON.parse(await readFile(manifestPath, 'utf8')).phase, 'reset');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('does not advance the manifest when reset verification fails', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'yardfolio-reset-failure-'));
  const manifestPath = join(directory, 'fixture-manifest.json');
  try {
    await writeFile(manifestPath, `${JSON.stringify(seededManifest(), null, 2)}\n`, { mode: 0o600 });
    await assert.rejects(
      resetFixtureManifest({
        manifestPath,
        apiUrl: 'http://127.0.0.1:8081',
        validateTarget: async () => ({ databaseName: 'yardfolio_study', migrationCount: 126 }),
        executeReset: async () => ({ remainingManifestRecords: 1 }),
      }),
      /did not prove zero remaining records/,
    );
    assert.equal(JSON.parse(await readFile(manifestPath, 'utf8')).phase, 'verified');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
