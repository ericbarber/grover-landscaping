import assert from 'node:assert/strict';
import test from 'node:test';
import {
  runWorkspaceRolloutSmoke,
  workspaceRolloutSmokeConfig,
} from './smoke-workspace-rollout.mjs';

const environment = (overrides = {}) => ({
  BASE_URL: 'https://pilot.example.test',
  ACCESS_TOKEN: 'do-not-print-rollout-token',
  SMOKE_ROLLOUT_PERSONA: 'crew-member',
  SMOKE_ROLLOUT_UNIT: 'cm3',
  SMOKE_ROLLOUT_SCOPE_TYPE: 'crew',
  SMOKE_ROLLOUT_SCOPE_ID: 'crew-controlled',
  SMOKE_ROLLOUT_ORGANIZATION_ID: 'org-controlled',
  SMOKE_ROLLOUT_REQUIRED_CAPABILITIES: 'assigned_work,job_execution,field_evidence',
  SMOKE_ROLLOUT_FORBIDDEN_CAPABILITIES: 'personal_recovery',
  SMOKE_ROLLOUT_SUCCESS_PATHS_JSON: '["/jobs/job-controlled"]',
  SMOKE_ROLLOUT_DENIAL_PATHS_JSON: '["/jobs/job-other-tenant"]',
  ...overrides,
});

function response(status, body = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function successfulFetch({ denialStatus = 403, projectionOverrides = {} } = {}) {
  return async (url, init = {}) => {
    const path = new URL(url).pathname;
    if (path === '/health/ready') return response(200, { status: 'ok', persistence: 'postgres' });
    if (path === '/auth/config') return response(200, { mode: 'cognito' });
    assert.equal(init.headers?.Authorization, 'Bearer do-not-print-rollout-token');
    if (path === '/me/access') {
      return response(200, {
        workspace_rollout: {
          contract_version: 2,
          enforcement_mode: 'managed',
          rollout_mode: 'cohort',
          personas: [{
            persona_id: 'crew-member',
            enabled_unit: 'cm3',
            scope: {
              scope_type: 'crew',
              scope_id: 'crew-controlled',
              organization_id: 'org-controlled',
            },
            capabilities: {
              assigned_work: true,
              job_execution: true,
              field_evidence: true,
              personal_recovery: false,
            },
            ...projectionOverrides,
          }],
        },
      });
    }
    if (path === '/jobs/job-controlled') return response(200, { id: 'never-inspected' });
    if (path === '/jobs/job-other-tenant') return response(denialStatus, { private: 'never-inspected' });
    return response(500);
  };
}

test('validates an exact managed unit plus authorized and denied resources', async () => {
  const result = await runWorkspaceRolloutSmoke(environment(), successfulFetch());

  assert.deepEqual(result, {
    personaId: 'crew-member',
    enabledUnit: 'cm3',
    successProbeCount: 1,
    denialProbeCount: 1,
  });
});

test('accepts explicit absent scope values and a final unit with no forbidden capability', () => {
  const config = workspaceRolloutSmokeConfig(environment({
    SMOKE_ROLLOUT_SCOPE_ID: 'none',
    SMOKE_ROLLOUT_ORGANIZATION_ID: 'none',
    SMOKE_ROLLOUT_FORBIDDEN_CAPABILITIES: 'none',
  }));

  assert.equal(config.scopeId, null);
  assert.equal(config.organizationId, null);
  assert.deepEqual(config.forbiddenCapabilities, []);
});

test('rejects unsafe origins and probe paths before making a request', async () => {
  await assert.rejects(
    runWorkspaceRolloutSmoke(
      environment({ BASE_URL: 'http://pilot.example.test/private?token=private' }),
      () => assert.fail('fetch must not run'),
    ),
    /exact HTTPS origin/,
  );
  await assert.rejects(
    runWorkspaceRolloutSmoke(
      environment({ SMOKE_ROLLOUT_SUCCESS_PATHS_JSON: '["//other.example.test/private"]' }),
      () => assert.fail('fetch must not run'),
    ),
    /unsafe application path/,
  );
});

test('fails when the exact unit or cumulative capability is absent', async () => {
  await assert.rejects(
    runWorkspaceRolloutSmoke(
      environment(),
      successfulFetch({ projectionOverrides: { enabled_unit: 'cm2' } }),
    ),
    /expected rollout unit/,
  );
  await assert.rejects(
    runWorkspaceRolloutSmoke(
      environment(),
      successfulFetch({
        projectionOverrides: {
          capabilities: {
            assigned_work: true,
            job_execution: true,
            field_evidence: false,
            personal_recovery: false,
          },
        },
      }),
    ),
    /required cumulative capability/,
  );
});

test('fails when a later unit leaks or a cross-resource probe succeeds', async () => {
  await assert.rejects(
    runWorkspaceRolloutSmoke(
      environment(),
      successfulFetch({
        projectionOverrides: {
          capabilities: {
            assigned_work: true,
            job_execution: true,
            field_evidence: true,
            personal_recovery: true,
          },
        },
      }),
    ),
    /forbidden later-unit capability/,
  );
  await assert.rejects(
    runWorkspaceRolloutSmoke(environment(), successfulFetch({ denialStatus: 200 })),
    /did not fail closed/,
  );
});

test('never places credentials, resource paths, or response bodies in failures', async () => {
  const privateValues = [
    'do-not-print-rollout-token',
    'job-other-tenant',
    'never-inspected',
  ];
  let failure;
  try {
    await runWorkspaceRolloutSmoke(environment(), successfulFetch({ denialStatus: 200 }));
  } catch (error) {
    failure = String(error);
  }
  assert.ok(failure);
  for (const privateValue of privateValues) assert.doesNotMatch(failure, new RegExp(privateValue));
});
