#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  recordGeneratedId,
  recordManagerDelegationStatus,
  recordVerifiedSnapshot,
  updateFixtureManifest,
  withFixtureOperationLock,
} from './fixture-state.mjs';
import {
  buildOwnerFoundationPlan,
  resolveOwnerPropertyRecovery,
  resolveOwnerReadyBriefRecovery,
  resolveOwnerWorkspaceRecovery,
} from './owner-foundation-plan.mjs';
import { validateFixtureManifest } from './validate-manifest.mjs';
import {
  normalizeStudyApiUrl,
  validateStudyTarget,
  validateStudyTargetBinding,
} from './validate-target.mjs';

const defaultManifestPath = '.localdev/yardfolio-study/fixture-manifest.json';
const providerReviewerId = 'organization-owner';
const providerOrganizationId = 'org_demo_landscaping';
const managerRecipient = 'property.manager.local@example.test';
const scheduleReviewerId = 'manager';
const crewId = 'crew_1001';

function fail(message) {
  throw new Error(`Cannot seed Yardfolio Study fixtures: ${message}`);
}

function requireRecord(value, label) {
  if (!value || Array.isArray(value) || typeof value !== 'object') fail(`${label} returned an invalid record`);
  return value;
}

function requireId(value, field, prefix, label) {
  const id = value?.[field];
  if (typeof id !== 'string' || !id.startsWith(prefix) || id.length > 180) {
    fail(`${label} returned an invalid ${field}`);
  }
  return id;
}

function requirePersisted(value, label) {
  requireRecord(value, label);
  if (value.persisted !== true) fail(`${label} was not persisted`);
  return value;
}

function containsObjectKey(value, prohibitedKeys) {
  if (!value || typeof value !== 'object') return false;
  return Object.entries(value).some(([key, child]) => (
    prohibitedKeys.has(key) || containsObjectKey(child, prohibitedKeys)
  ));
}

