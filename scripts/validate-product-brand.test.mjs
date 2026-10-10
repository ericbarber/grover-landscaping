import assert from 'node:assert/strict';
import test from 'node:test';
import {
  validateProductBrandSources,
  validateRepositoryProductBrand,
} from './validate-product-brand.mjs';

const validSources = {
  applicationIdentitySource: "export const APP_DISPLAY_NAME = 'Grover';",
  backendApplicationIdentitySource: 'pub const APP_DISPLAY_NAME: &str = "Grover";',
  indexSource: '<meta content="Grover"><meta content="Grover Field"><meta content="Grover connects care"><meta content="Grover | Care"><title>Grover | Care</title>',
  manifestSource: JSON.stringify({ name: 'Grover Field Work', short_name: 'Grover Field' }),
  iconSource: '<title id="title">Grover</title>',
  runtimeSources: [['components/ProductBrand.tsx', 'export function ProductBrand() {}']],
};

test('accepts the repository product-brand boundary', async () => {
  assert.deepEqual(await validateRepositoryProductBrand(), []);
});

test('rejects customer-visible hard-coded runtime copy', () => {
  assert.deepEqual(validateProductBrandSources({
    ...validSources,
    runtimeSources: [['components/Example.tsx', '<p>Return to Grover</p>']],
  }), [
    'customer-visible application name must come from appIdentity.ts: components/Example.tsx',
  ]);
});

test('rejects the former display name in runtime source', () => {
  assert.deepEqual(validateProductBrandSources({
    ...validSources,
    runtimeSources: [['components/Example.tsx', '<p>Return to Yardfolio</p>']],
  }), [
    'former customer-visible product name remains in runtime source: components/Example.tsx',
  ]);
});

test('rejects stale metadata, manifest, and icon identity', () => {
  const errors = validateProductBrandSources({
    ...validSources,
    indexSource: validSources.indexSource.replaceAll('Grover', 'OldName'),
    manifestSource: JSON.stringify({ name: 'OldName Field Work', short_name: 'OldName Field' }),
    iconSource: '<title>OldName</title>',
  });
  assert.equal(errors.length, 8);
  assert.ok(errors.some((error) => error.includes('web manifest name')));
  assert.ok(errors.some((error) => error.includes('app icon accessible title')));
});

test('rejects a backend display-name mismatch', () => {
  assert.deepEqual(validateProductBrandSources({
    ...validSources,
    backendApplicationIdentitySource: 'pub const APP_DISPLAY_NAME: &str = "OldName";',
  }), [
    'backend APP_DISPLAY_NAME is not aligned with frontend APP_DISPLAY_NAME',
  ]);
});
