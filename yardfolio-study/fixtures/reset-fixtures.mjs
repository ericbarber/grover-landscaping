#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  recordResetVerification,
  updateFixtureManifest,
  withFixtureOperationLock,
} from './fixture-state.mjs';
import { buildFixtureResetPlan } from './reset-plan.mjs';
import { validateFixtureManifest } from './validate-manifest.mjs';
import { validateStudyTargetBinding } from './validate-target.mjs';

const defaultManifestPath = '.localdev/yardfolio-study/fixture-manifest.json';

function fail(message) {
  throw new Error(`Cannot reset Yardfolio Study fixtures: ${message}`);
}

function sqlLiteral(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function fixtureIdValues(plan) {
  return plan.operations.map((operation) => `(${sqlLiteral(operation.table)}, ${sqlLiteral(operation.id)})`).join(',\n  ');
}

export function buildFixtureResetSql(plan) {
  if (plan.executable !== true || plan.requiresDerivedDependencyCleanup !== false) {
    fail('the reset plan is not executable');
  }
  const values = fixtureIdValues(plan);
  if (!values) fail('the reset plan has no exact IDs');
  return String.raw`BEGIN;
CREATE TEMP TABLE fixture_ids (table_name text NOT NULL, id text NOT NULL) ON COMMIT DROP;
INSERT INTO fixture_ids (table_name, id) VALUES
  ${values};

CREATE TEMP TABLE fixture_activations ON COMMIT DROP AS
SELECT activation.*
FROM owner_provider_relationship_activations activation
WHERE activation.owner_user_id IN (
  SELECT id FROM fixture_ids WHERE table_name = 'owner_workspaces'
);
CREATE TEMP TABLE fixture_releases ON COMMIT DROP AS
SELECT release.*
FROM owner_provider_service_releases release
WHERE release.activation_id IN (SELECT id FROM fixture_activations);
CREATE TEMP TABLE fixture_jobs (id text PRIMARY KEY) ON COMMIT DROP;
INSERT INTO fixture_jobs (id)
SELECT service_job_id FROM fixture_releases
UNION
SELECT id FROM fixture_ids WHERE table_name = 'service_jobs';
CREATE TEMP TABLE fixture_day_plans (id text PRIMARY KEY) ON COMMIT DROP;
INSERT INTO fixture_day_plans (id)
SELECT DISTINCT day_plan_id FROM day_plan_stops WHERE job_id IN (SELECT id FROM fixture_jobs)
UNION
SELECT id FROM fixture_ids WHERE table_name = 'day_plans';
CREATE TEMP TABLE fixture_stops (id text PRIMARY KEY) ON COMMIT DROP;
INSERT INTO fixture_stops (id)
SELECT id FROM day_plan_stops
WHERE job_id IN (SELECT id FROM fixture_jobs)
   OR day_plan_id IN (SELECT id FROM fixture_day_plans)
UNION
SELECT id FROM fixture_ids WHERE table_name = 'day_plan_stops';
CREATE TEMP TABLE fixture_manager_invitations ON COMMIT DROP AS
SELECT invitation.*
FROM customer_property_manager_invitations invitation
WHERE invitation.owner_user_id IN (
  SELECT id FROM fixture_ids WHERE table_name = 'owner_workspaces'
);

DELETE FROM customer_visit_recommendation_events
WHERE customer_recommendation_reference IN (
  SELECT customer_recommendation_reference FROM customer_visit_recommendation_series
  WHERE release_id IN (SELECT id FROM fixture_releases)
);
DELETE FROM customer_visit_recommendation_messages
WHERE customer_recommendation_reference IN (
  SELECT customer_recommendation_reference FROM customer_visit_recommendation_series
  WHERE release_id IN (SELECT id FROM fixture_releases)
);
DELETE FROM customer_visit_recommendation_decisions
WHERE customer_recommendation_reference IN (
  SELECT customer_recommendation_reference FROM customer_visit_recommendation_series
  WHERE release_id IN (SELECT id FROM fixture_releases)
);
DELETE FROM customer_visit_recommendation_publications
WHERE customer_recommendation_reference IN (
  SELECT customer_recommendation_reference FROM customer_visit_recommendation_series
  WHERE release_id IN (SELECT id FROM fixture_releases)
);
DELETE FROM customer_visit_recommendation_series
WHERE release_id IN (SELECT id FROM fixture_releases);
DELETE FROM customer_service_visit_messages
WHERE customer_visit_reference IN (
  SELECT customer_visit_reference FROM customer_service_visit_threads
  WHERE release_id IN (SELECT id FROM fixture_releases)
);
DELETE FROM customer_service_visit_threads
WHERE release_id IN (SELECT id FROM fixture_releases);
DELETE FROM customer_service_day_events
WHERE release_id IN (SELECT id FROM fixture_releases);

DELETE FROM job_completion_report_status_history
WHERE completion_report_id IN (
  SELECT id FROM job_completion_reports WHERE job_id IN (SELECT id FROM fixture_jobs)
);
DELETE FROM job_completion_reports WHERE job_id IN (SELECT id FROM fixture_jobs);
DELETE FROM service_job_add_ons WHERE job_id IN (SELECT id FROM fixture_jobs);
DELETE FROM project_bid_conversions
WHERE project_bid_id IN (
  SELECT id FROM project_bids WHERE day_plan_id IN (SELECT id FROM fixture_day_plans)
);
DELETE FROM project_bid_line_items
WHERE project_bid_id IN (
  SELECT id FROM project_bids WHERE day_plan_id IN (SELECT id FROM fixture_day_plans)
);
DELETE FROM project_bids WHERE day_plan_id IN (SELECT id FROM fixture_day_plans);
DELETE FROM day_plan_amendment_requests WHERE day_plan_id IN (SELECT id FROM fixture_day_plans);
DELETE FROM job_photos WHERE job_id IN (SELECT id FROM fixture_jobs);
DELETE FROM checklist_mutations WHERE job_id IN (SELECT id FROM fixture_jobs);
DELETE FROM job_checklist_items WHERE job_id IN (SELECT id FROM fixture_jobs);
DELETE FROM job_lifecycle_mutations WHERE job_id IN (SELECT id FROM fixture_jobs);
DELETE FROM operational_exceptions
WHERE (affected_resource_type = 'job' AND affected_resource_id IN (SELECT id FROM fixture_jobs))
   OR (affected_resource_type = 'stop' AND affected_resource_id IN (SELECT id FROM fixture_stops))
   OR (affected_resource_type = 'route' AND affected_resource_id IN (SELECT id FROM fixture_day_plans));
DELETE FROM stop_progress_mutations WHERE stop_id IN (SELECT id FROM fixture_stops);
DELETE FROM day_plan_stops WHERE id IN (SELECT id FROM fixture_stops);
DELETE FROM day_plans WHERE id IN (SELECT id FROM fixture_day_plans);

DELETE FROM owner_provider_service_releases WHERE id IN (SELECT id FROM fixture_releases);
DELETE FROM service_jobs WHERE id IN (SELECT id FROM fixture_jobs);

DELETE FROM customer_property_manager_access_events
WHERE invitation_id IN (SELECT id FROM fixture_manager_invitations);
DELETE FROM customer_portal_access_grants
WHERE activation_id IN (SELECT id FROM fixture_activations);
DELETE FROM customer_property_manager_invitations
WHERE id IN (SELECT id FROM fixture_manager_invitations);
DELETE FROM owner_provider_first_visit_events
WHERE activation_id IN (SELECT id FROM fixture_activations);
DELETE FROM owner_provider_first_visit_decisions
WHERE activation_id IN (SELECT id FROM fixture_activations);
DELETE FROM owner_provider_first_visit_proposals
WHERE activation_id IN (SELECT id FROM fixture_activations);
DELETE FROM owner_provider_first_visit_series
WHERE activation_id IN (SELECT id FROM fixture_activations);
DELETE FROM owner_provider_relationship_activation_events
WHERE activation_id IN (SELECT id FROM fixture_activations);
DELETE FROM owner_provider_active_relationships
WHERE activation_id IN (SELECT id FROM fixture_activations);
DELETE FROM owner_provider_relationship_activations
WHERE id IN (SELECT id FROM fixture_activations);

DELETE FROM organization_memberships
WHERE id IN (SELECT owner_membership_id FROM fixture_activations);
DELETE FROM customer_properties
WHERE id IN (SELECT customer_property_id FROM fixture_activations);
DELETE FROM organization_customer_accounts
WHERE account_id IN (SELECT customer_account_id FROM fixture_activations);
DELETE FROM customer_accounts
WHERE id IN (SELECT customer_account_id FROM fixture_activations);

DELETE FROM owner_provider_initial_service_proposal_messages
WHERE assessment_id IN (
  SELECT id FROM owner_provider_assessments
  WHERE owner_user_id IN (SELECT id FROM fixture_ids WHERE table_name = 'owner_workspaces')
);
DELETE FROM owner_provider_initial_service_proposal_acceptance_snapshots
WHERE proposal_id IN (
  SELECT proposal.id FROM owner_provider_initial_service_proposals proposal
  JOIN owner_properties property ON property.id = proposal.property_id
  WHERE property.owner_user_id IN (SELECT id FROM fixture_ids WHERE table_name = 'owner_workspaces')
);
DELETE FROM owner_provider_initial_service_proposal_decisions
WHERE proposal_id IN (
  SELECT proposal.id FROM owner_provider_initial_service_proposals proposal
  JOIN owner_properties property ON property.id = proposal.property_id
  WHERE property.owner_user_id IN (SELECT id FROM fixture_ids WHERE table_name = 'owner_workspaces')
);
DELETE FROM owner_provider_initial_service_proposal_events
WHERE proposal_id IN (
  SELECT proposal.id FROM owner_provider_initial_service_proposals proposal
  JOIN owner_properties property ON property.id = proposal.property_id
  WHERE property.owner_user_id IN (SELECT id FROM fixture_ids WHERE table_name = 'owner_workspaces')
);
DELETE FROM owner_provider_initial_service_proposals
WHERE property_id IN (
  SELECT id FROM owner_properties
  WHERE owner_user_id IN (SELECT id FROM fixture_ids WHERE table_name = 'owner_workspaces')
);
DELETE FROM owner_provider_assessment_private_notes
WHERE assessment_id IN (
  SELECT id FROM owner_provider_assessments
  WHERE owner_user_id IN (SELECT id FROM fixture_ids WHERE table_name = 'owner_workspaces')
);
DELETE FROM owner_provider_assessment_messages
WHERE assessment_id IN (
  SELECT id FROM owner_provider_assessments
  WHERE owner_user_id IN (SELECT id FROM fixture_ids WHERE table_name = 'owner_workspaces')
);
DELETE FROM owner_provider_assessment_events
WHERE assessment_id IN (
  SELECT id FROM owner_provider_assessments
  WHERE owner_user_id IN (SELECT id FROM fixture_ids WHERE table_name = 'owner_workspaces')
);
DELETE FROM owner_provider_assessments
WHERE owner_user_id IN (SELECT id FROM fixture_ids WHERE table_name = 'owner_workspaces');
DELETE FROM owner_provider_disclosure_grant_events
WHERE grant_id IN (
  SELECT id FROM owner_provider_disclosure_grants
  WHERE owner_user_id IN (SELECT id FROM fixture_ids WHERE table_name = 'owner_workspaces')
);
DELETE FROM owner_provider_disclosure_grants
WHERE owner_user_id IN (SELECT id FROM fixture_ids WHERE table_name = 'owner_workspaces');
DELETE FROM owner_provider_disclosure_receipts
WHERE owner_user_id IN (SELECT id FROM fixture_ids WHERE table_name = 'owner_workspaces');

DELETE FROM owner_provider_opportunity_responses
WHERE invitation_id IN (
  SELECT id FROM owner_provider_invitations
  WHERE owner_user_id IN (SELECT id FROM fixture_ids WHERE table_name = 'owner_workspaces')
);
DELETE FROM owner_provider_invitation_response_capabilities
WHERE invitation_id IN (
  SELECT id FROM owner_provider_invitations
  WHERE owner_user_id IN (SELECT id FROM fixture_ids WHERE table_name = 'owner_workspaces')
);
DELETE FROM owner_provider_organization_claim_review_events
WHERE claim_id IN (
  SELECT claim.id FROM owner_provider_invitation_organization_claims claim
  JOIN owner_provider_invitations invitation ON invitation.id = claim.invitation_id
  WHERE invitation.owner_user_id IN (SELECT id FROM fixture_ids WHERE table_name = 'owner_workspaces')
);
DELETE FROM owner_provider_invitation_organization_claims
WHERE invitation_id IN (
  SELECT id FROM owner_provider_invitations
  WHERE owner_user_id IN (SELECT id FROM fixture_ids WHERE table_name = 'owner_workspaces')
);
DELETE FROM owner_provider_invitation_recipient_checks
WHERE invitation_id IN (
  SELECT id FROM owner_provider_invitations
  WHERE owner_user_id IN (SELECT id FROM fixture_ids WHERE table_name = 'owner_workspaces')
);
DELETE FROM owner_provider_invitation_delivery_attempts
WHERE invitation_id IN (
  SELECT id FROM owner_provider_invitations
  WHERE owner_user_id IN (SELECT id FROM fixture_ids WHERE table_name = 'owner_workspaces')
);
DELETE FROM owner_provider_invitation_abuse_reports
WHERE invitation_id IN (
  SELECT id FROM owner_provider_invitations
  WHERE owner_user_id IN (SELECT id FROM fixture_ids WHERE table_name = 'owner_workspaces')
);
DELETE FROM owner_provider_recipient_suppressions
WHERE source_invitation_id IN (
  SELECT id FROM owner_provider_invitations
  WHERE owner_user_id IN (SELECT id FROM fixture_ids WHERE table_name = 'owner_workspaces')
);
DELETE FROM owner_provider_invitations
WHERE owner_user_id IN (SELECT id FROM fixture_ids WHERE table_name = 'owner_workspaces');
DELETE FROM owner_intake_media
WHERE owner_user_id IN (SELECT id FROM fixture_ids WHERE table_name = 'owner_workspaces');
DELETE FROM owner_yard_briefs
WHERE owner_user_id IN (SELECT id FROM fixture_ids WHERE table_name = 'owner_workspaces');
DELETE FROM owner_acquisition_events
WHERE owner_user_id IN (SELECT id FROM fixture_ids WHERE table_name = 'owner_workspaces');
DELETE FROM owner_properties
WHERE owner_user_id IN (SELECT id FROM fixture_ids WHERE table_name = 'owner_workspaces');
DELETE FROM owner_workspaces
WHERE owner_user_id IN (SELECT id FROM fixture_ids WHERE table_name = 'owner_workspaces');

DO $yardfolio_study_reset$
DECLARE
  fixture_id record;
  remaining bigint;
BEGIN
  FOR fixture_id IN SELECT table_name, id FROM fixture_ids LOOP
    EXECUTE format(
      'SELECT count(*) FROM %I WHERE %I = $1',
      fixture_id.table_name,
      CASE WHEN fixture_id.table_name = 'owner_workspaces' THEN 'owner_user_id' ELSE 'id' END
    ) INTO remaining USING fixture_id.id;
    IF remaining <> 0 THEN
      RAISE EXCEPTION 'fixture reset verification failed';
    END IF;
  END LOOP;
END
$yardfolio_study_reset$;
SELECT 'remaining_manifest_records=0';
COMMIT;
`;
}

export function parseResetOutput(output) {
  const match = output.match(/(?:^|\n)remaining_manifest_records=(\d+)(?:\n|$)/);
  if (!match) fail('PostgreSQL reset did not return its zero-remaining receipt');
  const remainingManifestRecords = Number(match[1]);
  if (remainingManifestRecords !== 0) fail('PostgreSQL reset left manifest-owned records');
  return { remainingManifestRecords };
}

export function resetWithPsql(sql, {
  psqlBin = process.env.YARDFOLIO_STUDY_PSQL_BIN ?? 'psql',
  environment = process.env,
  spawn = spawnSync,
} = {}) {
  if (environment.PGDATABASE !== 'yardfolio_study') fail('PGDATABASE must be exactly yardfolio_study');
  const result = spawn(
    psqlBin,
    ['--no-psqlrc', '--quiet', '--tuples-only', '--no-align', '--set', 'ON_ERROR_STOP=1'],
    {
      encoding: 'utf8',
      env: environment,
      input: sql,
      maxBuffer: 1024 * 1024,
    },
  );
  if (result.error || result.status !== 0) {
    fail('transactional PostgreSQL reset failed; connection details and database output are withheld');
  }
  return parseResetOutput(result.stdout);
}

async function readManifest(path) {
  let manifest;
  try {
    manifest = JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    if (error instanceof SyntaxError) fail('the manifest is not valid JSON');
    throw error;
  }
  validateFixtureManifest(manifest);
  return manifest;
}

export async function resetFixtureManifest({
  manifestPath = defaultManifestPath,
  apiUrl,
  fetchImpl = fetch,
  validateTarget = validateStudyTargetBinding,
  executeReset = resetWithPsql,
  now = () => new Date(),
} = {}) {
  if (!apiUrl) fail('YARDFOLIO_STUDY_API_URL is required');
  const resolvedPath = resolve(manifestPath);
  return withFixtureOperationLock(resolvedPath, 'reset', async () => {
    const manifest = await readManifest(resolvedPath);
    const target = await validateTarget({ apiUrl, fetchImpl });
    if (target.databaseName !== manifest.targetDatabaseName
      || target.migrationCount !== manifest.migrationCount) {
      fail('the runtime target no longer matches the manifest database and migration binding');
    }
    const plan = buildFixtureResetPlan(manifest);
    const receipt = await executeReset(buildFixtureResetSql(plan));
    if (receipt?.remainingManifestRecords !== 0) fail('reset executor did not prove zero remaining records');
    const attemptedAt = now().toISOString();
    return updateFixtureManifest(resolvedPath, (current) => recordResetVerification(current, {
      attemptedAt,
      remainingManifestRecords: 0,
    }));
  });
}

async function main() {
  if (process.argv.length > 3) fail('usage: reset-fixtures.mjs [MANIFEST_PATH]');
  const manifest = await resetFixtureManifest({
    manifestPath: process.argv[2] ?? defaultManifestPath,
    apiUrl: process.env.YARDFOLIO_STUDY_API_URL,
  });
  process.stdout.write(`${JSON.stringify({
    status: 'fixture_reset_verified',
    fixtureRevision: manifest.fixtureRevision,
    attemptedAt: manifest.resetVerification.attemptedAt,
    remainingManifestRecords: manifest.resetVerification.remainingManifestRecords,
  }, null, 2)}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
