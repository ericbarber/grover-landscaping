import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { buildPreparedManifest } from './prepare-manifest.mjs';
import { seedFixtureManifest } from './seed-fixtures.mjs';

function preparedManifest() {
  return buildPreparedManifest({
    target: {
      apiMode: 'local_review',
      persistence: 'postgres',
      databaseName: 'yardfolio_study',
      migrationCount: 126,
    },
    authConfig: {
      mode: 'local_review',
      local_reviewers: [
        {
          reviewer_id: 'property-owner-canyon',
          user_id: 'local-review-property-owner-canyon',
          roles: ['PropertyOwner'],
        },
        {
          reviewer_id: 'property-owner-sage',
          user_id: 'local-review-property-owner-sage',
          roles: ['PropertyOwner'],
        },
      ],
    },
    sourceCommit: '0123456789abcdef0123456789abcdef01234567',
    asOfDate: '2026-09-16',
    createdAt: '2026-10-03T12:00:00.000Z',
  });
}

function jsonResponse(status, payload, headers = {}) {
  const normalized = new Map(Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]));
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name) => normalized.get(name.toLowerCase()) ?? null },
    async json() { return payload; },
  };
}

function recordKeyFor(request, body) {
  const reviewer = request.headers['x-yardfolio-local-reviewer'];
  if (reviewer === 'property-owner-canyon') return 'canyon';
  if (reviewer === 'property-owner-sage') return 'sage';
  const token = body?.token ?? '';
  if (token.includes('canyon')) return 'canyon';
  if (token.includes('sage')) return 'sage';
  if (request.body?.includes('canyon')) return 'canyon';
  if (request.body?.includes('sage')) return 'sage';
  return null;
}

