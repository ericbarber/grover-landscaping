import { afterEach, describe, expect, it, vi } from 'vitest';
import { configureApiAuthentication } from './authenticatedFetch';
import {
  activateOwnerProviderRelationship,
  completeOwnerIntakeMediaUpload,
  createOwnerProperty,
  createOwnerIntakeMediaUpload,
  createOwnerInitialServiceProposalMessage,
  approveOwnerProviderDisclosure,
  deleteOwnerIntakeMedia,
  decideOwnerProviderAssessmentWindow,
  createOwnerProviderAssessmentMessage,
  decideOwnerInitialServiceProposal,
  fetchOwnerIntakeMedia,
  fetchOwnerProviderAssessmentMessages,
  fetchOwnerProviderAssessments,
  fetchOwnerProviderConnectionProgress,
  fetchOwnerProviderDisclosureReceipts,
  fetchOwnerProviderDisclosureReview,
  fetchOwnerInitialServiceProposals,
  fetchOwnerInitialServiceProposalMessages,
  fetchOwnerProviderRelationshipActivation,
  fetchOwnerYardBrief,
  fetchOwnerProperties,
  saveOwnerYardBrief,
  uploadOwnerIntakeMediaFile,
  saveOwnerWorkspace,
  revokeOwnerProviderDisclosure,
} from './ownerAcquisitionClient';

afterEach(() => {
  configureApiAuthentication(false, async () => null);
  vi.unstubAllGlobals();
});

