#!/usr/bin/env node

import { readFile } from 'node:fs/promises';

const [evidencePath, ...extraArguments] = process.argv.slice(2);

if (!evidencePath || extraArguments.length > 0) {
  console.error('Usage: node scripts/validate-protected-release-evidence.mjs <evidence.json>');
  process.exit(64);
}

const errors = [];
const addError = (message) => errors.push(message);
const safeIdentifier = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const commitSha = /^[a-f0-9]{40}$/;
const rfc3339 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/;

const requireValue = (condition, message) => {
  if (!condition) addError(message);
};

const validTimestamp = (value) =>
  typeof value === 'string' && rfc3339.test(value) && Number.isFinite(Date.parse(value));

const allowedKeys = {
  '': ['schema_version', 'environment', 'release_id', 'application_origin', 'source_commit', 'operator_ref', 'recorded_at', 'deploy', 'migrations', 'checks', 'rollback'],
  deploy: ['provider', 'deploy_id', 'status', 'started_at', 'completed_at'],
  migrations: ['status', 'applied_count', 'completed_at'],
  checks: ['readiness', 'auth_mode', 'tenant_isolation_http_status', 'production_smoke', 'completed_at'],
  rollback: ['target_deploy_id', 'target_source_commit', 'procedure_ref', 'status'],
};

let evidence;
try {
  evidence = JSON.parse(await readFile(evidencePath, 'utf8'));
} catch {
  console.error('Protected release evidence is not readable valid JSON.');
  process.exit(1);
}

requireValue(evidence?.schema_version === 1, 'schema_version must be 1');
requireValue(evidence?.environment === 'protected-pilot', 'environment must be protected-pilot');
requireValue(safeIdentifier.test(evidence?.release_id ?? ''), 'release_id must be a safe identifier');
requireValue(commitSha.test(evidence?.source_commit ?? ''), 'source_commit must be a full lowercase commit SHA');
requireValue(safeIdentifier.test(evidence?.operator_ref ?? ''), 'operator_ref must be a non-personal safe identifier');
requireValue(validTimestamp(evidence?.recorded_at), 'recorded_at must be an RFC 3339 UTC timestamp');

try {
  const origin = new URL(evidence?.application_origin);
  requireValue(
    origin.protocol === 'https:' && origin.pathname === '/' && !origin.search && !origin.hash &&
      evidence.application_origin === origin.origin,
    'application_origin must be an exact HTTPS origin',
  );
} catch {
  addError('application_origin must be an exact HTTPS origin');
}

requireValue(evidence?.deploy?.provider === 'render', 'deploy.provider must be render');
requireValue(safeIdentifier.test(evidence?.deploy?.deploy_id ?? ''), 'deploy.deploy_id must be a safe identifier');
requireValue(evidence?.deploy?.status === 'succeeded', 'deploy.status must be succeeded');
requireValue(validTimestamp(evidence?.deploy?.started_at), 'deploy.started_at must be an RFC 3339 UTC timestamp');
requireValue(validTimestamp(evidence?.deploy?.completed_at), 'deploy.completed_at must be an RFC 3339 UTC timestamp');

requireValue(evidence?.migrations?.status === 'succeeded', 'migrations.status must be succeeded');
requireValue(
  Number.isInteger(evidence?.migrations?.applied_count) && evidence.migrations.applied_count >= 0,
  'migrations.applied_count must be a non-negative integer',
);
requireValue(validTimestamp(evidence?.migrations?.completed_at), 'migrations.completed_at must be an RFC 3339 UTC timestamp');

requireValue(evidence?.checks?.readiness === 'postgres', 'checks.readiness must be postgres');
requireValue(evidence?.checks?.auth_mode === 'cognito', 'checks.auth_mode must be cognito');
requireValue(
  evidence?.checks?.tenant_isolation_http_status === 403,
  'checks.tenant_isolation_http_status must be 403',
);
requireValue(evidence?.checks?.production_smoke === 'passed', 'checks.production_smoke must be passed');
requireValue(validTimestamp(evidence?.checks?.completed_at), 'checks.completed_at must be an RFC 3339 UTC timestamp');

