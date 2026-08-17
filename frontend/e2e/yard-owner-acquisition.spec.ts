import { expect, test } from '@playwright/test';

test('a verified owner creates a private profile and reconfirms a changed address', async ({ page }) => {
  let yardBriefVersion = 0;
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
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.getByRole('heading', { name: 'You control each connection.' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
