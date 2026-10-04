#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const expectedDatabaseName = 'grover_modern_study';
const expectedPort = '8081';

const targetInspectionSql = String.raw`
BEGIN;
CREATE TEMP TABLE modern_grover_namespace_matches (
  table_name text NOT NULL,
  column_name text NOT NULL,
  match_count bigint NOT NULL
) ON COMMIT DROP;
DO $modern_grover$
DECLARE
  candidate record;
  matches bigint;
BEGIN
  FOR candidate IN
    SELECT table_schema, table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND data_type IN ('text', 'character varying', 'character')
  LOOP
    EXECUTE format(
      'SELECT count(*) FROM %I.%I WHERE %I LIKE $1 OR %I LIKE $2',
      candidate.table_schema,
      candidate.table_name,
      candidate.column_name,
      candidate.column_name
    ) INTO matches USING 'modern_study_canyon_%', 'modern_study_sage_%';
    IF matches > 0 THEN
      INSERT INTO modern_grover_namespace_matches
        (table_name, column_name, match_count)
      VALUES (candidate.table_name, candidate.column_name, matches);
    END IF;
  END LOOP;
END
$modern_grover$;
SELECT 'database_name=' || current_database();
SELECT 'migration_count=' || count(*) FROM _sqlx_migrations WHERE success;
SELECT 'namespace_matches=' || COALESCE(sum(match_count), 0)
FROM modern_grover_namespace_matches;
ROLLBACK;
`;

function fail(message) {
  throw new Error(`Modern Grover study target is unsafe: ${message}`);
}

function isTailscaleIpv4(hostname) {
  const octets = hostname.split('.').map(Number);
  return octets.length === 4
    && octets.every((octet) => Number.isInteger(octet) && octet >= 0 && octet <= 255)
    && octets[0] === 100
    && octets[1] >= 64
    && octets[1] <= 127;
}

export function normalizeStudyApiUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    fail('MODERN_GROVER_API_URL must be an absolute URL');
  }
  if (url.protocol !== 'http:') fail('the isolated local-review API must use http');
  if (url.username || url.password) fail('the API URL must not contain credentials');
  if (url.pathname !== '/' || url.search || url.hash) {
    fail('the API URL must be an exact origin without a path, query, or fragment');
  }
  if (url.port !== expectedPort) fail(`the isolated study API must use port ${expectedPort}`);
  const isLoopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (!isLoopback && !isTailscaleIpv4(url.hostname)) {
    fail('the API host must be loopback or a Tailscale 100.64.0.0/10 address');
  }
  return url.toString().replace(/\/$/, '');
}

export function parseTargetInspection(output) {
  const facts = new Map();
  for (const line of output.split(/\r?\n/)) {
    const separator = line.indexOf('=');
    if (separator > 0) facts.set(line.slice(0, separator).trim(), line.slice(separator + 1).trim());
  }
  const databaseName = facts.get('database_name');
  const migrationCount = Number(facts.get('migration_count'));
  const namespaceMatches = Number(facts.get('namespace_matches'));
  if (!databaseName || !Number.isInteger(migrationCount) || !Number.isInteger(namespaceMatches)) {
    fail('database inspection did not return the required summary');
  }
  return { databaseName, migrationCount, namespaceMatches };
}

export function inspectTargetWithPsql({
  psqlBin = process.env.MODERN_GROVER_PSQL_BIN ?? 'psql',
  environment = process.env,
} = {}) {
  if (environment.PGDATABASE !== expectedDatabaseName) {
    fail(`PGDATABASE must be exactly ${expectedDatabaseName}`);
  }
  const result = spawnSync(
    psqlBin,
    ['--no-psqlrc', '--quiet', '--tuples-only', '--no-align', '--set', 'ON_ERROR_STOP=1'],
    {
      encoding: 'utf8',
      env: environment,
      input: targetInspectionSql,
      maxBuffer: 1024 * 1024,
    },
  );
  if (result.error || result.status !== 0) {
    fail('PostgreSQL inspection failed; connection details and database output are withheld');
  }
  return parseTargetInspection(result.stdout);
}

async function readJson(fetchImpl, url) {
  let response;
  try {
    response = await fetchImpl(url, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    fail('the isolated study API is unavailable');
  }
  if (!response.ok) fail(`the isolated study API returned HTTP ${response.status}`);
  try {
    return await response.json();
  } catch {
    fail('the isolated study API returned invalid JSON');
  }
}

export async function validateStudyTarget({
  apiUrl,
  fetchImpl = fetch,
  inspectDatabase = inspectTargetWithPsql,
} = {}) {
  const normalizedApiUrl = normalizeStudyApiUrl(apiUrl);
  const [authConfig, readiness] = await Promise.all([
    readJson(fetchImpl, `${normalizedApiUrl}/auth/config`),
    readJson(fetchImpl, `${normalizedApiUrl}/health/ready`),
  ]);
  if (authConfig?.mode !== 'local_review') fail('the API is not in local_review mode');
  if (readiness?.status !== 'ok' || readiness?.persistence !== 'postgres') {
    fail('the API does not report ready PostgreSQL persistence');
  }
  if (readiness?.database_name !== expectedDatabaseName) {
    fail(`the API must report its connection to ${expectedDatabaseName}`);
  }

  const inspection = await inspectDatabase();
  if (inspection.databaseName !== expectedDatabaseName) {
    fail(`connected database must be exactly ${expectedDatabaseName}`);
  }
  if (!Number.isInteger(inspection.migrationCount) || inspection.migrationCount <= 0) {
    fail('the isolated database must contain successful SQLx migrations');
  }
  if (inspection.namespaceMatches !== 0) {
    fail('the Canyon View or Sage Lane fixture namespace is not empty');
  }

  return {
    apiMode: 'local_review',
    persistence: 'postgres',
    databaseName: inspection.databaseName,
    migrationCount: inspection.migrationCount,
    namespaceMatches: inspection.namespaceMatches,
  };
}

async function main() {
  const apiUrl = process.env.MODERN_GROVER_API_URL;
  if (!apiUrl) fail('MODERN_GROVER_API_URL is required');
  const result = await validateStudyTarget({ apiUrl });
  process.stdout.write(`${JSON.stringify({
    status: 'target_boundary_preflight_passed',
    ...result,
  }, null, 2)}\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
