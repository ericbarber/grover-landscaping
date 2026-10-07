#!/usr/bin/env node

import { readFile, readdir } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url));
const legacyDisplayNames = ['Grover'];

function productNameFrom(source) {
  const match = source.match(/export const PRODUCT_NAME = '([^']+)'/);
  return match?.[1] ?? null;
}

function occurrencesOf(source, value) {
  return source.split(value).length - 1;
}

export function validateProductBrandSources({
  productBrandSource,
  indexSource,
  manifestSource,
  iconSource,
  publicSiteSource,
  runtimeSources,
}) {
  const errors = [];
  const productName = productNameFrom(productBrandSource);
  if (!productName) return ['frontend product brand must declare a literal PRODUCT_NAME'];

  const fieldAppName = `${productName} Field`;
  for (const [path, source] of runtimeSources) {
    if (source.includes(productName)) {
      errors.push(`customer-visible product name must come from productBrand.ts: ${path}`);
    }
    for (const legacyName of legacyDisplayNames) {
      if (legacyName !== productName && source.includes(legacyName)) {
        errors.push(`former customer-visible product name remains in runtime source: ${path}`);
      }
    }
  }

  const requiredIndexFragments = [
    `content="${productName}"`,
    `content="${fieldAppName}"`,
    `content="${productName} connects`,
    `content="${productName} |`,
    `<title>${productName} |`,
  ];
  for (const fragment of requiredIndexFragments) {
    if (!indexSource.includes(fragment)) {
      errors.push(`frontend index metadata is not aligned with PRODUCT_NAME: ${fragment}`);
    }
  }

  let manifest;
  try {
    manifest = JSON.parse(manifestSource);
  } catch {
    errors.push('web manifest must be valid JSON');
  }
  if (manifest) {
    if (!String(manifest.name ?? '').startsWith(productName)) {
      errors.push('web manifest name is not aligned with PRODUCT_NAME');
    }
    if (manifest.short_name !== fieldAppName) {
      errors.push('web manifest short_name is not aligned with FIELD_APP_NAME');
    }
  }

  if (!iconSource.includes(`>${productName}</title>`)) {
    errors.push('app icon accessible title is not aligned with PRODUCT_NAME');
  }
  if (occurrencesOf(publicSiteSource, `| ${productName}"`) !== 5) {
    errors.push('server-rendered public route titles are not aligned with PRODUCT_NAME');
  }

  return errors;
}

async function collectRuntimeSources(directory, prefix = '') {
  const sources = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    const absolutePath = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      sources.push(...await collectRuntimeSources(absolutePath, relativePath));
      continue;
    }
    if (!['.ts', '.tsx'].includes(extname(entry.name))) continue;
    if (entry.name === 'productBrand.ts' || /\.(test|spec)\.[^.]+$/.test(entry.name)) continue;
    sources.push([relativePath, await readFile(absolutePath, 'utf8')]);
  }
  return sources;
}

export async function validateRepositoryProductBrand(root = repositoryRoot) {
  const read = (path) => readFile(resolve(root, path), 'utf8');
  return validateProductBrandSources({
    productBrandSource: await read('frontend/src/productBrand.ts'),
    indexSource: await read('frontend/index.html'),
    manifestSource: await read('frontend/public/manifest.webmanifest'),
    iconSource: await read('frontend/public/app-icon.svg'),
    publicSiteSource: await read('backend/src/public_site.rs'),
    runtimeSources: await collectRuntimeSources(resolve(root, 'frontend/src')),
  });
}

async function main() {
  const errors = await validateRepositoryProductBrand();
  if (errors.length > 0) {
    for (const error of errors) process.stderr.write(`[FAILED] ${error}\n`);
    process.exitCode = 1;
    return;
  }
  process.stdout.write('Product brand is aligned across runtime, metadata, PWA, and server-rendered titles.\n');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
