import assert from 'node:assert/strict';
import test from 'node:test';
import {
  evaluateAuditOutput,
  evaluateAuditReport,
} from './audit-frontend-dependencies.mjs';

function report(overrides = {}) {
  return {
    metadata: {
      vulnerabilities: {
        info: 0,
        low: 0,
        moderate: 0,
        high: 0,
        critical: 0,
        total: 0,
        ...overrides,
      },
    },
  };
}

test('a clean audit passes', () => {
  const decision = evaluateAuditReport(report());
  assert.equal(decision.exitCode, 0);
  assert.match(decision.message, /audit passed/);
});

test('a moderate-only audit passes the high and critical policy', () => {
  const decision = evaluateAuditReport(report({ moderate: 2, total: 2 }));
  assert.equal(decision.exitCode, 0);
  assert.match(decision.message, /moderate=2 high=0 critical=0/);
});

test('a high finding blocks the audit', () => {
  const decision = evaluateAuditReport(report({ high: 1, total: 1 }), 1);
  assert.equal(decision.exitCode, 1);
  assert.match(decision.message, /audit blocked/);
});

test('a critical finding blocks the audit', () => {
  const decision = evaluateAuditReport(report({ critical: 1, total: 1 }), 1);
  assert.equal(decision.exitCode, 1);
  assert.match(decision.message, /critical=1/);
});

test('missing vulnerability metadata fails closed', () => {
  const decision = evaluateAuditReport({ metadata: {} });
  assert.equal(decision.exitCode, 2);
  assert.match(decision.message, /no vulnerability metadata/);
});

test('invalid vulnerability counts fail closed', () => {
  const decision = evaluateAuditReport(report({ high: 'unknown' }));
  assert.equal(decision.exitCode, 2);
  assert.match(decision.message, /invalid counts for high/);
});

test('malformed audit JSON fails closed', () => {
  const decision = evaluateAuditOutput('{not-json');
  assert.equal(decision.exitCode, 2);
  assert.match(decision.message, /malformed JSON/);
});

test('a nonzero npm result without findings fails closed', () => {
  const decision = evaluateAuditReport(report(), 1);
  assert.equal(decision.exitCode, 2);
  assert.match(decision.message, /npm exited with status 1/);
});
