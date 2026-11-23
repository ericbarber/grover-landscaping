#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepareFixtureManifest } from './prepare-manifest.mjs';
import { resetFixtureManifest } from './reset-fixtures.mjs';
import { seedFixtureManifest } from './seed-fixtures.mjs';
import { validateSessionCheckpoint } from './validate-session-checkpoint.mjs';
import { fixtureSnapshotOrder } from './validate-manifest.mjs';
import { validateStudyRuntime } from './validate-study-runtime.mjs';
import { validateStudyTarget } from './validate-target.mjs';

const supportedCheckpoints = new Set(fixtureSnapshotOrder());
const sessionManifestRoot = resolve(fileURLToPath(
  new URL('../../.localdev/yardfolio-study/', import.meta.url),
));

function fail(message) {
  throw new Error(`Cannot manage Yardfolio Study session: ${message}`);
}

function requireCheckpoint(checkpoint) {
  if (!supportedCheckpoints.has(checkpoint)) {
    fail('checkpoint must name a supported forward-only lifecycle moment');
  }
  return checkpoint;
}

function requireManifestPath(manifestPath, { explicitNew = false } = {}) {
  if (!manifestPath) {
    fail(explicitNew ? 'an explicit new manifest path is required' : 'manifest path is required');
  }
  const resolvedPath = resolve(manifestPath);
  if (!resolvedPath.startsWith(`${sessionManifestRoot}${sep}`) || !resolvedPath.endsWith('.json')) {
    fail('manifest must be a JSON file under .localdev/yardfolio-study');
  }
  return resolvedPath;
}

async function readManifest(manifestPath) {
  try {
    return JSON.parse(await readFile(resolve(manifestPath), 'utf8'));
  } catch (error) {
    if (error instanceof SyntaxError) fail('manifest is not valid JSON');
    throw error;
  }
}

export async function prepareStudySession({
  checkpoint,
  manifestPath,
  apiUrl,
  sourceCommit,
  asOfDate,
  prepareManifest = prepareFixtureManifest,
  seedManifest = seedFixtureManifest,
  validateCheckpoint = validateSessionCheckpoint,
} = {}) {
  requireCheckpoint(checkpoint);
  const resolvedManifestPath = requireManifestPath(manifestPath, { explicitNew: true });
  const prepared = await prepareManifest({
    apiUrl,
    sourceCommit,
    asOfDate,
    outputPath: resolvedManifestPath,
  });
  const seeded = await seedManifest({
    apiUrl,
    manifestPath: prepared.outputPath,
    stopAfter: checkpoint,
  });
  return validateCheckpoint(seeded, checkpoint);
}

export async function verifyStudySession({
  checkpoint,
  manifestPath,
  apiUrl,
  loadManifest = readManifest,
  validateRuntime = validateStudyRuntime,
  validateCheckpoint = validateSessionCheckpoint,
} = {}) {
  requireCheckpoint(checkpoint);
  const resolvedManifestPath = requireManifestPath(manifestPath);
  await validateRuntime({ apiUrl });
  return validateCheckpoint(await loadManifest(resolvedManifestPath), checkpoint);
}

export async function resetStudySession({
  manifestPath,
  apiUrl,
  resetManifest = resetFixtureManifest,
  validateEmptyTarget = validateStudyTarget,
} = {}) {
  const resolvedManifestPath = requireManifestPath(manifestPath);
  const manifest = await resetManifest({ manifestPath: resolvedManifestPath, apiUrl });
  const target = await validateEmptyTarget({ apiUrl });
  return {
    fixtureRevision: manifest.fixtureRevision,
    attemptedAt: manifest.resetVerification.attemptedAt,
    remainingManifestRecords: manifest.resetVerification.remainingManifestRecords,
    databaseName: target.databaseName,
    namespaceMatches: target.namespaceMatches,
  };
}

function usage() {
  return [
    'Usage:',
    '  study-session.mjs prepare CHECKPOINT MANIFEST.json',
    '  study-session.mjs verify CHECKPOINT MANIFEST.json',
    '  study-session.mjs reset MANIFEST.json',
  ].join('\n');
}

async function main() {
  const [command, first, second, ...extra] = process.argv.slice(2);
  if (extra.length > 0) fail(usage());
  const apiUrl = process.env.YARDFOLIO_STUDY_API_URL;
  let status;
  let result;
  if (command === 'prepare' && first && second) {
    status = 'study_session_prepared';
    result = await prepareStudySession({
      checkpoint: first,
      manifestPath: second,
      apiUrl,
      sourceCommit: process.env.YARDFOLIO_STUDY_SOURCE_COMMIT,
      asOfDate: process.env.YARDFOLIO_STUDY_AS_OF,
    });
  } else if (command === 'verify' && first && second) {
    status = 'study_session_verified';
    result = await verifyStudySession({
      checkpoint: first,
      manifestPath: second,
      apiUrl,
    });
  } else if (command === 'reset' && first && !second) {
    status = 'study_session_reset_verified';
    result = await resetStudySession({
      manifestPath: first,
      apiUrl,
    });
  } else {
    fail(usage());
  }
  process.stdout.write(`${JSON.stringify({ status, ...result }, null, 2)}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
