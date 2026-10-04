#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const expectedRecords = new Map([
  ['canyon', {
    label: 'Canyon View',
    namespace: 'modern_study_canyon_',
    ownerReviewerId: 'property-owner-canyon',
    ownerUserId: 'local-review-property-owner-canyon',
  }],
  ['sage', {
    label: 'Sage Lane',
    namespace: 'modern_study_sage_',
    ownerReviewerId: 'property-owner-sage',
    ownerUserId: 'local-review-property-owner-sage',
  }],
]);
const generatedIdPrefixes = new Map([
  ['owner_workspaces', 'local-review-property-owner-'],
  ['owner_properties', 'owner_property_'],
  ['owner_yard_briefs', 'owner_brief_'],
  ['owner_provider_invitations', 'owner_provider_invitation_'],
  ['owner_provider_invitation_organization_claims', 'owner_provider_claim_'],
  ['owner_provider_invitation_response_capabilities', 'owner_provider_capability_'],
  ['owner_provider_disclosure_grants', 'owner_disclosure_grant_'],
  ['owner_provider_disclosure_receipts', 'owner_disclosure_receipt_'],
  ['owner_provider_assessments', 'owner_provider_assessment_'],
  ['owner_provider_initial_service_proposals', 'owner_provider_proposal_'],
  ['owner_provider_initial_service_proposal_decisions', 'owner_provider_proposal_decision_'],
  ['owner_provider_relationship_activations', 'owner_provider_activation_'],
  ['owner_provider_first_visit_proposals', 'owner_provider_first_visit_'],
  ['owner_provider_first_visit_decisions', 'owner_provider_first_visit_decision_'],
  ['owner_provider_service_releases', 'owner_provider_service_release_'],
  ['customer_accounts', 'acct_'],
  ['customer_properties', 'property_'],
  ['customer_portal_access_grants', 'portal_access_'],
  ['customer_property_manager_invitations', 'customer_pm_invitation_'],
  ['organization_memberships', 'membership_'],
  ['service_jobs', 'job_'],
  ['day_plans', 'day_plan_'],
  ['day_plan_stops', 'stop_'],
]);
const prohibitedKeyPattern = /(address|contact|email|message|note|payload|phone|photo|token)/i;
const allowedSnapshots = new Set([
  'open_customer_decision',
  'accepted_not_scheduled',
  'confirmed_visit',
  'field_route',
  'proof_review',
  'delivered_outcome',
]);
const allowedTopLevelKeys = new Set([
  'schemaVersion',
  'manifestKind',
  'fixtureRevision',
  'targetDatabaseName',
  'apiMode',
  'sourceCommit',
  'migrationCount',
  'asOfDate',
  'createdAt',
  'phase',
  'records',
  'resetVerification',
]);
const allowedRecordKeys = new Set([
  'key',
  'syntheticLabel',
  'requestNamespace',
  'ownerReviewerId',
  'ownerUserId',
  'managerReviewerId',
  'crewReviewerId',
  'managerDelegationStatus',
  'generatedRecordIds',
  'snapshots',
]);
const allowedResetKeys = new Set(['attemptedAt', 'remainingManifestRecords']);

function fail(message) {
  throw new Error(`Invalid Modern Grover fixture manifest: ${message}`);
}

function inspectForPrivateKeys(value, path = 'manifest') {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (prohibitedKeyPattern.test(key)) fail(`${path}.${key} is a prohibited private-data field`);
    inspectForPrivateKeys(child, `${path}.${key}`);
  }
}

function rejectUnknownKeys(value, allowedKeys, path) {
  for (const key of Object.keys(value)) {
    if (!allowedKeys.has(key)) fail(`${path}.${key} is not part of the manifest contract`);
  }
}

function isIsoTimestamp(value) {
  return typeof value === 'string'
    && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)
    && !Number.isNaN(Date.parse(value));
}

function isCalendarDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

