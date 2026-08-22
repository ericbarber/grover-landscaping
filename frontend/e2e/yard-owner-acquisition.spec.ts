import { expect, test } from '@playwright/test';

test('a verified owner creates a private profile and reconfirms a changed address', async ({ page }) => {
  let yardBriefVersion = 0;
  let mediaVersion = 0;
  let mediaRecords: Array<Record<string, unknown>> = [];
  await page.route('**/auth/config', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ mode: 'disabled', issuer_url: null, client_id: null, login_domain: null }),
  }));
  await page.route('**/me/access', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({
      user_id: 'local-development-user',
      username: 'Local Developer',
      verified_email: 'owner@example.com',
      claim_roles: [],
      memberships: [],
    }),
  }));
  await page.route('**/owner-workspace', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'owner_workspace_not_found',
          message: 'Your Yard Owner workspace has not been created yet.',
        }),
      });
      return;
    }
    const request = route.request().postDataJSON();
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        owner_user_id: 'local-development-user',
        verified_email: 'owner@example.com',
        display_name: request.display_name,
        status: 'active',
        persisted: true,
      }),
    });
  });
  await page.route('**/owner-properties', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ contentType: 'application/json', body: '[]' });
      return;
    }
    const request = route.request().postDataJSON();
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        property_id: 'owner_property_1',
        owner_user_id: 'local-development-user',
        display_name: request.display_name,
        address_line_1: request.address_line_1,
        address_line_2: request.address_line_2 ?? '',
        city: request.city,
        region: request.region,
        postal_code: request.postal_code,
        country_code: request.country_code,
        coarse_area: request.coarse_area ?? '',
        address_status: request.address_status,
        authority_attested: request.authority_attested,
        status: 'draft',
        version: 1,
        persisted: true,
      }),
    });
  });
  await page.route('**/owner-properties/owner_property_1/yard-brief', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'owner_yard_brief_not_found',
          message: 'A private yard brief has not been saved for this property.',
        }),
      });
      return;
    }
    const request = route.request().postDataJSON();
    yardBriefVersion += 1;
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        brief_id: `owner_brief_${yardBriefVersion}`,
        owner_user_id: 'local-development-user',
        property_id: 'owner_property_1',
        version: yardBriefVersion,
        status: request.status,
        yard_areas: request.yard_areas,
        care_goals: request.care_goals,
        cadence_preference: request.cadence_preference,
        considerations: request.considerations,
        author_source: 'yard_owner',
        persisted: true,
      }),
    });
  });
  await page.route('**/owner-properties/owner_property_1/intake-media', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify(mediaRecords) });
      return;
    }
    const request = route.request().postDataJSON();
    mediaVersion += 1;
    const record = {
      media_id: `owner_media_${mediaVersion}`,
      owner_user_id: 'local-development-user',
      property_id: 'owner_property_1',
      brief_id: `owner_brief_${yardBriefVersion}`,
      shot_type: request.shot_type,
      file_name: request.file_name,
      content_type: request.content_type,
      upload_mode: 'local-placeholder',
      object_key: `owner-intake/private/owner_media_${mediaVersion}.jpg`,
      thumbnail_object_key: null,
      status: 'pending_upload',
      file_size_bytes: null,
      image_width_px: null,
      image_height_px: null,
      metadata_source: null,
      rejection_reason: null,
      replaces_media_id: request.replaces_media_id,
      replaced_by_media_id: null,
      display_url: null,
      thumbnail_url: null,
      persisted: true,
    };
    mediaRecords = [record, ...mediaRecords];
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ media: record, upload_url: '/api/photo-placeholder' }),
    });
  });
  await page.route('**/owner-properties/owner_property_1/provider-connection-progress', (route) => route.fulfill({
    contentType: 'application/json',
    body: '[]',
  }));
  await page.route('**/owner-properties/owner_property_1/provider-disclosure-receipts', (route) => route.fulfill({
    contentType: 'application/json',
    body: '[]',
  }));
  await page.route('**/owner-properties/owner_property_1/provider-assessments', (route) => route.fulfill({
    contentType: 'application/json',
    body: '[]',
  }));
  await page.route('**/owner-properties/owner_property_1/initial-service-proposals', (route) => route.fulfill({
    contentType: 'application/json', body: '[]',
  }));
  await page.route('**/owner-properties/owner_property_1/intake-media/*/complete', async (route) => {
    const mediaId = route.request().url().split('/').at(-2);
    const replacement = mediaRecords.find((record) => record.media_id === mediaId);
    if (replacement?.replaces_media_id) {
      mediaRecords = mediaRecords.map((record) => record.media_id === replacement.replaces_media_id
        ? { ...record, status: 'replaced', replaced_by_media_id: mediaId }
        : record);
    }
    mediaRecords = mediaRecords.map((record) => record.media_id === mediaId
      ? {
          ...record,
          status: 'ready',
          file_size_bytes: route.request().postDataJSON().file_size_bytes ?? 64,
          metadata_source: 'client_reported',
        }
      : record);
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(mediaRecords.find((record) => record.media_id === mediaId)),
    });
  });
  await page.route('**/owner-properties/owner_property_1/intake-media/*', async (route) => {
    if (route.request().method() !== 'DELETE') {
      await route.fallback();
      return;
    }
    const mediaId = route.request().url().split('/').at(-1);
    const deleted = mediaRecords.find((record) => record.media_id === mediaId);
    mediaRecords = mediaRecords.filter((record) => record.media_id !== mediaId);
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ ...deleted, status: 'deleted', display_url: null, thumbnail_url: null }),
    });
  });

  await page.goto('/for-yard-owners');
  await expect(page.getByRole('link', { name: 'Sign up your yard' })).toBeVisible();
  await page.getByRole('link', { name: 'Sign up your yard' }).click();
  await expect(page).toHaveURL(/\/app\/yard-owner$/);
  await expect(page.getByRole('heading', { name: 'Tell us about the yard. You choose who sees it.' })).toBeVisible();
  await page.getByLabel('Your name').fill('Morgan Reyes');
  await page.getByRole('button', { name: 'Save and add my property' }).click();

  await page.getByLabel('Street address').fill('123 Oak Street');
  await page.getByLabel('City').fill('Phoenix');
  await page.getByLabel('State or region').fill('AZ');
  await page.getByLabel('ZIP or postal code').fill('85004');
  const addressConfirmation = page.getByLabel('I reviewed this address and it is correct. Editing an address field will require confirmation again.');
  await addressConfirmation.check();
  await page.getByLabel('Street address').fill('125 Oak Street');
  await expect(addressConfirmation).not.toBeChecked();
  await addressConfirmation.check();
  await page.getByLabel('I am authorized to request yard care for this property.').check();
  await page.getByRole('button', { name: 'Save private property' }).click();

  await expect(page.getByText('Home is saved privately. No provider can see it yet.')).toBeVisible();
  await expect(page.getByText('125 Oak Street')).toBeVisible();
  await expect(page.getByText('Private draft')).toBeVisible();
  await page.getByRole('button', { name: 'Your details, complete' }).click();
  await page.getByLabel('Your name').fill('Morgan Reyes-Smith');
  await page.getByRole('button', { name: 'Save changes and continue' }).click();
  await expect(page.getByRole('heading', { name: 'Your properties' })).toBeVisible();
  await expect(page.getByText('Private to Morgan Reyes-Smith until a provider connection is approved.')).toBeVisible();
  await page.getByRole('button', { name: 'Build or review yard brief' }).click();
  await expect(page.getByRole('heading', { name: 'Describe the yard and the care you want' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Your properties' })).not.toBeVisible();
  await expect(page.getByRole('heading', { name: 'Provider connection progress' })).not.toBeVisible();
  await page.getByRole('button', { name: 'Property, complete' }).click();
  await expect(page.getByRole('heading', { name: 'Your properties' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Describe the yard and the care you want' })).not.toBeVisible();
  await page.getByRole('button', { name: 'Yard brief', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Describe the yard and the care you want' })).toBeVisible();
  await page.getByLabel('Front yard').check();
  await page.getByLabel('Routine upkeep').check();
  await page.getByLabel('Preferred care cadence').selectOption('every_two_weeks');
  await page.getByLabel('Access, pets, concerns, or priorities').fill('Keep the side gate closed for the dog.');
  await page.getByRole('button', { name: 'Save private draft' }).click();
  await expect(page.getByText('Private draft version 1 is saved.')).toBeVisible();
  await page.getByLabel('Back yard').check();
  await page.getByRole('button', { name: 'Save ready brief' }).click();
  await expect(page.getByText('Yard brief version 2 is ready and still private.')).toBeVisible();
  await expect(page.getByText('Version 2 · ready')).toBeVisible();
  await expect(page.getByText('This is your starting brief—not a measurement, diagnosis, price, work order, or provider instruction.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Add useful views without diagnosing the yard' })).toBeVisible();
  await page.getByRole('button', { name: 'Connect care', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Provider connection progress' })).toBeVisible();
  await expect(page.getByText('No provider connection has started.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Describe the yard and the care you want' })).not.toBeVisible();
  await page.getByRole('button', { name: 'Yard brief, complete' }).click();
  await expect(page.getByRole('heading', { name: 'Describe the yard and the care you want' })).toBeVisible();
  await page.getByLabel('Choose photograph').setInputFiles({
    name: 'front-yard.jpg',
    mimeType: 'image/jpeg',
    buffer: Buffer.from('private-yard-photo'),
  });
  await page.getByRole('button', { name: 'Add private photograph' }).click();
  await expect(page.getByText('The photograph is saved privately. No provider can see it yet.')).toBeVisible();
  await expect(page.getByText('front-yard.jpg')).toBeVisible();
  await expect(page.getByText('ready', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Replace' }).click();
  await expect(page.getByText('The original stays active until its replacement finishes successfully.')).toBeVisible();
  await page.getByLabel('Choose photograph').setInputFiles({
    name: 'front-yard-new.jpg',
    mimeType: 'image/jpeg',
    buffer: Buffer.from('replacement-private-yard-photo'),
  });
  await page.getByRole('button', { name: 'Upload replacement' }).click();
  await expect(page.getByText('front-yard-new.jpg')).toBeVisible();
  await expect(page.getByText('replaced', { exact: true })).toBeVisible();
  await expect(page.getByText('This older photo is no longer active. Delete it when you no longer need it.')).toBeVisible();
  await page.getByRole('button', { name: 'Save private draft' }).click();
  await expect(page.getByText('Private draft version 3 is saved.')).toBeVisible();
  await expect(page.getByText('Your latest brief is a draft. Existing photos remain private and deletable; mark the current brief ready before adding or replacing a photo.')).toBeVisible();
  await expect(page.getByText('front-yard-new.jpg')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Replace' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Save ready brief' }).click();
  await expect(page.getByText('Yard brief version 4 is ready and still private.')).toBeVisible();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Delete' }).last().click();
  await expect(page.getByText('The private photograph was deleted.')).toBeVisible();
  await expect(page.getByText('front-yard.jpg')).not.toBeVisible();
  await page.getByRole('button', { name: 'Continue to connect care' }).click();
  await expect(page.getByText('Private intake is complete. No provider connection or sharing has started.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Provider connection progress' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Describe the yard and the care you want' })).not.toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.getByRole('heading', { name: 'You control each connection.' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('an owner safely retries approval and reconciles a stale revocation after lost responses', async ({ page }) => {
  let accessState: 'decision' | 'active' | 'revoked' = 'decision';
  let receipts: Array<Record<string, unknown>> = [];
  const approvalKeys: string[] = [];
  const revokeKeys: string[] = [];
  const property = {
    property_id: 'owner_property_2', owner_user_id: 'local-development-user', display_name: 'Home',
    address_line_1: '125 Oak Street', address_line_2: '', city: 'Phoenix', region: 'AZ',
    postal_code: '85004', country_code: 'US', coarse_area: 'Central Phoenix',
    address_status: 'owner_confirmed', authority_attested: true, status: 'draft', version: 1, persisted: true,
  };
  const brief = {
    brief_id: 'owner_brief_ready', owner_user_id: 'local-development-user', property_id: 'owner_property_2',
    version: 4, status: 'ready', yard_areas: ['Front yard', 'Back yard'], care_goals: ['Routine upkeep'],
    cadence_preference: 'every_two_weeks', considerations: 'Keep the side gate closed for the dog.',
    author_source: 'yard_owner', persisted: true,
  };
  const photo = {
    media_id: 'owner_media_ready', owner_user_id: 'local-development-user', property_id: 'owner_property_2',
    brief_id: 'owner_brief_ready', shot_type: 'front_yard', file_name: 'front-yard.jpg', content_type: 'image/jpeg',
    upload_mode: 'object_storage', object_key: 'owner-intake/private/front-yard.jpg', thumbnail_object_key: null,
    status: 'ready', file_size_bytes: 64, image_width_px: 1200, image_height_px: 800,
    metadata_source: 'client_reported', rejection_reason: null, replaces_media_id: null, replaced_by_media_id: null,
    display_url: 'local://owner-media/owner_media_ready', thumbnail_url: null, persisted: true,
  };
  const progress = () => [{
    invitation_id: 'invitation_2', provider_name: 'Desert Green Care', invitation_status: 'responded',
    delivery_status: 'delivered',
    progress_stage: accessState === 'decision' ? 'disclosure_decision' : accessState === 'active' ? 'assessment_access_approved' : 'assessment_access_ended',
    status_label: accessState === 'decision' ? 'Provider interest is ready for your review' : accessState === 'active' ? 'Assessment access is active' : 'Assessment access ended',
    owner_action_required: accessState === 'decision',
    next_action: accessState === 'decision' ? 'review_disclosure' : accessState === 'active' ? 'wait_for_assessment' : 'review_connection',
    latest_response_action: 'express_interest', response_label: 'Interested in assessing this yard',
    expires_at_epoch_seconds: 1_799_000_000, responded_at_epoch_seconds: 1_798_000_000, persisted: true,
  }];
  const activeReceipt = () => ({
    receipt_id: 'receipt_2', grant_id: 'grant_2', invitation_id: 'invitation_2', property_name: 'Home',
    organization_name: 'Desert Green Care', purpose: 'yard_assessment',
    approved_categories: ['exact_address', 'selected_yard_photos'],
    withheld_categories: ['yard_brief', 'owner_contact', 'access_considerations'],
    selected_photos: [{ media_id: 'owner_media_ready', file_label: 'front-yard.jpg', shot_type: 'front_yard' }],
    brief_version: 4, grant_version: 1, affirmed_at_epoch_seconds: 1_798_100_000,
    status: accessState === 'revoked' ? 'revoked' : 'active', expires_at_epoch_seconds: 1_799_000_000,
    version: accessState === 'revoked' ? 2 : 1,
    latest_event_kind: accessState === 'revoked' ? 'revoked' : 'granted',
    latest_reason_code: accessState === 'revoked' ? 'assessment_complete' : null,
  });

  await page.route('**/auth/config', (route) => route.fulfill({
    contentType: 'application/json', body: JSON.stringify({ mode: 'disabled', issuer_url: null, client_id: null, login_domain: null }),
  }));
  await page.route('**/me/access', (route) => route.fulfill({
    contentType: 'application/json', body: JSON.stringify({
      user_id: 'local-development-user', username: 'Morgan Reyes', verified_email: 'owner@example.com', claim_roles: [], memberships: [],
    }),
  }));
  await page.route('**/owner-workspace', (route) => route.fulfill({
    contentType: 'application/json', body: JSON.stringify({
      owner_user_id: 'local-development-user', verified_email: 'owner@example.com', display_name: 'Morgan Reyes', status: 'active', persisted: true,
    }),
  }));
  await page.route('**/owner-properties', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify([property]) }));
  await page.route('**/owner-properties/owner_property_2/yard-brief', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify(brief) }));
  await page.route('**/owner-properties/owner_property_2/intake-media', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify([photo]) }));
  await page.route('**/owner-properties/owner_property_2/provider-connection-progress', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify(progress()) }));
  await page.route('**/owner-properties/owner_property_2/provider-disclosure-receipts', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify(receipts) }));
  await page.route('**/owner-properties/owner_property_2/provider-assessments', (route) => route.fulfill({ contentType: 'application/json', body: '[]' }));
  await page.route('**/owner-properties/owner_property_2/initial-service-proposals', (route) => route.fulfill({ contentType: 'application/json', body: '[]' }));
  await page.route('**/owner-properties/owner_property_2/provider-invitations/invitation_2/disclosure-review', (route) => route.fulfill({
    contentType: 'application/json', body: JSON.stringify({
      review_version: 'review-v1', invitation_id: 'invitation_2', property_name: 'Home', provider_organization_name: 'Desert Green Care',
      purpose: 'yard_assessment', brief_version: 4, exact_address: '125 Oak Street, Phoenix, AZ 85004',
      yard_areas: ['Front yard', 'Back yard'], care_goals: ['Routine upkeep'], cadence_preference: 'every_two_weeks',
      access_considerations: 'Keep the side gate closed for the dog.', owner_contact: 'Morgan Reyes · owner@example.com',
      available_categories: ['exact_address', 'yard_brief', 'selected_yard_photos', 'owner_contact', 'access_considerations'],
      media_options: [{ media_id: 'owner_media_ready', shot_type: 'front_yard', file_label: 'front-yard.jpg', thumbnail_url: null }],
      consent_text_version: 'owner-disclosure-v1', retention_notice_version: 'retention-v1',
      retention_notice: 'The provider may retain assessment records required for business or legal purposes.',
      authority_boundary: 'Assessment access does not approve pricing, schedule service, assign a crew, or authorize work.',
      expires_at_epoch_seconds: 1_799_000_000,
    }),
  }));
  await page.route('**/owner-properties/owner_property_2/provider-invitations/invitation_2/disclosure-grants', async (route) => {
    const request = route.request().postDataJSON();
    approvalKeys.push(request.idempotency_key);
    expect(request.approved_categories).toEqual(['exact_address', 'selected_yard_photos']);
    expect(request.selected_media_ids).toEqual(['owner_media_ready']);
    expect(request.owner_affirmed).toBe(true);
    accessState = 'active';
    receipts = [activeReceipt()];
    if (approvalKeys.length === 1) {
      await route.abort('failed');
      return;
    }
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(activeReceipt()) });
  });
  await page.route('**/owner-properties/owner_property_2/provider-disclosure-grants/grant_2/revoke', async (route) => {
    const request = route.request().postDataJSON();
    revokeKeys.push(request.idempotency_key);
    expect(request).toMatchObject({ expected_version: 1, reason_code: 'assessment_complete', owner_confirmed: true });
    if (revokeKeys.length === 1) {
      await route.abort('failed');
      return;
    }
    accessState = 'revoked';
    receipts = [activeReceipt()];
    await route.fulfill({
      status: 409,
      contentType: 'application/json',
      body: JSON.stringify({
        error: 'owner_provider_disclosure_revoke_conflict',
        message: 'Assessment access changed before this request was applied.',
      }),
    });
  });

  await page.goto('/app/yard-owner');
  await page.getByRole('button', { name: 'Build or review yard brief' }).click();
  await page.getByRole('button', { name: 'Connect care', exact: true }).click();
  await expect(page.getByText('Nothing new is shared yet.')).toBeVisible();
  await page.getByRole('button', { name: 'Review access for Desert Green Care' }).click();
  await expect(page.getByRole('heading', { name: 'Review access for Desert Green Care' })).toBeFocused();
  await expect(page.getByLabel('Exact service address')).not.toBeChecked();
  await expect(page.getByLabel('Yard care brief')).not.toBeChecked();
  await page.getByLabel('Exact service address').check();
  await page.getByLabel('Selected yard photographs').check();
  await page.getByLabel('front-yard.jpg').check();
  await expect(page.getByText('Yard care brief, Owner contact, Access considerations')).toBeVisible();
  await page.getByLabel('I approve only the selected items for Desert Green Care to assess this yard.').check();
  await page.getByRole('button', { name: 'Approve selected assessment access' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByLabel('Exact service address')).toBeChecked();
  await expect(page.getByLabel('Selected yard photographs')).toBeChecked();
  await expect(page.getByLabel('front-yard.jpg')).toBeChecked();
  await page.getByRole('button', { name: 'Approve selected assessment access' }).click();
  await expect(page.getByText('Selected assessment access was approved. This did not accept pricing or start service.')).toBeVisible();
  expect(approvalKeys).toHaveLength(2);
  expect(approvalKeys[1]).toBe(approvalKeys[0]);
  await expect(page.getByText('Desert Green Care').first()).toBeVisible();
  await expect(page.getByText('active', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'End future assessment access' }).click();
  await expect(page.getByRole('heading', { name: 'End future access for Desert Green Care?' })).toBeFocused();
  await page.getByLabel('Reason').selectOption('assessment_complete');
  await page.getByRole('button', { name: 'Confirm and end future access' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'End future access for Desert Green Care?' })).toBeVisible();
  await page.getByRole('button', { name: 'Confirm and end future access' }).click();
  expect(revokeKeys).toHaveLength(2);
  expect(revokeKeys[1]).toBe(revokeKeys[0]);
  await expect(page.getByText('Assessment access changed in another tab. Current access was reloaded; review its status before trying again.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'End future access for Desert Green Care?' })).not.toBeVisible();
  await expect(page.getByText('revoked', { exact: true })).toBeVisible();
  await expect(page.getByText('Assessment access ended', { exact: true }).first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('an owner confirms an assessment window and uses only the shared conversation', async ({ page }) => {
  const property = {
    property_id: 'owner_property_3', owner_user_id: 'local-development-user', display_name: 'Home',
    address_line_1: '125 Oak Street', address_line_2: '', city: 'Phoenix', region: 'AZ',
    postal_code: '85004', country_code: 'US', coarse_area: 'Central Phoenix',
    address_status: 'owner_confirmed', authority_attested: true, status: 'draft', version: 1, persisted: true,
  };
  const brief = {
    brief_id: 'owner_brief_ready', owner_user_id: 'local-development-user', property_id: 'owner_property_3',
    version: 4, status: 'ready', yard_areas: ['Front yard'], care_goals: ['Routine upkeep'],
    cadence_preference: 'every_two_weeks', considerations: 'Keep the side gate closed.',
    author_source: 'yard_owner', persisted: true,
  };
  let assessment = {
    assessment_id: 'assessment_3', invitation_id: 'invitation_3', property_id: 'owner_property_3',
    organization_id: 'organization_3', disclosure_grant_id: 'grant_3', assessment_method: 'on_site',
    status: 'window_proposed', proposed_window_start_epoch_seconds: 1_800_000_000,
    proposed_window_end_epoch_seconds: 1_800_001_800, time_zone: 'America/Phoenix',
    outcome_reason_code: null, owner_visible_summary: null, version: 1, persisted: true,
  };
  let messages = [{
    message_id: 'message_provider_1', assessment_id: 'assessment_3', author_role: 'provider',
    message_kind: 'clarification', customer_safe_body: 'Please make sure an adult can provide gate access.',
    assessment_version_snapshot: 1, created_at_epoch_seconds: 1_799_000_000, persisted: true,
  }];

  await page.route('**/auth/config', (route) => route.fulfill({
    contentType: 'application/json', body: JSON.stringify({ mode: 'disabled', issuer_url: null, client_id: null, login_domain: null }),
  }));
  await page.route('**/me/access', (route) => route.fulfill({
    contentType: 'application/json', body: JSON.stringify({
      user_id: 'local-development-user', username: 'Morgan Reyes', verified_email: 'owner@example.com', claim_roles: [], memberships: [],
    }),
  }));
  await page.route('**/owner-workspace', (route) => route.fulfill({
    contentType: 'application/json', body: JSON.stringify({
      owner_user_id: 'local-development-user', verified_email: 'owner@example.com', display_name: 'Morgan Reyes', status: 'active', persisted: true,
    }),
  }));
  await page.route('**/owner-properties', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify([property]) }));
  await page.route('**/owner-properties/owner_property_3/yard-brief', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify(brief) }));
  await page.route('**/owner-properties/owner_property_3/intake-media', (route) => route.fulfill({ contentType: 'application/json', body: '[]' }));
  await page.route('**/owner-properties/owner_property_3/provider-connection-progress', (route) => route.fulfill({
    contentType: 'application/json', body: JSON.stringify([{
      invitation_id: 'invitation_3', provider_name: 'Desert Bloom Landscaping', invitation_status: 'responded',
      delivery_status: 'delivered', progress_stage: 'assessment_access_approved',
      status_label: 'Assessment access is active', owner_action_required: false,
      next_action: 'wait_for_assessment', latest_response_action: 'express_interest',
      response_label: 'Interested in assessing this yard', expires_at_epoch_seconds: 1_899_000_000,
      responded_at_epoch_seconds: 1_798_000_000, persisted: true,
    }]),
  }));
  await page.route('**/owner-properties/owner_property_3/provider-disclosure-receipts', (route) => route.fulfill({ contentType: 'application/json', body: '[]' }));
  await page.route('**/owner-properties/owner_property_3/provider-assessments', (route) => route.fulfill({
    contentType: 'application/json', body: JSON.stringify([assessment]),
  }));
  await page.route('**/owner-properties/owner_property_3/initial-service-proposals', (route) => route.fulfill({
    contentType: 'application/json', body: '[]',
  }));
  await page.route('**/owner-properties/owner_property_3/provider-assessments/assessment_3/messages', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify(messages) });
      return;
    }
    const request = route.request().postDataJSON();
    expect(request).toMatchObject({
      message_kind: 'owner_question', expected_assessment_version: 2,
      customer_safe_body: 'Should I leave the side gate unlocked?',
    });
    const created = {
      message_id: 'message_owner_1', assessment_id: 'assessment_3', author_role: 'owner',
      message_kind: request.message_kind, customer_safe_body: request.customer_safe_body,
      assessment_version_snapshot: request.expected_assessment_version,
      created_at_epoch_seconds: 1_799_100_000, persisted: true,
    };
    messages = [...messages, created];
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(created) });
  });
  await page.route('**/owner-properties/owner_property_3/provider-assessments/assessment_3/window-decision', async (route) => {
    expect(route.request().postDataJSON()).toMatchObject({ action: 'confirm', expected_version: 1 });
    assessment = { ...assessment, status: 'owner_confirmed', version: 2 };
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(assessment) });
  });

  await page.goto('/app/yard-owner');
  await page.getByRole('button', { name: 'Build or review yard brief' }).click();
  await page.getByRole('button', { name: 'Connect care', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Review the yard before agreeing on care' })).toBeVisible();
  await expect(page.getByText('Assessment time needs your review')).toBeVisible();
  await expect(page.getByText(/America\/Phoenix/)).toBeVisible();
  await expect(page.getByText('Please make sure an adult can provide gate access.')).toBeVisible();
  await expect(page.getByText(/does not accept pricing, create a customer account, assign a crew/)).toBeVisible();

  await page.getByRole('button', { name: 'Confirm assessment time' }).click();
  await expect(page.getByText('Assessment time confirmed. This did not accept service or schedule recurring care.')).toBeVisible();
  await expect(page.getByText('Assessment time confirmed', { exact: true })).toBeVisible();

  await page.getByLabel('Customer-safe message').fill('Should I leave the side gate unlocked?');
  await page.getByRole('button', { name: 'Send assessment message' }).click();
  await expect(page.getByText('Your assessment message was saved for this provider. It did not make a service decision.')).toBeVisible();
  await expect(page.getByText('Should I leave the side gate unlocked?')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('an owner reviews and explicitly accepts an exact initial-service proposal version', async ({ page }) => {
  const property = {
    property_id: 'owner_property_4', owner_user_id: 'local-development-user', display_name: 'Home',
    address_line_1: '125 Oak Street', address_line_2: '', city: 'Phoenix', region: 'AZ',
    postal_code: '85004', country_code: 'US', coarse_area: 'Central Phoenix',
    address_status: 'owner_confirmed', authority_attested: true, status: 'draft', version: 1, persisted: true,
  };
  const assessment = {
    assessment_id: 'assessment_4', invitation_id: 'invitation_4', property_id: 'owner_property_4',
    organization_id: 'organization_4', disclosure_grant_id: 'grant_4', assessment_method: 'remote',
    status: 'completed', outcome_reason_code: null,
    owner_visible_summary: 'Routine service scope is ready for proposal review.', version: 3, persisted: true,
  };
  let proposal = {
    proposal_id: 'proposal_4', assessment_id: 'assessment_4', invitation_id: 'invitation_4',
    property_id: 'owner_property_4', organization_id: 'organization_4', disclosure_grant_id: 'grant_4',
    proposal_version: 2, status: 'sent', title: 'Every-two-week yard care',
    customer_summary: 'Routine front and back yard care based on the completed assessment.',
    included_scope: ['Mow and edge turf', 'Blow hardscape clean'],
    exclusions: ['Tree work above eight feet'], cadence_code: 'every_two_weeks',
    cadence_detail: 'One visit every two weeks', arrival_policy: 'Service day confirmed first.',
    weather_policy: 'Unsafe weather may move the visit after notice.',
    cancellation_policy: 'Cancel at least 24 hours before a confirmed visit.',
    proof_expectation: 'A completion note and customer-safe photos follow each visit.',
    price_amount_minor: 12000, price_basis: 'per_visit', currency_code: 'USD',
    annualized_monthly_minor: 26000, revision_note: 'Updated after confirming the turf area.',
    issued_at_epoch_seconds: Math.floor(Date.now() / 1000),
    expires_at_epoch_seconds: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
    persisted: true,
  };

  await page.route('**/auth/config', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ mode: 'disabled', issuer_url: null, client_id: null, login_domain: null }) }));
  await page.route('**/me/access', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ user_id: 'local-development-user', username: 'Morgan Reyes', verified_email: 'owner@example.com', claim_roles: [], memberships: [] }) }));
  await page.route('**/owner-workspace', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ owner_user_id: 'local-development-user', verified_email: 'owner@example.com', display_name: 'Morgan Reyes', status: 'active', persisted: true }) }));
  await page.route('**/owner-properties', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify([property]) }));
  await page.route('**/owner-properties/owner_property_4/yard-brief', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ brief_id: 'brief_4', owner_user_id: 'local-development-user', property_id: 'owner_property_4', version: 2, status: 'ready', yard_areas: ['Front yard', 'Back yard'], care_goals: ['Routine upkeep'], cadence_preference: 'every_two_weeks', considerations: '', author_source: 'yard_owner', persisted: true }) }));
  await page.route('**/owner-properties/owner_property_4/intake-media', (route) => route.fulfill({ contentType: 'application/json', body: '[]' }));
  await page.route('**/owner-properties/owner_property_4/provider-connection-progress', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify([{ invitation_id: 'invitation_4', provider_name: 'Desert Bloom Landscaping', invitation_status: 'responded', delivery_status: 'delivered', progress_stage: 'assessment_access_approved', status_label: 'Assessment complete', owner_action_required: true, next_action: 'review_proposal', latest_response_action: 'express_interest', response_label: 'Proposal sent', expires_at_epoch_seconds: proposal.expires_at_epoch_seconds, responded_at_epoch_seconds: proposal.issued_at_epoch_seconds, persisted: true }]) }));
  await page.route('**/owner-properties/owner_property_4/provider-disclosure-receipts', (route) => route.fulfill({ contentType: 'application/json', body: '[]' }));
  await page.route('**/owner-properties/owner_property_4/provider-assessments', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify([assessment]) }));
  await page.route('**/owner-properties/owner_property_4/provider-assessments/assessment_4/messages', (route) => route.fulfill({ contentType: 'application/json', body: '[]' }));
  await page.route('**/owner-properties/owner_property_4/initial-service-proposals', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify([proposal]) }));
  let proposalMessages: Record<string, unknown>[] = [];
  await page.route('**/owner-properties/owner_property_4/initial-service-proposals/proposal_4/messages', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify(proposalMessages) });
      return;
    }
    const body = route.request().postDataJSON();
    expect(body).toMatchObject({
      message_kind: 'owner_change_request', expected_proposal_version: 2,
      customer_safe_body: 'Please include the irrigation controller check.',
    });
    const created = {
      message_id: 'proposal_message_4', proposal_id: 'proposal_4',
      assessment_id: 'assessment_4', author_role: 'owner',
      message_kind: body.message_kind, customer_safe_body: body.customer_safe_body,
      proposal_version_snapshot: body.expected_proposal_version,
      series_version_snapshot: body.expected_proposal_version,
      in_reply_to_message_id: null, related_proposal_id: null,
      created_at_epoch_seconds: Math.floor(Date.now() / 1000), persisted: true,
    };
    proposalMessages = [...proposalMessages, created];
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(created) });
  });
  await page.route('**/owner-properties/owner_property_4/initial-service-proposals/proposal_4/decision', async (route) => {
    const body = route.request().postDataJSON();
    expect(body).toMatchObject({
      action: 'accept', expected_proposal_version: 2,
      affirmation_text_version: 'initial_service_proposal_acceptance_v1',
    });
    expect(body.reason_code).toBeUndefined();
    proposal = { ...proposal, status: 'accepted' };
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ decision_id: 'decision_4', proposal_id: 'proposal_4', action: 'accept', reason_code: null, customer_safe_note: null, proposal_version: 2, affirmation_text_version: 'initial_service_proposal_acceptance_v1', decided_at_epoch_seconds: Math.floor(Date.now() / 1000), acceptance_snapshot_id: 'snapshot_4', acceptance_snapshot_sha256: 'a'.repeat(64), persisted: true }) });
  });
  let activation: Record<string, unknown> | null = null;
  let firstVisit: Record<string, unknown> = {
    activation_id: 'activation_4', owner_property_id: 'owner_property_4',
    invitation_id: 'invitation_4', organization_id: 'organization_4',
    organization_name: 'Desert Bloom Landscaping', customer_account_id: 'account_4',
    customer_property_id: 'customer_property_4', status: 'proposed', current_version: 1,
    proposal_id: 'first_visit_4', window_start_epoch_seconds: 1_800_000_000,
    window_end_epoch_seconds: 1_800_007_200, time_zone: 'America/Phoenix',
    customer_safe_arrival_note: 'Please unlock the side gate and keep pets inside.',
    owner_decision: null, owner_customer_safe_note: null,
    proposed_at_epoch_seconds: Math.floor(Date.now() / 1000),
    decided_at_epoch_seconds: null, persisted: true,
  };
  await page.route('**/owner-properties/owner_property_4/initial-service-proposals/proposal_4/activation', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill(activation
        ? { contentType: 'application/json', body: JSON.stringify(activation) }
        : { status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'owner_provider_relationship_activation_not_found', message: 'No activation yet.' }) });
      return;
    }
    const body = route.request().postDataJSON();
    expect(body).toMatchObject({
      expected_proposal_version: 2,
      activation_affirmation_text_version: 'owner_provider_relationship_activation_v1',
      owner_confirmed: true,
    });
    activation = {
      activation_id: 'activation_4', owner_property_id: 'owner_property_4',
      invitation_id: 'invitation_4', organization_id: 'organization_4',
      proposal_id: 'proposal_4', proposal_version: 2,
      acceptance_snapshot_id: 'snapshot_4', acceptance_snapshot_sha256: 'a'.repeat(64),
      customer_account_id: 'account_4', customer_property_id: 'customer_property_4',
      owner_membership_id: 'membership_4', portal_access_id: 'portal_4',
      status: 'provider_setup', closed_competing_invitation_count: 1,
      activated_at_epoch_seconds: Math.floor(Date.now() / 1000), persisted: true,
    };
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(activation) });
  });
  await page.route('**/owner-properties/owner_property_4/provider-relationships/activation_4/first-visit', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify(firstVisit) }));
  await page.route('**/owner-properties/owner_property_4/provider-relationships/activation_4/first-visit/decision', async (route) => {
    const body = route.request().postDataJSON();
    expect(body).toMatchObject({
      expected_window_version: 1, action: 'confirm',
      confirmation_affirmation_text_version: 'owner_provider_first_visit_confirmation_v1',
    });
    firstVisit = {
      ...firstVisit, status: 'confirmed', owner_decision: 'confirm',
      decided_at_epoch_seconds: Math.floor(Date.now() / 1000),
    };
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(firstVisit) });
  });

  await page.goto('/app/yard-owner');
  await page.getByRole('button', { name: 'Build or review yard brief' }).click();
  await page.getByRole('button', { name: 'Connect care', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Compare the exact offer before deciding' })).toBeVisible();
  await expect(page.getByText('$120.00 per visit')).toBeVisible();
  await expect(page.getByText('Tree work above eight feet')).toBeVisible();
  await expect(page.getByText('Updated after confirming the turf area.')).toBeVisible();
  await page.getByRole('button', { name: 'Request a change' }).click();
  await page.getByLabel('Proposal message').fill('Please include the irrigation controller check.');
  await page.getByRole('button', { name: 'Send change request' }).click();
  await expect(page.getByText(/Change requested for proposal version 2. This did not decline or accept it/)).toBeVisible();
  await expect(page.getByText('Please include the irrigation controller check.')).toBeVisible();
  await page.getByRole('button', { name: 'Review and accept' }).click();
  const affirmation = page.getByLabel(/I accept this exact proposal for provider setup/);
  await expect(page.getByRole('button', { name: 'Accept this exact version' })).toBeDisabled();
  await affirmation.check();
  await page.getByRole('button', { name: 'Accept this exact version' }).click();
  await expect(page.getByText(/Proposal accepted for provider setup. No visit was scheduled/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Create the provider relationship' })).toBeVisible();
  await page.getByRole('button', { name: 'Review provider setup' }).click();
  const activationAffirmation = page.getByLabel(/I want Grover to create this provider relationship/);
  await expect(page.getByRole('button', { name: 'Activate provider setup' })).toBeDisabled();
  await activationAffirmation.check();
  await page.getByRole('button', { name: 'Activate provider setup' }).click();
  await expect(page.getByText(/Provider relationship activated. Customer and property setup is ready/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Provider setup is underway' })).toBeVisible();
  await expect(page.getByText(/1 other open request was closed for this yard/)).toBeVisible();
  await expect(page.getByText(/No payment, recurring schedule, route, work order, or crew assignment exists yet/)).toBeVisible();
  await expect(page.getByText('First-visit proposal · version 1')).toBeVisible();
  await page.getByRole('button', { name: 'Review and confirm window' }).click();
  const firstVisitAffirmation = page.getByLabel(/I confirm this exact first-visit arrival window/);
  await expect(page.getByRole('button', { name: 'Confirm this exact window' })).toBeDisabled();
  await firstVisitAffirmation.check();
  await page.getByRole('button', { name: 'Confirm this exact window' }).click();
  await expect(page.getByText(/First visit confirmed. The provider still assigns crews/)).toBeVisible();
  await expect(page.getByText('First visit confirmed', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open my Yard Owner portal' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
