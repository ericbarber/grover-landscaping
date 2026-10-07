import assert from 'node:assert/strict';
import test from 'node:test';
import {
  validateProductBrandSources,
  validateRepositoryProductBrand,
} from './validate-product-brand.mjs';

const validSources = {
  productBrandSource: "export const PRODUCT_NAME = 'Grover';",
  indexSource: '<meta content="Grover"><meta content="Grover Field"><meta content="Grover connects care"><meta content="Grover | Care"><title>Grover | Care</title>',
  manifestSource: JSON.stringify({ name: 'Grover Landscaping Field Work', short_name: 'Grover Field' }),
  iconSource: '<title id="title">Grover Landscaping</title>',
  publicSiteSource: Array.from({ length: 5 }, () => 'title: "Page | Grover"').join('\n'),
  runtimeSources: [['components/GroverBrand.tsx', 'export function GroverBrand() {}']],
};

test('accepts the repository product-brand boundary', async () => {
  assert.deepEqual(await validateRepositoryProductBrand(), []);
});

test('rejects customer-visible hard-coded runtime copy', () => {
  const errors = validateProductBrandSources({
    ...validSources,
    runtimeSources: [['components/Example.tsx', '<p>Return to Grover</p>']],
  });
  assert.deepEqual(errors, [
    'customer-visible product name must come from productBrand.ts: components/Example.tsx',
  ]);
});

test('rejects stale metadata, manifest, icon, and server titles', () => {
  const errors = validateProductBrandSources({
    ...validSources,
    indexSource: validSources.indexSource.replaceAll('Grover', 'OldName'),
    manifestSource: JSON.stringify({ name: 'OldName Field Work', short_name: 'OldName Field' }),
    iconSource: '<title>OldName Landscaping</title>',
    publicSiteSource: 'title: "Page | OldName"',
  });
  assert.equal(errors.length, 9);
  assert.ok(errors.some((error) => error.includes('web manifest name')));
  assert.ok(errors.some((error) => error.includes('app icon accessible title')));
  assert.ok(errors.some((error) => error.includes('server-rendered public route titles')));
});
