import assert from 'node:assert/strict';
import test from 'node:test';
import {
  validateStudyRuntime,
  validateStudyRuntimeResponses,
} from './validate-study-runtime.mjs';

const localReviewers = [
  ['organization-owner', 'local-review-organization-owner', 'OrganizationOwner'],
  ['manager', 'local-review-manager', 'Manager'],
  ['crew-lead', 'local-review-crew-lead', 'CrewLead'],
  ['property-manager', 'local-review-property-manager', 'PropertyManager'],
  ['property-owner-canyon', 'local-review-property-owner-canyon', 'PropertyOwner'],
  ['property-owner-sage', 'local-review-property-owner-sage', 'PropertyOwner'],
].map(([reviewer_id, user_id, role]) => ({ reviewer_id, user_id, roles: [role] }));

function authConfig(overrides = {}) {
  return { mode: 'local_review', local_reviewers: localReviewers, ...overrides };
}

function readiness(overrides = {}) {
  return {
    status: 'ok',
    persistence: 'postgres',
    database_name: 'yardfolio_study',
    ...overrides,
  };
}

test('accepts the isolated study API and exact comparison identities', async () => {
  const requests = [];
  const result = await validateStudyRuntime({
    apiUrl: 'http://127.0.0.1:8081/',
    fetchImpl: async (url) => {
      requests.push(url);
      return new Response(
        JSON.stringify(url.endsWith('/auth/config') ? authConfig() : readiness()),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    },
  });
  assert.deepEqual(requests.sort(), [
    'http://127.0.0.1:8081/auth/config',
    'http://127.0.0.1:8081/health/ready',
  ]);
  assert.deepEqual(result, {
    apiUrl: 'http://127.0.0.1:8081',
    apiMode: 'local_review',
    persistence: 'postgres',
    databaseName: 'yardfolio_study',
    reviewerCount: 6,
  });
});

test('fails closed for a shared runtime or changed comparison identity', () => {
  assert.throws(
    () => validateStudyRuntimeResponses(authConfig(), readiness({ database_name: 'yardfolio' })),
    /not bound to yardfolio_study/,
  );
  assert.throws(
    () => validateStudyRuntimeResponses(authConfig({ mode: 'cognito' }), readiness()),
    /not in local_review mode/,
  );
  assert.throws(
    () => validateStudyRuntimeResponses(
      authConfig({ local_reviewers: localReviewers.slice(1) }),
      readiness(),
    ),
    /required organization-owner identity/,
  );
});

test('withholds response content from unavailable and invalid runtime failures', async () => {
  await assert.rejects(
    validateStudyRuntime({
      apiUrl: 'http://127.0.0.1:8081',
      fetchImpl: async () => new Response('private database detail', { status: 503 }),
    }),
    (error) => !error.message.includes('private database detail') && /HTTP 503/.test(error.message),
  );
  await assert.rejects(
    validateStudyRuntime({
      apiUrl: 'http://127.0.0.1:8081',
      fetchImpl: async () => new Response('not-json', { status: 200 }),
    }),
    /invalid JSON/,
  );
});
