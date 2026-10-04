import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { validateQualityBudgets } from './validate-quality-budgets.mjs';

async function fixture(overrides = {}) {
  const root = await mkdtemp(join(tmpdir(), 'grover-quality-budget-'));
  const dist = join(root, 'dist');
  const assets = join(dist, 'assets');
  const publicDirectory = join(root, 'public');
  await mkdir(assets, { recursive: true });
  await mkdir(publicDirectory, { recursive: true });
  await writeFile(join(assets, 'App-hash.js'), 'a'.repeat(80));
  await writeFile(join(assets, 'manager-workspaces-hash.js'), 'b'.repeat(90));
  await writeFile(join(assets, 'PublicLandingPage-hash.js'), 'c'.repeat(50));
  await writeFile(join(assets, 'index.css'), 'd'.repeat(40));
  await writeFile(join(dist, 'index.html'), '<main>Grover</main>');
  await writeFile(join(publicDirectory, 'hero.webp'), 'e'.repeat(30));
  const budget = join(root, 'quality-budgets.json');
  await writeFile(budget, JSON.stringify({
    schemaVersion: 1,
    baselineDate: '2026-10-01',
    frontendArtifacts: {
      maxLargestJavaScriptChunkBytes: 100,
      maxTotalJavaScriptBytes: 250,
      maxTotalJavaScriptGzipBytes: 100,
      maxTotalCssBytes: 50,
      maxTotalCssGzipBytes: 50,
      maxTotalDistBytes: 400,
      maxLargestPublicImageBytes: 40,
      requiredChunkMaximums: { 'App-': 90, 'manager-workspaces-': 100, 'PublicLandingPage-': 60 },
      ...overrides,
    },
    metricPrivacy: {
      allowedDimensions: ['outcome'], forbiddenDimensions: ['tenant_id'],
      realUserMeasurementStatus: 'not_approved',
    },
    operationalIndicators: [{
      name: 'grover_test_total', kind: 'counter', allowedDimensions: ['outcome'],
      owner: 'test_owner', runbook: 'docs/test.md', protectedStatus: 'external_pending',
    }],
  }));
  return { root, dist, publicDirectory, budget };
}

test('accepts a complete build inside every artifact budget', async (t) => {
  const files = await fixture();
  t.after(() => rm(files.root, { recursive: true, force: true }));
  const report = await validateQualityBudgets(files);
  assert.equal(report.failures.length, 0);
  assert.equal(report.requiredChunks['App-'].matched, 1);
});

test('reports an actionable byte regression', async (t) => {
  const files = await fixture({ maxTotalJavaScriptBytes: 200 });
  t.after(() => rm(files.root, { recursive: true, force: true }));
  const report = await validateQualityBudgets(files);
  assert.deepEqual(report.failures, ['total JavaScript: 220 bytes exceeds 200 bytes']);
});

test('fails when a required stable chunk boundary disappears', async (t) => {
  const files = await fixture({ requiredChunkMaximums: { 'missing-': 100 } });
  t.after(() => rm(files.root, { recursive: true, force: true }));
  const report = await validateQualityBudgets(files);
  assert.deepEqual(report.failures, ['required JavaScript chunk prefix missing- matched 0 files']);
});

test('rejects a privacy dimension that is both allowed and forbidden', async (t) => {
  const files = await fixture();
  t.after(() => rm(files.root, { recursive: true, force: true }));
  const budget = JSON.parse(await (await import('node:fs/promises')).readFile(files.budget, 'utf8'));
  budget.metricPrivacy.forbiddenDimensions.push('outcome');
  await writeFile(files.budget, JSON.stringify(budget));
  await assert.rejects(
    () => validateQualityBudgets(files),
    /metric dimension cannot be both allowed and forbidden: outcome/,
  );
});

test('rejects operational dimensions outside the privacy allowlist', async (t) => {
  const files = await fixture();
  t.after(() => rm(files.root, { recursive: true, force: true }));
  const budget = JSON.parse(await (await import('node:fs/promises')).readFile(files.budget, 'utf8'));
  budget.operationalIndicators[0].allowedDimensions.push('property_id');
  await writeFile(files.budget, JSON.stringify(budget));
  await assert.rejects(
    () => validateQualityBudgets(files),
    /uses unapproved dimension: property_id/,
  );
});
