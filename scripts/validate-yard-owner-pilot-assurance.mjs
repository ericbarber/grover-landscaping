#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const defaultManifestPath = path.join(repositoryRoot, 'docs', 'yard-owner-acquisition-pilot-assurance.json');
export const defaultRunbookPath = path.join(repositoryRoot, 'docs', 'yard-owner-acquisition-pilot-operations-runbook.md');

const requiredMetricFamilies = new Set([
  'invitation_delivery',
  'suppression',
  'claim_review',
  'authorization',
  'disclosure',
  'response',
  'notification',
  'privacy',
  'support',
  'availability',
]);
const requiredScenarioIds = new Set([
  'bounce',
  'expiry',
  'wrong_recipient',
  'impersonation',
  'unintended_disclosure',
  'failed_revocation',
  'system_outage',
]);
const requiredProhibitedLabelTerms = new Set([
  'address',
  'photo',
  'media_id',
  'access_note',
  'message',
  'contact',
  'email',
  'token',
  'evidence_reference',
  'owner_user_id',
  'recipient_user_id',
  'property_id',
  'invitation_id',
  'organization_id',
  'grant_id',
  'receipt_id',
]);
const requiredExternalBlockerIds = new Set([
  'delivery_adapter_and_threat_review',
  'live_dashboard_alert_routing',
  'named_staffing_and_service_levels',
  'human_usability_assistive_technology_devices',
  'privacy_security_approval',
  'cross_functional_go_no_go',
]);
const alertFields = [
  'condition',
  'severity',
  'accountable_function',
  'runbook_anchor',
  'containment',
  'customer_safe_update',
  'recovery_check',
  'rollback_or_escalation',
];

function nonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function headingAnchor(heading) {
  return `#${heading
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')}`;
}

