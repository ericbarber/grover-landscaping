#!/usr/bin/env node

import { pathToFileURL } from 'node:url';

const safeIdentifier = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const safePersona = /^[a-z][a-z0-9-]{0,63}$/;
const safeCapability = /^[a-z][a-z0-9_]{0,63}$/;

class SmokeFailure extends Error {}

function fail(message) {
  throw new SmokeFailure(message);
}

function required(environment, name) {
  const value = environment[name];
  if (typeof value !== 'string' || value.length === 0) {
    fail(`${name} is required`);
  }
  return value;
}

function exactOrigin(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.origin !== value || url.pathname !== '/' || url.search || url.hash) {
      fail('BASE_URL must be an exact HTTPS origin');
    }
    return url.origin;
  } catch (error) {
    if (error instanceof SmokeFailure) throw error;
    fail('BASE_URL must be an exact HTTPS origin');
  }
}

function optionalIdentifier(environment, name) {
  const value = required(environment, name);
  if (value === 'none') return null;
  if (!safeIdentifier.test(value)) fail(`${name} must be a safe identifier or none`);
  return value;
}

function capabilityList(environment, name, { allowNone = false } = {}) {
  const value = required(environment, name);
  if (allowNone && value === 'none') return [];
  const capabilities = value.split(',').map((item) => item.trim()).filter(Boolean);
  if (capabilities.length === 0 || capabilities.some((item) => !safeCapability.test(item))) {
    fail(`${name} must be a comma-separated capability list${allowNone ? ' or none' : ''}`);
  }
  return [...new Set(capabilities)];
}

function probePaths(environment, name, baseUrl) {
  let value;
  try {
    value = JSON.parse(required(environment, name));
  } catch {
    fail(`${name} must be a JSON array of relative application paths`);
  }
  if (!Array.isArray(value) || value.length === 0 || value.length > 10) {
    fail(`${name} must contain between 1 and 10 paths`);
  }
  for (const path of value) {
    if (typeof path !== 'string'
      || !path.startsWith('/')
      || path.startsWith('//')
      || path.includes('\\')
      || path.includes('#')
      || path.includes('..')
      || /[\r\n]/.test(path)) {
      fail(`${name} contains an unsafe application path`);
    }
    try {
      if (new URL(path, `${baseUrl}/`).origin !== baseUrl) {
        fail(`${name} contains an unsafe application path`);
      }
    } catch (error) {
      if (error instanceof SmokeFailure) throw error;
      fail(`${name} contains an unsafe application path`);
    }
  }
  return value;
}

export function workspaceRolloutSmokeConfig(environment) {
  const baseUrl = exactOrigin(required(environment, 'BASE_URL'));
  const accessToken = required(environment, 'ACCESS_TOKEN');
  const personaId = required(environment, 'SMOKE_ROLLOUT_PERSONA');
  const enabledUnit = required(environment, 'SMOKE_ROLLOUT_UNIT');
  const scopeType = required(environment, 'SMOKE_ROLLOUT_SCOPE_TYPE');
  if (!safePersona.test(personaId)) fail('SMOKE_ROLLOUT_PERSONA must be a safe persona identifier');
  if (!safeIdentifier.test(enabledUnit)) fail('SMOKE_ROLLOUT_UNIT must be a safe unit identifier');
  if (!safeIdentifier.test(scopeType)) fail('SMOKE_ROLLOUT_SCOPE_TYPE must be a safe scope identifier');

  const timeoutSeconds = Number(environment.SMOKE_REQUEST_TIMEOUT_SECONDS ?? '30');
  if (!Number.isInteger(timeoutSeconds) || timeoutSeconds < 1 || timeoutSeconds > 300) {
    fail('SMOKE_REQUEST_TIMEOUT_SECONDS must be a whole number between 1 and 300');
  }
  const denialStatus = Number(environment.SMOKE_ROLLOUT_DENIAL_STATUS ?? '403');
  if (![403, 404].includes(denialStatus)) {
    fail('SMOKE_ROLLOUT_DENIAL_STATUS must be 403 or 404');
  }

  return {
    baseUrl,
    accessToken,
    personaId,
    enabledUnit,
    scopeType,
    scopeId: optionalIdentifier(environment, 'SMOKE_ROLLOUT_SCOPE_ID'),
    organizationId: optionalIdentifier(environment, 'SMOKE_ROLLOUT_ORGANIZATION_ID'),
    requiredCapabilities: capabilityList(environment, 'SMOKE_ROLLOUT_REQUIRED_CAPABILITIES'),
    forbiddenCapabilities: capabilityList(
      environment,
      'SMOKE_ROLLOUT_FORBIDDEN_CAPABILITIES',
      { allowNone: true },
    ),
    successPaths: probePaths(environment, 'SMOKE_ROLLOUT_SUCCESS_PATHS_JSON', baseUrl),
    denialPaths: probePaths(environment, 'SMOKE_ROLLOUT_DENIAL_PATHS_JSON', baseUrl),
    denialStatus,
    timeoutMilliseconds: timeoutSeconds * 1000,
  };
}

