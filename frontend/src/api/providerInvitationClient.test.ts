import { afterEach, describe, expect, it, vi } from 'vitest';
import { configureApiAuthentication } from './authenticatedFetch';
import {
  createProviderAssessmentMessage,
  createProviderAssessmentPrivateNote,
  fetchProviderDisclosureAccess,
  fetchProviderInvitationProgress,
  proposeProviderAssessmentWindow,
  publishProviderInitialServiceProposal,
  startProviderAssessment,
  transitionProviderAssessment,
} from './providerInvitationClient';

afterEach(() => {
  configureApiAuthentication(false, async () => null);
  vi.unstubAllGlobals();
});

describe('provider invitation progress client', () => {
  it('keeps the bearer token in the protected request body and maps safe progress', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      invitation_id: 'invitation_1', progress_stage: 'response_recorded',
      status_label: 'Interest recorded; waiting for the owner’s next decision',
      next_action: 'wait_for_owner', recipient_email_checked: true,
      organization_relationship_checked: true, opportunity_response_capability: true,
      response_action: 'express_interest', response_label: 'Interest recorded',
      responded_at_epoch_seconds: 1_799_000_000, closed: false,
    }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchProviderInvitationProgress('owner_provider_secret')).resolves.toEqual(
      expect.objectContaining({
        invitationId: 'invitation_1',
        progressStage: 'response_recorded',
        responseAction: 'express_interest',
        closed: false,
      }),
    );
    expect(fetchMock.mock.calls[0][0]).toContain('/provider-invitations/progress');
    expect(fetchMock.mock.calls[0][0]).not.toContain('owner_provider_secret');
    expect(JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)).toEqual({
      token: 'owner_provider_secret',
    });
  });

  it('maps only present owner-approved disclosure categories', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      invitation_id: 'invitation_1', status: 'active', can_access: true,
      grant_id: 'owner_disclosure_grant_1', receipt_id: 'receipt_1',
      organization_name: 'Desert Bloom', property_name: 'Home', purpose: 'yard_assessment',
      approved_categories: ['exact_address'], withheld_categories: ['owner_contact'],
      brief_version: 2, expires_at_epoch_seconds: 1_800_000_000,
      exact_address: '123 Oak Street, Phoenix, AZ 85004',
      assessment: {
        assessment_id: 'assessment_1', invitation_id: 'invitation_1', property_id: 'property_1',
        organization_id: 'organization_1', disclosure_grant_id: 'owner_disclosure_grant_1',
        assessment_method: 'remote', status: 'remote_review', version: 1,
      },
      customer_safe_messages: [{
        message_id: 'message_1', assessment_id: 'assessment_1', author_role: 'owner',
        message_kind: 'owner_question', customer_safe_body: 'Is the controller included?',
        assessment_version_snapshot: 1, created_at_epoch_seconds: 1_800_000_001,
      }],
      private_notes: [{
        note_id: 'note_1', assessment_id: 'assessment_1', organization_id: 'organization_1',
        author_user_id: 'provider_1', note_kind: 'route_fit', private_body: 'Private route note.',
        assessment_version_snapshot: 1, created_at_epoch_seconds: 1_800_000_002,
      }],
      initial_service_proposal: {
        proposal_id: 'proposal_1', assessment_id: 'assessment_1', invitation_id: 'invitation_1',
        property_id: 'property_1', organization_id: 'organization_1',
        disclosure_grant_id: 'owner_disclosure_grant_1', proposal_version: 2,
        status: 'sent', title: 'Routine yard care', customer_summary: 'Customer-safe terms.',
        included_scope: ['Mow and edge'], exclusions: ['Tree work'],
        cadence_code: 'every_two_weeks', cadence_detail: 'Every other Tuesday',
        arrival_policy: 'Day confirmed first.', weather_policy: 'Unsafe weather moves the visit.',
        cancellation_policy: '24 hours notice.', proof_expectation: 'Completion photos.',
        price_amount_minor: 12000, price_basis: 'per_visit', currency_code: 'USD',
        annualized_monthly_minor: 26000, revision_note: 'Price clarified.',
        issued_at_epoch_seconds: 1_799_000_000, expires_at_epoch_seconds: 1_800_000_000,
        persisted: true,
      },
      authority_boundary: 'Assessment access only.', persisted: true,
    }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const access = await fetchProviderDisclosureAccess('owner_provider_secret');
    expect(access.exactAddress).toContain('123 Oak Street');
    expect(access.ownerContact).toBeUndefined();
    expect(access.grantId).toBe('owner_disclosure_grant_1');
    expect(access.assessment?.status).toBe('remote_review');
    expect(access.customerSafeMessages?.[0].authorRole).toBe('owner');
    expect(access.privateNotes?.[0].privateBody).toBe('Private route note.');
    expect(access.currentInitialServiceProposal).toEqual(expect.objectContaining({
      proposalId: 'proposal_1', proposalVersion: 2, priceAmountMinor: 12000,
    }));
    expect(fetchMock.mock.calls[0][0]).not.toContain('owner_provider_secret');
    expect(JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)).toEqual({
      token: 'owner_provider_secret',
    });
  });

  it('publishes a versioned customer-safe proposal without private operating fields', async () => {
    const apiProposal = {
      proposal_id: 'proposal_1', assessment_id: 'assessment_1', invitation_id: 'invitation_1',
      property_id: 'property_1', organization_id: 'organization_1', disclosure_grant_id: 'grant_1',
      proposal_version: 1, status: 'sent', title: 'Routine yard care',
      customer_summary: 'Visible summary.', included_scope: ['Mow'], exclusions: ['Trees'],
      cadence_code: 'weekly', cadence_detail: 'Every Tuesday', arrival_policy: 'Confirm first.',
      weather_policy: 'Weather notice.', cancellation_policy: '24 hours.',
      proof_expectation: 'Completion note.', price_amount_minor: 9000, price_basis: 'per_visit',
      currency_code: 'USD', annualized_monthly_minor: 39000,
      issued_at_epoch_seconds: 1_799_000_000, expires_at_epoch_seconds: 1_800_000_000,
      persisted: true,
    };
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(apiProposal), { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);

    await publishProviderInitialServiceProposal('secret', 'assessment_1', {
      expectedProposalVersion: 0, title: 'Routine yard care', customerSummary: 'Visible summary.',
      includedScope: ['Mow'], exclusions: ['Trees'], cadenceCode: 'weekly',
      cadenceDetail: 'Every Tuesday', arrivalPolicy: 'Confirm first.',
      weatherPolicy: 'Weather notice.', cancellationPolicy: '24 hours.',
      proofExpectation: 'Completion note.', priceAmountMinor: 9000, priceBasis: 'per_visit',
      currencyCode: 'USD', expiresAtEpochSeconds: 1_800_000_000,
    }, 'proposal-key');
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body).toMatchObject({
      token: 'secret', expected_proposal_version: 0, included_scope: ['Mow'],
      price_amount_minor: 9000, idempotency_key: 'proposal-key',
    });
    expect(body).not.toHaveProperty('route_fit');
    expect(body).not.toHaveProperty('margin');
  });

  it('sends provider assessment mutations with token, current version, and separate visibility bodies', async () => {
    const responses = [
      { assessment_id: 'assessment_1', invitation_id: 'invitation_1', property_id: 'property_1', organization_id: 'organization_1', disclosure_grant_id: 'grant_1', assessment_method: 'remote', status: 'remote_review', version: 1 },
      { assessment_id: 'assessment_1', invitation_id: 'invitation_1', property_id: 'property_1', organization_id: 'organization_1', disclosure_grant_id: 'grant_1', assessment_method: 'remote', status: 'in_progress', version: 2 },
      { message_id: 'message_1', assessment_id: 'assessment_1', author_role: 'provider', message_kind: 'provider_answer', customer_safe_body: 'Shared answer.', assessment_version_snapshot: 2, created_at_epoch_seconds: 1 },
      { note_id: 'note_1', assessment_id: 'assessment_1', organization_id: 'organization_1', author_user_id: 'provider_1', note_kind: 'route_fit', private_body: 'Private note.', assessment_version_snapshot: 2, created_at_epoch_seconds: 2 },
    ];
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(new Response(
      JSON.stringify(responses.shift()), { status: 200 },
    )));
    vi.stubGlobal('fetch', fetchMock);

    const started = await startProviderAssessment('secret', 'grant_1', 'remote', {}, 'start-key');
    const active = await transitionProviderAssessment('secret', started, 'begin', {}, 'begin-key');
    await createProviderAssessmentMessage('secret', active, 'provider_answer', 'Shared answer.', 'message-key');
    await createProviderAssessmentPrivateNote('secret', active, 'route_fit', 'Private note.', 'note-key');

    const bodies = fetchMock.mock.calls.map((call) => JSON.parse((call[1] as RequestInit).body as string));
    expect(bodies[0]).toMatchObject({ token: 'secret', disclosure_grant_id: 'grant_1', idempotency_key: 'start-key' });
    expect(bodies[1]).toMatchObject({ action: 'begin', expected_version: 1, idempotency_key: 'begin-key' });
    expect(bodies[2]).toMatchObject({ customer_safe_body: 'Shared answer.', expected_assessment_version: 2 });
    expect(bodies[2]).not.toHaveProperty('private_body');
    expect(bodies[3]).toMatchObject({ private_body: 'Private note.', expected_assessment_version: 2 });
    expect(bodies[3]).not.toHaveProperty('customer_safe_body');
  });

  it('proposes a replacement window against the current assessment version', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      assessment_id: 'assessment_1', invitation_id: 'invitation_1', property_id: 'property_1',
      organization_id: 'organization_1', disclosure_grant_id: 'grant_1', assessment_method: 'on_site',
      status: 'window_proposed', proposed_window_start_epoch_seconds: 1_800_010_000,
      proposed_window_end_epoch_seconds: 1_800_013_600, time_zone: 'America/Phoenix', version: 3,
    }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    await proposeProviderAssessmentWindow('secret', {
      assessmentId: 'assessment_1', invitationId: 'invitation_1', propertyId: 'property_1',
      organizationId: 'organization_1', disclosureGrantId: 'grant_1', assessmentMethod: 'on_site',
      status: 'window_change_requested', version: 2,
    }, { startEpochSeconds: 1_800_010_000, endEpochSeconds: 1_800_013_600, timeZone: 'America/Phoenix' }, 'window-key');
    expect(JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)).toEqual({
      token: 'secret', proposed_window_start_epoch_seconds: 1_800_010_000,
      proposed_window_end_epoch_seconds: 1_800_013_600, time_zone: 'America/Phoenix',
      expected_version: 2, idempotency_key: 'window-key',
    });
  });
});
