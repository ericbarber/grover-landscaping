import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const validator = fileURLToPath(new URL('./validate-protected-release-evidence.mjs', import.meta.url));

const validEvidence = () => ({
  schema_version: 1,
  environment: 'protected-pilot',
  release_id: 'release-2026-09-03-001',
  application_origin: 'https://pilot.example.test',
  source_commit: '1111111111111111111111111111111111111111',
  operator_ref: 'release-operator-1',
  recorded_at: '2026-09-03T18:35:00Z',
  deploy: {
    provider: 'render',
    deploy_id: 'deploy-current',
    status: 'succeeded',
    started_at: '2026-09-03T18:00:00Z',
    completed_at: '2026-09-03T18:10:00Z',
  },
  migrations: {
    status: 'succeeded',
    applied_count: 122,
    completed_at: '2026-09-03T18:09:00Z',
  },
  checks: {
    readiness: 'postgres',
    auth_mode: 'cognito',
    tenant_isolation_http_status: 403,
    production_smoke: 'passed',
    completed_at: '2026-09-03T18:30:00Z',
  },
  rollback: {
    target_deploy_id: 'deploy-prior',
    target_source_commit: '2222222222222222222222222222222222222222',
    procedure_ref: 'docs/production-deployment.md#operations',
    status: 'ready',
  },
});

const validate = async (evidence) => {
  const directory = await mkdtemp(path.join(tmpdir(), 'grover-release-evidence-'));
  const evidencePath = path.join(directory, 'evidence.json');
  await writeFile(evidencePath, JSON.stringify(evidence));
  const result = spawnSync(process.execPath, [validator, evidencePath], { encoding: 'utf8' });
  await rm(directory, { recursive: true });
  return result;
};

test('accepts complete redacted protected-release evidence', async () => {
  const result = await validate(validEvidence());
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /complete and credential-safe/);
});

test('rejects incomplete and fail-open release evidence', async () => {
  const evidence = validEvidence();
  evidence.release_id = 'replace-with-safe-release-id';
  evidence.checks.tenant_isolation_http_status = 200;
  evidence.rollback.target_deploy_id = evidence.deploy.deploy_id;
  const result = await validate(evidence);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /tenant_isolation_http_status must be 403/);
  assert.match(result.stderr, /must identify a prior deploy/);
  assert.match(result.stderr, /template placeholders must be replaced/);
});

test('rejects credential-bearing keys and values without echoing them', async () => {
  const evidence = validEvidence();
  evidence.access_token = 'Bearer do-not-print-release-credential';
  const result = await validate(evidence);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /sensitive field is forbidden/);
  assert.match(result.stderr, /unexpected evidence field/);
  assert.match(result.stderr, /bearer credential content is forbidden/);
  assert.doesNotMatch(result.stderr, /do-not-print-release-credential/);
});

test('rejects an invalid origin, timestamp, and rollback reference', async () => {
  const evidence = validEvidence();
  evidence.application_origin = 'http://pilot.example.test/private';
  evidence.deploy.completed_at = 'tomorrow';
  evidence.rollback.procedure_ref = '../private-notes.txt';
  const result = await validate(evidence);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /exact HTTPS origin/);
  assert.match(result.stderr, /RFC 3339 UTC timestamp/);
  assert.match(result.stderr, /repository docs path or HTTPS URL/);
});
