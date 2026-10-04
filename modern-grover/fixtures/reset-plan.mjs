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

function fail(message) {
  throw new Error(`Cannot plan Modern Grover fixture reset: ${message}`);
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

  return {
    schemaVersion: 1,
    targetDatabaseName: manifest.targetDatabaseName,
    sourceCommit: manifest.sourceCommit,
    fixtureRevision: manifest.fixtureRevision,
    executable: false,
    requiresDerivedDependencyCleanup: true,
    operations,
    verification: operations.map((operation) => ({ ...operation })),
  };
}
