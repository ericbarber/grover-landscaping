import { expect, test } from '@playwright/test';

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

  await page.reload();
  await expect(page.getByLabel('Invitation code')).toHaveValue('');
  await expect(page.getByRole('heading', { name: 'Interest recorded; waiting for the owner’s next decision' })).toHaveCount(0);
  await page.getByLabel('Invitation code').fill('owner_provider_secret');
  await page.getByRole('button', { name: 'Check invitation progress' }).click();
  await expect(page.getByRole('heading', { name: 'Interest recorded; waiting for the owner’s next decision' })).toBeVisible();
});

test('a provider sees only owner-approved assessment details and loses future access after revocation', async ({ page }) => {
  let accessActive = true;
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
      }),
    });
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

  accessActive = false;
  await page.getByRole('button', { name: 'Check invitation progress' }).click();
  await expect(page.getByRole('heading', { name: 'Assessment access ended', exact: true })).toBeVisible();
  await expect(page.getByText('The owner-approved details are no longer available.')).toBeVisible();
  await expect(page.getByText('Private local preview')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