function createJourneyFetch() {
  const proposalVersions = new Map([['canyon', 0], ['sage', 0]]);
  const assessmentVersions = new Map([['canyon', 1], ['sage', 1]]);
  const reportStatuses = new Map([['canyon', 'draft'], ['sage', 'draft']]);
  const deliveredProof = new Set();
  const exceptions = new Map();
  const properties = new Map();
  const requests = [];
  const fetchImpl = async (url, request) => {
    const path = new URL(url).pathname;
    const method = request.method;
    const body = request.body ? JSON.parse(request.body) : undefined;
    let key = recordKeyFor(request, body);
    if (!key) {
      if (path.includes('canyon')) key = 'canyon';
      if (path.includes('sage')) key = 'sage';
    }
    requests.push({ path, method, key, body });
    const ownerUserId = `local-review-property-owner-${key}`;
    const propertyId = `owner_property_${key}123`;
    const briefId = `owner_brief_${key}123`;
    const invitationId = `owner_provider_invitation_${key}123`;
    const persisted = (extra) => ({ ...extra, persisted: true });

    if (path === '/owner-workspace' && method === 'GET') return jsonResponse(404, {});
    if (path === '/owner-workspace' && method === 'PUT') {
      return jsonResponse(200, persisted({
        owner_user_id: ownerUserId,
        verified_email: `property.owner.${key}.local@example.test`,
        display_name: `${key === 'canyon' ? 'Canyon' : 'Sage'} Study Owner`,
        status: 'active',
      }));
    }
    if (path === '/owner-properties' && method === 'GET') {
      return jsonResponse(200, properties.has(key) ? [properties.get(key)] : []);
    }
    if (path === '/owner-properties' && method === 'POST') {
      const property = persisted({
        property_id: propertyId,
        owner_user_id: ownerUserId,
        ...body,
        address_line_2: body.address_line_2 ?? '',
        status: 'active',
        version: 1,
      });
      properties.set(key, property);
      return jsonResponse(201, property);
    }
    if (path.endsWith('/yard-brief') && method === 'GET') return jsonResponse(404, {});
    if (path.endsWith('/yard-brief') && method === 'PUT') {
      return jsonResponse(200, persisted({
        brief_id: briefId,
        owner_user_id: ownerUserId,
        property_id: propertyId,
        version: 1,
        ...body,
        author_source: 'yard_owner',
      }));
    }
    if (path.endsWith('/provider-invitations') && method === 'POST') {
      return jsonResponse(202, persisted({ invitation_id: invitationId }), {
        'x-yardfolio-local-fixture-invitation-token': `fixture-token-${key}-1234567890`,
      });
    }
    if (path === '/provider-invitations/preview') {
      return jsonResponse(200, {
        invitation_id: invitationId,
        status: 'opened',
        can_review_limited_request: true,
      });
    }
    if (path === '/provider-invitations/verify-recipient') {
      return jsonResponse(200, persisted({ invitation_id: invitationId, recipient_email_checked: true }));
    }
    if (path === '/provider-invitations/organization-options') {
      return jsonResponse(200, [{ organization_id: 'org_demo_landscaping', relationship_checked: true }]);
    }
    if (path === '/provider-invitations/organization-claims') {
      return jsonResponse(201, persisted({
        claim_id: `owner_provider_claim_${key}123`,
        organization_id: 'org_demo_landscaping',
        status: 'relationship_checked',
        organization_relationship_checked: true,
        opportunity_response_capability: false,
      }));
    }
    if (path.endsWith('/response-capabilities')) {
      return jsonResponse(201, persisted({
        capability_id: `owner_provider_capability_${key}123`,
        version: 1,
      }));
    }
    if (path === '/provider-opportunity-responses') {
      return jsonResponse(201, persisted({ action: 'express_interest' }));
    }
    if (path.endsWith('/disclosure-review')) {
      return jsonResponse(200, persisted({
        review_version: `disclosure_review_v1_${'a'.repeat(64)}`,
        consent_text_version: 'owner-provider-assessment-consent-v1',
        retention_notice_version: 'owner-provider-assessment-retention-v1',
      }));
    }
    if (path.endsWith('/disclosure-grants')) {
      return jsonResponse(201, persisted({
        grant_id: `owner_disclosure_grant_${key}123`,
        receipt_id: `owner_disclosure_receipt_${key}123`,
      }));
    }
    if (path === '/provider-disclosures/access') {
      return jsonResponse(200, persisted({
        can_access: true,
        grant_id: `owner_disclosure_grant_${key}123`,
      }));
    }
    if (path === '/provider-assessments') {
      return jsonResponse(201, persisted({
        assessment_id: `owner_provider_assessment_${key}123`,
        status: 'remote_review',
        version: 1,
      }));
    }
    if (path.endsWith('/transitions')) {
      const version = assessmentVersions.get(key) + 1;
      assessmentVersions.set(key, version);
      return jsonResponse(200, persisted({
        assessment_id: `owner_provider_assessment_${key}123`,
        status: body.action === 'complete' ? 'completed' : 'in_progress',
        version,
      }));
    }
    if (path.endsWith('/initial-service-proposals') && path.startsWith('/provider-assessments/')) {
      const version = proposalVersions.get(key) + 1;
      proposalVersions.set(key, version);
      return jsonResponse(201, persisted({
        proposal_id: `owner_provider_proposal_${key}${version}23`,
        proposal_version: version,
        price_amount_minor: 42_000,
        status: 'sent',
      }));
    }
    if (path.endsWith('/initial-service-proposals') && method === 'GET') {
      return jsonResponse(200, [1, 2, 3].map((version) => persisted({
        proposal_id: `owner_provider_proposal_${key}${version}23`,
        proposal_version: version,
        price_amount_minor: 42_000,
        status: version === 3 ? 'sent' : 'superseded',
      })));
    }
    if (path.includes('/initial-service-proposals/') && method === 'GET') {
      const pathKey = path.includes('_canyon') ? 'canyon' : 'sage';
      return request.headers['x-yardfolio-local-reviewer'] === `property-owner-${pathKey}`
        ? jsonResponse(200, persisted({ proposal_id: `owner_provider_proposal_${pathKey}323` }))
        : jsonResponse(404, { error: 'not_found' });
    }
    if (path.endsWith('/decision') && path.includes('/initial-service-proposals/')) {
      if (body.idempotency_key.includes('stale_proposal_accept')) {
        return jsonResponse(409, { error: 'conflict' });
      }
      return jsonResponse(200, persisted({
        decision_id: `owner_provider_proposal_decision_${key}123`,
      }));
    }
    if (path.endsWith('/activation')) {
      return jsonResponse(201, persisted({
        activation_id: `owner_provider_activation_${key}123`,
        customer_account_id: `acct_${key}123`,
        customer_property_id: `property_${key}123`,
        owner_membership_id: `membership_${key}123`,
        portal_access_id: `portal_access_${key}123`,
      }));
    }
    if (path.endsWith('/manager-invitations')) {
      return jsonResponse(201, persisted({
        invitation_id: `customer_pm_invitation_${key}123`,
        status: 'pending',
      }));
    }
    if (path.includes('/customer-property-manager-invitations/') && path.endsWith('/accept')) {
      key = path.includes('canyon') ? 'canyon' : 'sage';
      return jsonResponse(200, persisted({ status: 'accepted' }));
    }
    if (path.endsWith('/first-visit/status')) {
      return jsonResponse(200, persisted({ current_version: 0, status: 'awaiting_provider' }));
    }
    if (path.endsWith('/first-visit/proposal')) {
      return jsonResponse(201, persisted({
        proposal_id: `owner_provider_first_visit_${key}123`,
        current_version: 1,
        status: 'proposed',
      }));
    }
    if (path.endsWith('/first-visit/decision')) {
      return jsonResponse(201, persisted({ current_version: 1, status: 'confirmed' }));
    }
    if (path.endsWith('/service-release')) {
      return jsonResponse(201, persisted({
        release_id: `owner_provider_service_release_${key}123`,
        service_job_id: `job_${key}123`,
      }));
    }
    if (path === '/day-plans') {
      key = body.service_date === '2026-09-16' ? 'canyon' : 'sage';
      return jsonResponse(201, persisted({
        id: `day_plan_${key}123`,
        status: 'draft',
      }));
    }
    if (path.endsWith('/stops')) {
      key = body.job_id.includes('canyon') ? 'canyon' : 'sage';
      return jsonResponse(201, persisted({ stop_id: `stop_${key}123` }));
    }
    if (path.endsWith('/publish')) {
      key = path.includes('canyon') ? 'canyon' : 'sage';
      return jsonResponse(200, persisted({ id: `day_plan_${key}123`, status: 'published' }));
    }
    if (path === '/operational-exceptions' && method === 'POST') {
      const exception = {
        id: `exception_${key}123`,
        status: 'open',
        assigned_user_id: null,
        affected_resource_id: `job_${key}123`,
        updated_at: `${key}-exception-created`,
      };
      exceptions.set(key, exception);
      return jsonResponse(201, exception);
    }
    if (path.startsWith('/operational-exceptions/') && method === 'PUT') {
      key = path.includes('canyon') ? 'canyon' : 'sage';
      const current = exceptions.get(key);
      const exception = {
        ...current,
        status: body.action === 'start' ? 'in_progress' : current.status,
        assigned_user_id: body.action === 'assign' ? body.assigned_user_id : current.assigned_user_id,
        updated_at: `${key}-exception-${body.action}`,
      };
      exceptions.set(key, exception);
      return jsonResponse(200, exception);
    }
    if (path === '/customer-portal/visits' && method === 'GET') {
      const reference = `customer_visit_${key}123`;
      return jsonResponse(200, {
        properties: [{ property_id: `property_${key}123` }],
        visits: [{
          property_id: `property_${key}123`,
          customer_visit_reference: reference,
          delivered_proof_available: deliveredProof.has(key),
        }],
      });
    }
    if (path.includes('/customer-portal/visits/') && path.endsWith('/proof')) {
      key = path.includes('customer_visit_canyon') ? 'canyon' : 'sage';
      const expectedOwner = `property-owner-${key}`;
      const reviewer = request.headers['x-yardfolio-local-reviewer'];
      if (reviewer !== expectedOwner && reviewer !== 'property-manager') {
        return jsonResponse(403, { error: 'customer_portal_access_required' });
      }
      if (!deliveredProof.has(key)) {
        return jsonResponse(404, { error: 'customer_visit_proof_pending' });
      }
      return jsonResponse(200, {
        report_status: 'delivered',
        checklist_progress: 100,
        before_photos: 1,
        after_photos: 1,
        issue_photos: 0,
        service: { checklist: [] },
        photo_evidence: [],
        completed_recommendations: [],
      });
    }
    if (path.includes('/stops/') && path.endsWith('/status')) {
      return jsonResponse(200, persisted({ status: body.status }));
    }
    if (path.endsWith('/start') && path.startsWith('/jobs/')) {
      return jsonResponse(202, persisted({ status: 'accepted' }));
    }
    if (path.endsWith('/photos/presign')) {
      return jsonResponse(201, {
        photo_id: `photo_offline_${body.client_mutation_id.replaceAll('-', '')}`,
        upload_mode: 'local-placeholder',
      });
    }
    if (path.endsWith('/photos/complete')) {
      return jsonResponse(202, { status: 'accepted' });
    }
    if (path.endsWith('/complete') && path.startsWith('/jobs/')) {
      reportStatuses.set(key, 'submitted');
      return jsonResponse(202, persisted({ status: 'accepted' }));
    }
    if (path.endsWith('/report') && path.startsWith('/jobs/')) {
      return jsonResponse(200, persisted({
        report_id: `report_job_${key}123`,
        job_id: `job_${key}123`,
        report_status: reportStatuses.get(key),
        ready_for_customer: true,
        checklist_progress: 100,
        before_photos: 1,
        after_photos: 1,
      }));
    }
    if (path.includes('/completion-reports/') && path.endsWith('/review')) {
      reportStatuses.set(key, 'in_review');
      return jsonResponse(200, persisted({ report_status: 'in_review' }));
    }
    if (path.endsWith('/request-changes')) {
      reportStatuses.set(key, 'changes_requested');
      return jsonResponse(200, persisted({ report_status: 'changes_requested' }));
    }
    if (path.endsWith('/resubmit')) {
      reportStatuses.set(key, 'submitted');
      return jsonResponse(200, persisted({ report_status: 'submitted' }));
    }
    if (path.endsWith('/deliver')) {
      reportStatuses.set(key, 'delivered');
      deliveredProof.add(key);
      return jsonResponse(200, persisted({ report_status: 'delivered' }));
    }
    throw new Error(`unexpected fixture request: ${method} ${path}`);
  };
  return { fetchImpl, requests };
}

