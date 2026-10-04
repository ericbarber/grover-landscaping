import { validateFixtureManifest } from './validate-manifest.mjs';

const fixtureDefinitions = new Map([
  ['canyon', {
    workspaceDisplayName: 'Canyon Study Owner',
    verifiedEmail: 'property.owner.canyon.local@example.test',
    addressLine1: '100 Modern Grover Fixture Way',
    postalCode: '85001',
  }],
  ['sage', {
    workspaceDisplayName: 'Sage Study Owner',
    verifiedEmail: 'property.owner.sage.local@example.test',
    addressLine1: '200 Modern Grover Fixture Way',
    postalCode: '85002',
  }],
]);

function fail(message) {
  throw new Error(`Cannot plan Modern Grover owner foundation: ${message}`);
}

function request(reviewerId, method, path, body, journal) {
  return {
    method,
    path,
    headers: {
      accept: 'application/json',
      'x-grover-local-reviewer': reviewerId,
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    ...(body ? { body } : {}),
    ...(journal ? { journal } : {}),
  };
}

function buildRecordPlan(record) {
  const definition = fixtureDefinitions.get(record.key);
  if (!definition) fail(`unsupported record key ${record.key}`);
  const property = {
    display_name: record.syntheticLabel,
    address_line_1: definition.addressLine1,
    address_line_2: null,
    city: 'Phoenix',
    region: 'AZ',
    postal_code: definition.postalCode,
    country_code: 'US',
    coarse_area: 'Central Phoenix',
    address_status: 'owner_confirmed',
    authority_attested: true,
  };

  return {
    recordKey: record.key,
    reviewerId: record.ownerReviewerId,
    ownerUserId: record.ownerUserId,
    syntheticLabel: record.syntheticLabel,
    requestNamespace: record.requestNamespace,
    requests: {
      discoverWorkspace: request(record.ownerReviewerId, 'GET', '/owner-workspace'),
      saveWorkspace: request(
        record.ownerReviewerId,
        'PUT',
        '/owner-workspace',
        { display_name: definition.workspaceDisplayName },
        { table: 'owner_workspaces', responseIdField: 'owner_user_id' },
      ),
      discoverProperties: request(record.ownerReviewerId, 'GET', '/owner-properties'),
      createProperty: request(
        record.ownerReviewerId,
        'POST',
        '/owner-properties',
        property,
        { table: 'owner_properties', responseIdField: 'property_id' },
      ),
      discoverReadyBrief: request(
        record.ownerReviewerId,
        'GET',
        '/owner-properties/{property_id}/yard-brief',
      ),
      saveReadyBrief: request(
        record.ownerReviewerId,
        'PUT',
        '/owner-properties/{property_id}/yard-brief',
        {
          status: 'ready',
          yard_areas: ['Front yard'],
          care_goals: ['One-time cleanup'],
          cadence_preference: 'one_time',
          considerations: 'Synthetic fixture; no access code.',
        },
        { table: 'owner_yard_briefs', responseIdField: 'brief_id' },
      ),
      createProviderInvitation: {
        ...request(
          record.ownerReviewerId,
          'POST',
          '/owner-properties/{property_id}/provider-invitations',
          {
            provider_name: 'Fixture Yard Care',
            recipient_business_email: 'owner.local@example.test',
            expires_in_days: 7,
            idempotency_key: `${record.requestNamespace}invitation`,
          },
          {
            table: 'owner_provider_invitations',
            responseIdField: 'invitation_id',
          },
        ),
        transientResponseHeader: 'x-grover-local-fixture-invitation-token',
        tokenHandling: 'memory_only_same_process',
      },
    },
  };
}

function findRecordPlan(manifest, recordKey) {
  const plan = buildOwnerFoundationPlan(manifest).find(
    (candidate) => candidate.recordKey === recordKey,
  );
  if (!plan) fail(`unsupported record key ${recordKey}`);
  const record = manifest.records.find((candidate) => candidate.key === recordKey);
  return { plan, record };
}

export function resolveOwnerWorkspaceRecovery(manifest, recordKey, workspace) {
  const { plan, record } = findRecordPlan(manifest, recordKey);
  const journaledWorkspaceIds = record.generatedRecordIds.owner_workspaces ?? [];
  if (journaledWorkspaceIds.length > 1) {
    fail(`${plan.syntheticLabel} must own at most one journaled workspace`);
  }
  if (workspace === null) {
    if (journaledWorkspaceIds.length > 0) {
      fail(`${plan.syntheticLabel} journaled workspace is missing`);
    }
    return { action: 'save' };
  }
  const definition = fixtureDefinitions.get(recordKey);
  if (!workspace || typeof workspace !== 'object'
    || workspace.owner_user_id !== plan.ownerUserId
    || workspace.verified_email !== definition.verifiedEmail
    || workspace.display_name !== definition.workspaceDisplayName
    || workspace.status !== 'active'
    || workspace.persisted !== true) {
    fail(`${plan.syntheticLabel} workspace does not exactly match the fixture owner`);
  }
  if (journaledWorkspaceIds.length === 1) {
    return { action: 'reuse_journaled', workspaceId: plan.ownerUserId };
  }
  return { action: 'recover_unjournaled', workspaceId: plan.ownerUserId };
}

export function buildOwnerFoundationPlan(manifest) {
  validateFixtureManifest(manifest);
  if (manifest.phase === 'reset') fail('a reset manifest cannot plan new writes');
  return manifest.records.map(buildRecordPlan);
}

function propertyMatchesPlan(property, plan) {
  const expected = plan.requests.createProperty.body;
  return property.owner_user_id === plan.ownerUserId
    && property.display_name === expected.display_name
    && property.address_line_1 === expected.address_line_1
    && (property.address_line_2 ?? null) === expected.address_line_2
    && property.city === expected.city
    && property.region === expected.region
    && property.postal_code === expected.postal_code
    && property.country_code === expected.country_code
    && property.coarse_area === expected.coarse_area
    && property.address_status === expected.address_status
    && property.authority_attested === expected.authority_attested;
}

export function resolveOwnerPropertyRecovery(
  manifest,
  recordKey,
  properties,
) {
  const { plan, record } = findRecordPlan(manifest, recordKey);
  const journaledWorkspaceIds = record.generatedRecordIds.owner_workspaces ?? [];
  const journaledPropertyIds = record.generatedRecordIds.owner_properties ?? [];
  if (journaledWorkspaceIds.length !== 1
    || journaledWorkspaceIds[0] !== plan.ownerUserId) {
    fail(`${plan.syntheticLabel} workspace must be journaled before property recovery`);
  }
  if (!Array.isArray(properties)) fail(`${plan.syntheticLabel} property discovery must return an array`);
  if (!Array.isArray(journaledPropertyIds) || journaledPropertyIds.length > 1) {
    fail(`${plan.syntheticLabel} must own at most one journaled owner property`);
  }
  if (properties.some((property) => property?.owner_user_id !== plan.ownerUserId)) {
    fail(`${plan.syntheticLabel} property discovery crossed its owner scope`);
  }

  const labelMatches = properties.filter(
    (property) => property?.display_name === plan.syntheticLabel,
  );
  const exactMatches = labelMatches.filter((property) => propertyMatchesPlan(property, plan));
  if (labelMatches.length !== exactMatches.length) {
    fail(`${plan.syntheticLabel} collides with a property that has different fixture fields`);
  }
  if (exactMatches.length > 1) {
    fail(`${plan.syntheticLabel} has multiple matching properties; reset must reconcile them`);
  }
  if (exactMatches.some((property) => typeof property.property_id !== 'string'
    || !property.property_id.startsWith('owner_property_')
    || property.property_id.length > 180)) {
    fail(`${plan.syntheticLabel} matching property has an invalid API-generated ID`);
  }

  if (journaledPropertyIds.length === 1) {
    const property = exactMatches.find(
      (candidate) => candidate.property_id === journaledPropertyIds[0],
    );
    if (!property) fail(`${plan.syntheticLabel} journaled property is missing or no longer matches`);
    return { action: 'reuse_journaled', propertyId: property.property_id };
  }
  if (exactMatches.length === 1) {
    return { action: 'recover_unjournaled', propertyId: exactMatches[0].property_id };
  }
  return { action: 'create' };
}

export function resolveOwnerReadyBriefRecovery(manifest, recordKey, propertyId, brief) {
  const { plan, record } = findRecordPlan(manifest, recordKey);
  const propertyIds = record.generatedRecordIds.owner_properties ?? [];
  const journaledBriefIds = record.generatedRecordIds.owner_yard_briefs ?? [];
  if (propertyIds.length !== 1 || propertyIds[0] !== propertyId) {
    fail(`${plan.syntheticLabel} exact property must be journaled before brief recovery`);
  }
  if (journaledBriefIds.length > 1) {
    fail(`${plan.syntheticLabel} must own at most one journaled yard brief`);
  }
  if (brief === null) {
    if (journaledBriefIds.length > 0) {
      fail(`${plan.syntheticLabel} journaled yard brief is missing`);
    }
    return { action: 'save' };
  }
  const expected = plan.requests.saveReadyBrief.body;
  if (!brief || typeof brief !== 'object'
    || typeof brief.brief_id !== 'string'
    || !brief.brief_id.startsWith('owner_brief_')
    || brief.brief_id.length > 180
    || brief.owner_user_id !== plan.ownerUserId
    || brief.property_id !== propertyId
    || !Number.isInteger(brief.version)
    || brief.version < 1
    || brief.status !== expected.status
    || JSON.stringify(brief.yard_areas) !== JSON.stringify(expected.yard_areas)
    || JSON.stringify(brief.care_goals) !== JSON.stringify(expected.care_goals)
    || brief.cadence_preference !== expected.cadence_preference
    || brief.considerations !== expected.considerations
    || brief.author_source !== 'yard_owner'
    || brief.persisted !== true) {
    fail(`${plan.syntheticLabel} yard brief does not exactly match the ready fixture brief`);
  }
  if (journaledBriefIds.length === 1) {
    if (journaledBriefIds[0] !== brief.brief_id) {
      fail(`${plan.syntheticLabel} journaled yard brief is missing or no longer matches`);
    }
    return { action: 'reuse_journaled', briefId: brief.brief_id };
  }
  return { action: 'recover_unjournaled', briefId: brief.brief_id };
}
