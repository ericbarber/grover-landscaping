import assert from 'node:assert/strict';
import test from 'node:test';
import {
  prepareStudySession,
  resetStudySession,
  verifyStudySession,
} from './study-session.mjs';

const receipt = {
  checkpoint: 'open_customer_decision',
  fixtureRevision: 'yardfolio-study-matched-v1',
  sourceCommit: '1234567890abcdef1234567890abcdef12345678',
  asOfDate: '2026-10-10',
  recordLabels: ['Canyon View', 'Sage Lane'],
};

test('prepares, seeds, and admits one exact checkpoint in order', async () => {
  const calls = [];
  const result = await prepareStudySession({
    checkpoint: 'open_customer_decision',
    manifestPath: '.localdev/yardfolio-study/session.json',
    apiUrl: 'http://127.0.0.1:8081',
    sourceCommit: receipt.sourceCommit,
    asOfDate: receipt.asOfDate,
    prepareManifest: async (options) => {
      calls.push(['prepare', options]);
      return { outputPath: '/workspace/.localdev/yardfolio-study/session.json' };
    },
    seedManifest: async (options) => {
      calls.push(['seed', options]);
      return { phase: 'verified' };
    },
    validateCheckpoint: (manifest, checkpoint) => {
      calls.push(['validate', { manifest, checkpoint }]);
      return receipt;
    },
  });
  assert.deepEqual(result, receipt);
  assert.deepEqual(calls.map(([name]) => name), ['prepare', 'seed', 'validate']);
  assert.match(calls[0][1].outputPath, /\.localdev\/yardfolio-study\/session\.json$/);
  assert.equal(calls[1][1].manifestPath, '/workspace/.localdev/yardfolio-study/session.json');
  assert.equal(calls[1][1].stopAfter, 'open_customer_decision');
});

test('rejects invalid preparation before creating a manifest', async () => {
  let prepareCalled = false;
  await assert.rejects(
    prepareStudySession({
      checkpoint: 'rewound_proposal',
      manifestPath: '.localdev/yardfolio-study/session.json',
      prepareManifest: async () => { prepareCalled = true; },
    }),
    /supported forward-only lifecycle moment/,
  );
  assert.equal(prepareCalled, false);
  await assert.rejects(
    prepareStudySession({ checkpoint: 'open_customer_decision' }),
    /explicit new manifest path/,
  );
  await assert.rejects(
    prepareStudySession({
      checkpoint: 'open_customer_decision',
      manifestPath: 'session.json',
      prepareManifest: async () => { prepareCalled = true; },
    }),
    /under \.localdev\/yardfolio-study/,
  );
  assert.equal(prepareCalled, false);
});

test('verifies the runtime before admitting an existing session', async () => {
  const calls = [];
  const result = await verifyStudySession({
    checkpoint: 'open_customer_decision',
    manifestPath: '.localdev/yardfolio-study/session.json',
    apiUrl: 'http://127.0.0.1:8081',
    validateRuntime: async (options) => calls.push(['runtime', options]),
    loadManifest: async (path) => {
      calls.push(['load', path]);
      return { phase: 'verified' };
    },
    validateCheckpoint: (manifest, checkpoint) => {
      calls.push(['checkpoint', { manifest, checkpoint }]);
      return receipt;
    },
  });
  assert.deepEqual(result, receipt);
  assert.deepEqual(calls.map(([name]) => name), ['runtime', 'load', 'checkpoint']);
});

test('resets the exact manifest and proves an empty study target', async () => {
  const result = await resetStudySession({
    manifestPath: '.localdev/yardfolio-study/session.json',
    apiUrl: 'http://127.0.0.1:8081',
    resetManifest: async () => ({
      fixtureRevision: 'yardfolio-study-matched-v1',
      resetVerification: {
        attemptedAt: '2026-10-10T12:00:00.000Z',
        remainingManifestRecords: 0,
      },
    }),
    validateEmptyTarget: async () => ({
      databaseName: 'yardfolio_study',
      namespaceMatches: 0,
    }),
  });
  assert.deepEqual(result, {
    fixtureRevision: 'yardfolio-study-matched-v1',
    attemptedAt: '2026-10-10T12:00:00.000Z',
    remainingManifestRecords: 0,
    databaseName: 'yardfolio_study',
    namespaceMatches: 0,
  });
});
