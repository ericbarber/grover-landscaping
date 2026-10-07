import {
  fixtureOwnedIdTables,
  validateFixtureManifest,
} from './validate-manifest.mjs';

// Direct manifest-owned rows only. A future transactional executor must delete
// derived child rows before interpreting this order as executable SQL.
const directResetOrder = [
  'day_plan_stops',
  'day_plans',
  'owner_provider_service_releases',
  'service_jobs',
  'customer_portal_access_grants',
  'customer_property_manager_invitations',
  'owner_provider_first_visit_decisions',
  'owner_provider_first_visit_proposals',
  'owner_provider_relationship_activations',
  'organization_memberships',
  'customer_properties',
  'customer_accounts',
  'owner_provider_initial_service_proposal_decisions',
  'owner_provider_initial_service_proposals',
  'owner_provider_assessments',
  'owner_provider_disclosure_grants',
  'owner_provider_disclosure_receipts',
  'owner_provider_invitation_response_capabilities',
  'owner_provider_invitation_organization_claims',
  'owner_provider_invitations',
  'owner_yard_briefs',
  'owner_properties',
  'owner_workspaces',
];

const derivedResetSelectors = [
  { table: 'customer_visit_recommendation_events', rootTable: 'owner_provider_service_releases', path: ['customer_visit_recommendation_series.release_id'] },
  { table: 'customer_visit_recommendation_messages', rootTable: 'owner_provider_service_releases', path: ['customer_visit_recommendation_publications.customer_recommendation_reference', 'customer_visit_recommendation_series.release_id'] },
  { table: 'customer_visit_recommendation_decisions', rootTable: 'owner_provider_service_releases', path: ['customer_visit_recommendation_publications.customer_recommendation_reference', 'customer_visit_recommendation_series.release_id'] },
  { table: 'customer_visit_recommendation_publications', rootTable: 'owner_provider_service_releases', path: ['customer_visit_recommendation_series.release_id'] },
  { table: 'customer_visit_recommendation_series', rootTable: 'owner_provider_service_releases', path: ['release_id'] },
  { table: 'customer_service_visit_messages', rootTable: 'owner_provider_service_releases', path: ['customer_service_visit_threads.release_id'] },
  { table: 'customer_service_visit_threads', rootTable: 'owner_provider_service_releases', path: ['release_id'] },
  { table: 'customer_service_day_events', rootTable: 'owner_provider_service_releases', path: ['release_id'] },
  { table: 'job_completion_report_status_history', rootTable: 'service_jobs', path: ['job_completion_reports.job_id'] },
  { table: 'job_completion_reports', rootTable: 'service_jobs', path: ['job_id'] },
  { table: 'service_job_add_ons', rootTable: 'service_jobs', path: ['job_id'] },
  { table: 'job_photos', rootTable: 'service_jobs', path: ['job_id'] },
  { table: 'checklist_mutations', rootTable: 'service_jobs', path: ['job_id'] },
  { table: 'job_checklist_items', rootTable: 'service_jobs', path: ['job_id'] },
  { table: 'job_lifecycle_mutations', rootTable: 'service_jobs', path: ['job_id'] },
  { table: 'operational_exceptions', rootTable: 'service_jobs', path: ['affected_resource_type=job', 'affected_resource_id'] },
  { table: 'stop_progress_mutations', rootTable: 'day_plan_stops', path: ['stop_id'] },
  { table: 'day_plan_amendment_requests', rootTable: 'day_plans', path: ['day_plan_id'] },
  { table: 'customer_property_manager_access_events', rootTable: 'customer_property_manager_invitations', path: ['invitation_id'] },
  { table: 'owner_provider_first_visit_events', rootTable: 'owner_provider_relationship_activations', path: ['activation_id'] },
  { table: 'owner_provider_first_visit_series', rootTable: 'owner_provider_relationship_activations', path: ['activation_id'] },
  { table: 'owner_provider_relationship_activation_events', rootTable: 'owner_provider_relationship_activations', path: ['activation_id'] },
  { table: 'owner_provider_active_relationships', rootTable: 'owner_provider_relationship_activations', path: ['activation_id'] },
  { table: 'organization_customer_accounts', rootTable: 'customer_accounts', path: ['account_id'] },
  { table: 'owner_provider_initial_service_proposal_messages', rootTable: 'owner_provider_initial_service_proposals', path: ['proposal_id'] },
  { table: 'owner_provider_initial_service_proposal_events', rootTable: 'owner_provider_initial_service_proposals', path: ['proposal_id'] },
  { table: 'owner_provider_initial_service_proposal_acceptance_snapshots', rootTable: 'owner_provider_initial_service_proposal_decisions', path: ['decision_id'] },
  { table: 'owner_provider_assessment_private_notes', rootTable: 'owner_provider_assessments', path: ['assessment_id'] },
  { table: 'owner_provider_assessment_messages', rootTable: 'owner_provider_assessments', path: ['assessment_id'] },
  { table: 'owner_provider_assessment_events', rootTable: 'owner_provider_assessments', path: ['assessment_id'] },
  { table: 'owner_provider_disclosure_grant_events', rootTable: 'owner_provider_disclosure_grants', path: ['grant_id'] },
  { table: 'owner_provider_opportunity_responses', rootTable: 'owner_provider_invitation_response_capabilities', path: ['capability_id'] },
  { table: 'owner_provider_organization_claim_review_events', rootTable: 'owner_provider_invitation_organization_claims', path: ['claim_id'] },
  { table: 'owner_provider_invitation_delivery_attempts', rootTable: 'owner_provider_invitations', path: ['invitation_id'] },
  { table: 'owner_provider_invitation_recipient_checks', rootTable: 'owner_provider_invitations', path: ['invitation_id'] },
  { table: 'owner_provider_invitation_abuse_reports', rootTable: 'owner_provider_invitations', path: ['invitation_id'] },
  { table: 'owner_provider_recipient_suppressions', rootTable: 'owner_provider_invitations', path: ['source_invitation_id'] },
  { table: 'owner_intake_media', rootTable: 'owner_properties', path: ['property_id'] },
  { table: 'owner_acquisition_events', rootTable: 'owner_workspaces', path: ['owner_user_id'] },
];