async function requestJson(fetchImpl, apiUrl, {
  reviewerId,
  method = 'GET',
  path,
  body,
  allowNotFound = false,
  captureHeader,
  clientMutationId,
  expectedStatuses,
}) {
  let response;
  try {
    response = await fetchImpl(`${apiUrl}${path}`, {
      method,
      headers: {
        accept: 'application/json',
        'x-yardfolio-local-reviewer': reviewerId,
        ...(clientMutationId === undefined
          ? {}
          : { 'x-client-mutation-id': clientMutationId }),
        ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    fail(`${method} ${path} could not reach the isolated API`);
  }
  if (allowNotFound && response.status === 404) return { value: null, header: null, status: 404 };
  const statusAccepted = response.ok || expectedStatuses?.includes(response.status);
  if (!statusAccepted) fail(`${method} ${path} returned HTTP ${response.status}`);
  let value;
  try {
    value = await response.json();
  } catch {
    fail(`${method} ${path} returned invalid JSON`);
  }
  return {
    value,
    status: response.status,
    header: captureHeader ? response.headers?.get(captureHeader) ?? null : null,
  };
}

function addDays(dateText, offset) {
  const date = new Date(`${dateText}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

function fixtureMutationId(recordKey, sequence) {
  const recordSuffix = recordKey === 'canyon' ? '8000' : '8001';
  return `00000000-0000-4000-${recordSuffix}-${String(sequence).padStart(12, '0')}`;
}

function proposalBody(record, token, expectedVersion, expiresAtEpochSeconds) {
  const version = expectedVersion + 1;
  return {
    token,
    expected_proposal_version: expectedVersion,
    title: `${record.syntheticLabel} one-time yard cleanup`,
    customer_summary: 'One-time residential yard cleanup with a documented completion handoff.',
    included_scope: ['Trim shrubs', 'Remove yard debris', 'Blow hard surfaces'],
    exclusions: ['Tree removal', 'Irrigation repair'],
    cadence_code: 'one_time',
    cadence_detail: 'One visit after the owner confirms the arrival window.',
    arrival_policy: 'The crew will arrive within the confirmed two-hour window.',
    weather_policy: 'Unsafe weather moves the visit to a newly confirmed window.',
    cancellation_policy: 'Contact the provider before the confirmed arrival window.',
    proof_expectation: 'The provider will document completed scope before delivery.',
    price_amount_minor: 42_000,
    price_basis: 'fixed',
    currency_code: 'USD',
    revision_note: expectedVersion === 0 ? null : `Synthetic proposal revision ${version}.`,
    expires_at_epoch_seconds: expiresAtEpochSeconds,
    idempotency_key: `${record.requestNamespace}proposal_v${version}`,
  };
}

async function journal(manifestPath, recordKey, table, id) {
  return updateFixtureManifest(
    manifestPath,
    (manifest) => recordGeneratedId(manifest, { recordKey, table, id }),
  );
}

async function snapshot(manifestPath, recordKey, name) {
  return updateFixtureManifest(
    manifestPath,
    (manifest) => recordVerifiedSnapshot(manifest, { recordKey, snapshot: name }),
  );
}

async function seedFoundation({ manifestPath, manifest, record, apiUrl, fetchImpl }) {
  const plan = buildOwnerFoundationPlan(manifest).find((candidate) => candidate.recordKey === record.key);
  const workspaceResponse = await requestJson(fetchImpl, apiUrl, {
    reviewerId: record.ownerReviewerId,
    path: plan.requests.discoverWorkspace.path,
    allowNotFound: true,
  });
  const workspaceRecovery = resolveOwnerWorkspaceRecovery(manifest, record.key, workspaceResponse.value);
  let workspace = workspaceResponse.value;
  if (workspaceRecovery.action === 'save') {
    workspace = (await requestJson(fetchImpl, apiUrl, {
      reviewerId: record.ownerReviewerId,
      method: 'PUT',
      path: plan.requests.saveWorkspace.path,
      body: plan.requests.saveWorkspace.body,
    })).value;
  }
  requirePersisted(workspace, `${record.syntheticLabel} workspace`);
  manifest = await journal(manifestPath, record.key, 'owner_workspaces', record.ownerUserId);

  const properties = (await requestJson(fetchImpl, apiUrl, {
    reviewerId: record.ownerReviewerId,
    path: plan.requests.discoverProperties.path,
  })).value;
  const propertyRecovery = resolveOwnerPropertyRecovery(manifest, record.key, properties);
  let propertyId = propertyRecovery.propertyId;
  if (propertyRecovery.action === 'create') {
    const property = requirePersisted((await requestJson(fetchImpl, apiUrl, {
      reviewerId: record.ownerReviewerId,
      method: 'POST',
      path: plan.requests.createProperty.path,
      body: plan.requests.createProperty.body,
    })).value, `${record.syntheticLabel} property`);
    propertyId = requireId(property, 'property_id', 'owner_property_', `${record.syntheticLabel} property`);
  }
  manifest = await journal(manifestPath, record.key, 'owner_properties', propertyId);

  const briefPath = plan.requests.discoverReadyBrief.path.replace('{property_id}', encodeURIComponent(propertyId));
  const briefResponse = await requestJson(fetchImpl, apiUrl, {
    reviewerId: record.ownerReviewerId,
    path: briefPath,
    allowNotFound: true,
  });
  const briefRecovery = resolveOwnerReadyBriefRecovery(
    manifest,
    record.key,
    propertyId,
    briefResponse.value,
  );
  let briefId = briefRecovery.briefId;
  if (briefRecovery.action === 'save') {
    const brief = requirePersisted((await requestJson(fetchImpl, apiUrl, {
      reviewerId: record.ownerReviewerId,
      method: 'PUT',
      path: briefPath,
      body: plan.requests.saveReadyBrief.body,
    })).value, `${record.syntheticLabel} yard brief`);
    briefId = requireId(brief, 'brief_id', 'owner_brief_', `${record.syntheticLabel} yard brief`);
  }
  manifest = await journal(manifestPath, record.key, 'owner_yard_briefs', briefId);
  return { manifest, plan, propertyId };
}

async function seedProviderToField({ manifestPath, manifest, record, plan, propertyId, apiUrl, fetchImpl, now }) {
  if (manifest.records.find((candidate) => candidate.key === record.key)
    .generatedRecordIds.owner_provider_invitations) {
    fail(`${record.syntheticLabel} invitation is already journaled; its memory-only token cannot be recovered, so reset this manifest before retrying`);
  }

  const invitationPath = plan.requests.createProviderInvitation.path
    .replace('{property_id}', encodeURIComponent(propertyId));
  const invitationResponse = await requestJson(fetchImpl, apiUrl, {
    reviewerId: record.ownerReviewerId,
    method: 'POST',
    path: invitationPath,
    body: plan.requests.createProviderInvitation.body,
    captureHeader: plan.requests.createProviderInvitation.transientResponseHeader,
  });
  const invitation = requirePersisted(invitationResponse.value, `${record.syntheticLabel} invitation`);
  const invitationId = requireId(invitation, 'invitation_id', 'owner_provider_invitation_', `${record.syntheticLabel} invitation`);
  const token = invitationResponse.header;
  if (invitationResponse.status !== 202 || typeof token !== 'string' || token.length < 16) {
    fail(`${record.syntheticLabel} invitation did not return its one-time local fixture token`);
  }
  manifest = await journal(manifestPath, record.key, 'owner_provider_invitations', invitationId);

  const provider = async (method, path, body) => (await requestJson(fetchImpl, apiUrl, {
    reviewerId: providerReviewerId, method, path, body,
  })).value;
  const owner = async (method, path, body) => (await requestJson(fetchImpl, apiUrl, {
    reviewerId: record.ownerReviewerId, method, path, body,
  })).value;
  const propertyManager = async (method, path, body) => (await requestJson(fetchImpl, apiUrl, {
    reviewerId: record.managerReviewerId, method, path, body,
  })).value;
  const scheduler = async (method, path, body) => (await requestJson(fetchImpl, apiUrl, {
    reviewerId: scheduleReviewerId, method, path, body,
  })).value;
  const crew = async (method, path, body, clientMutationId) => (await requestJson(fetchImpl, apiUrl, {
    reviewerId: record.crewReviewerId, method, path, body, clientMutationId,
  })).value;

  const preview = requireRecord(await provider('POST', '/provider-invitations/preview', { token }), `${record.syntheticLabel} invitation preview`);
  if (preview.invitation_id !== invitationId || preview.status !== 'opened'
    || preview.can_review_limited_request !== true) {
    fail(`${record.syntheticLabel} invitation did not open for limited review`);
  }
  const recipient = requireRecord(await provider('POST', '/provider-invitations/verify-recipient', { token }), `${record.syntheticLabel} recipient verification`);
  if (recipient.invitation_id !== invitationId || recipient.recipient_email_checked !== true) {
    fail(`${record.syntheticLabel} recipient verification did not match its invitation`);
  }
  const organizationOptions = await provider('POST', '/provider-invitations/organization-options', { token });
  if (!Array.isArray(organizationOptions)
    || !organizationOptions.some((option) => option.organization_id === providerOrganizationId
      && option.relationship_checked === true)) {
    fail(`${record.syntheticLabel} provider organization relationship is unavailable`);
  }
  const claim = requirePersisted(await provider('POST', '/provider-invitations/organization-claims', {
    token,
    claim_kind: 'existing_relationship',
    organization_id: providerOrganizationId,
    provider_display_name: null,
    authority_attested: true,
    idempotency_key: `${record.requestNamespace}organization_claim`,
  }), `${record.syntheticLabel} organization claim`);
  const claimId = requireId(claim, 'claim_id', 'owner_provider_claim_', `${record.syntheticLabel} organization claim`);
  if (claim.organization_id !== providerOrganizationId
    || claim.status !== 'relationship_checked'
    || claim.organization_relationship_checked !== true
    || claim.opportunity_response_capability !== false) {
    fail(`${record.syntheticLabel} organization relationship was not checked`);
  }
  manifest = await journal(manifestPath, record.key, 'owner_provider_invitation_organization_claims', claimId);

  const capability = requirePersisted(await provider(
    'POST',
    `/provider-invitation-organization-claims/${encodeURIComponent(claimId)}/response-capabilities`,
    {
      token,
      withheld_categories_acknowledged: true,
      idempotency_key: `${record.requestNamespace}response_capability`,
    },
  ), `${record.syntheticLabel} response capability`);
  const capabilityId = requireId(capability, 'capability_id', 'owner_provider_capability_', `${record.syntheticLabel} response capability`);
  manifest = await journal(manifestPath, record.key, 'owner_provider_invitation_response_capabilities', capabilityId);
  const response = requirePersisted(await provider('POST', '/provider-opportunity-responses', {
    token,
    capability_id: capabilityId,
    expected_capability_version: capability.version,
    action: 'express_interest',
    response_code: 'ready_for_owner_disclosure',
    block_future_invitations: false,
    idempotency_key: `${record.requestNamespace}express_interest`,
  }), `${record.syntheticLabel} opportunity response`);
  if (response.action !== 'express_interest') fail(`${record.syntheticLabel} opportunity response was not recorded`);

  const review = requirePersisted(await owner(
    'GET',
    `/owner-properties/${encodeURIComponent(propertyId)}/provider-invitations/${encodeURIComponent(invitationId)}/disclosure-review`,
  ), `${record.syntheticLabel} disclosure review`);
  const grant = requirePersisted(await owner(
    'POST',
    `/owner-properties/${encodeURIComponent(propertyId)}/provider-invitations/${encodeURIComponent(invitationId)}/disclosure-grants`,
    {
      expected_review_version: review.review_version,
      purpose: 'yard_assessment',
      approved_categories: ['exact_address', 'yard_brief', 'access_considerations'],
      selected_media_ids: [],
      consent_text_version: review.consent_text_version,
      retention_notice_version: review.retention_notice_version,
      owner_affirmed: true,
      idempotency_key: `${record.requestNamespace}disclosure_grant`,
    },
  ), `${record.syntheticLabel} disclosure grant`);
  const grantId = requireId(grant, 'grant_id', 'owner_disclosure_grant_', `${record.syntheticLabel} disclosure grant`);
  const receiptId = requireId(grant, 'receipt_id', 'owner_disclosure_receipt_', `${record.syntheticLabel} disclosure receipt`);
  manifest = await journal(manifestPath, record.key, 'owner_provider_disclosure_receipts', receiptId);
  manifest = await journal(manifestPath, record.key, 'owner_provider_disclosure_grants', grantId);
  const access = requirePersisted(await provider('POST', '/provider-disclosures/access', { token }), `${record.syntheticLabel} disclosure access`);
  if (access.can_access !== true || access.grant_id !== grantId) fail(`${record.syntheticLabel} disclosure access was not granted`);

  let assessment = requirePersisted(await provider('POST', '/provider-assessments', {
    token,
    disclosure_grant_id: grantId,
    assessment_method: 'remote',
    proposed_window_start_epoch_seconds: null,
    proposed_window_end_epoch_seconds: null,
    time_zone: null,
    idempotency_key: `${record.requestNamespace}assessment`,
  }), `${record.syntheticLabel} assessment`);
  const assessmentId = requireId(assessment, 'assessment_id', 'owner_provider_assessment_', `${record.syntheticLabel} assessment`);
  manifest = await journal(manifestPath, record.key, 'owner_provider_assessments', assessmentId);
  assessment = requirePersisted(await provider('POST', `/provider-assessments/${encodeURIComponent(assessmentId)}/transitions`, {
    token,
    action: 'begin',
    expected_version: assessment.version,
    reason_code: null,
    owner_visible_summary: null,
    idempotency_key: `${record.requestNamespace}assessment_begin`,
  }), `${record.syntheticLabel} assessment start`);
  assessment = requirePersisted(await provider('POST', `/provider-assessments/${encodeURIComponent(assessmentId)}/transitions`, {
    token,
    action: 'complete',
    expected_version: assessment.version,
    reason_code: null,
    owner_visible_summary: 'The one-time cleanup scope is suitable for the property and standard crew access.',
    idempotency_key: `${record.requestNamespace}assessment_complete`,
  }), `${record.syntheticLabel} assessment completion`);
  if (assessment.status !== 'completed') fail(`${record.syntheticLabel} assessment did not complete`);

  const futureEpoch = Math.floor(now().getTime() / 1000) + 30 * 86_400;
  const proposals = [];
  for (let expectedVersion = 0; expectedVersion < 3; expectedVersion += 1) {
    const proposal = requirePersisted(await provider(
      'POST',
      `/provider-assessments/${encodeURIComponent(assessmentId)}/initial-service-proposals`,
      proposalBody(record, token, expectedVersion, futureEpoch),
    ), `${record.syntheticLabel} proposal v${expectedVersion + 1}`);
    if (proposal.proposal_version !== expectedVersion + 1 || proposal.price_amount_minor !== 42_000) {
      fail(`${record.syntheticLabel} proposal version or fixed total did not match`);
    }
    proposals.push(proposal);
    manifest = await journal(
      manifestPath,
      record.key,
      'owner_provider_initial_service_proposals',
      requireId(proposal, 'proposal_id', 'owner_provider_proposal_', `${record.syntheticLabel} proposal`),
    );
  }
  const ownerProposals = await owner('GET', `/owner-properties/${encodeURIComponent(propertyId)}/initial-service-proposals`);
  const proposalV3 = proposals[2];
  if (!Array.isArray(ownerProposals)
    || ownerProposals.filter((candidate) => candidate.status === 'sent').length !== 1
    || !ownerProposals.some((candidate) => candidate.proposal_id === proposalV3.proposal_id
      && candidate.proposal_version === 3 && candidate.status === 'sent')) {
    fail(`${record.syntheticLabel} owner proposal read did not isolate current v3`);
  }
  const ownerProperties = (await requestJson(fetchImpl, apiUrl, {
    reviewerId: record.ownerReviewerId,
    path: '/owner-properties',
  })).value;
  if (!Array.isArray(ownerProperties) || ownerProperties.length !== 1
    || ownerProperties[0]?.property_id !== propertyId) {
    fail(`${record.syntheticLabel} owner read did not isolate its exact property`);
  }
  const otherOwnerReviewerId = record.key === 'canyon' ? 'property-owner-sage' : 'property-owner-canyon';
  const deniedRead = await requestJson(fetchImpl, apiUrl, {
    reviewerId: otherOwnerReviewerId,
    path: `/owner-properties/${encodeURIComponent(propertyId)}/initial-service-proposals/${encodeURIComponent(proposalV3.proposal_id)}`,
    expectedStatuses: [404],
  });
  if (deniedRead.status !== 404) fail(`${record.syntheticLabel} proposal was visible across owner scope`);
  const staleDecision = await requestJson(fetchImpl, apiUrl, {
    reviewerId: record.ownerReviewerId,
    method: 'POST',
    path: `/owner-properties/${encodeURIComponent(propertyId)}/initial-service-proposals/${encodeURIComponent(proposals[1].proposal_id)}/decision`,
    body: {
      action: 'accept',
      expected_proposal_version: 2,
      reason_code: null,
      customer_safe_note: null,
      affirmation_text_version: 'initial_service_proposal_acceptance_v1',
      idempotency_key: `${record.requestNamespace}stale_proposal_accept`,
    },
    expectedStatuses: [409],
  });
  if (staleDecision.status !== 409) fail(`${record.syntheticLabel} stale proposal acceptance did not fail closed`);
  manifest = await snapshot(manifestPath, record.key, 'open_customer_decision');

  const decision = requirePersisted(await owner(
    'POST',
    `/owner-properties/${encodeURIComponent(propertyId)}/initial-service-proposals/${encodeURIComponent(proposalV3.proposal_id)}/decision`,
    {
      action: 'accept',
      expected_proposal_version: 3,
      reason_code: null,
      customer_safe_note: null,
      affirmation_text_version: 'initial_service_proposal_acceptance_v1',
      idempotency_key: `${record.requestNamespace}proposal_accept`,
    },
  ), `${record.syntheticLabel} proposal decision`);
  const decisionId = requireId(decision, 'decision_id', 'owner_provider_proposal_decision_', `${record.syntheticLabel} proposal decision`);
  manifest = await journal(manifestPath, record.key, 'owner_provider_initial_service_proposal_decisions', decisionId);
  manifest = await snapshot(manifestPath, record.key, 'accepted_not_scheduled');

  const activation = requirePersisted(await owner(
    'POST',
    `/owner-properties/${encodeURIComponent(propertyId)}/initial-service-proposals/${encodeURIComponent(proposalV3.proposal_id)}/activation`,
    {
      expected_proposal_version: 3,
      activation_affirmation_text_version: 'owner_provider_relationship_activation_v1',
      owner_confirmed: true,
      idempotency_key: `${record.requestNamespace}activation`,
    },
  ), `${record.syntheticLabel} relationship activation`);
  const activationIds = [
    ['owner_provider_relationship_activations', 'activation_id', 'owner_provider_activation_'],
    ['customer_accounts', 'customer_account_id', 'acct_'],
    ['customer_properties', 'customer_property_id', 'property_'],
    ['organization_memberships', 'owner_membership_id', 'membership_'],
    ['customer_portal_access_grants', 'portal_access_id', 'portal_access_'],
  ];
  for (const [table, field, prefix] of activationIds) {
    manifest = await journal(manifestPath, record.key, table, requireId(activation, field, prefix, `${record.syntheticLabel} activation`));
  }
  const activationId = activation.activation_id;
  const customerPropertyId = activation.customer_property_id;

  const managerInvitation = requirePersisted(await owner(
    'POST',
    `/owner-properties/${encodeURIComponent(propertyId)}/provider-relationships/${encodeURIComponent(activationId)}/manager-invitations`,
    {
      recipient_email: managerRecipient,
      idempotency_key: `${record.requestNamespace}manager_invitation`,
    },
  ), `${record.syntheticLabel} manager invitation`);
  const managerInvitationId = requireId(managerInvitation, 'invitation_id', 'customer_pm_invitation_', `${record.syntheticLabel} manager invitation`);
  manifest = await journal(manifestPath, record.key, 'customer_property_manager_invitations', managerInvitationId);
  manifest = await updateFixtureManifest(manifestPath, (current) => recordManagerDelegationStatus(current, {
    recordKey: record.key, status: 'pending',
  }));
  const acceptedManager = requirePersisted(await propertyManager(
    'POST',
    `/customer-property-manager-invitations/${encodeURIComponent(managerInvitationId)}/accept`,
  ), `${record.syntheticLabel} manager acceptance`);
  if (acceptedManager.status !== 'accepted') fail(`${record.syntheticLabel} manager invitation was not accepted`);
  manifest = await updateFixtureManifest(manifestPath, (current) => recordManagerDelegationStatus(current, {
    recordKey: record.key, status: 'accepted',
  }));

  const visitStatus = requirePersisted(await provider(
    'POST',
    `/provider-relationships/${encodeURIComponent(activationId)}/first-visit/status`,
    { token },
  ), `${record.syntheticLabel} first visit status`);
  if (visitStatus.current_version !== 0) fail(`${record.syntheticLabel} first visit was not awaiting its first proposal`);
  const visitStart = Math.floor(now().getTime() / 1000) + (record.key === 'canyon' ? 7 : 8) * 86_400;
  const proposedVisit = requirePersisted(await provider(
    'POST',
    `/provider-relationships/${encodeURIComponent(activationId)}/first-visit/proposal`,
    {
      token,
      expected_series_version: 0,
      window_start_epoch_seconds: visitStart,
      window_end_epoch_seconds: visitStart + 7_200,
      time_zone: 'America/Phoenix',
      customer_safe_arrival_note: 'Please keep pets inside during the arrival window.',
      idempotency_key: `${record.requestNamespace}first_visit`,
    },
  ), `${record.syntheticLabel} first visit proposal`);
  const visitProposalId = requireId(proposedVisit, 'proposal_id', 'owner_provider_first_visit_', `${record.syntheticLabel} first visit proposal`);
  manifest = await journal(manifestPath, record.key, 'owner_provider_first_visit_proposals', visitProposalId);
  const confirmedVisit = requirePersisted(await owner(
    'POST',
    `/owner-properties/${encodeURIComponent(propertyId)}/provider-relationships/${encodeURIComponent(activationId)}/first-visit/decision`,
    {
      expected_window_version: proposedVisit.current_version,
      action: 'confirm',
      customer_safe_note: null,
      confirmation_affirmation_text_version: 'owner_provider_first_visit_confirmation_v1',
      idempotency_key: `${record.requestNamespace}first_visit_confirm`,
    },
  ), `${record.syntheticLabel} first visit confirmation`);
  if (confirmedVisit.status !== 'confirmed') fail(`${record.syntheticLabel} first visit did not confirm`);

  const release = requirePersisted(await provider(
    'POST',
    `/provider-relationships/${encodeURIComponent(activationId)}/service-release`,
    {
      expected_first_visit_version: confirmedVisit.current_version,
      idempotency_key: `${record.requestNamespace}service_release`,
    },
  ), `${record.syntheticLabel} service release`);
  const releaseId = requireId(release, 'release_id', 'owner_provider_service_release_', `${record.syntheticLabel} service release`);
  const jobId = requireId(release, 'service_job_id', 'job_', `${record.syntheticLabel} released job`);
  manifest = await journal(manifestPath, record.key, 'owner_provider_service_releases', releaseId);
  manifest = await journal(manifestPath, record.key, 'service_jobs', jobId);
  manifest = await snapshot(manifestPath, record.key, 'confirmed_visit');

  const serviceDate = addDays(manifest.asOfDate, record.key === 'canyon' ? 0 : 1);
  const dayPlan = requirePersisted(await scheduler('POST', '/day-plans', {
    crew_id: crewId,
    service_date: serviceDate,
  }), `${record.syntheticLabel} day plan`);
  const dayPlanId = requireId(dayPlan, 'id', 'day_plan_', `${record.syntheticLabel} day plan`);
  manifest = await journal(manifestPath, record.key, 'day_plans', dayPlanId);
  const stop = requirePersisted(await scheduler('POST', `/day-plans/${encodeURIComponent(dayPlanId)}/stops`, {
    job_id: jobId,
    estimated_drive_minutes: 15,
    estimated_service_minutes: 120,
  }), `${record.syntheticLabel} route stop`);
  const stopId = requireId(stop, 'stop_id', 'stop_', `${record.syntheticLabel} route stop`);
  manifest = await journal(manifestPath, record.key, 'day_plan_stops', stopId);
  const published = requirePersisted(await scheduler('POST', `/day-plans/${encodeURIComponent(dayPlanId)}/publish`), `${record.syntheticLabel} published route`);
  if (published.id !== dayPlanId || published.status !== 'published') fail(`${record.syntheticLabel} route did not publish`);
  manifest = await snapshot(manifestPath, record.key, 'field_route');

  let exception = requireRecord(await scheduler('POST', '/operational-exceptions', {
    organization_id: providerOrganizationId,
    category: 'access',
    priority: 'high',
    title: `${record.syntheticLabel} gate access needs confirmation`,
    description: 'Confirm synthetic gate access before the crew begins the scheduled cleanup.',
    affected_resource_type: 'job',
    affected_resource_id: jobId,
    assigned_user_id: null,
  }), `${record.syntheticLabel} operational exception`);
  const exceptionId = requireId(exception, 'id', 'exception_', `${record.syntheticLabel} operational exception`);
  exception = requireRecord(await scheduler('PUT', `/operational-exceptions/${encodeURIComponent(exceptionId)}`, {
    action: 'assign',
    assigned_user_id: 'local-review-manager',
    resolution_note: null,
    expected_updated_at: exception.updated_at,
  }), `${record.syntheticLabel} assigned exception`);
  exception = requireRecord(await scheduler('PUT', `/operational-exceptions/${encodeURIComponent(exceptionId)}`, {
    action: 'start',
    assigned_user_id: null,
    resolution_note: null,
    expected_updated_at: exception.updated_at,
  }), `${record.syntheticLabel} started exception`);
  if (exception.status !== 'in_progress'
    || exception.assigned_user_id !== 'local-review-manager'
    || exception.affected_resource_id !== jobId) {
    fail(`${record.syntheticLabel} exception handoff was not assigned and started`);
  }
  manifest = await snapshot(manifestPath, record.key, 'exception_handoff');

  const customerVisitsBeforeProof = requireRecord(await owner(
    'GET',
    '/customer-portal/visits',
  ), `${record.syntheticLabel} customer visits`);
  const customerVisit = customerVisitsBeforeProof.visits?.find(
    (visit) => visit.property_id === customerPropertyId,
  );
  const customerVisitReference = requireId(
    customerVisit,
    'customer_visit_reference',
    'customer_visit_',
    `${record.syntheticLabel} customer visit`,
  );
  const pendingProof = await requestJson(fetchImpl, apiUrl, {
    reviewerId: record.ownerReviewerId,
    path: `/customer-portal/visits/${encodeURIComponent(customerVisitReference)}/proof`,
    expectedStatuses: [404],
  });
  if (pendingProof.status !== 404 || pendingProof.value?.error !== 'customer_visit_proof_pending') {
    fail(`${record.syntheticLabel} proof was not withheld before delivery`);
  }
  const deniedProof = await requestJson(fetchImpl, apiUrl, {
    reviewerId: otherOwnerReviewerId,
    path: `/customer-portal/visits/${encodeURIComponent(customerVisitReference)}/proof`,
    expectedStatuses: [403, 404],
  });
  if (![403, 404].includes(deniedProof.status)
    || !['customer_portal_access_required', 'customer_visit_proof_not_found']
      .includes(deniedProof.value?.error)) {
    fail(`${record.syntheticLabel} proof was visible across owner scope`);
  }

  const stopPath = `/day-plans/${encodeURIComponent(dayPlanId)}/stops/${encodeURIComponent(stopId)}/status`;
  const stopInProgress = requirePersisted(await crew('POST', stopPath, {
    status: 'in_progress',
    client_mutation_id: fixtureMutationId(record.key, 1),
  }), `${record.syntheticLabel} started route stop`);
  if (stopInProgress.status !== 'in_progress') fail(`${record.syntheticLabel} route stop did not start`);
  const startedJob = requirePersisted(await crew(
    'POST',
    `/jobs/${encodeURIComponent(jobId)}/start`,
    undefined,
    fixtureMutationId(record.key, 2),
  ), `${record.syntheticLabel} started job`);
  if (startedJob.status !== 'accepted') fail(`${record.syntheticLabel} job did not start`);

  for (const [photoType, sequence] of [['before', 3], ['after', 4]]) {
    const upload = requireRecord(await crew('POST', `/jobs/${encodeURIComponent(jobId)}/photos/presign`, {
      file_name: `${record.key}-${photoType}-placeholder.jpg`,
      content_type: 'image/jpeg',
      photo_type: photoType,
      client_mutation_id: fixtureMutationId(record.key, sequence),
    }), `${record.syntheticLabel} ${photoType} evidence ticket`);
    const photoId = requireId(upload, 'photo_id', 'photo_offline_', `${record.syntheticLabel} ${photoType} evidence`);
    if (upload.upload_mode !== 'local-placeholder') {
      fail(`${record.syntheticLabel} evidence unexpectedly required external storage`);
    }
    const completedUpload = await crew('POST', `/jobs/${encodeURIComponent(jobId)}/photos/complete`, {
      photo_id: photoId,
      file_size_bytes: 1,
      image_width_px: 1,
      image_height_px: 1,
    });
    if (completedUpload.status !== 'accepted') fail(`${record.syntheticLabel} ${photoType} evidence did not complete`);
  }

  const completedJob = requirePersisted(await crew(
    'POST',
    `/jobs/${encodeURIComponent(jobId)}/complete`,
    undefined,
    fixtureMutationId(record.key, 5),
  ), `${record.syntheticLabel} completed job`);
  if (completedJob.status !== 'accepted') fail(`${record.syntheticLabel} job did not complete`);
  const stopFinished = requirePersisted(await crew('POST', stopPath, {
    status: 'finished',
    client_mutation_id: fixtureMutationId(record.key, 6),
  }), `${record.syntheticLabel} finished route stop`);
  if (stopFinished.status !== 'finished') fail(`${record.syntheticLabel} route stop did not finish`);

  const report = requirePersisted(await crew(
    'GET',
    `/jobs/${encodeURIComponent(jobId)}/report`,
  ), `${record.syntheticLabel} submitted completion report`);
  const reportId = requireId(report, 'report_id', 'report_', `${record.syntheticLabel} completion report`);
  if (report.job_id !== jobId || report.report_status !== 'submitted'
    || report.ready_for_customer !== true || report.checklist_progress !== 100
    || report.before_photos < 1 || report.after_photos < 1) {
    fail(`${record.syntheticLabel} completion report was not ready for review`);
  }
  let reportAction = requirePersisted(await scheduler(
    'POST',
    `/completion-reports/${encodeURIComponent(reportId)}/review`,
  ), `${record.syntheticLabel} report review`);
  if (reportAction.report_status !== 'in_review') fail(`${record.syntheticLabel} report did not enter review`);
  reportAction = requirePersisted(await scheduler(
    'POST',
    `/completion-reports/${encodeURIComponent(reportId)}/request-changes`,
    { reason: 'Confirm the synthetic before/after evidence labels before delivery.' },
  ), `${record.syntheticLabel} report change request`);
  if (reportAction.report_status !== 'changes_requested') fail(`${record.syntheticLabel} report changes were not requested`);
  reportAction = requirePersisted(await crew(
    'POST',
    `/completion-reports/${encodeURIComponent(reportId)}/resubmit`,
  ), `${record.syntheticLabel} report resubmission`);
  if (reportAction.report_status !== 'submitted') fail(`${record.syntheticLabel} report did not resubmit`);
  reportAction = requirePersisted(await scheduler(
    'POST',
    `/completion-reports/${encodeURIComponent(reportId)}/review`,
  ), `${record.syntheticLabel} second report review`);
  if (reportAction.report_status !== 'in_review') fail(`${record.syntheticLabel} corrected report did not enter review`);
  manifest = await snapshot(manifestPath, record.key, 'proof_review');

  const delivered = requirePersisted(await scheduler(
    'POST',
    `/completion-reports/${encodeURIComponent(reportId)}/deliver`,
  ), `${record.syntheticLabel} report delivery`);
  if (delivered.report_status !== 'delivered') fail(`${record.syntheticLabel} report did not deliver`);
  const deliveredProof = requireRecord(await owner(
    'GET',
    `/customer-portal/visits/${encodeURIComponent(customerVisitReference)}/proof`,
  ), `${record.syntheticLabel} delivered owner proof`);
  const managerProof = requireRecord(await propertyManager(
    'GET',
    `/customer-portal/visits/${encodeURIComponent(customerVisitReference)}/proof`,
  ), `${record.syntheticLabel} delivered manager proof`);
  for (const proof of [deliveredProof, managerProof]) {
    if (proof.report_status !== 'delivered' || proof.checklist_progress !== 100
      || proof.before_photos < 1 || proof.after_photos < 1
      || containsObjectKey(proof, new Set(['report_id', 'job_id', 'share_url']))) {
      fail(`${record.syntheticLabel} delivered proof was not customer-safe`);
    }
  }
  const customerVisitsAfterProof = requireRecord(await owner(
    'GET',
    '/customer-portal/visits',
  ), `${record.syntheticLabel} delivered customer visits`);
  const deliveredVisit = customerVisitsAfterProof.visits?.find(
    (visit) => visit.customer_visit_reference === customerVisitReference,
  );
  if (deliveredVisit?.delivered_proof_available !== true) {
    fail(`${record.syntheticLabel} delivered proof was not advertised on the customer visit`);
  }
  manifest = await snapshot(manifestPath, record.key, 'delivered_outcome');
  return manifest;
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

export async function seedFixtureManifest({
  manifestPath = defaultManifestPath,
  apiUrl,
  fetchImpl = fetch,
  validateEmptyTarget = validateStudyTarget,
  validateBoundTarget = validateStudyTargetBinding,
  now = () => new Date(),
} = {}) {
  if (!apiUrl) fail('YARDFOLIO_STUDY_API_URL is required');
  const normalizedApiUrl = normalizeStudyApiUrl(apiUrl);
  const resolvedPath = resolve(manifestPath);
  return withFixtureOperationLock(resolvedPath, 'seed', async () => {
    let manifest = await readManifest(resolvedPath);
    if (!['prepared', 'seeded'].includes(manifest.phase)) fail('only a prepared or foundation-partial manifest can be seeded');
    const target = manifest.phase === 'prepared'
      ? await validateEmptyTarget({ apiUrl: normalizedApiUrl, fetchImpl })
      : await validateBoundTarget({ apiUrl: normalizedApiUrl, fetchImpl });
    if (target.databaseName !== manifest.targetDatabaseName
      || target.migrationCount !== manifest.migrationCount) {
      fail('the runtime target no longer matches the manifest database and migration binding');
    }
    for (const recordKey of ['canyon', 'sage']) {
      manifest = await readManifest(resolvedPath);
      const record = manifest.records.find((candidate) => candidate.key === recordKey);
      const foundation = await seedFoundation({
        manifestPath: resolvedPath, manifest, record, apiUrl: normalizedApiUrl, fetchImpl,
      });
      manifest = await seedProviderToField({
        manifestPath: resolvedPath,
        manifest: foundation.manifest,
        record,
        plan: foundation.plan,
        propertyId: foundation.propertyId,
        apiUrl: normalizedApiUrl,
        fetchImpl,
        now,
      });
    }
    validateFixtureManifest(manifest);
    if (manifest.phase !== 'verified') fail('both fixture records must finish with verified snapshots');
    return manifest;
  });
}

async function main() {
  if (process.argv.length > 3) fail('usage: seed-fixtures.mjs [MANIFEST_PATH]');
  const manifest = await seedFixtureManifest({
    manifestPath: process.argv[2] ?? defaultManifestPath,
    apiUrl: process.env.YARDFOLIO_STUDY_API_URL,
  });
  process.stdout.write(`${JSON.stringify({
    status: 'fixture_seed_verified',
    fixtureRevision: manifest.fixtureRevision,
    records: manifest.records.map((record) => ({
      key: record.key,
      snapshotCount: record.snapshots.length,
      managerDelegationStatus: record.managerDelegationStatus,
    })),
  }, null, 2)}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
