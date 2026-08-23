import { expect, test } from '@playwright/test';

test('provider entry separates owner, company, worker, and known-owner paths', async ({ page }) => {
  await page.goto('/providers/start');

  await expect(page.getByRole('heading', { name: 'Start with the provider path that matches your role.' })).toBeVisible();
  await expect(page.getByText('No opportunity promise.', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Owner-operator' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Company owner' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Crew lead or team member' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Known-owner connection' })).toBeVisible();

  await expect(page.getByRole('link', { name: /Start owner-operator setup/ }))
    .toHaveAttribute('href', '/app?provider-entry=owner-operator');
  await expect(page.getByRole('link', { name: /Start company setup/ }))
    .toHaveAttribute('href', '/app?provider-entry=company-owner');
  await expect(page.getByRole('link', { name: /Sign in with your invitation/ }))
    .toHaveAttribute('href', '/app');
  await expect(page.getByRole('link', { name: /Review an owner invitation/ }).first())
    .toHaveAttribute('href', '/app/provider-invitation');

  await expect(page.getByText('Setup is preparation—not publication.')).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('landscaping-company signup routes through provider fit selection', async ({ page }) => {
  await page.goto('/for-landscaping-companies');

  await expect(page.getByRole('link', { name: /Sign up your company/ }).first())
    .toHaveAttribute('href', '/providers/start');
});

test('provider path opens authenticated setup without granting authority from the query', async ({ page }) => {
  await page.route('http://localhost:8080/**', (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/health/ready') return route.fulfill({ contentType: 'application/json', body: '{"status":"ok"}' });
    if (path === '/auth/config') {
      return route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          mode: 'local_review', issuer_url: null, client_id: null, login_domain: null,
          local_reviewers: [{ reviewer_id: 'organization-owner', user_id: 'owner_1', display_name: 'Olivia — Organization Owner', verified_email: 'owner@example.test', roles: ['OrganizationOwner'] }],
        }),
      });
    }
    if (path === '/me/access') {
      return route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          user_id: 'owner_1', username: 'Olivia — Organization Owner', verified_email: 'owner@example.test', claim_roles: ['OrganizationOwner'],
          memberships: [{ id: 'membership_1', organization_id: 'org_1', organization_name: 'Desert Bloom', organization_type: 'yard_care_company', user_id: 'owner_1', display_name: 'Olivia — Organization Owner', role: 'OrganizationOwner', status: 'active', scope_type: 'organization', scope_id: 'org_1' }],
        }),
      });
    }
    if (path === '/jobs') return route.fulfill({ contentType: 'application/json', body: '[]' });
    return route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":{"code":"storage_unavailable","message":"Test fallback"}}' });
  });
  await page.goto('/app?provider-entry=owner-operator');

  await expect(page.getByText('Owner-operator setup', { exact: true })).toBeVisible();
  await expect(page.getByText('Signed-in claims and active memberships remain authoritative.', { exact: false })).toBeVisible();
  await expect(page.getByText('provider organization of one', { exact: false })).toBeVisible();
});
