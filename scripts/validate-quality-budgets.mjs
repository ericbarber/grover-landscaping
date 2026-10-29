#!/usr/bin/env node

import { gzipSync } from 'node:zlib';
import { readFile, readdir, stat } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));

function parseArguments(argv) {
  const options = {
    budget: join(repositoryRoot, 'quality-budgets.json'),
    dist: join(repositoryRoot, 'frontend', 'dist'),
    publicDirectory: join(repositoryRoot, 'frontend', 'public'),
    json: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--json') {
      options.json = true;
      continue;
    }
    if (argument === '--budget' || argument === '--dist' || argument === '--public') {
      const value = argv[index + 1];
      if (!value) throw new Error(`${argument} requires a path`);
      index += 1;
      const key = argument === '--public' ? 'publicDirectory' : argument.slice(2);
      options[key] = resolve(value);
      continue;
    }
    throw new Error(`Unknown argument: ${argument}`);
  }
  return options;
}

async function filesBelow(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesBelow(path));
    if (entry.isFile()) files.push(path);
  }
  return files;
}

async function fileMeasurements(files) {
  return Promise.all(files.map(async (path) => {
    const bytes = (await stat(path)).size;
    const content = await readFile(path);
    return { path, bytes, gzipBytes: gzipSync(content).length };
  }));
}

function total(records, field = 'bytes') {
  return records.reduce((sum, record) => sum + record[field], 0);
}

function largest(records) {
  return records.reduce((current, record) => (
    !current || record.bytes > current.bytes ? record : current
  ), null);
}

function validateBudgetShape(budget) {
  if (budget.schemaVersion !== 1) throw new Error('quality budget schemaVersion must be 1');
  const values = Object.values(budget.frontendArtifacts ?? {});
  if (values.length === 0) throw new Error('frontendArtifacts budgets are required');
  for (const [name, value] of Object.entries(budget.frontendArtifacts)) {
    if (name === 'requiredChunkMaximums') continue;
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error(`${name} must be a positive integer byte budget`);
    }
  }
  for (const [prefix, value] of Object.entries(budget.frontendArtifacts.requiredChunkMaximums ?? {})) {
    if (!prefix || !Number.isInteger(value) || value <= 0) {
      throw new Error('required chunk budgets need a non-empty prefix and positive integer bytes');
    }
  }
  const privacy = budget.metricPrivacy ?? {};
  if (!Array.isArray(privacy.allowedDimensions) || !Array.isArray(privacy.forbiddenDimensions)) {
    throw new Error('metricPrivacy allowedDimensions and forbiddenDimensions are required');
  }
  const overlap = privacy.allowedDimensions.filter((value) => privacy.forbiddenDimensions.includes(value));
  if (overlap.length > 0) throw new Error(`metric dimension cannot be both allowed and forbidden: ${overlap.join(', ')}`);
  const indicatorNames = new Set();
  for (const indicator of budget.operationalIndicators ?? []) {
    if (!indicator.name || indicatorNames.has(indicator.name)) {
      throw new Error(`operational indicator names must be non-empty and unique: ${indicator.name ?? ''}`);
    }
    indicatorNames.add(indicator.name);
    if (!['counter', 'gauge', 'histogram'].includes(indicator.kind)) {
      throw new Error(`operational indicator ${indicator.name} has an unsupported kind`);
    }
    if (!indicator.owner || !indicator.runbook || !indicator.protectedStatus) {
      throw new Error(`operational indicator ${indicator.name} requires owner, runbook, and protectedStatus`);
    }
    for (const dimension of indicator.allowedDimensions ?? []) {
      if (!privacy.allowedDimensions.includes(dimension)) {
        throw new Error(`operational indicator ${indicator.name} uses unapproved dimension: ${dimension}`);
      }
      if (privacy.forbiddenDimensions.includes(dimension)) {
        throw new Error(`operational indicator ${indicator.name} uses forbidden dimension: ${dimension}`);
      }
    }
  }
}

function budgetCheck(name, actual, maximum, failures) {
  if (actual > maximum) failures.push(`${name}: ${actual} bytes exceeds ${maximum} bytes`);
  return { actualBytes: actual, maximumBytes: maximum, passed: actual <= maximum };
}

export async function validateQualityBudgets(options) {
  const budget = JSON.parse(await readFile(options.budget, 'utf8'));
  validateBudgetShape(budget);
  const distFiles = await fileMeasurements(await filesBelow(options.dist));
  const publicFiles = await fileMeasurements(await filesBelow(options.publicDirectory));
  const javascript = distFiles.filter((record) => extname(record.path) === '.js');
  const css = distFiles.filter((record) => extname(record.path) === '.css');
  const publicImages = publicFiles.filter((record) => ['.avif', '.gif', '.jpeg', '.jpg', '.png', '.webp'].includes(extname(record.path).toLowerCase()));
  if (javascript.length === 0) throw new Error('production build contains no JavaScript assets');
  if (css.length === 0) throw new Error('production build contains no CSS assets');

  const failures = [];
  const limits = budget.frontendArtifacts;
  const report = {
    schemaVersion: budget.schemaVersion,
    baselineDate: budget.baselineDate,
    measurements: {
      largestJavaScriptChunk: budgetCheck('largest JavaScript chunk', largest(javascript).bytes, limits.maxLargestJavaScriptChunkBytes, failures),
      totalJavaScript: budgetCheck('total JavaScript', total(javascript), limits.maxTotalJavaScriptBytes, failures),
      totalJavaScriptGzip: budgetCheck('total JavaScript gzip', total(javascript, 'gzipBytes'), limits.maxTotalJavaScriptGzipBytes, failures),
      totalCss: budgetCheck('total CSS', total(css), limits.maxTotalCssBytes, failures),
      totalCssGzip: budgetCheck('total CSS gzip', total(css, 'gzipBytes'), limits.maxTotalCssGzipBytes, failures),
      totalDist: budgetCheck('total dist', total(distFiles), limits.maxTotalDistBytes, failures),
      largestPublicImage: budgetCheck('largest public image', largest(publicImages)?.bytes ?? 0, limits.maxLargestPublicImageBytes, failures),
    },
    requiredChunks: {},
    failures,
  };

  for (const [prefix, maximum] of Object.entries(limits.requiredChunkMaximums)) {
    const matches = javascript.filter((record) => record.path.split('/').at(-1).startsWith(prefix));
    if (matches.length !== 1) {
      failures.push(`required JavaScript chunk prefix ${prefix} matched ${matches.length} files`);
      report.requiredChunks[prefix] = { matched: matches.length, maximumBytes: maximum, passed: false };
      continue;
    }
    report.requiredChunks[prefix] = {
      ...budgetCheck(`chunk ${prefix}`, matches[0].bytes, maximum, failures),
      matched: 1,
    };
  }
  return report;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const report = await validateQualityBudgets(options);
  if (options.json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    for (const [name, measurement] of Object.entries(report.measurements)) {
      process.stdout.write(`${name}: ${measurement.actualBytes}/${measurement.maximumBytes} bytes\n`);
    }
    for (const [prefix, measurement] of Object.entries(report.requiredChunks)) {
      process.stdout.write(`chunk ${prefix}: ${measurement.actualBytes ?? 'missing'}/${measurement.maximumBytes} bytes\n`);
    }
  }
  if (report.failures.length > 0) {
    for (const failure of report.failures) process.stderr.write(`Quality budget failed: ${failure}\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write('Quality budgets passed.\n');
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`Quality budget validation error: ${error.message}\n`);
    process.exitCode = 1;
  });
}
