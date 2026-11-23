import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { validateFixtureManifest } from './validate-manifest.mjs';

const examplePath = fileURLToPath(new URL('./fixture-manifest.example.json', import.meta.url));
const example = () => JSON.parse(awaitableExample);
const awaitableExample = await readFile(examplePath, 'utf8');
const localFixture = () => ({
  ...example(),
  manifestKind: 'local_fixture',
  sourceCommit: '0123456789abcdef0123456789abcdef01234567',
  migrationCount: 126,
});

test('accepts the repository non-secret template only when explicitly allowed', () => {
  assert.equal(validateFixtureManifest(example(), { allowTemplate: true }).phase, 'prepared');
  assert.throws(() => validateFixtureManifest(example()), /manifestKind must be local_fixture/);
});

test('rejects the shared database and non-review API mode', () => {
  const shared = { ...example(), manifestKind: 'local_fixture', targetDatabaseName: 'yardfolio_landscaping' };
  assert.throws(() => validateFixtureManifest(shared), /isolated yardfolio_study/);
  const production = { ...example(), manifestKind: 'local_fixture', apiMode: 'cognito' };
  assert.throws(() => validateFixtureManifest(production), /apiMode must be local_review/);
});

test('requires a distinct fixed owner reviewer for each synthetic record', () => {
  const sharedOwner = structuredClone(example());
  sharedOwner.records[1].ownerReviewerId = sharedOwner.records[0].ownerReviewerId;
  assert.throws(
    () => validateFixtureManifest(sharedOwner, { allowTemplate: true }),
    /fixed local reviewer identities/,
  );
});

test('accepts API-generated IDs only under their owning record and known table prefix', () => {
  const manifest = {
    ...localFixture(),
    phase: 'seeded',
    records: example().records.map((record) => record.key === 'canyon' ? {
      ...record,
      generatedRecordIds: {
        owner_workspaces: ['local-review-property-owner-canyon'],
        owner_properties: ['owner_property_12345678'],
      },
    } : record),
  };
  assert.equal(validateFixtureManifest(manifest).phase, 'seeded');
  const wrongPrefix = structuredClone(manifest);
  wrongPrefix.records[0].generatedRecordIds.owner_properties = ['property_1001'];
  assert.throws(() => validateFixtureManifest(wrongPrefix), /does not match the API prefix/);
  const unknownTable = structuredClone(manifest);
  unknownTable.records[0].generatedRecordIds.unknown_records = ['unknown_12345678'];
  assert.throws(() => validateFixtureManifest(unknownTable), /allowed table/);
  const exactWorkspace = structuredClone(manifest);
  exactWorkspace.records[0].generatedRecordIds.owner_workspaces = [
    'local-review-property-owner-canyon',
  ];
  assert.equal(validateFixtureManifest(exactWorkspace).phase, 'seeded');
  const wrongWorkspace = structuredClone(exactWorkspace);
  wrongWorkspace.records[0].generatedRecordIds.owner_workspaces = [
    'local-review-property-owner-sage',
  ];
  assert.throws(() => validateFixtureManifest(wrongWorkspace), /workspace ownership/);
  const missingWorkspace = structuredClone(manifest);
  delete missingWorkspace.records[0].generatedRecordIds.owner_workspaces;
  assert.throws(() => validateFixtureManifest(missingWorkspace), /workspace before dependent/);
});

test('rejects secret or protected-content fields anywhere in the manifest', () => {
  const manifest = { ...example(), manifestKind: 'local_fixture', invitationToken: 'secret' };
  assert.throws(() => validateFixtureManifest(manifest), /not part of the manifest contract/);
});

test('rejects placeholder provenance and incomplete seeded lifecycle evidence', () => {
  const placeholder = { ...example(), manifestKind: 'local_fixture' };
  assert.throws(() => validateFixtureManifest(placeholder), /real sourceCommit/);

  const seeded = {
    ...localFixture(),
    phase: 'seeded',
  };
  assert.throws(() => validateFixtureManifest(seeded), /retain generated record IDs/);
});

test('requires ordered snapshot prefixes and matched verified checkpoints', () => {
  const manifest = {
    ...localFixture(),
    phase: 'verified',
    records: example().records.map((record) => ({
      ...record,
      generatedRecordIds: {
        owner_workspaces: [record.ownerUserId],
        owner_properties: [`owner_property_${record.key}123`],
      },
      snapshots: ['open_customer_decision'],
    })),
  };
  assert.equal(validateFixtureManifest(manifest).phase, 'verified');

  const skipped = structuredClone(manifest);
  skipped.records[0].snapshots = ['open_customer_decision', 'field_route'];
  assert.throws(() => validateFixtureManifest(skipped), /ordered lifecycle prefix/);

  const mismatched = structuredClone(manifest);
  mismatched.records[0].snapshots.push('accepted_not_scheduled');
  assert.throws(() => validateFixtureManifest(mismatched), /same lifecycle checkpoint/);
});

test('accepts a complete reset receipt and rejects incomplete reset proof', () => {
  const reset = {
    ...localFixture(),
    phase: 'reset',
    records: example().records.map((record) => record.key === 'canyon' ? {
      ...record,
      generatedRecordIds: {
        owner_workspaces: ['local-review-property-owner-canyon'],
        owner_properties: ['owner_property_12345678'],
      },
    } : record),
    resetVerification: {
      attemptedAt: '2026-10-01T18:00:00Z',
      remainingManifestRecords: 0,
    },
  };
  assert.equal(validateFixtureManifest(reset).phase, 'reset');
  assert.throws(
    () => validateFixtureManifest({
      ...reset,
      resetVerification: { ...reset.resetVerification, remainingManifestRecords: 1 },
    }),
    /zero remainingManifestRecords/,
  );
});
