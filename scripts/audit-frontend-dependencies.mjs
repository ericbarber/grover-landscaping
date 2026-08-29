#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const frontendDirectory = path.join(repositoryRoot, 'frontend');
const blockingSeverities = ['high', 'critical'];
const reportedSeverities = ['info', 'low', 'moderate', 'high', 'critical', 'total'];

function isCount(value) {
  return Number.isInteger(value) && value >= 0;
}

export function evaluateAuditReport(report, auditStatus = 0) {
  const counts = report?.metadata?.vulnerabilities;
  if (!counts || typeof counts !== 'object') {
    return {
      exitCode: 2,
      message: 'Frontend dependency audit failed closed: npm returned no vulnerability metadata.',
    };
  }

  const invalidSeverities = reportedSeverities.filter((severity) => !isCount(counts[severity]));
  if (invalidSeverities.length > 0) {
    return {
      exitCode: 2,
      message: `Frontend dependency audit failed closed: invalid counts for ${invalidSeverities.join(', ')}.`,
    };
  }

  const summary = reportedSeverities
    .map((severity) => `${severity}=${counts[severity]}`)
    .join(' ');
  const blockingCount = blockingSeverities.reduce(
    (total, severity) => total + counts[severity],
    0,
  );

  if (blockingCount > 0) {
    return {
      exitCode: 1,
      message: `Frontend dependency audit blocked: ${summary}.`,
    };
  }

  if (auditStatus !== 0) {
    return {
      exitCode: 2,
      message: `Frontend dependency audit failed closed: npm exited with status ${auditStatus}; ${summary}.`,
    };
  }

  return {
    exitCode: 0,
    message: `Frontend dependency audit passed: ${summary}.`,
  };
}

export function evaluateAuditOutput(output, auditStatus = 0) {
  try {
    return evaluateAuditReport(JSON.parse(output), auditStatus);
  } catch (error) {
    return {
      exitCode: 2,
      message: `Frontend dependency audit failed closed: npm returned malformed JSON (${error.message}).`,
    };
  }
}

function main() {
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const result = spawnSync(
    npmCommand,
    ['audit', '--audit-level=high', '--json'],
    {
      cwd: frontendDirectory,
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    },
  );

  if (result.error) {
    console.error(`Frontend dependency audit failed closed: could not run npm audit (${result.error.message}).`);
    process.exitCode = 2;
    return;
  }

  const decision = evaluateAuditOutput(result.stdout, result.status);
  const write = decision.exitCode === 0 ? console.log : console.error;
  write(decision.message);
  process.exitCode = decision.exitCode;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
