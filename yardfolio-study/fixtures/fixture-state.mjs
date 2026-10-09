#!/usr/bin/env node

import { randomUUID } from 'node:crypto';
import { chmod, open, readFile, rename, unlink } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  fixtureSnapshotOrder,
  validateFixtureManifest,
} from './validate-manifest.mjs';

const snapshotOrder = fixtureSnapshotOrder();

function fail(message) {
  throw new Error(`Cannot update Yardfolio Study fixture state: ${message}`);
}

function cloneValidatedManifest(manifest) {
  validateFixtureManifest(manifest);
  return structuredClone(manifest);
}

function findRecord(manifest, recordKey) {
  const record = manifest.records.find((candidate) => candidate.key === recordKey);
  if (!record) fail('record key must be canyon or sage');
  return record;
}

function recordIdCount(record) {
  return Object.values(record.generatedRecordIds)
    .reduce((total, ids) => total + ids.length, 0);
}

export function recordGeneratedId(manifest, { recordKey, table, id }) {
  const next = cloneValidatedManifest(manifest);
  if (next.phase === 'reset') fail('a reset manifest cannot accept new records');
  const record = findRecord(next, recordKey);
  const existing = record.generatedRecordIds[table] ?? [];
  if (existing.includes(id)) return next;
  record.generatedRecordIds[table] = [...existing, id];
  next.phase = 'seeded';
  validateFixtureManifest(next);
  return next;
}

export function recordVerifiedSnapshot(manifest, { recordKey, snapshot }) {
  const next = cloneValidatedManifest(manifest);
  if (!['seeded', 'verified'].includes(next.phase)) {
    fail('snapshots can be recorded only after generated records are journaled');
  }
  const record = findRecord(next, recordKey);
  if (recordIdCount(record) === 0) {
    fail(`${record.syntheticLabel} must journal a generated record before verification`);
  }
  if (!record.snapshots.includes(snapshot)) {
    if (snapshot !== snapshotOrder[record.snapshots.length]) {
      fail(`${record.syntheticLabel} snapshot must advance to the next lifecycle checkpoint`);
    }
    record.snapshots.push(snapshot);
  }
  const [first, ...remaining] = next.records.map(
    (candidate) => JSON.stringify(candidate.snapshots),
  );
  next.phase = record.snapshots.length > 0
    && remaining.every((snapshots) => snapshots === first)
    ? 'verified'
    : 'seeded';
  validateFixtureManifest(next);
  return next;
}

export function recordManagerDelegationStatus(manifest, { recordKey, status }) {
  const next = cloneValidatedManifest(manifest);
  if (next.phase === 'reset') fail('a reset manifest cannot change delegation state');
  const record = findRecord(next, recordKey);
  if (record.managerDelegationStatus === status) return next;
  const invitationIds = record.generatedRecordIds.customer_property_manager_invitations ?? [];
  if (status !== 'not_created' && invitationIds.length === 0) {
    fail(`${record.syntheticLabel} must journal its manager invitation before changing delegation state`);
  }
  const allowedTransitions = {
    not_created: new Set(['pending']),
    pending: new Set(['accepted', 'revoked']),
    accepted: new Set(['revoked']),
    revoked: new Set(),
  };
  if (!allowedTransitions[record.managerDelegationStatus]?.has(status)) {
    fail(`manager delegation cannot move from ${record.managerDelegationStatus} to ${status}`);
  }
  record.managerDelegationStatus = status;
  validateFixtureManifest(next);
  return next;
}

export function recordResetVerification(manifest, { attemptedAt, remainingManifestRecords }) {
  const next = cloneValidatedManifest(manifest);
  if (!['seeded', 'verified', 'reset'].includes(next.phase)) {
    fail('a prepared manifest cannot be reset');
  }
  const candidate = structuredClone(next);
  candidate.phase = 'reset';
  candidate.resetVerification = { attemptedAt, remainingManifestRecords };
  validateFixtureManifest(candidate);
  return next.phase === 'reset' ? next : candidate;
}

