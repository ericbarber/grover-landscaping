#!/usr/bin/env node

import { mkdir, open } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateFixtureManifest } from './validate-manifest.mjs';
import { validateStudyTarget } from './validate-target.mjs';

const defaultManifestPath = '.localdev/yardfolio-study/fixture-manifest.json';
const studyOwners = [
  {
    key: 'canyon',
    syntheticLabel: 'Canyon View',
    requestNamespace: 'yardfolio_study_canyon_',
    ownerReviewerId: 'property-owner-canyon',
    ownerUserId: 'local-review-property-owner-canyon',
  },
  {
    key: 'sage',
    syntheticLabel: 'Sage Lane',
    requestNamespace: 'yardfolio_study_sage_',
    ownerReviewerId: 'property-owner-sage',
    ownerUserId: 'local-review-property-owner-sage',
  },
];

function fail(message) {
  throw new Error(`Cannot prepare Yardfolio Study fixture manifest: ${message}`);
}

function requireSourceCommit(value) {
  if (!/^[0-9a-f]{40}$/.test(value ?? '') || /^0+$/.test(value)) {
    fail('YARDFOLIO_STUDY_SOURCE_COMMIT must be the exact nonzero lowercase 40-character commit running on the study API');
  }
  return value;
}

function requireAsOfDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? '')) {
    fail('YARDFOLIO_STUDY_AS_OF must use YYYY-MM-DD');
  }
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (parsed.getUTCFullYear() !== year
    || parsed.getUTCMonth() !== month - 1
    || parsed.getUTCDate() !== day) {
    fail('YARDFOLIO_STUDY_AS_OF must be a real calendar date');
  }
  return value;
}

function requireStudyReviewers(authConfig) {
  if (authConfig?.mode !== 'local_review' || !Array.isArray(authConfig.local_reviewers)) {
    fail('the API must publish its fixed local-review profiles');
  }
  for (const expected of studyOwners) {
    const reviewer = authConfig.local_reviewers.find(
      (candidate) => candidate.reviewer_id === expected.ownerReviewerId,
    );
    if (reviewer?.user_id !== expected.ownerUserId
      || reviewer?.roles?.length !== 1
      || reviewer.roles[0] !== 'PropertyOwner') {
      fail(`${expected.syntheticLabel} does not have its exact isolated Property Owner reviewer`);
    }
  }
}

export function buildPreparedManifest({
  target,
  authConfig,
  sourceCommit,
  asOfDate,
  createdAt,
}) {
  requireStudyReviewers(authConfig);
  const manifest = {
    schemaVersion: 2,
    manifestKind: 'local_fixture',
    fixtureRevision: 'yardfolio-study-matched-v1',
    targetDatabaseName: target.databaseName,
    apiMode: target.apiMode,
    sourceCommit: requireSourceCommit(sourceCommit),
    migrationCount: target.migrationCount,
    asOfDate: requireAsOfDate(asOfDate),
    createdAt,
    phase: 'prepared',
    records: studyOwners.map((owner) => ({
      ...owner,
      managerReviewerId: 'property-manager',
      crewReviewerId: 'crew-lead',
      managerDelegationStatus: 'not_created',
      generatedRecordIds: {},
      snapshots: [],
    })),
    resetVerification: {
      attemptedAt: null,
      remainingManifestRecords: null,
    },
  };
  validateFixtureManifest(manifest);
  return manifest;
}

async function readJson(fetchImpl, url) {
  const response = await fetchImpl(url, { headers: { accept: 'application/json' } });
  if (!response.ok) fail(`the study API returned HTTP ${response.status} while checking reviewers`);
  try {
    return await response.json();
  } catch {
    fail('the study API returned invalid reviewer configuration JSON');
  }
}

export async function prepareFixtureManifest({
  apiUrl,
  sourceCommit,
  asOfDate,
  outputPath = defaultManifestPath,
  fetchImpl = fetch,
  validateTarget = validateStudyTarget,
  now = () => new Date(),
} = {}) {
  if (!apiUrl) fail('YARDFOLIO_STUDY_API_URL is required');
  const target = await validateTarget({ apiUrl, fetchImpl });
  const authConfig = await readJson(fetchImpl, `${apiUrl.replace(/\/$/, '')}/auth/config`);
  const manifest = buildPreparedManifest({
    target,
    authConfig,
    sourceCommit,
    asOfDate,
    createdAt: now().toISOString(),
  });
  const resolvedPath = resolve(outputPath);
  await mkdir(dirname(resolvedPath), { recursive: true });
  let handle;
  try {
    handle = await open(resolvedPath, 'wx', 0o600);
    await handle.writeFile(`${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    await handle.sync();
  } catch (error) {
    if (error?.code === 'EEXIST') {
      fail(`refusing to replace existing manifest ${resolvedPath}`);
    }
    throw error;
  } finally {
    await handle?.close();
  }
  return { manifest, outputPath: resolvedPath };
}

async function main() {
  if (process.argv.length > 3) {
    fail('usage: prepare-manifest.mjs [OUTPUT_PATH]');
  }
  const { manifest, outputPath } = await prepareFixtureManifest({
    apiUrl: process.env.YARDFOLIO_STUDY_API_URL,
    sourceCommit: process.env.YARDFOLIO_STUDY_SOURCE_COMMIT,
    asOfDate: process.env.YARDFOLIO_STUDY_AS_OF,
    outputPath: process.argv[2] ?? defaultManifestPath,
  });
  process.stdout.write(`${JSON.stringify({
    status: 'fixture_manifest_prepared',
    outputPath,
    fixtureRevision: manifest.fixtureRevision,
    migrationCount: manifest.migrationCount,
    recordCount: manifest.records.length,
  }, null, 2)}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
