import { validateFixtureManifest } from './validate-manifest.mjs';

const fixtureDefinitions = new Map([
  ['canyon', {
    workspaceDisplayName: 'Canyon Study Owner',
    addressLine1: '100 Modern Grover Fixture Way',
    postalCode: '85001',
  }],
  ['sage', {
    workspaceDisplayName: 'Sage Study Owner',
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
      saveWorkspace: request(record.ownerReviewerId, 'PUT', '/owner-workspace', {
        display_name: definition.workspaceDisplayName,
      }),
      discoverProperties: request(record.ownerReviewerId, 'GET', '/owner-properties'),
      createProperty: request(
        record.ownerReviewerId,
        'POST',
        '/owner-properties',
        property,
        { table: 'owner_properties', responseIdField: 'property_id' },
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
  journaledPropertyIds = [],
) {
  const plan = buildOwnerFoundationPlan(manifest).find(
    (candidate) => candidate.recordKey === recordKey,
  );
  if (!plan) fail(`unsupported record key ${recordKey}`);
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
