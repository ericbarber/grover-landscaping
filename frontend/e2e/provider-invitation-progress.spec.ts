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
  await expect(page.getByText('Exact address')).toBeVisible();
  await expect(page.locator('body')).not.toContainText('owner_provider_secret');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
