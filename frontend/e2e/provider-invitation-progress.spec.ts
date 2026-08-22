import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/health/ready', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ status: 'ready', service: 'grover-landscaping-api' }),
  }));
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