function runbookAnchors(markdown) {
  return new Set(markdown
    .split('\n')
    .filter((line) => /^#{1,6}\s+/.test(line))
    .map((line) => headingAnchor(line.replace(/^#{1,6}\s+/, ''))));
}

export function validateAssuranceManifest(manifest, runbookMarkdown) {
  const errors = [];
  if (manifest.schema_version !== 1) errors.push('schema_version must be 1');
  if (manifest.evidence_class !== 'automated_repository') {
    errors.push('evidence_class must remain automated_repository');
  }
  if (!Number.isInteger(manifest.metric_retention_days) || manifest.metric_retention_days < 1) {
    errors.push('metric_retention_days must be a positive integer');
  }

  const prohibitedTerms = Array.isArray(manifest.prohibited_label_terms)
    ? manifest.prohibited_label_terms
    : [];
  if (prohibitedTerms.length === 0) errors.push('prohibited_label_terms must not be empty');
  for (const term of requiredProhibitedLabelTerms) {
    if (!prohibitedTerms.includes(term)) errors.push(`missing prohibited label term: ${term}`);
  }
  const blockedLabelTerms = new Set([...prohibitedTerms, ...requiredProhibitedLabelTerms]);

  const metrics = Array.isArray(manifest.metrics) ? manifest.metrics : [];
  const metricMap = new Map();
  const metricFamilies = new Set();
  for (const metric of metrics) {
    if (!nonEmpty(metric.name)) {
      errors.push('every metric requires a name');
      continue;
    }
    if (metricMap.has(metric.name)) errors.push(`duplicate metric: ${metric.name}`);
    metricMap.set(metric.name, metric);
    metricFamilies.add(metric.family);
    if (!['counter', 'gauge'].includes(metric.kind)) {
      errors.push(`${metric.name} has unsupported kind ${metric.kind}`);
    }
    if (!Array.isArray(metric.allowed_labels) || metric.allowed_labels.length === 0) {
      errors.push(`${metric.name} requires controlled allowed_labels`);
      continue;
    }
    for (const label of metric.allowed_labels) {
      const normalized = String(label).toLowerCase();
      if ([...blockedLabelTerms].some((term) => normalized.includes(String(term).toLowerCase()))) {
        errors.push(`${metric.name} uses prohibited label ${label}`);
      }
      const values = metric.allowed_label_values?.[label];
      if (!Array.isArray(values) || values.length === 0 || values.some((value) => !nonEmpty(value))) {
        errors.push(`${metric.name}.${label} requires controlled label values`);
      }
    }
    for (const label of Object.keys(metric.allowed_label_values ?? {})) {
      if (!metric.allowed_labels.includes(label)) {
        errors.push(`${metric.name} defines values for undeclared label ${label}`);
      }
    }
  }
  for (const family of requiredMetricFamilies) {
    if (!metricFamilies.has(family)) errors.push(`missing metric family: ${family}`);
  }

  const anchors = runbookAnchors(runbookMarkdown);
  const alerts = Array.isArray(manifest.alerts) ? manifest.alerts : [];
  const alertMap = new Map();
  const alertFamilies = new Set();
  for (const alert of alerts) {
    if (!nonEmpty(alert.id)) {
      errors.push('every alert requires an id');
      continue;
    }
    if (alertMap.has(alert.id)) errors.push(`duplicate alert: ${alert.id}`);
    alertMap.set(alert.id, alert);
    if (!metricMap.has(alert.metric)) {
      errors.push(`${alert.id} references unknown metric ${alert.metric}`);
    } else {
      alertFamilies.add(metricMap.get(alert.metric).family);
    }
    for (const field of alertFields) {
      if (!nonEmpty(alert[field])) errors.push(`${alert.id} requires ${field}`);
    }
    if (nonEmpty(alert.runbook_anchor) && !anchors.has(alert.runbook_anchor)) {
      errors.push(`${alert.id} references missing runbook anchor ${alert.runbook_anchor}`);
    }
    if (!/^S[0-3]$/.test(alert.severity ?? '')) {
      errors.push(`${alert.id} has invalid severity ${alert.severity}`);
    }
  }
  for (const family of requiredMetricFamilies) {
    if (!alertFamilies.has(family)) errors.push(`missing alert for metric family: ${family}`);
  }

  const scenarios = Array.isArray(manifest.rehearsal_scenarios)
    ? manifest.rehearsal_scenarios
    : [];
  const scenarioIds = new Set();
  for (const scenario of scenarios) {
    if (!nonEmpty(scenario.id)) {
      errors.push('every rehearsal scenario requires an id');
      continue;
    }
    if (scenarioIds.has(scenario.id)) errors.push(`duplicate rehearsal scenario: ${scenario.id}`);
    scenarioIds.add(scenario.id);
    if (scenario.synthetic_only !== true) {
      errors.push(`${scenario.id} must remain synthetic_only`);
    }
    const metric = metricMap.get(scenario.trigger?.metric);
    const alert = alertMap.get(scenario.expected_alert);
    if (!metric) {
      errors.push(`${scenario.id} references unknown trigger metric ${scenario.trigger?.metric}`);
      continue;
    }
    if (!alert) {
      errors.push(`${scenario.id} references unknown alert ${scenario.expected_alert}`);
    } else if (alert.metric !== metric.name) {
      errors.push(`${scenario.id} trigger metric does not match alert metric`);
    }
    const labels = scenario.trigger?.labels ?? {};
    if (Object.keys(labels).length === 0) errors.push(`${scenario.id} requires trigger labels`);
    for (const [label, value] of Object.entries(labels)) {
      if (!metric.allowed_labels.includes(label)) {
        errors.push(`${scenario.id} uses undeclared label ${label}`);
      } else if (!metric.allowed_label_values[label].includes(value)) {
        errors.push(`${scenario.id} uses uncontrolled ${label} value ${value}`);
      }
    }
  }
  for (const scenarioId of requiredScenarioIds) {
    if (!scenarioIds.has(scenarioId)) errors.push(`missing rehearsal scenario: ${scenarioId}`);
  }

  const evidence = Array.isArray(manifest.automated_evidence) ? manifest.automated_evidence : [];
  if (evidence.length === 0) errors.push('automated_evidence must not be empty');
  for (const record of evidence) {
    if (!nonEmpty(record.id) || record.status !== 'passed') {
      errors.push('automated evidence records require an id and passed status');
    }
  }

  const blockers = Array.isArray(manifest.external_blockers) ? manifest.external_blockers : [];
  if (blockers.length === 0) errors.push('external_blockers must not be empty');
  const blockerIds = new Set();
  for (const blocker of blockers) {
    blockerIds.add(blocker.id);
    if (!nonEmpty(blocker.id) || !['external_pending', 'unsigned'].includes(blocker.status)) {
      errors.push(`external blocker ${blocker.id ?? '<missing>'} must remain external_pending or unsigned`);
    }
  }
  for (const blockerId of requiredExternalBlockerIds) {
    if (!blockerIds.has(blockerId)) errors.push(`missing external blocker: ${blockerId}`);
  }

  return errors;
}

export function loadAssuranceInputs(
  manifestPath = defaultManifestPath,
  runbookPath = defaultRunbookPath,
) {
  return {
    manifest: JSON.parse(fs.readFileSync(manifestPath, 'utf8')),
    runbookMarkdown: fs.readFileSync(runbookPath, 'utf8'),
  };
}

function main() {
  const { manifest, runbookMarkdown } = loadAssuranceInputs();
  const errors = validateAssuranceManifest(manifest, runbookMarkdown);
  if (errors.length > 0) {
    for (const error of errors) console.error(`ERROR ${error}`);
    process.exitCode = 1;
    return;
  }

  console.log(`Validated ${manifest.metrics.length} minimized metrics, ${manifest.alerts.length} alerts, and ${manifest.rehearsal_scenarios.length} rehearsal scenarios.`);
  if (process.argv.includes('--rehearse')) {
    const alerts = new Map(manifest.alerts.map((alert) => [alert.id, alert]));
    for (const scenario of manifest.rehearsal_scenarios) {
      const alert = alerts.get(scenario.expected_alert);
      console.log(`SYNTHETIC PASS ${scenario.id}: ${scenario.trigger.metric} -> ${alert.id} (${alert.severity}) -> ${alert.accountable_function}`);
    }
    console.log('Synthetic passes validate mechanics only; live integrations, staffing, and signed reviews remain pending.');
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
