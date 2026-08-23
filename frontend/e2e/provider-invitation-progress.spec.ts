import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/health/ready', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ status: 'ready', service: 'grover-landscaping-api' }),
  }));
  await page.route('**/provider-invitations/preview', async (route) => {
    const token = route.request().postDataJSON().token;
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        invitation_id: 'preview_invitation', status: 'opened',
        can_review_limited_request: true, provider_name: 'Desert Green Care',
        owner_name: 'Morgan', coarse_area: 'North Phoenix',
        care_goals: ['routine_maintenance'], cadence: 'every_two_weeks',
        recipient_email_hint: 'd***@provider.example',
        still_private_categories: ['exact_address', 'yard_photos', 'owner_contact', 'access_considerations'],
        recipient_email_checked: token !== 'first_connection_secret',
        organization_relationship_checked: false,
        opportunity_response_capability: false,
      }),
    });
  });
});

test('a first-time recipient completes the bounded known-owner connection path', async ({ page }) => {
  let recipientChecked = false;
  let organizationChecked = false;
  let responseAuthorized = false;
  let responseRecorded = false;
  await page.route('**/auth/config', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ mode: 'disabled', issuer_url: null, client_id: null, login_domain: null }),
  }));
  await page.route('**/me/access', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ user_id: 'recipient-first', username: 'Provider User', verified_email: 'dispatch@provider.example', claim_roles: [], memberships: [] }),
  }));
  await page.route('**/provider-invitations/verify-recipient', async (route) => {
    expect(route.request().postDataJSON()).toEqual({ token: 'first_connection_secret' });
    recipientChecked = true;
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({
      invitation_id: 'invitation_first', status: 'opened', can_review_limited_request: true,
      provider_name: 'Desert Green Care', owner_name: 'Morgan', coarse_area: 'North Phoenix',
      care_goals: ['routine_maintenance'], cadence: 'every_two_weeks', recipient_email_hint: 'd***@provider.example',
      still_private_categories: ['exact_address', 'yard_photos', 'owner_contact', 'access_considerations'],
      recipient_email_checked: true, organization_relationship_checked: false,
      opportunity_response_capability: false,
    }) });
  });
  await page.route('**/provider-invitations/progress', async (route) => {
    expect(recipientChecked).toBe(true);
    const progress = responseRecorded ? {
      progress_stage: 'response_recorded', status_label: 'Interest recorded; waiting for the owner’s next decision', next_action: 'wait_for_owner', response_action: 'express_interest', response_label: 'Interest recorded',
    } : responseAuthorized ? {
      progress_stage: 'response_ready', status_label: 'Limited request ready for response', next_action: 'respond_to_limited_request',
    } : organizationChecked ? {
      progress_stage: 'response_authorization_required', status_label: 'Limited response acknowledgement required', next_action: 'acknowledge_withheld_data', organization_claim_id: 'claim_first', organization_claim_status: 'relationship_checked', organization_claim_version: 1,
    } : {
      progress_stage: 'organization_check_required', status_label: 'Provider organization relationship required', next_action: 'complete_organization_check',
    };
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({
      invitation_id: 'invitation_first', recipient_email_checked: true,
      organization_relationship_checked: organizationChecked,
      opportunity_response_capability: responseAuthorized,
      closed: false, ...progress,
    }) });
  });
  await page.route('**/provider-invitations/organization-options', (route) => route.fulfill({
    contentType: 'application/json', body: JSON.stringify([{ organization_id: 'org_existing', display_name: 'Desert Green Care', membership_role: 'organization_owner', relationship_checked: false }]),
  }));
  await page.route('**/provider-invitations/organization-claims', async (route) => {
    expect(route.request().postDataJSON()).toMatchObject({ token: 'first_connection_secret', claim_kind: 'existing_relationship', organization_id: 'org_existing' });
    organizationChecked = true;
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ claim_id: 'claim_first', invitation_id: 'invitation_first', claim_kind: 'existing_relationship', proposed_display_name: 'Desert Green Care', organization_id: 'org_existing', status: 'relationship_checked', assigned_function: null, version: 1, organization_relationship_checked: true, opportunity_response_capability: false, persisted: true }) });
  });
  await page.route('**/provider-invitation-organization-claims/claim_first/response-capabilities', async (route) => {
    expect(route.request().postDataJSON()).toMatchObject({ token: 'first_connection_secret', withheld_categories_acknowledged: true });
    responseAuthorized = true;
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ capability_id: 'capability_first', invitation_id: 'invitation_first', claim_id: 'claim_first', organization_id: 'org_existing', brief_version: 1, purpose: 'known_provider_yard_assessment_response', allowed_actions: ['preliminary_question', 'express_interest', 'decline', 'report'], withheld_categories: ['exact_address', 'yard_photos', 'owner_contact', 'access_considerations'], status: 'active', expires_at_epoch_seconds: 1_900_000_000, version: 1, opportunity_response_capability: true, persisted: true }) });
  });
  await page.route('**/provider-invitations/inbox', (route) => route.fulfill({
    contentType: 'application/json', body: JSON.stringify({ invitation_id: 'invitation_first', status: 'active', can_review_limited_request: true, capability_id: 'capability_first', capability_version: 1, organization_id: 'org_existing', organization_name: 'Desert Green Care', provider_name: 'Desert Green Care', owner_name: 'Morgan', coarse_area: 'North Phoenix', care_goals: ['routine_maintenance'], cadence: 'every_two_weeks', allowed_actions: ['preliminary_question', 'express_interest', 'decline', 'report'], withheld_categories: ['exact_address', 'yard_photos', 'owner_contact', 'access_considerations'], opportunity_response_capability: true, recovery_action: null }),
  }));
  await page.route('**/provider-opportunity-responses', async (route) => {
    expect(route.request().postDataJSON()).toMatchObject({ token: 'first_connection_secret', capability_id: 'capability_first', expected_capability_version: 1, action: 'express_interest', response_code: 'ready_for_owner_disclosure' });
    responseRecorded = true;
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ response_id: 'response_first', capability_id: 'capability_first', invitation_id: 'invitation_first', organization_id: 'org_existing', action: 'express_interest', response_code: 'ready_for_owner_disclosure', status: 'recorded', capability_status: 'active', capability_version: 1, opportunity_response_capability: true, persisted: true }) });
  });

  await page.goto('/app/provider-invitation#invitation=first_connection_secret');
  await expect(page.getByRole('heading', { name: 'Desert Green Care' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue as dispatch@provider.example' }).click();
  await expect(page.getByRole('heading', { name: 'Connect the provider organization' })).toBeVisible();
  await page.getByLabel(/Desert Green Care/).check();
  await page.getByRole('button', { name: 'Continue with this organization' }).click();
  await expect(page.getByRole('heading', { name: 'Open a bounded response path' })).toBeVisible();
  await page.getByLabel(/I understand these details remain private/).check();
  await page.getByRole('button', { name: 'Open limited response' }).click();
  await expect(page.getByRole('heading', { name: 'Review the limited request' })).toBeVisible();
  await expect(page.getByText('Morgan · North Phoenix')).toBeVisible();
  await page.getByRole('button', { name: 'Request owner-approved assessment review' }).click();
  await expect(page.getByRole('heading', { name: 'Interest recorded; waiting for the owner’s next decision' })).toBeVisible();
  await expect(page.locator('body')).not.toContainText('first_connection_secret');
});

test('a checked recipient loads status without retaining the bearer fragment', async ({ page }) => {
  await page.route('**/auth/config', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ mode: 'disabled', issuer_url: null, client_id: null, login_domain: null }),
  }));
  await page.route('**/me/access', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({
      user_id: 'recipient-user-1', username: 'Provider User',
      verified_email: 'dispatch@provider.example', claim_roles: [], memberships: [],
    }),
  }));
  await page.route('**/provider-invitations/progress', async (route) => {
    expect(route.request().postDataJSON()).toEqual({ token: 'owner_provider_secret' });
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        invitation_id: 'invitation_1', progress_stage: 'response_recorded',
        status_label: 'Interest recorded; waiting for the owner’s next decision',
        next_action: 'wait_for_owner', recipient_email_checked: true,
        organization_relationship_checked: true,
        opportunity_response_capability: true, response_action: 'express_interest',
        response_label: 'Interest recorded', responded_at_epoch_seconds: 1_799_000_000,
        closed: false,
      }),
    });
  });

  await page.goto('/app/provider-invitation#invitation=owner_provider_secret');
  await expect(page).toHaveURL(/\/app\/provider-invitation$/);
  await expect(page.getByRole('heading', { name: 'Review your connection progress' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Interest recorded; waiting for the owner’s next decision' })).toBeVisible();
  await expect(page.getByText('Exact service address')).toBeVisible();
  await expect(page.locator('body')).not.toContainText('owner_provider_secret');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(await page.evaluate(() => {
    const main = document.querySelector('main');
    const heading = document.querySelector('h1');
    const brandMark = document.querySelector('.grover-brand-mark');
    if (!main || !heading || !brandMark) throw new Error('Provider shell theme was not rendered.');
    return {
      canvas: getComputedStyle(main).backgroundColor,
      displayFamily: getComputedStyle(heading).fontFamily,
      brandMark: getComputedStyle(brandMark).stroke,
    };
  })).toEqual({
    canvas: 'rgb(246, 242, 232)',
    displayFamily: '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif',
    brandMark: 'rgb(222, 199, 157)',
  });

  await page.reload();
  await expect(page.getByLabel('Invitation code')).toHaveValue('');
  await expect(page.getByRole('heading', { name: 'Interest recorded; waiting for the owner’s next decision' })).toHaveCount(0);
  await page.getByLabel('Invitation code').fill('owner_provider_secret');
  await page.getByRole('button', { name: 'Check invitation progress' }).click();
  await expect(page.getByRole('heading', { name: 'Interest recorded; waiting for the owner’s next decision' })).toBeVisible();
});

test('an activated provider sees setup status without implied first-visit authority', async ({ page }) => {
  let firstVisit: Record<string, unknown> = {
    activation_id: 'activation_activated', owner_property_id: 'owner_property_activated',
    invitation_id: 'invitation_activated', organization_id: 'organization_activated',
    organization_name: 'Desert Bloom Landscaping', customer_account_id: 'account_activated',
    customer_property_id: 'customer_property_activated', status: 'awaiting_provider',
    current_version: 0, proposal_id: null, window_start_epoch_seconds: null,
    window_end_epoch_seconds: null, time_zone: null, customer_safe_arrival_note: null,
    owner_decision: null, owner_customer_safe_note: null,
    proposed_at_epoch_seconds: null, decided_at_epoch_seconds: null, persisted: true,
  };
  await page.route('**/auth/config', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ mode: 'disabled', issuer_url: null, client_id: null, login_domain: null }),
  }));
  await page.route('**/me/access', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({
      user_id: 'recipient-user-activation', username: 'Provider User',
      verified_email: 'dispatch@provider.example', claim_roles: [], memberships: [],
    }),
  }));
  await page.route('**/provider-invitations/progress', async (route) => {
    expect(route.request().postDataJSON()).toEqual({ token: 'activated_relationship_secret' });
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        invitation_id: 'invitation_activated', activation_id: 'activation_activated',
        progress_stage: 'relationship_activated',
        status_label: 'Provider relationship activated',
        next_action: 'complete_provider_setup', recipient_email_checked: true,
        organization_relationship_checked: false,
        opportunity_response_capability: false, response_action: null,
        response_label: null, responded_at_epoch_seconds: null, closed: true,
      }),
    });
  });
  await page.route('**/provider-relationships/activation_activated/first-visit/status', async (route) => {
    expect(route.request().postDataJSON()).toEqual({ token: 'activated_relationship_secret' });
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(firstVisit) });
  });
  await page.route('**/provider-relationships/activation_activated/first-visit/proposal', async (route) => {
    const body = route.request().postDataJSON();
    expect(body).toMatchObject({
      token: 'activated_relationship_secret', expected_series_version: 0,
      customer_safe_arrival_note: 'Please unlock the side gate.',
    });
    expect(body.window_end_epoch_seconds - body.window_start_epoch_seconds).toBe(7_200);
    firstVisit = {
      ...firstVisit, status: 'proposed', current_version: 1,
      proposal_id: 'first_visit_activated',
      window_start_epoch_seconds: body.window_start_epoch_seconds,
      window_end_epoch_seconds: body.window_end_epoch_seconds,
      time_zone: body.time_zone,
      customer_safe_arrival_note: body.customer_safe_arrival_note,
      proposed_at_epoch_seconds: Math.floor(Date.now() / 1000),
    };
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(firstVisit) });
  });

  await page.goto('/app/provider-invitation#invitation=activated_relationship_secret');
  await expect(page.getByRole('heading', { name: 'Provider relationship activated' })).toBeVisible();
  await expect(page.getByText('Relationship active', { exact: true })).toBeVisible();
  await expect(page.getByText('Provider setup', { exact: true })).toBeVisible();
  await expect(page.locator('article p').filter({
    hasText: 'Safe next step: Continue customer and property onboarding',
  })).toBeVisible();
  await expect(page.getByText(/no first visit, payment, route, schedule, or crew assignment was created/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Plan the first visit separately' })).toBeVisible();
  await page.getByLabel('Arrival window starts').fill('2027-01-15T08:00');
  await page.getByLabel('Arrival window ends').fill('2027-01-15T10:00');
  await page.getByLabel('Owner-visible preparation note').fill('Please unlock the side gate.');
  await expect(page.getByText(/Crew, route, work-order, payment, and private production planning remain separate/)).toBeVisible();
  await page.getByRole('button', { name: 'Propose first-visit window' }).click();
  await expect(page.getByText('Waiting for owner confirmation')).toBeVisible();
  await expect(page.getByText('Please unlock the side gate.')).toBeVisible();
  await expect(page.getByText('Owner-approved assessment access')).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText('activated_relationship_secret');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('a provider sees only owner-approved assessment details and loses future access after revocation', async ({ page }) => {
  let accessActive = true;
  let assessment: Record<string, unknown> | null = null;
  let proposal: Record<string, unknown> | null = null;
  const messages: Record<string, unknown>[] = [];
  const privateNotes: Record<string, unknown>[] = [];
  const proposalMessages: Record<string, unknown>[] = [];
  await page.route('**/auth/config', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ mode: 'disabled', issuer_url: null, client_id: null, login_domain: null }),
  }));
  await page.route('**/me/access', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({
      user_id: 'recipient-user-1', username: 'Provider User',
      verified_email: 'dispatch@provider.example', claim_roles: [], memberships: [],
    }),
  }));
  await page.route('**/provider-invitations/progress', async (route) => {
    expect(route.request().postDataJSON()).toEqual({ token: 'selective_access_secret' });
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        invitation_id: 'invitation_2',
        progress_stage: accessActive ? 'assessment_access_ready' : 'assessment_access_closed',
        status_label: accessActive ? 'Owner-approved assessment access is ready' : 'Owner-approved assessment access ended',
        next_action: accessActive ? 'review_owner_approved_details' : 'contact_owner',
        recipient_email_checked: true, organization_relationship_checked: true,
        opportunity_response_capability: true, response_action: 'express_interest',
        response_label: 'Interest recorded', responded_at_epoch_seconds: 1_799_000_000, closed: false,
      }),
    });
  });
  await page.route('**/provider-disclosures/access', async (route) => {
    expect(route.request().postDataJSON()).toEqual({ token: 'selective_access_secret' });
    if (!accessActive) {
      await route.fulfill({
        status: 410, contentType: 'application/json',
        body: JSON.stringify({ invitation_id: 'invitation_2', status: 'revoked', can_access: false, recovery_action: 'contact_owner' }),
      });
      return;
    }
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        invitation_id: 'invitation_2', status: 'active', can_access: true,
        grant_id: 'owner_disclosure_grant_2', receipt_id: 'receipt_2',
        organization_name: 'Desert Green Care', property_name: 'Home', purpose: 'yard_assessment',
        approved_categories: ['selected_yard_photos', 'access_considerations'],
        withheld_categories: ['exact_address', 'yard_brief', 'owner_contact'], brief_version: 4,
        expires_at_epoch_seconds: 1_799_000_000,
        selected_yard_photos: [{
          media_id: 'owner_media_ready', shot_type: 'front_yard', file_label: 'front-yard.jpg',
          display_url: 'local://owner-media/owner_media_ready', thumbnail_url: null,
          authorization_expires_at_epoch_seconds: 1_799_000_000,
        }],
        access_considerations: 'Keep the side gate closed for the dog.',
        authority_boundary: 'Assessment access does not approve pricing, schedule service, assign a crew, or authorize work.',
        assessment, customer_safe_messages: messages, private_notes: privateNotes,
        initial_service_proposal: proposal,
        initial_service_proposal_messages: proposalMessages,
      }),
    });
  });
  await page.route('**/provider-assessments', async (route) => {
    const body = route.request().postDataJSON();
    expect(body).toMatchObject({ token: 'selective_access_secret', disclosure_grant_id: 'owner_disclosure_grant_2', assessment_method: 'remote' });
    assessment = {
      assessment_id: 'assessment_2', invitation_id: 'invitation_2', property_id: 'property_2',
      organization_id: 'organization_2', disclosure_grant_id: 'owner_disclosure_grant_2',
      assessment_method: 'remote', status: 'remote_review', version: 1,
    };
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(assessment) });
  });
  await page.route('**/provider-assessments/assessment_2/transitions', async (route) => {
    const body = route.request().postDataJSON();
    const currentVersion = Number(assessment?.version);
    expect(body.expected_version).toBe(currentVersion);
    assessment = {
      ...assessment,
      status: body.action === 'begin' ? 'in_progress' : 'completed',
      owner_visible_summary: body.owner_visible_summary,
      version: currentVersion + 1,
    };
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(assessment) });
  });
  await page.route('**/provider-assessments/assessment_2/messages', async (route) => {
    const body = route.request().postDataJSON();
    expect(body.private_body).toBeUndefined();
    const created = { message_id: 'message_2', assessment_id: 'assessment_2', author_role: 'provider', message_kind: body.message_kind, customer_safe_body: body.customer_safe_body, assessment_version_snapshot: body.expected_assessment_version, created_at_epoch_seconds: 1_800_000_001 };
    messages.push(created);
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(created) });
  });
  await page.route('**/provider-assessments/assessment_2/private-notes', async (route) => {
    const body = route.request().postDataJSON();
    expect(body.customer_safe_body).toBeUndefined();
    const created = { note_id: 'note_2', assessment_id: 'assessment_2', organization_id: 'organization_2', author_user_id: 'recipient-user-1', note_kind: body.note_kind, private_body: body.private_body, assessment_version_snapshot: body.expected_assessment_version, created_at_epoch_seconds: 1_800_000_002 };
    privateNotes.push(created);
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(created) });
  });
  await page.route('**/provider-assessments/assessment_2/initial-service-proposals', async (route) => {
    const body = route.request().postDataJSON();
    expect(body).toMatchObject({
      token: 'selective_access_secret', expected_proposal_version: 0,
      included_scope: ['Mow and edge turf'], exclusions: ['Tree work above eight feet'],
      price_amount_minor: 12000, price_basis: 'per_visit', currency_code: 'USD',
    });
    expect(body).not.toHaveProperty('route_fit');
    proposal = {
      proposal_id: 'proposal_2', assessment_id: 'assessment_2', invitation_id: 'invitation_2',
      property_id: 'property_2', organization_id: 'organization_2',
      disclosure_grant_id: 'owner_disclosure_grant_2', proposal_version: 1,
      status: 'sent', title: body.title, customer_summary: body.customer_summary,
      included_scope: body.included_scope, exclusions: body.exclusions,
      cadence_code: body.cadence_code, cadence_detail: body.cadence_detail,
      arrival_policy: body.arrival_policy, weather_policy: body.weather_policy,
      cancellation_policy: body.cancellation_policy, proof_expectation: body.proof_expectation,
      price_amount_minor: body.price_amount_minor, price_basis: body.price_basis,
      currency_code: body.currency_code, annualized_monthly_minor: 26000,
      revision_note: null, issued_at_epoch_seconds: 1_800_000_000,
      expires_at_epoch_seconds: body.expires_at_epoch_seconds, persisted: true,
    };
    proposalMessages.push({
      message_id: 'proposal_message_owner_2', proposal_id: 'proposal_2',
      assessment_id: 'assessment_2', author_role: 'owner',
      message_kind: 'owner_question', customer_safe_body: 'Does this include edging near the irrigation boxes?',
      proposal_version_snapshot: 1, series_version_snapshot: 1,
      in_reply_to_message_id: null, related_proposal_id: null,
      created_at_epoch_seconds: 1_800_000_010, persisted: true,
    });
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(proposal) });
  });
  await page.route('**/provider-assessments/assessment_2/initial-service-proposal-responses', async (route) => {
    const body = route.request().postDataJSON();
    expect(body).toMatchObject({
      token: 'selective_access_secret',
      in_reply_to_message_id: 'proposal_message_owner_2',
      customer_safe_body: 'Yes. Version 1 includes edging around the visible irrigation boxes.',
      expected_proposal_version: 1,
    });
    expect(body.related_proposal_id).toBeUndefined();
    const created = {
      message_id: 'proposal_message_provider_2', proposal_id: 'proposal_2',
      assessment_id: 'assessment_2', author_role: 'provider',
      message_kind: 'provider_response', customer_safe_body: body.customer_safe_body,
      proposal_version_snapshot: 1, series_version_snapshot: 1,
      in_reply_to_message_id: body.in_reply_to_message_id, related_proposal_id: null,
      created_at_epoch_seconds: 1_800_000_020, persisted: true,
    };
    proposalMessages.push(created);
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(created) });
  });

  await page.goto('/app/provider-invitation#invitation=selective_access_secret');
  await expect(page).toHaveURL(/\/app\/provider-invitation$/);
  await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();
  await expect(page.getByText('Private local preview')).toBeVisible();
  await expect(page.getByText('Keep the side gate closed for the dog.')).toBeVisible();
  await expect(page.getByText('Exact service address')).toBeVisible();
  await expect(page.getByText('Yard care brief')).toBeVisible();
  await expect(page.getByText('Owner contact')).toBeVisible();
  await expect(page.getByText('Assessment access does not approve pricing, schedule service, assign a crew, or authorize work.')).toBeVisible();
  await expect(page.getByText('Service address', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Yard brief', { exact: true })).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText('selective_access_secret');

  await page.getByRole('button', { name: 'Start remote review' }).click();
  await expect(page.getByText('remote review', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Begin assessment' }).click();
  await page.getByLabel('Customer-safe message').fill('The visible irrigation check is included in this review.');
  await page.getByRole('button', { name: 'Share with owner' }).click();
  await expect(page.getByText('The visible irrigation check is included in this review.')).toBeVisible();
  await page.getByLabel('Provider-private note').fill('Route fit remains internal.');
  await page.getByRole('button', { name: 'Save private note' }).click();
  await expect(page.getByText('Route fit remains internal.')).toBeVisible();
  await page.getByLabel('Customer-safe outcome').fill('Remote assessment complete; proposal preparation may begin separately.');
  await page.getByRole('button', { name: 'Complete assessment' }).click();
  await expect(page.getByText('Remote assessment complete; proposal preparation may begin separately.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Turn the completed assessment into a customer-safe offer' })).toBeVisible();
  await page.getByLabel('Proposal title').fill('Every-two-week yard care');
  await page.getByLabel('Price (USD)').fill('120.00');
  await page.getByLabel('Customer summary').fill('Routine front and back yard care based on the completed assessment.');
  await page.getByLabel(/Included scope/).fill('Mow and edge turf');
  await page.getByLabel(/Exclusions/).fill('Tree work above eight feet');
  await page.getByRole('button', { name: 'Send proposal to owner' }).click();
  await expect(page.getByText('Proposal version 1 was sent to the owner. Nothing was scheduled or activated.')).toBeVisible();
  await expect(page.getByText('$120.00 per visit')).toBeVisible();
  await page.getByRole('button', { name: 'Reload workspace' }).click();
  await expect(page.getByText('Does this include edging near the irrigation boxes?', { exact: true })).toBeVisible();
  await page.getByLabel('Proposal response').fill('Yes. Version 1 includes edging around the visible irrigation boxes.');
  await page.getByRole('button', { name: 'Send response' }).click();
  await expect(page.getByText(/Response shared about proposal version 1. Nothing was activated/)).toBeVisible();
  await expect(page.getByText('Yes. Version 1 includes edging around the visible irrigation boxes.')).toBeVisible();

  accessActive = false;
  await page.getByRole('button', { name: 'Check invitation progress' }).click();
  await expect(page.getByRole('heading', { name: 'Assessment access ended', exact: true })).toBeVisible();
  await expect(page.getByText('The owner-approved details are no longer available.')).toBeVisible();
  await expect(page.getByText('Private local preview')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('a provider proposes a replacement after the owner requests another on-site time', async ({ page }) => {
  await page.route('**/auth/config', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ mode: 'disabled', issuer_url: null, client_id: null, login_domain: null }) }));
  await page.route('**/me/access', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ user_id: 'recipient-user-1', username: 'Provider User', verified_email: 'dispatch@provider.example', claim_roles: [], memberships: [] }) }));
  await page.route('**/provider-invitations/progress', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify({
    invitation_id: 'invitation_3', progress_stage: 'assessment_access_ready', status_label: 'Owner-approved assessment access is ready', next_action: 'review_owner_approved_details', recipient_email_checked: true, organization_relationship_checked: true, opportunity_response_capability: true, response_action: 'express_interest', closed: false,
  }) }));
  await page.route('**/provider-disclosures/access', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify({
    invitation_id: 'invitation_3', status: 'active', can_access: true, grant_id: 'owner_disclosure_grant_3', organization_name: 'Desert Green Care', property_name: 'Home', purpose: 'yard_assessment', approved_categories: ['yard_brief'], withheld_categories: ['exact_address'], brief_version: 4, expires_at_epoch_seconds: 1_900_000_000, yard_brief: { yard_areas: ['front_yard'], care_goals: ['routine_maintenance'], cadence_preference: 'every_two_weeks' }, authority_boundary: 'Assessment access only.', assessment: { assessment_id: 'assessment_3', invitation_id: 'invitation_3', property_id: 'property_3', organization_id: 'organization_3', disclosure_grant_id: 'owner_disclosure_grant_3', assessment_method: 'on_site', status: 'window_change_requested', proposed_window_start_epoch_seconds: 1_800_000_000, proposed_window_end_epoch_seconds: 1_800_003_600, time_zone: 'America/Phoenix', version: 2 }, customer_safe_messages: [], private_notes: [],
  }) }));
  await page.route('**/provider-assessments/assessment_3/window-proposal', async (route) => {
    const body = route.request().postDataJSON();
    expect(body).toMatchObject({ token: 'replacement_secret', expected_version: 2 });
    expect(body.time_zone).toEqual(expect.any(String));
    expect(body.proposed_window_end_epoch_seconds).toBeGreaterThan(body.proposed_window_start_epoch_seconds);
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ assessment_id: 'assessment_3', invitation_id: 'invitation_3', property_id: 'property_3', organization_id: 'organization_3', disclosure_grant_id: 'owner_disclosure_grant_3', assessment_method: 'on_site', status: 'window_proposed', proposed_window_start_epoch_seconds: body.proposed_window_start_epoch_seconds, proposed_window_end_epoch_seconds: body.proposed_window_end_epoch_seconds, time_zone: body.time_zone, version: 3 }) });
  });

  await page.goto('/app/provider-invitation#invitation=replacement_secret');
  await expect(page.getByText('The owner requested another time.')).toBeVisible();
  await page.getByLabel('Replacement starts').fill('2027-01-15T10:00');
  await page.getByLabel('Replacement ends').fill('2027-01-15T11:00');
  await page.getByRole('button', { name: 'Send replacement window' }).click();
  await expect(page.getByText('Replacement assessment window sent for owner confirmation.')).toBeVisible();
  await expect(page.getByText('window proposed', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