export function validateFixtureManifest(manifest, { allowTemplate = false } = {}) {
  if (!manifest || Array.isArray(manifest) || typeof manifest !== 'object') {
    fail('manifest must be an object');
  }
  rejectUnknownKeys(manifest, allowedTopLevelKeys, 'manifest');
  if (manifest.schemaVersion !== 2) fail('schemaVersion must be 2');
  if (manifest.manifestKind !== 'local_fixture' && !(allowTemplate && manifest.manifestKind === 'template_only')) {
    fail('manifestKind must be local_fixture');
  }
  if (manifest.targetDatabaseName !== 'grover_modern_study') {
    fail('targetDatabaseName must be the isolated grover_modern_study database');
  }
  if (manifest.apiMode !== 'local_review') fail('apiMode must be local_review');
  if (!/^modern-grover-matched-v\d+$/.test(manifest.fixtureRevision)) {
    fail('fixtureRevision must use the modern-grover-matched-vN namespace');
  }
  if (!/^[0-9a-f]{40}$/.test(manifest.sourceCommit)) fail('sourceCommit must be a full lowercase Git commit');
  if (!Number.isInteger(manifest.migrationCount) || manifest.migrationCount < 0) {
    fail('migrationCount must be a non-negative integer');
  }
  if (!isCalendarDate(manifest.asOfDate)) fail('asOfDate must be a real YYYY-MM-DD calendar date');
  if (!isIsoTimestamp(manifest.createdAt)) fail('createdAt must be an ISO UTC timestamp');
  if (!['prepared', 'seeded', 'verified', 'reset'].includes(manifest.phase)) fail('phase is unsupported');
  const isTemplate = manifest.manifestKind === 'template_only';
  if (isTemplate) {
    if (manifest.sourceCommit !== '0000000000000000000000000000000000000000'
      || manifest.migrationCount !== 0
      || manifest.phase !== 'prepared') {
      fail('template_only manifests must retain placeholder source, migration, and phase values');
    }
  } else if (manifest.sourceCommit === '0000000000000000000000000000000000000000'
    || manifest.migrationCount === 0) {
    fail('local_fixture manifests require a real sourceCommit and applied migrationCount');
  }
  if (!Array.isArray(manifest.records) || manifest.records.length !== 2) {
    fail('records must contain exactly Canyon View and Sage Lane');
  }

  const seenKeys = new Set();
  const allGeneratedIds = new Set();
  for (const record of manifest.records) {
    if (!record || Array.isArray(record) || typeof record !== 'object') fail('each record must be an object');
    rejectUnknownKeys(record, allowedRecordKeys, `manifest.records[${seenKeys.size}]`);
    const expected = expectedRecords.get(record.key);
    if (!expected || seenKeys.has(record.key)) fail(`record key must be unique canyon or sage: ${record.key}`);
    seenKeys.add(record.key);
    if (record.syntheticLabel !== expected.label || record.requestNamespace !== expected.namespace) {
      fail(`record ${record.key} does not match its fixed synthetic label and namespace`);
    }
    if (record.ownerReviewerId !== expected.ownerReviewerId
      || record.ownerUserId !== expected.ownerUserId
      || record.managerReviewerId !== 'property-manager'
      || record.crewReviewerId !== 'crew-lead') {
      fail(`record ${record.key} must use the fixed local reviewer identities`);
    }
    if (!['not_created', 'pending', 'accepted', 'revoked'].includes(record.managerDelegationStatus)) {
      fail(`record ${record.key} has an unsupported managerDelegationStatus`);
    }
    if (!Array.isArray(record.snapshots) || record.snapshots.some((snapshot) => !allowedSnapshots.has(snapshot))) {
      fail(`record ${record.key} has an unsupported snapshot`);
    }
    if (new Set(record.snapshots).size !== record.snapshots.length) {
      fail(`record ${record.key} contains duplicate snapshots`);
    }

    if (!record.generatedRecordIds || Array.isArray(record.generatedRecordIds)
      || typeof record.generatedRecordIds !== 'object') {
      fail(`record ${record.key} generatedRecordIds must be an object keyed by table`);
    }
    for (const [table, ids] of Object.entries(record.generatedRecordIds)) {
      const expectedPrefix = generatedIdPrefixes.get(table);
      if (!expectedPrefix || !Array.isArray(ids) || ids.length === 0) {
        fail('generatedRecordIds entries require an allowed table and non-empty ID array');
      }
      for (const id of ids) {
        if (typeof id !== 'string' || id.length > 180 || !id.startsWith(expectedPrefix)) {
          fail(`generated ID does not match the API prefix for ${table}: ${String(id)}`);
        }
        if (allGeneratedIds.has(id)) fail(`generated ID is duplicated: ${id}`);
        allGeneratedIds.add(id);
      }
      if (table === 'owner_workspaces'
        && (ids.length !== 1 || ids[0] !== record.ownerUserId)) {
        fail(`record ${record.key} workspace ownership must equal its fixed ownerUserId`);
      }
      if (['owner_properties', 'owner_yard_briefs', 'owner_provider_invitations'].includes(table)
        && ids.length !== 1) {
        fail(`record ${record.key} must own exactly one ${table} foundation ID`);
      }
    }
    const generated = record.generatedRecordIds;
    const hasWorkspace = generated.owner_workspaces?.[0] === record.ownerUserId;
    if (Object.keys(generated).some((table) => table !== 'owner_workspaces') && !hasWorkspace) {
      fail(`record ${record.key} must journal its workspace before dependent records`);
    }
    if ((generated.owner_yard_briefs || generated.owner_provider_invitations)
      && !generated.owner_properties) {
      fail(`record ${record.key} must journal its property before brief or invitation records`);
    }
    if (generated.owner_provider_invitations && !generated.owner_yard_briefs) {
      fail(`record ${record.key} must journal its brief before invitation records`);
    }
  }
  if (!manifest.resetVerification || typeof manifest.resetVerification !== 'object') {
    fail('resetVerification is required');
  }
  rejectUnknownKeys(manifest.resetVerification, allowedResetKeys, 'manifest.resetVerification');
  if (manifest.phase === 'prepared' && allGeneratedIds.size !== 0) {
    fail('prepared manifests cannot claim generated record IDs');
  }
  if (['seeded', 'verified', 'reset'].includes(manifest.phase) && allGeneratedIds.size === 0) {
    fail(`${manifest.phase} manifests must retain generated record IDs`);
  }
  if (manifest.phase === 'verified'
    && manifest.records.some((record) => record.snapshots.length === 0)) {
    fail('verified manifests require at least one validated snapshot for each record');
  }
  const { attemptedAt, remainingManifestRecords } = manifest.resetVerification;
  if (manifest.phase === 'reset') {
    if (!isIsoTimestamp(attemptedAt) || remainingManifestRecords !== 0) {
      fail('reset manifests require an ISO attemptedAt and zero remainingManifestRecords');
    }
  } else if (attemptedAt !== null || remainingManifestRecords !== null) {
    fail('resetVerification must remain null until reset completes');
  }
  inspectForPrivateKeys(manifest);
  return manifest;
}

async function main() {
  const argumentsWithoutFlags = process.argv.slice(2).filter((argument) => argument !== '--allow-template');
  if (argumentsWithoutFlags.length !== 1) {
    throw new Error('Usage: validate-manifest.mjs [--allow-template] MANIFEST.json');
  }
  const path = resolve(argumentsWithoutFlags[0]);
  const manifest = JSON.parse(await readFile(path, 'utf8'));
  validateFixtureManifest(manifest, { allowTemplate: process.argv.includes('--allow-template') });
  process.stdout.write(`Modern Grover fixture manifest is valid: ${manifest.phase}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