async function removeTemporaryFile(path) {
  try {
    await unlink(path);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
}

async function writeManifestAtomically(path, manifest) {
  const directory = dirname(path);
  const temporaryPath = join(
    directory,
    `.${basename(path)}.tmp-${process.pid}-${randomUUID()}`,
  );
  let handle;
  try {
    handle = await open(temporaryPath, 'wx', 0o600);
    await handle.writeFile(`${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    await handle.sync();
    await handle.close();
    handle = undefined;
    await rename(temporaryPath, path);
    await chmod(path, 0o600);
    const directoryHandle = await open(directory, 'r');
    try {
      await directoryHandle.sync();
    } finally {
      await directoryHandle.close();
    }
  } catch (error) {
    await handle?.close();
    await removeTemporaryFile(temporaryPath);
    throw error;
  }
}

export async function updateFixtureManifest(path, transform) {
  const resolvedPath = resolve(path);
  const lockPath = `${resolvedPath}.lock`;
  let lockHandle;
  try {
    lockHandle = await open(lockPath, 'wx', 0o600);
  } catch (error) {
    if (error?.code === 'EEXIST') fail(`another fixture operation owns ${lockPath}`);
    throw error;
  }

  try {
    await lockHandle.writeFile(`${JSON.stringify({
      processId: process.pid,
      startedAt: new Date().toISOString(),
    })}\n`, 'utf8');
    await lockHandle.sync();
    let current;
    try {
      current = JSON.parse(await readFile(resolvedPath, 'utf8'));
    } catch (error) {
      if (error instanceof SyntaxError) fail('the manifest is not valid JSON');
      throw error;
    }
    validateFixtureManifest(current);
    const next = transform(current);
    validateFixtureManifest(next);
    await writeManifestAtomically(resolvedPath, next);
    return next;
  } finally {
    try {
      await lockHandle.close();
    } finally {
      await unlink(lockPath);
    }
  }
}

export async function withFixtureOperationLock(path, operation, callback) {
  if (!/^[a-z][a-z0-9-]{1,31}$/.test(operation ?? '')) {
    fail('operation lock name is invalid');
  }
  const resolvedPath = resolve(path);
  const lockPath = `${resolvedPath}.${operation}.lock`;
  let lockHandle;
  try {
    lockHandle = await open(lockPath, 'wx', 0o600);
  } catch (error) {
    if (error?.code === 'EEXIST') fail(`another ${operation} operation owns ${lockPath}`);
    throw error;
  }
  try {
    await lockHandle.writeFile(`${JSON.stringify({
      processId: process.pid,
      operation,
      startedAt: new Date().toISOString(),
    })}\n`, 'utf8');
    await lockHandle.sync();
    return await callback();
  } finally {
    try {
      await lockHandle.close();
    } finally {
      await unlink(lockPath);
    }
  }
}

function parseCommand(arguments_) {
  const [manifestPath, command, ...values] = arguments_;
  if (!manifestPath || !command) {
    fail('usage: fixture-state.mjs MANIFEST.json COMMAND [VALUES...]');
  }
  if (command === 'record-id' && values.length === 3) {
    const [recordKey, table, id] = values;
    return { manifestPath, transform: (manifest) => recordGeneratedId(manifest, { recordKey, table, id }) };
  }
  if (command === 'record-snapshot' && values.length === 2) {
    const [recordKey, snapshot] = values;
    return { manifestPath, transform: (manifest) => recordVerifiedSnapshot(manifest, { recordKey, snapshot }) };
  }
  if (command === 'record-delegation' && values.length === 2) {
    const [recordKey, status] = values;
    return { manifestPath, transform: (manifest) => recordManagerDelegationStatus(manifest, { recordKey, status }) };
  }
  if (command === 'complete-reset' && values.length === 2) {
    const [attemptedAt, remaining] = values;
    return {
      manifestPath,
      transform: (manifest) => recordResetVerification(manifest, {
        attemptedAt,
        remainingManifestRecords: Number(remaining),
      }),
    };
  }
  fail('unsupported command or argument count');
}

async function main() {
  const { manifestPath, transform } = parseCommand(process.argv.slice(2));
  const manifest = await updateFixtureManifest(manifestPath, transform);
  process.stdout.write(`${JSON.stringify({
    status: 'fixture_manifest_updated',
    phase: manifest.phase,
    records: manifest.records.map((record) => ({
      key: record.key,
      generatedRecordCount: recordIdCount(record),
      verifiedSnapshotCount: record.snapshots.length,
      managerDelegationStatus: record.managerDelegationStatus,
    })),
  }, null, 2)}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
