#!/usr/bin/env node

import { fileURLToPath } from 'node:url';
import { normalizeStudyApiUrl } from './validate-target.mjs';

const requiredReviewers = [
  ['organization-owner', 'local-review-organization-owner', 'OrganizationOwner'],
  ['manager', 'local-review-manager', 'Manager'],
  ['crew-lead', 'local-review-crew-lead', 'CrewLead'],
  ['property-manager', 'local-review-property-manager', 'PropertyManager'],
  ['property-owner-canyon', 'local-review-property-owner-canyon', 'PropertyOwner'],
  ['property-owner-sage', 'local-review-property-owner-sage', 'PropertyOwner'],
];

function fail(message) {
  throw new Error(`Yardfolio Study runtime is unsafe: ${message}`);
}

async function readJson(fetchImpl, url, label) {
  let response;
  try {
    response = await fetchImpl(url, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    fail(`the isolated study API is unavailable while checking ${label}`);
  }
  if (!response.ok) fail(`the isolated study API returned HTTP ${response.status} while checking ${label}`);
  try {
    return await response.json();
  } catch {
    fail(`the isolated study API returned invalid JSON while checking ${label}`);
  }
}

export function validateStudyRuntimeResponses(authConfig, readiness) {
  if (authConfig?.mode !== 'local_review') fail('the API is not in local_review mode');
  if (readiness?.status !== 'ok' || readiness?.persistence !== 'postgres') {
    fail('the API does not report ready PostgreSQL persistence');
  }
  if (readiness?.database_name !== 'yardfolio_study') {
    fail('the API is not bound to yardfolio_study');
  }
  if (!Array.isArray(authConfig.local_reviewers)) {
    fail('the API did not publish local-review identities');
  }
  for (const [reviewerId, userId, role] of requiredReviewers) {
    const reviewer = authConfig.local_reviewers.find(
      (candidate) => candidate?.reviewer_id === reviewerId,
    );
    if (reviewer?.user_id !== userId
      || reviewer?.roles?.length !== 1
      || reviewer.roles[0] !== role) {
      fail(`the required ${reviewerId} identity is unavailable or changed`);
    }
  }
  return {
    apiMode: 'local_review',
    persistence: 'postgres',
    databaseName: 'yardfolio_study',
    reviewerCount: authConfig.local_reviewers.length,
  };
}

export async function validateStudyRuntime({ apiUrl, fetchImpl = fetch } = {}) {
  if (!apiUrl) fail('YARDFOLIO_STUDY_API_URL is required');
  const normalizedApiUrl = normalizeStudyApiUrl(apiUrl);
  const [authConfig, readiness] = await Promise.all([
    readJson(fetchImpl, `${normalizedApiUrl}/auth/config`, 'review identities'),
    readJson(fetchImpl, `${normalizedApiUrl}/health/ready`, 'readiness'),
  ]);
  return {
    apiUrl: normalizedApiUrl,
    ...validateStudyRuntimeResponses(authConfig, readiness),
  };
}

async function main() {
  const result = await validateStudyRuntime({
    apiUrl: process.env.YARDFOLIO_STUDY_API_URL,
  });
  process.stdout.write(`${JSON.stringify({
    status: 'study_frontend_target_verified',
    ...result,
  }, null, 2)}\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
