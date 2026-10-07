import assert from 'node:assert/strict';
import test from 'node:test';
import {
  normalizeStudyApiUrl,
  parseTargetInspection,
  validateStudyTarget,
} from './validate-target.mjs';

function response(status, payload) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() { return payload; },
  };
}

function safeFetch(url) {
  if (url.endsWith('/auth/config')) return response(200, { mode: 'local_review' });
  if (url.endsWith('/health/ready')) {
    return response(200, {
      status: 'ok',
      persistence: 'postgres',
      database_name: 'yardfolio_study',
    });
  }
  return response(404, {});
}

test('accepts only the isolated study origin shape', () => {
  assert.equal(normalizeStudyApiUrl('http://127.0.0.1:8081'), 'http://127.0.0.1:8081');
  assert.equal(normalizeStudyApiUrl('http://100.88.21.105:8081/'), 'http://100.88.21.105:8081');
  assert.throws(() => normalizeStudyApiUrl('http://127.0.0.1:8080'), /port 8081/);
  assert.throws(() => normalizeStudyApiUrl('https://pilot.example.com:8081'), /must use http/);
  assert.throws(() => normalizeStudyApiUrl('http://192.168.1.5:8081'), /loopback or a Tailscale/);
  assert.throws(() => normalizeStudyApiUrl('http://user:secret@127.0.0.1:8081'), /must not contain credentials/);
  assert.throws(() => normalizeStudyApiUrl('http://127.0.0.1:8081/path'), /exact origin/);
});

test('parses only the privacy-minimized database summary', () => {
  assert.deepEqual(parseTargetInspection(`
database_name=yardfolio_study
migration_count=125
namespace_matches=0
`), {
    databaseName: 'yardfolio_study',
    migrationCount: 125,
    namespaceMatches: 0,
  });
  assert.throws(() => parseTargetInspection('database_name=yardfolio_study'), /required summary/);
});

test('accepts a ready isolated target with empty fixture namespaces', async () => {
  const result = await validateStudyTarget({
    apiUrl: 'http://127.0.0.1:8081',
    fetchImpl: safeFetch,
    inspectDatabase: () => ({
      databaseName: 'yardfolio_study',
      migrationCount: 125,
      namespaceMatches: 0,
    }),
  });
  assert.deepEqual(result, {
    apiMode: 'local_review',
    persistence: 'postgres',
    databaseName: 'yardfolio_study',
    migrationCount: 125,
    namespaceMatches: 0,
  });
});

test('fails closed for the wrong API mode or persistence', async () => {
  await assert.rejects(
    validateStudyTarget({
      apiUrl: 'http://127.0.0.1:8081',
      fetchImpl: (url) => url.endsWith('/auth/config')
        ? response(200, { mode: 'cognito' })
        : response(200, {
          status: 'ok',
          persistence: 'postgres',
          database_name: 'yardfolio_study',
        }),
      inspectDatabase: () => assert.fail('database inspection must not run'),
    }),
    /not in local_review mode/,
  );
  await assert.rejects(
    validateStudyTarget({
      apiUrl: 'http://127.0.0.1:8081',
      fetchImpl: (url) => url.endsWith('/auth/config')
        ? response(200, { mode: 'local_review' })
        : response(200, { status: 'ok', persistence: 'seed-local' }),
      inspectDatabase: () => assert.fail('database inspection must not run'),
    }),
    /ready PostgreSQL persistence/,
  );
});

test('fails closed when the API does not prove the study database identity', async () => {
  for (const databaseName of [undefined, 'yardfolio_landscaping']) {
    await assert.rejects(
      validateStudyTarget({
        apiUrl: 'http://127.0.0.1:8081',
        fetchImpl: (url) => url.endsWith('/auth/config')
          ? response(200, { mode: 'local_review' })
          : response(200, {
            status: 'ok',
            persistence: 'postgres',
            database_name: databaseName,
          }),
        inspectDatabase: () => assert.fail('operator database inspection must not run'),
      }),
      /API must report its connection to yardfolio_study/,
    );
  }
});

test('fails closed for a shared database, missing migrations, or occupied namespace', async () => {
  for (const [inspection, pattern] of [
    [{ databaseName: 'yardfolio_landscaping', migrationCount: 125, namespaceMatches: 0 }, /connected database/],
    [{ databaseName: 'yardfolio_study', migrationCount: 0, namespaceMatches: 0 }, /successful SQLx migrations/],
    [{ databaseName: 'yardfolio_study', migrationCount: 125, namespaceMatches: 1 }, /namespace is not empty/],
  ]) {
    await assert.rejects(
      validateStudyTarget({
        apiUrl: 'http://100.88.21.105:8081',
        fetchImpl: safeFetch,
        inspectDatabase: () => inspection,
      }),
      pattern,
    );
  }
});

test('withholds API response bodies and connection details from failures', async () => {
  await assert.rejects(
    validateStudyTarget({
      apiUrl: 'http://127.0.0.1:8081',
      fetchImpl: async () => { throw new Error('postgres://user:secret@example.test/private'); },
      inspectDatabase: () => assert.fail('database inspection must not run'),
    }),
    (error) => {
      assert.match(error.message, /API is unavailable/);
      assert.doesNotMatch(error.message, /secret|example\.test|postgres:\/\//);
      return true;
    },
  );
});