function fail(message) {
  throw new Error(`Cannot plan Yardfolio Study fixture reset: ${message}`);
}

function assertCompleteTableCoverage() {
  const allowed = [...fixtureOwnedIdTables()].sort();
  const planned = [...directResetOrder].sort();
  if (JSON.stringify(allowed) !== JSON.stringify(planned)) {
    fail('direct reset order does not cover the complete manifest table allowlist');
  }
}

export function buildFixtureResetPlan(manifest) {
  validateFixtureManifest(manifest);
  assertCompleteTableCoverage();
  if (!['seeded', 'verified'].includes(manifest.phase)) {
    fail('only seeded or verified manifests can begin a reset');
  }

  const operations = [];
  for (const table of directResetOrder) {
    for (const record of manifest.records) {
      for (const id of record.generatedRecordIds[table] ?? []) {
        operations.push({
          recordKey: record.key,
          table,
          keyColumn: table === 'owner_workspaces' ? 'owner_user_id' : 'id',
          id,
        });
      }
    }
  }
  if (operations.length === 0) fail('the manifest has no owned rows to reset');

  const derivedSelectors = [];
  for (const selector of derivedResetSelectors) {
    for (const record of manifest.records) {
      for (const rootId of record.generatedRecordIds[selector.rootTable] ?? []) {
        derivedSelectors.push({
          recordKey: record.key,
          table: selector.table,
          rootTable: selector.rootTable,
          rootKeyColumn: selector.rootTable === 'owner_workspaces' ? 'owner_user_id' : 'id',
          rootId,
          path: [...selector.path],
        });
      }
    }
  }

  return {
    schemaVersion: 1,
    targetDatabaseName: manifest.targetDatabaseName,
    sourceCommit: manifest.sourceCommit,
    fixtureRevision: manifest.fixtureRevision,
    executable: false,
    requiresDerivedDependencyCleanup: true,
    derivedSelectors,
    operations,
    verification: operations.map((operation) => ({ ...operation })),
  };
}
