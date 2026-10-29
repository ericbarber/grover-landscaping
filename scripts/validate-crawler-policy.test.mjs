import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { parseCrawlerPolicy, validateCrawlerPolicy } from './validate-crawler-policy.mjs';

const policyPath = fileURLToPath(new URL('../frontend/public/robots.txt', import.meta.url));
const repositoryPolicy = await readFile(policyPath, 'utf8');

test('accepts the repository crawler policy', () => {
  assert.deepEqual(validateCrawlerPolicy(repositoryPolicy), []);
  const parsed = parseCrawlerPolicy(repositoryPolicy);
  assert.ok(parsed.allows.includes('/'));
  assert.ok(parsed.disallows.includes('/app'));
});

test('rejects a policy that exposes protected or review routes', () => {
  const unsafe = repositoryPolicy
    .replace('Disallow: /app\n', '')
    .replace('Disallow: /yardfolio-study\n', '');
  assert.deepEqual(validateCrawlerPolicy(unsafe), [
    'required private/review exclusion is missing: /app',
    'required private/review exclusion is missing: /yardfolio-study',
  ]);
});

test('rejects broad exclusions that hide public audience pages', () => {
  const unsafe = `${repositoryPolicy}\nDisallow: /for-\n`;
  const errors = validateCrawlerPolicy(unsafe);
  assert.ok(errors.includes('public marketing path is disallowed: /for-yard-owners'));
  assert.ok(errors.includes('public marketing path is disallowed: /for-crew-leads'));
});

test('requires any future sitemap directive to use an absolute HTTPS canonical URL', () => {
  assert.match(
    validateCrawlerPolicy(`${repositoryPolicy}\nSitemap: /sitemap.xml\n`).join('\n'),
    /absolute HTTPS/,
  );
  assert.deepEqual(
    validateCrawlerPolicy(`${repositoryPolicy}\nSitemap: https://yardfolio.example/sitemap.xml\n`),
    [],
  );
});
