import { expect, test, type Page } from '@playwright/test';

async function mockProviderOwner(page: Page, includeReadiness = false) {
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
    if (includeReadiness && path === '/organizations/org_1') {
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ id: 'org_1', display_name: 'Desert Bloom Landscaping', organization_type: 'yard_care_company', contact_email: 'office@desertbloom.example', contact_phone: '', website_url: '', time_zone: 'America/Phoenix', service_area_label: 'Phoenix metro', default_daily_stop_capacity: 12, status: 'active', persisted: true }) });
    }
    if (includeReadiness && path === '/organizations/org_1/setup-progress') {
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ organization_id: 'org_1', organization_profile_complete: false, team_invitation_created: false, crew_configured: true, first_route_published: false, completed_steps: 1, total_steps: 4, persisted: true }) });
    }
    if (path === '/jobs') return route.fulfill({ contentType: 'application/json', body: '[]' });
    return route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":{"code":"storage_unavailable","message":"Test fallback"}}' });
  });
}

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
  await mockProviderOwner(page);
  await page.goto('/app?provider-entry=owner-operator');

  await expect(page.getByText('Owner-operator setup', { exact: true })).toBeVisible();
  await expect(page.getByText('Signed-in claims and active memberships remain authoritative.', { exact: false })).toBeVisible();
  await expect(page.getByText('provider organization of one', { exact: false })).toBeVisible();
});

test('provider readiness distinguishes supplied, operating, missing, and unchecked facts', async ({ page }) => {
  await mockProviderOwner(page, true);
  await page.goto('/app?provider-entry=company-owner');

  const readiness = page.locator('[data-provider-identity-readiness]');
  await expect(readiness).toBeVisible();
  await expect(readiness.getByRole('heading', { name: 'Preparation facts, without a broad verified badge.' })).toBeVisible();
  await expect(readiness.getByText('Supplied by provider').first()).toBeVisible();
  await expect(readiness.getByText('Operating preference recorded')).toBeVisible();
  await expect(readiness.getByText('Operational setup recorded')).toBeVisible();
  await expect(readiness.getByText('Needs information').first()).toBeVisible();
  await expect(readiness.getByText('Not collected')).toBeVisible();
  await expect(readiness.getByText('Not evaluated', { exact: true })).toBeVisible();
  await expect(readiness).toContainText('do not publish this provider');
});
