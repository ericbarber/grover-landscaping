#!/usr/bin/env node

import { readFile, readdir } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url));
const formerDisplayNames = ['Yardfolio'];

function frontendDisplayNameFrom(source) {
  const match = source.match(/export const APP_DISPLAY_NAME = '([^']+)'/);
  return match?.[1] ?? null;
}

function backendDisplayNameFrom(source) {
  const match = source.match(/pub const APP_DISPLAY_NAME: &str = "([^"]+)"/);
  return match?.[1] ?? null;
}

export function validateProductBrandSources({
  applicationIdentitySource,
  backendApplicationIdentitySource,
  indexSource,
  manifestSource,
  iconSource,
  publicSiteSource,
  runtimeSources,
}) {
  const errors = [];
  const displayName = frontendDisplayNameFrom(applicationIdentitySource);
  if (!displayName) return ['frontend application identity must declare a literal APP_DISPLAY_NAME'];
  const backendDisplayName = backendDisplayNameFrom(backendApplicationIdentitySource);
  if (backendDisplayName !== displayName) {
    errors.push('backend APP_DISPLAY_NAME is not aligned with frontend APP_DISPLAY_NAME');
  }

  const fieldAppName = `${displayName} Field`;
  for (const [path, source] of runtimeSources) {
    if (source.includes(displayName)) {
      errors.push(`customer-visible application name must come from appIdentity.ts: ${path}`);
    }
    for (const formerName of formerDisplayNames) {
      if (formerName !== displayName && source.includes(formerName)) {
        errors.push(`former customer-visible product name remains in runtime source: ${path}`);
      }
    }
  }

  const requiredIndexFragments = [
    `content="${displayName}"`,
    `content="${fieldAppName}"`,
    `content="${displayName} connects`,
    `content="${displayName} |`,
    `<title>${displayName} |`,
  ];
  for (const fragment of requiredIndexFragments) {
    if (!indexSource.includes(fragment)) {
      errors.push(`frontend index metadata is not aligned with APP_DISPLAY_NAME: ${fragment}`);
    }
  }

  let manifest;
  try {
    manifest = JSON.parse(manifestSource);
  } catch {
    errors.push('web manifest must be valid JSON');
  }
  if (manifest) {
    if (!String(manifest.name ?? '').startsWith(displayName)) {
      errors.push('web manifest name is not aligned with APP_DISPLAY_NAME');
    }
    if (manifest.short_name !== fieldAppName) {
      errors.push('web manifest short_name is not aligned with FIELD_APP_DISPLAY_NAME');
    }
  }

  if (!iconSource.includes(`>${displayName}</title>`)) {
    errors.push('app icon accessible title is not aligned with APP_DISPLAY_NAME');
  }
  if (!publicSiteSource.includes('app_page_title(metadata.title)')) {
    errors.push('server-rendered public route titles must compose through app_page_title');
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
    if (entry.name === 'appIdentity.ts' || /\.(test|spec)\.[^.]+$/.test(entry.name)) continue;
    sources.push([relativePath, await readFile(absolutePath, 'utf8')]);
  }
  return sources;
}

export async function validateRepositoryProductBrand(root = repositoryRoot) {
  const read = (path) => readFile(resolve(root, path), 'utf8');
  return validateProductBrandSources({
    applicationIdentitySource: await read('frontend/src/appIdentity.ts'),
    backendApplicationIdentitySource: await read('backend/src/application_identity.rs'),
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