requireValue(
  safeIdentifier.test(evidence?.rollback?.target_deploy_id ?? ''),
  'rollback.target_deploy_id must be a safe identifier',
);
requireValue(
  evidence?.rollback?.target_deploy_id !== evidence?.deploy?.deploy_id,
  'rollback.target_deploy_id must identify a prior deploy',
);
requireValue(
  commitSha.test(evidence?.rollback?.target_source_commit ?? ''),
  'rollback.target_source_commit must be a full lowercase commit SHA',
);
requireValue(
  typeof evidence?.rollback?.procedure_ref === 'string' &&
    (/^docs\/[A-Za-z0-9._/-]+\.md(?:#[A-Za-z0-9_-]+)?$/.test(evidence.rollback.procedure_ref) ||
      /^https:\/\/[A-Za-z0-9.-]+(?::[0-9]{1,5})?\/[A-Za-z0-9._~!$&'()*+,;=:@%/?#-]+$/.test(evidence.rollback.procedure_ref)),
  'rollback.procedure_ref must be a repository docs path or HTTPS URL',
);
requireValue(evidence?.rollback?.status === 'ready', 'rollback.status must be ready');

if (validTimestamp(evidence?.deploy?.started_at) && validTimestamp(evidence?.deploy?.completed_at)) {
  requireValue(
    Date.parse(evidence.deploy.started_at) <= Date.parse(evidence.deploy.completed_at),
    'deploy completion cannot precede its start',
  );
}

if (validTimestamp(evidence?.deploy?.completed_at) && validTimestamp(evidence?.checks?.completed_at)) {
  requireValue(
    Date.parse(evidence.deploy.completed_at) <= Date.parse(evidence.checks.completed_at),
    'protected checks cannot precede deploy completion',
  );
}

if (validTimestamp(evidence?.checks?.completed_at) && validTimestamp(evidence?.recorded_at)) {
  requireValue(
    Date.parse(evidence.checks.completed_at) <= Date.parse(evidence.recorded_at),
    'evidence cannot be recorded before protected checks complete',
  );
}

for (const [objectPath, permitted] of Object.entries(allowedKeys)) {
  const value = objectPath ? evidence?.[objectPath] : evidence;
  if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
  for (const key of Object.keys(value)) {
    if (!permitted.includes(key)) addError(`unexpected evidence field at ${objectPath ? `${objectPath}.` : ''}${key}`);
  }
}

const forbiddenKey = /(access.?token|id.?token|refresh.?token|authorization|password|secret|cookie|signed.?url|object.?key|database.?url|aws.?access.?key)/i;
const inspectKeys = (value, path = '') => {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    const childPath = path ? `${path}.${key}` : key;
    if (forbiddenKey.test(key)) addError(`sensitive field is forbidden at ${childPath}`);
    inspectKeys(child, childPath);
  }
};
inspectKeys(evidence);

const serialized = JSON.stringify(evidence);
for (const [pattern, message] of [
  [/replace-with-/i, 'template placeholders must be replaced'],
  [/Bearer\s+[A-Za-z0-9._~-]+/i, 'bearer credential content is forbidden'],
  [/\beyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/, 'JWT content is forbidden'],
  [/\bAKIA[0-9A-Z]{16}\b/, 'AWS access key content is forbidden'],
  [/X-Amz-(?:Credential|Signature|Security-Token)=/i, 'signed AWS query content is forbidden'],
  [/postgres(?:ql)?:\/\/[^\s"@]+@/i, 'database credential content is forbidden'],
]) {
  if (pattern.test(serialized)) addError(message);
}

if (errors.length > 0) {
  for (const error of [...new Set(errors)]) console.error(`[FAILED] ${error}`);
  console.error(`Protected release evidence failed with ${new Set(errors).size} issue(s).`);
  process.exit(1);
}

console.log('Protected release evidence is complete and credential-safe.');