describe('Yard Owner acquisition API client', () => {
  it('maps private owner property records from the API', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify([{
      property_id: 'owner_property_1', owner_user_id: 'owner_1', display_name: 'Home',
      address_line_1: '123 Oak Street', address_line_2: '', city: 'Phoenix', region: 'AZ',
      postal_code: '85004', country_code: 'US', coarse_area: 'Central Phoenix',
      address_status: 'owner_confirmed', authority_attested: true, status: 'draft',
      version: 1, persisted: true,
    }]), { status: 200 })));

    await expect(fetchOwnerProperties()).resolves.toEqual([expect.objectContaining({
      propertyId: 'owner_property_1',
      addressLine1: '123 Oak Street',
      authorityAttested: true,
      persisted: true,
    })]);
  });

  it('sends only profile content while authentication supplies owner identity', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      owner_user_id: 'owner_1', verified_email: 'owner@example.com', display_name: 'Morgan',
      status: 'active', persisted: true,
    }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await saveOwnerWorkspace('Morgan');

    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body).toEqual({ display_name: 'Morgan' });
    expect(body).not.toHaveProperty('owner_user_id');
    expect(body).not.toHaveProperty('verified_email');
  });

  it('invalidates address confirmation when the caller has not reconfirmed it', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      property_id: 'owner_property_1', owner_user_id: 'owner_1', display_name: 'Home',
      address_line_1: '123 Oak Street', address_line_2: '', city: 'Phoenix', region: 'AZ',
      postal_code: '85004', country_code: 'US', coarse_area: '', address_status: 'unconfirmed',
      authority_attested: true, status: 'draft', version: 1, persisted: true,
    }), { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);

    await createOwnerProperty({
      displayName: 'Home', addressLine1: '123 Oak Street', city: 'Phoenix', region: 'AZ',
      postalCode: '85004', addressConfirmed: false, authorityAttested: true,
    });

    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.address_status).toBe('unconfirmed');
    expect(body).not.toHaveProperty('owner_user_id');
  });

  it('maps and versions the owner-authored private yard brief', async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify({
      brief_id: 'owner_brief_1', owner_user_id: 'owner_1', property_id: 'owner_property_1',
      version: 2, status: 'ready', yard_areas: ['Front yard'], care_goals: ['Routine upkeep'],
      cadence_preference: 'every_two_weeks', considerations: 'Keep the side gate closed.',
      author_source: 'yard_owner', persisted: true,
    }), { status: 200 })));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchOwnerYardBrief('owner_property_1')).resolves.toEqual(expect.objectContaining({
      briefId: 'owner_brief_1',
      propertyId: 'owner_property_1',
      version: 2,
      yardAreas: ['Front yard'],
      authorSource: 'yard_owner',
    }));

    await saveOwnerYardBrief('owner_property_1', {
      status: 'ready',
      yardAreas: ['Front yard'],
      careGoals: ['Routine upkeep'],
      cadencePreference: 'every_two_weeks',
      considerations: 'Keep the side gate closed.',
    });
    const body = JSON.parse((fetchMock.mock.calls[1][1] as RequestInit).body as string);
    expect(body).toEqual({
      status: 'ready',
      yard_areas: ['Front yard'],
      care_goals: ['Routine upkeep'],
      cadence_preference: 'every_two_weeks',
      considerations: 'Keep the side gate closed.',
    });
    expect(body).not.toHaveProperty('owner_user_id');
  });

  it('maps customer-safe provider connection progress without private authority data', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([{
      invitation_id: 'invitation_1', provider_name: 'Desert Bloom Yard Care',
      invitation_status: 'opened', delivery_status: 'delivered',
      progress_stage: 'disclosure_decision',
      status_label: 'Provider is interested in the next owner-approved review',
      owner_action_required: true, next_action: 'review_disclosure',
      latest_response_action: 'express_interest',
      response_label: 'Interested in reviewing the next owner-approved details',
      expires_at_epoch_seconds: 1_800_000_000, responded_at_epoch_seconds: 1_799_000_000,
      persisted: true,
    }]), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchOwnerProviderConnectionProgress('owner_property_1')).resolves.toEqual([
      expect.objectContaining({
        invitationId: 'invitation_1',
        progressStage: 'disclosure_decision',
        ownerActionRequired: true,
        latestResponseAction: 'express_interest',
      }),
    ]);
    expect(fetchMock.mock.calls[0][0]).toContain(
      '/owner-properties/owner_property_1/provider-connection-progress',
    );
  });

  it('keeps disclosure snapshots server-derived and sends only affirmative owner choices', async () => {
    const reviewApi = {
      review_version: `disclosure_review_v1_${'0'.repeat(64)}`,
      invitation_id: 'invitation_1', property_name: 'Home',
      provider_organization_name: 'Desert Bloom', purpose: 'yard_assessment',
      brief_version: 2, exact_address: '123 Oak Street, Phoenix, AZ 85004',
      yard_areas: ['Front yard'], care_goals: ['Routine upkeep'],
      cadence_preference: 'every_two_weeks', access_considerations: 'Use side gate',
      owner_contact: 'Morgan — owner@example.com',
      available_categories: ['exact_address', 'yard_brief', 'selected_yard_photos', 'owner_contact', 'access_considerations'],
      media_options: [{ media_id: 'media_1', shot_type: 'front_yard', file_label: 'front.jpg' }],
      consent_text_version: 'owner-provider-assessment-consent-v1',
      retention_notice_version: 'owner-provider-assessment-retention-v1',
      retention_notice: 'Future access can be ended.', authority_boundary: 'Assessment only.',
      expires_at_epoch_seconds: 1_800_000_000,
    };
    const receiptApi = {
      receipt_id: 'receipt_1', grant_id: 'grant_1', invitation_id: 'invitation_1',
      property_name: 'Home', organization_name: 'Desert Bloom', purpose: 'yard_assessment',
      approved_categories: ['exact_address'], withheld_categories: ['yard_brief'],
      selected_photos: [], brief_version: 2, grant_version: 1,
      affirmed_at_epoch_seconds: 1_700_000_000, status: 'active',
      expires_at_epoch_seconds: 1_800_000_000, version: 1,
      latest_event_kind: 'created', latest_reason_code: null,
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(reviewApi), { status: 200 }))
      .mockResolvedValueOnce(new Response('{}', { status: 201 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([receiptApi]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ...receiptApi, status: 'revoked', version: 2 }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const review = await fetchOwnerProviderDisclosureReview('property_1', 'invitation_1');
    await approveOwnerProviderDisclosure('property_1', 'invitation_1', review, ['exact_address'], [], 'approval-key-1');
    const approvalBody = JSON.parse((fetchMock.mock.calls[1][1] as RequestInit).body as string);
    expect(approvalBody.approved_categories).toEqual(['exact_address']);
    expect(approvalBody).not.toHaveProperty('exact_address');
    const [receipt] = await fetchOwnerProviderDisclosureReceipts('property_1');
    expect(receipt).toEqual(expect.objectContaining({ grantId: 'grant_1', status: 'active' }));
    await revokeOwnerProviderDisclosure('property_1', receipt, 'owner_choice', 'revoke-key-1');
    expect(JSON.parse((fetchMock.mock.calls[3][1] as RequestInit).body as string)).toEqual({
      expected_version: 1, reason_code: 'owner_choice', owner_confirmed: true,
      idempotency_key: 'revoke-key-1',
    });
  });

  it('maps owner assessment progress and sends versioned owner decisions and messages', async () => {
    const assessmentApi = {
      assessment_id: 'assessment_1', invitation_id: 'invitation_1',
      property_id: 'property_1', organization_id: 'organization_1',
      disclosure_grant_id: 'grant_1', assessment_method: 'on_site',
      status: 'window_proposed', proposed_window_start_epoch_seconds: 1_800_000_000,
      proposed_window_end_epoch_seconds: 1_800_001_800, time_zone: 'America/Phoenix',
      outcome_reason_code: null, owner_visible_summary: null, version: 2, persisted: true,
    };
    const messageApi = {
      message_id: 'message_1', assessment_id: 'assessment_1', author_role: 'owner',
      message_kind: 'owner_question', customer_safe_body: 'Should I unlock the side gate?',
      assessment_version_snapshot: 3, created_at_epoch_seconds: 1_799_000_000,
      persisted: true,
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([assessmentApi]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        ...assessmentApi, status: 'owner_confirmed', version: 3,
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(messageApi), { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);

    const [assessment] = await fetchOwnerProviderAssessments('property_1');
    await expect(fetchOwnerProviderAssessmentMessages('property_1', assessment.assessmentId))
      .resolves.toEqual([]);
    const confirmed = await decideOwnerProviderAssessmentWindow(
      'property_1', assessment, 'confirm', 'owner-window-1',
    );
    expect(confirmed.status).toBe('owner_confirmed');
    expect(JSON.parse((fetchMock.mock.calls[2][1] as RequestInit).body as string)).toEqual({
      action: 'confirm', expected_version: 2, idempotency_key: 'owner-window-1',
    });
    await expect(createOwnerProviderAssessmentMessage(
      'property_1', confirmed, 'owner_question', 'Should I unlock the side gate?',
      'owner-message-1',
    )).resolves.toEqual(expect.objectContaining({
      messageId: 'message_1', authorRole: 'owner', assessmentVersionSnapshot: 3,
    }));
    expect(JSON.parse((fetchMock.mock.calls[3][1] as RequestInit).body as string)).toEqual({
      message_kind: 'owner_question',
      customer_safe_body: 'Should I unlock the side gate?',
      expected_assessment_version: 3,
      idempotency_key: 'owner-message-1',
    });
  });

  it('maps immutable proposals and sends an exact versioned acceptance', async () => {
    const proposalApi = {
      proposal_id: 'proposal_1', assessment_id: 'assessment_1', invitation_id: 'invitation_1',
      property_id: 'property_1', organization_id: 'organization_1', disclosure_grant_id: 'grant_1',
      proposal_version: 2, status: 'sent', title: 'Routine yard care',
      customer_summary: 'Visible summary.', included_scope: ['Mow'], exclusions: ['Trees'],
      cadence_code: 'every_two_weeks', cadence_detail: 'Every other Tuesday',
      arrival_policy: 'Confirm first.', weather_policy: 'Weather notice.',
      cancellation_policy: '24 hours.', proof_expectation: 'Completion note.',
      price_amount_minor: 12000, price_basis: 'per_visit', currency_code: 'USD',
      annualized_monthly_minor: 26000, revision_note: 'Updated price.',
      issued_at_epoch_seconds: 1_799_000_000, expires_at_epoch_seconds: 1_800_000_000,
      persisted: true,
    };
    const decisionApi = {
      decision_id: 'decision_1', proposal_id: 'proposal_1', action: 'accept',
      proposal_version: 2, affirmation_text_version: 'initial_service_proposal_acceptance_v1',
      decided_at_epoch_seconds: 1_799_500_000, acceptance_snapshot_id: 'snapshot_1',
      acceptance_snapshot_sha256: 'a'.repeat(64), persisted: true,
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([proposalApi]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(decisionApi), { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);
    const [proposal] = await fetchOwnerInitialServiceProposals('property_1');
    expect(proposal).toEqual(expect.objectContaining({
      proposalVersion: 2, revisionNote: 'Updated price.', annualizedMonthlyMinor: 26000,
    }));
    await decideOwnerInitialServiceProposal('property_1', proposal, 'accept', {
      customerSafeNote: 'Please contact me first.',
      affirmationTextVersion: 'initial_service_proposal_acceptance_v1',
    }, 'decision-key');
    expect(JSON.parse((fetchMock.mock.calls[1][1] as RequestInit).body as string)).toEqual({
      action: 'accept', expected_proposal_version: 2, customer_safe_note: 'Please contact me first.',
      affirmation_text_version: 'initial_service_proposal_acceptance_v1', idempotency_key: 'decision-key',
    });
  });

  it('maps and creates proposal-version messages separately from decisions', async () => {
    const proposal = {
      proposalId: 'proposal_2', assessmentId: 'assessment_1', invitationId: 'invitation_1',
      propertyId: 'property_1', organizationId: 'organization_1', disclosureGrantId: 'grant_1',
      proposalVersion: 2, status: 'sent' as const, title: 'Routine yard care',
      customerSummary: 'Visible summary.', includedScope: ['Mow'], exclusions: ['Trees'],
      cadenceCode: 'every_two_weeks' as const, cadenceDetail: 'Every other Tuesday',
      arrivalPolicy: 'Confirm first.', weatherPolicy: 'Weather notice.',
      cancellationPolicy: '24 hours.', proofExpectation: 'Completion note.',
      priceAmountMinor: 12000, priceBasis: 'per_visit' as const, currencyCode: 'USD',
      issuedAtEpochSeconds: 1_799_000_000, expiresAtEpochSeconds: 1_800_000_000,
      persisted: true,
    };
    const messageApi = {
      message_id: 'proposal_message_1', proposal_id: 'proposal_2',
      assessment_id: 'assessment_1', author_role: 'owner',
      message_kind: 'owner_change_request', customer_safe_body: 'Please adjust the cadence.',
      proposal_version_snapshot: 2, series_version_snapshot: 2,
      in_reply_to_message_id: null, related_proposal_id: null,
      created_at_epoch_seconds: 1_799_500_000, persisted: true,
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([messageApi]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(messageApi), { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchOwnerInitialServiceProposalMessages('property_1', 'proposal_2'))
      .resolves.toEqual([expect.objectContaining({
        messageId: 'proposal_message_1', messageKind: 'owner_change_request',
        proposalVersionSnapshot: 2,
      })]);
    await createOwnerInitialServiceProposalMessage(
      'property_1', proposal, 'owner_change_request', 'Please adjust the cadence.', 'message-key',
    );
    expect(JSON.parse((fetchMock.mock.calls[1][1] as RequestInit).body as string)).toEqual({
      message_kind: 'owner_change_request',
      customer_safe_body: 'Please adjust the cadence.',
      expected_proposal_version: 2,
      idempotency_key: 'message-key',
    });
  });

  it('loads and creates an exact-version relationship activation', async () => {
    const proposal = {
      proposalId: 'proposal_2', assessmentId: 'assessment_1', invitationId: 'invitation_1',
      propertyId: 'property_1', organizationId: 'organization_1', disclosureGrantId: 'grant_1',
      proposalVersion: 2, status: 'accepted' as const, title: 'Routine yard care',
      customerSummary: 'Visible summary.', includedScope: ['Mow'], exclusions: ['Trees'],
      cadenceCode: 'every_two_weeks' as const, cadenceDetail: 'Every other Tuesday',
      arrivalPolicy: 'Confirm first.', weatherPolicy: 'Weather notice.',
      cancellationPolicy: '24 hours.', proofExpectation: 'Completion note.',
      priceAmountMinor: 12000, priceBasis: 'per_visit' as const, currencyCode: 'USD',
      issuedAtEpochSeconds: 1_799_000_000, expiresAtEpochSeconds: 1_800_000_000,
      persisted: true,
    };
    const activationApi = {
      activation_id: 'activation_1', owner_property_id: 'property_1',
      invitation_id: 'invitation_1', organization_id: 'organization_1',
      proposal_id: 'proposal_2', proposal_version: 2,
      acceptance_snapshot_id: 'snapshot_1', acceptance_snapshot_sha256: 'a'.repeat(64),
      customer_account_id: 'account_1', customer_property_id: 'customer_property_1',
      owner_membership_id: 'membership_1', portal_access_id: 'portal_1',
      status: 'provider_setup', closed_competing_invitation_count: 1,
      activated_at_epoch_seconds: 1_799_500_000, persisted: true,
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        error: 'owner_provider_relationship_activation_not_found', message: 'Not found.',
      }), { status: 404, headers: { 'content-type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify(activationApi), { status: 201 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(activationApi), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchOwnerProviderRelationshipActivation('property_1', 'proposal_2'))
      .resolves.toBeUndefined();
    await expect(activateOwnerProviderRelationship(
      'property_1', proposal, 'owner_provider_relationship_activation_v1', 'activation-key',
    )).resolves.toEqual(expect.objectContaining({
      activationId: 'activation_1', status: 'provider_setup',
      closedCompetingInvitationCount: 1,
    }));
    expect(JSON.parse((fetchMock.mock.calls[1][1] as RequestInit).body as string)).toEqual({
      expected_proposal_version: 2,
      activation_affirmation_text_version: 'owner_provider_relationship_activation_v1',
      owner_confirmed: true,
      idempotency_key: 'activation-key',
    });
    await expect(fetchOwnerProviderRelationshipActivation('property_1', 'proposal_2'))
      .resolves.toEqual(expect.objectContaining({ customerPropertyId: 'customer_property_1' }));
  });

  it('creates an independently scoped guided-media upload without provider identifiers', async () => {
    const apiMedia = {
      media_id: 'owner_media_1', owner_user_id: 'owner_1', property_id: 'owner_property_1',
      brief_id: 'owner_brief_2', shot_type: 'front_yard', file_name: 'front.jpg',
      content_type: 'image/jpeg', upload_mode: 'local-placeholder',
      object_key: 'local/owner-intake/private/owner_property_1/front_yard/front.jpg',
      thumbnail_object_key: null, status: 'pending_upload', file_size_bytes: null,
      image_width_px: null, image_height_px: null, metadata_source: null,
      rejection_reason: null, replaces_media_id: null, replaced_by_media_id: null,
      display_url: null, thumbnail_url: null, persisted: true,
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([apiMedia]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        media: apiMedia,
        upload_url: 'local://private-upload',
        thumbnail_upload_url: null,
        thumbnail_content_type: null,
        thumbnail_max_dimension_px: null,
      }), { status: 201 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        ...apiMedia,
        status: 'ready',
        file_size_bytes: 5,
        metadata_source: 'client_reported',
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ...apiMedia, status: 'deleted' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchOwnerIntakeMedia('owner_property_1')).resolves.toEqual([
      expect.objectContaining({ mediaId: 'owner_media_1', shotType: 'front_yard' }),
    ]);
    const file = new File(['image'], 'front.jpg', { type: 'image/jpeg' });
    const upload = await createOwnerIntakeMediaUpload('owner_property_1', file, 'front_yard');
    expect(upload.media.objectKey).toContain('owner-intake');
    const createBody = JSON.parse((fetchMock.mock.calls[1][1] as RequestInit).body as string);
    expect(createBody).toEqual({
      file_name: 'front.jpg',
      content_type: 'image/jpeg',
      shot_type: 'front_yard',
      replaces_media_id: null,
    });
    expect(createBody).not.toHaveProperty('job_id');
    expect(createBody).not.toHaveProperty('organization_id');
    await uploadOwnerIntakeMediaFile(upload, file);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await expect(completeOwnerIntakeMediaUpload(
      'owner_property_1',
      'owner_media_1',
      file,
    )).resolves.toEqual(expect.objectContaining({ status: 'ready', fileSizeBytes: 5 }));
    expect(JSON.parse((fetchMock.mock.calls[2][1] as RequestInit).body as string)).toEqual({
      file_size_bytes: file.size,
    });
    await expect(deleteOwnerIntakeMedia('owner_property_1', 'owner_media_1')).resolves.toEqual(
      expect.objectContaining({ status: 'deleted' }),
    );
  });
});
