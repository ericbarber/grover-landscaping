import assert from 'node:assert/strict';
import test from 'node:test';
import {
  validateProductBrandSources,
  validateRepositoryProductBrand,
} from './validate-product-brand.mjs';

const validSources = {
  productBrandSource: "export const PRODUCT_NAME = 'Yardfolio';",
  indexSource: '<meta content="Yardfolio"><meta content="Yardfolio Field"><meta content="Yardfolio connects care"><meta content="Yardfolio | Care"><title>Yardfolio | Care</title>',
  manifestSource: JSON.stringify({ name: 'Yardfolio Field Work', short_name: 'Yardfolio Field' }),
  iconSource: '<title id="title">Yardfolio</title>',
  publicSiteSource: Array.from({ length: 5 }, () => 'title: "Page | Yardfolio"').join('\n'),
  runtimeSources: [['components/ProductBrand.tsx', 'export function ProductBrand() {}']],
};

test('accepts the repository product-brand boundary', async () => {
  assert.deepEqual(await validateRepositoryProductBrand(), []);
});

test('rejects customer-visible hard-coded runtime copy', () => {
  const errors = validateProductBrandSources({
    ...validSources,
    runtimeSources: [['components/Example.tsx', '<p>Return to Yardfolio</p>']],
  });
  assert.deepEqual(errors, [
    'customer-visible product name must come from productBrand.ts: components/Example.tsx',
  ]);
});

test('rejects the former display name in runtime source', () => {
  assert.deepEqual(validateProductBrandSources({
    ...validSources,
    runtimeSources: [['components/Example.tsx', '<p>Return to Grover</p>']],
  }), [
    'former customer-visible product name remains in runtime source: components/Example.tsx',
  ]);
});

test('rejects stale metadata, manifest, icon, and server titles', () => {
  const errors = validateProductBrandSources({
    ...validSources,
    indexSource: validSources.indexSource.replaceAll('Yardfolio', 'OldName'),
    manifestSource: JSON.stringify({ name: 'OldName Field Work', short_name: 'OldName Field' }),
    iconSource: '<title>OldName Landscaping</title>',
    publicSiteSource: 'title: "Page | OldName"',
  });
  assert.equal(errors.length, 9);
  assert.ok(errors.some((error) => error.includes('web manifest name')));
  assert.ok(errors.some((error) => error.includes('app icon accessible title')));
  assert.ok(errors.some((error) => error.includes('server-rendered public route titles')));
});