test('executes and journals the complete two-record provider-to-outcome journey without tokens', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'yardfolio-seed-fixtures-'));
  const manifestPath = join(directory, 'fixture-manifest.json');
  const journey = createJourneyFetch();
  let emptyTargetChecks = 0;
  try {
    await writeFile(manifestPath, `${JSON.stringify(preparedManifest(), null, 2)}\n`, { mode: 0o600 });
    const manifest = await seedFixtureManifest({
      manifestPath,
      apiUrl: 'http://127.0.0.1:8081',
      fetchImpl: journey.fetchImpl,
      validateEmptyTarget: async () => {
        emptyTargetChecks += 1;
        return { databaseName: 'yardfolio_study', migrationCount: 126, namespaceMatches: 0 };
      },
      validateBoundTarget: async () => assert.fail('a fresh run does not need recovery validation'),
      now: () => new Date('2026-10-03T12:00:00.000Z'),
    });
    assert.equal(emptyTargetChecks, 1);
    assert.equal(manifest.phase, 'verified');
    for (const record of manifest.records) {
      assert.deepEqual(record.snapshots, [
        'open_customer_decision',
        'accepted_not_scheduled',
        'confirmed_visit',
        'field_route',
        'exception_handoff',
        'proof_review',
        'delivered_outcome',
      ]);
      assert.equal(record.managerDelegationStatus, 'accepted');
      assert.equal(record.generatedRecordIds.owner_provider_initial_service_proposals.length, 3);
      assert.equal(record.generatedRecordIds.day_plan_stops.length, 1);
    }
    const manifestText = await readFile(manifestPath, 'utf8');
    assert.doesNotMatch(manifestText, /fixture-token|recipient_business_email|address_line_1/);
    assert.equal(journey.requests.filter((request) => request.path.endsWith('/publish')).length, 2);
    assert.equal(journey.requests.filter((request) => request.path.endsWith('/deliver')).length, 2);
    assert.equal(journey.requests.filter((request) => request.path.endsWith('/proof')).length, 8);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('stops both records at one verified forward-only session checkpoint', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'yardfolio-seed-checkpoint-'));
  const manifestPath = join(directory, 'fixture-manifest.json');
  const journey = createJourneyFetch();
  try {
    await writeFile(manifestPath, `${JSON.stringify(preparedManifest(), null, 2)}\n`, { mode: 0o600 });
    const manifest = await seedFixtureManifest({
      manifestPath,
      apiUrl: 'http://127.0.0.1:8081',
      fetchImpl: journey.fetchImpl,
      validateEmptyTarget: async () => ({
        databaseName: 'yardfolio_study', migrationCount: 126, namespaceMatches: 0,
      }),
      now: () => new Date('2026-10-03T12:00:00.000Z'),
      stopAfter: 'open_customer_decision',
    });
    assert.equal(manifest.phase, 'verified');
    for (const record of manifest.records) {
      assert.deepEqual(record.snapshots, ['open_customer_decision']);
      assert.equal(record.managerDelegationStatus, 'not_created');
      assert.equal(record.generatedRecordIds.owner_provider_initial_service_proposals.length, 3);
      assert.equal(record.generatedRecordIds.owner_provider_relationship_activations, undefined);
    }
    assert.equal(journey.requests.some((request) => request.path.endsWith('/activation')), false);
    assert.equal(journey.requests.some((request) => request.path.endsWith('/publish')), false);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('rejects an unknown session checkpoint before target access', async () => {
  await assert.rejects(
    seedFixtureManifest({
      apiUrl: 'http://127.0.0.1:8081',
      stopAfter: 'rewound_proposal',
      validateEmptyTarget: async () => assert.fail('invalid checkpoint must fail before preflight'),
    }),
    /stopAfter must name a supported verified checkpoint/,
  );
});

test('withholds transport details from API failures', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'yardfolio-seed-redaction-'));
  const manifestPath = join(directory, 'fixture-manifest.json');
  try {
    await writeFile(manifestPath, `${JSON.stringify(preparedManifest(), null, 2)}\n`, { mode: 0o600 });
    await assert.rejects(
      seedFixtureManifest({
        manifestPath,
        apiUrl: 'http://127.0.0.1:8081',
        fetchImpl: async () => { throw new Error('fixture-token-secret postgres://private'); },
        validateEmptyTarget: async () => ({ databaseName: 'yardfolio_study', migrationCount: 126 }),
        now: () => new Date('2026-10-03T12:00:00.000Z'),
      }),
      (error) => {
        assert.match(error.message, /could not reach the isolated API/);
        assert.doesNotMatch(error.message, /secret|postgres/);
        return true;
      },
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
