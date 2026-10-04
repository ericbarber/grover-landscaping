#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const requiredDisallows = [
  '/app',
  '/auth/',
  '/diagnostics',
  '/organization-invitations/',
  '/bid-review/',
  '/report-view/',
  '/design',
  '/modern-grover',
];
const publicPaths = [
  '/',
  '/for-yard-owners',
  '/for-property-managers',
  '/for-landscaping-companies',
  '/for-crew-leads',
];

export function parseCrawlerPolicy(source) {
  const policy = { userAgents: [], allows: [], disallows: [], sitemaps: [] };
  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.replace(/\s+#.*$/, '').trim();
    if (!line) continue;
    const separator = line.indexOf(':');
    if (separator < 1) continue;
    const name = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();
    if (name === 'user-agent') policy.userAgents.push(value);
    if (name === 'allow') policy.allows.push(value);
    if (name === 'disallow') policy.disallows.push(value);
    if (name === 'sitemap') policy.sitemaps.push(value);
  }
  return policy;
}

function pathIsDisallowed(path, disallows) {
  return disallows.some((rule) => rule !== '' && path.startsWith(rule));
}

export function validateCrawlerPolicy(source) {
  const policy = parseCrawlerPolicy(source);
  const errors = [];
  if (!policy.userAgents.includes('*')) errors.push('a global User-agent: * policy is required');
  if (!policy.allows.includes('/')) errors.push('the global public root must be allowed');
  for (const path of requiredDisallows) {
    if (!policy.disallows.includes(path)) errors.push(`required private/review exclusion is missing: ${path}`);
  }
  for (const path of publicPaths) {
    if (pathIsDisallowed(path, policy.disallows)) errors.push(`public marketing path is disallowed: ${path}`);
  }
  for (const rule of policy.disallows) {
    if (rule.includes('?') || rule.includes('#')) errors.push(`crawler exclusion must not contain query or fragment data: ${rule}`);
  }
  for (const sitemap of policy.sitemaps) {
    try {
      const url = new URL(sitemap);
      if (url.protocol !== 'https:' || url.pathname !== '/sitemap.xml' || url.search || url.hash) {
        errors.push('Sitemap must be an absolute HTTPS /sitemap.xml URL');
      }
    } catch {
      errors.push('Sitemap must be an absolute HTTPS /sitemap.xml URL');
    }
  }
  return errors;
}

async function main() {
  const [policyPath = 'frontend/public/robots.txt', ...extraArguments] = process.argv.slice(2);
  if (extraArguments.length > 0) {
    process.stderr.write('Usage: node scripts/validate-crawler-policy.mjs [robots.txt]\n');
    process.exitCode = 64;
    return;
  }
  let source;
  try {
    source = await readFile(resolve(policyPath), 'utf8');
  } catch {
    process.stderr.write('Crawler policy is not readable.\n');
    process.exitCode = 1;
    return;
  }
  const errors = validateCrawlerPolicy(source);
  if (errors.length > 0) {
    for (const error of errors) process.stderr.write(`[FAILED] ${error}\n`);
    process.exitCode = 1;
    return;
  }
  process.stdout.write('Crawler policy preserves public discovery and excludes protected/review routes.\n');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
