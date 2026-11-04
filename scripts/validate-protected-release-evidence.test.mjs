import assert from 'node:assert/strict';
import test from 'node:test';
import { validateProtectedReleaseEvidence } from './validate-protected-release-evidence.mjs';

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

const messages = (evidence) => validateProtectedReleaseEvidence(evidence).join('\n');

test('accepts complete redacted protected-release evidence', () => {
  assert.deepEqual(validateProtectedReleaseEvidence(validEvidence()), []);
});

test('rejects incomplete and fail-open release evidence', () => {
  const evidence = validEvidence();
  evidence.release_id = 'replace-with-safe-release-id';
  evidence.checks.tenant_isolation_http_status = 200;
  evidence.rollback.target_deploy_id = evidence.deploy.deploy_id;
  const errors = messages(evidence);
  assert.match(errors, /tenant_isolation_http_status must be 403/);
  assert.match(errors, /must identify a prior deploy/);
  assert.match(errors, /template placeholders must be replaced/);
});

test('rejects credential-bearing keys and values without echoing them', () => {
  const evidence = validEvidence();
  evidence.access_token = 'Bearer do-not-print-release-credential';
  const errors = messages(evidence);
  assert.match(errors, /sensitive field is forbidden/);
  assert.match(errors, /unexpected evidence field/);
  assert.match(errors, /bearer credential content is forbidden/);
  assert.doesNotMatch(errors, /do-not-print-release-credential/);
});

test('rejects an invalid origin, timestamp, and rollback reference', () => {
  const evidence = validEvidence();
  evidence.application_origin = 'http://pilot.example.test/private';
  evidence.deploy.completed_at = 'tomorrow';
  evidence.rollback.procedure_ref = '../private-notes.txt';
  const errors = messages(evidence);
  assert.match(errors, /exact HTTPS origin/);
  assert.match(errors, /RFC 3339 UTC timestamp/);
  assert.match(errors, /repository docs path or HTTPS URL/);
});
