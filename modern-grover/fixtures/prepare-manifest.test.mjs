import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { buildPreparedManifest, prepareFixtureManifest } from './prepare-manifest.mjs';

const sourceCommit = '0123456789abcdef0123456789abcdef01234567';
const target = {
  apiMode: 'local_review',
  persistence: 'postgres',
  databaseName: 'grover_modern_study',
  migrationCount: 126,
};
const authConfig = {
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
};

test('builds a valid prepared manifest with distinct study owners', () => {
  const manifest = buildPreparedManifest({
    target,
    authConfig,
    sourceCommit,
    asOfDate: '2026-09-16',
    createdAt: '2026-10-03T12:00:00.000Z',
  });
  assert.equal(manifest.phase, 'prepared');
  assert.deepEqual(
    manifest.records.map((record) => record.ownerUserId),
    ['local-review-property-owner-canyon', 'local-review-property-owner-sage'],
  );
});

test('rejects missing, shared, or malformed study identity inputs', () => {
  const input = {
    target,
    authConfig,
    sourceCommit,
    asOfDate: '2026-09-16',
    createdAt: '2026-10-03T12:00:00.000Z',
  };
  assert.throws(
    () => buildPreparedManifest({ ...input, authConfig: { mode: 'local_review', local_reviewers: [] } }),
    /Canyon View/,
  );
  assert.throws(() => buildPreparedManifest({ ...input, sourceCommit: '0'.repeat(40) }), /nonzero/);
  assert.throws(() => buildPreparedManifest({ ...input, asOfDate: '2026-02-30' }), /real calendar/);
});

test('writes once with private permissions and refuses replacement', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'grover-fixture-manifest-'));
  const outputPath = join(directory, 'fixture-manifest.json');
  const fetchImpl = async () => ({ ok: true, json: async () => authConfig });
  const validateTarget = async () => target;
  try {
    const result = await prepareFixtureManifest({
      apiUrl: 'http://127.0.0.1:8081',
      sourceCommit,
      asOfDate: '2026-09-16',
      outputPath,
      fetchImpl,
      validateTarget,
      now: () => new Date('2026-10-03T12:00:00.000Z'),
    });
    assert.equal(result.manifest.phase, 'prepared');
    assert.equal(JSON.parse(await readFile(outputPath, 'utf8')).records.length, 2);
    await assert.rejects(
      prepareFixtureManifest({
        apiUrl: 'http://127.0.0.1:8081',
        sourceCommit,
        asOfDate: '2026-09-16',
        outputPath,
        fetchImpl,
        validateTarget,
      }),
      /refusing to replace existing manifest/,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
