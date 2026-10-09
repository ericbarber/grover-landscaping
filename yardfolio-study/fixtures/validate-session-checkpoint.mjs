#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  fixtureSnapshotOrder,
  validateFixtureManifest,
} from './validate-manifest.mjs';

const snapshotOrder = fixtureSnapshotOrder();

function fail(message) {
  throw new Error(`Yardfolio Study session is not ready: ${message}`);
}

export function validateSessionCheckpoint(manifest, checkpoint) {
  validateFixtureManifest(manifest);
  const checkpointIndex = snapshotOrder.indexOf(checkpoint);
  if (checkpointIndex < 0) fail('checkpoint is unsupported');
  if (manifest.phase !== 'verified') fail('manifest phase must be verified');
  const expectedSnapshots = snapshotOrder.slice(0, checkpointIndex + 1);
  for (const record of manifest.records) {
    if (JSON.stringify(record.snapshots) !== JSON.stringify(expectedSnapshots)) {
      fail(`${record.syntheticLabel} is not at the requested checkpoint`);
    }
  }
  return {
    checkpoint,
    fixtureRevision: manifest.fixtureRevision,
    sourceCommit: manifest.sourceCommit,
    asOfDate: manifest.asOfDate,
    recordLabels: manifest.records.map((record) => record.syntheticLabel),
  };
}

async function main() {
  if (process.argv.length !== 4) {
    fail('usage: validate-session-checkpoint.mjs CHECKPOINT MANIFEST.json');
  }
  const checkpoint = process.argv[2];
  const manifest = JSON.parse(await readFile(resolve(process.argv[3]), 'utf8'));
  const result = validateSessionCheckpoint(manifest, checkpoint);
  process.stdout.write(`${JSON.stringify({
    status: 'study_session_checkpoint_verified',
    ...result,
  }, null, 2)}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
