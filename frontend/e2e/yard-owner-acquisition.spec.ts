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
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        owner_user_id: 'local-development-user',
        verified_email: 'owner@example.com',
        display_name: 'Morgan Reyes',
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
  await expect(page.getByRole('link', { name: 'Set up my yard' })).toBeVisible();
  await page.getByRole('link', { name: 'Set up my yard' }).click();
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
  await page.getByRole('button', { name: 'Build or review yard brief' }).click();
  await expect(page.getByRole('heading', { name: 'Describe the yard and the care you want' })).toBeVisible();
  await page.getByLabel('Front yard').check();
  await page.getByLabel('Routine upkeep').check();
  await page.getByLabel('Preferred care cadence').selectOption('every_two_weeks');
  await page.getByLabel('Access, pets, concerns, or priorities').fill('Keep the side gate closed for the dog.');
  await page.getByRole('button', { name: 'Save private draft' }).click();
  await expect(page.getByText('Private draft version 1 is saved.')).toBeVisible();
  await page.getByLabel('Back yard').check();
  await page.getByRole('button', { name: 'Save brief and continue' }).click();
  await expect(page.getByText('Yard brief version 2 is ready and still private.')).toBeVisible();
  await expect(page.getByText('Version 2 · ready')).toBeVisible();
  await expect(page.getByText('This is your starting brief—not a measurement, diagnosis, price, work order, or provider instruction.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Add useful views without diagnosing the yard' })).toBeVisible();
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
  await page.getByRole('button', { name: 'Save brief and continue' }).click();
  await expect(page.getByText('Yard brief version 4 is ready and still private.')).toBeVisible();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Delete' }).last().click();
  await expect(page.getByText('The private photograph was deleted.')).toBeVisible();
  await expect(page.getByText('front-yard.jpg')).not.toBeVisible();
  await page.getByRole('button', { name: 'Finish without more photos' }).click();
  await expect(page.getByText('Private intake is complete. No provider connection or sharing has started.')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.getByRole('heading', { name: 'You control each connection.' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
