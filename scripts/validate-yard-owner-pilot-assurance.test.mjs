import assert from 'node:assert/strict';
import test from 'node:test';
import {
  loadAssuranceInputs,
  validateAssuranceManifest,
} from './validate-yard-owner-pilot-assurance.mjs';

const inputs = loadAssuranceInputs();

test('the committed Yard Owner pilot assurance contract is complete', () => {
  assert.deepEqual(validateAssuranceManifest(inputs.manifest, inputs.runbookMarkdown), []);
});

test('private identifier labels are rejected', () => {
  const manifest = structuredClone(inputs.manifest);
  manifest.prohibited_label_terms = manifest.prohibited_label_terms.filter(
    (term) => term !== 'property_id',
  );
  manifest.metrics[0].allowed_labels.push('property_id');
  manifest.metrics[0].allowed_label_values.property_id = ['synthetic-property'];
  assert.match(
    validateAssuranceManifest(manifest, inputs.runbookMarkdown).join('\n'),
    /prohibited label property_id/,
  );
});

test('missing rehearsal scenarios are rejected', () => {
  const manifest = structuredClone(inputs.manifest);
  manifest.rehearsal_scenarios = manifest.rehearsal_scenarios.filter(
    (scenario) => scenario.id !== 'failed_revocation',
  );
  assert.match(
    validateAssuranceManifest(manifest, inputs.runbookMarkdown).join('\n'),
    /missing rehearsal scenario: failed_revocation/,
  );
});

test('metric families without an alert are rejected', () => {
  const manifest = structuredClone(inputs.manifest);
  manifest.alerts = manifest.alerts.filter(
    (alert) => alert.metric !== 'owner_provider_notification_backlog',
  );
  assert.match(
    validateAssuranceManifest(manifest, inputs.runbookMarkdown).join('\n'),
    /missing alert for metric family: notification/,
  );
});

test('uncontrolled trigger values are rejected', () => {
  const manifest = structuredClone(inputs.manifest);
  manifest.rehearsal_scenarios[0].trigger.labels.outcome = 'recipient@example.com';
  assert.match(
    validateAssuranceManifest(manifest, inputs.runbookMarkdown).join('\n'),
    /uses uncontrolled outcome value/,
  );
});

test('repository automation cannot mark external gates passed', () => {
  const manifest = structuredClone(inputs.manifest);
  manifest.external_blockers[0].status = 'passed';
  assert.match(
    validateAssuranceManifest(manifest, inputs.runbookMarkdown).join('\n'),
    /must remain external_pending or unsigned/,
  );
});

test('required external blockers cannot be omitted', () => {
  const manifest = structuredClone(inputs.manifest);
  manifest.external_blockers = manifest.external_blockers.filter(
    (blocker) => blocker.id !== 'privacy_security_approval',
  );
  assert.match(
    validateAssuranceManifest(manifest, inputs.runbookMarkdown).join('\n'),
    /missing external blocker: privacy_security_approval/,
  );
});