function projectionFor(config, accessSummary) {
  const rollout = accessSummary?.workspace_rollout;
  if (rollout?.contract_version !== 2
    || rollout?.enforcement_mode !== 'managed'
    || rollout?.rollout_mode !== 'cohort'
    || !Array.isArray(rollout?.personas)) {
    fail('access summary did not return the expected managed cohort contract');
  }

  const projection = rollout.personas.find((candidate) => (
    candidate?.persona_id === config.personaId
    && candidate?.scope?.scope_type === config.scopeType
    && (candidate?.scope?.scope_id ?? null) === config.scopeId
    && (candidate?.scope?.organization_id ?? null) === config.organizationId
  ));
  if (!projection) fail('access summary omitted the exact expected persona scope');
  if (projection.enabled_unit !== config.enabledUnit) {
    fail('access summary did not enable the expected rollout unit');
  }
  if (!projection.capabilities || typeof projection.capabilities !== 'object') {
    fail('access summary omitted the rollout capability map');
  }
  for (const capability of config.requiredCapabilities) {
    if (projection.capabilities[capability] !== true) {
      fail('access summary omitted a required cumulative capability');
    }
  }
  for (const capability of config.forbiddenCapabilities) {
    if (projection.capabilities[capability] !== false) {
      fail('access summary enabled a forbidden later-unit capability');
    }
  }
  return projection;
}

async function checkedFetch(fetchImplementation, url, init, failureMessage) {
  try {
    return await fetchImplementation(url, init);
  } catch {
    fail(failureMessage);
  }
}

async function jsonResponse(response, failureMessage) {
  if (!response?.ok) fail(failureMessage);
  try {
    return await response.json();
  } catch {
    fail(failureMessage);
  }
}

export async function runWorkspaceRolloutSmoke(
  environment,
  fetchImplementation = globalThis.fetch,
) {
  const config = workspaceRolloutSmokeConfig(environment);
  if (typeof fetchImplementation !== 'function') fail('A fetch implementation is required');
  const publicInit = () => ({
    redirect: 'error',
    signal: AbortSignal.timeout(config.timeoutMilliseconds),
  });
  const protectedInit = () => ({
    headers: { Authorization: `Bearer ${config.accessToken}` },
    redirect: 'error',
    signal: AbortSignal.timeout(config.timeoutMilliseconds),
  });

  const readiness = await jsonResponse(
    await checkedFetch(
      fetchImplementation,
      `${config.baseUrl}/health/ready`,
      publicInit(),
      'PostgreSQL readiness could not be verified',
    ),
    'PostgreSQL readiness could not be verified',
  );
  if (readiness?.status !== 'ok' || readiness?.persistence !== 'postgres') {
    fail('readiness did not report PostgreSQL persistence');
  }

  const authConfig = await jsonResponse(
    await checkedFetch(
      fetchImplementation,
      `${config.baseUrl}/auth/config`,
      publicInit(),
      'Cognito runtime mode could not be verified',
    ),
    'Cognito runtime mode could not be verified',
  );
  if (authConfig?.mode !== 'cognito') fail('runtime authentication did not report Cognito mode');

  const accessSummary = await jsonResponse(
    await checkedFetch(
      fetchImplementation,
      `${config.baseUrl}/me/access`,
      protectedInit(),
      'managed rollout access could not be verified',
    ),
    'managed rollout access could not be verified',
  );
  projectionFor(config, accessSummary);

  for (const [index, path] of config.successPaths.entries()) {
    const response = await checkedFetch(
      fetchImplementation,
      `${config.baseUrl}${path}`,
      protectedInit(),
      `authorized rollout probe ${index + 1} could not be completed`,
    );
    if (!response.ok) fail(`authorized rollout probe ${index + 1} did not succeed`);
  }

  for (const [index, path] of config.denialPaths.entries()) {
    const response = await checkedFetch(
      fetchImplementation,
      `${config.baseUrl}${path}`,
      protectedInit(),
      `cross-resource rollout probe ${index + 1} could not be completed`,
    );
    if (response.status !== config.denialStatus) {
      fail(`cross-resource rollout probe ${index + 1} did not fail closed`);
    }
  }

  return {
    personaId: config.personaId,
    enabledUnit: config.enabledUnit,
    successProbeCount: config.successPaths.length,
    denialProbeCount: config.denialPaths.length,
  };
}

async function main() {
  try {
    const result = await runWorkspaceRolloutSmoke(process.env);
    console.log(
      `Workspace rollout protected smoke passed for ${result.personaId}/${result.enabledUnit} `
      + `(${result.successProbeCount} authorized, ${result.denialProbeCount} denied).`,
    );
  } catch (error) {
    const message = error instanceof SmokeFailure
      ? error.message
      : 'unexpected protected smoke failure';
    console.error(`Workspace rollout protected smoke failed: ${message}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
