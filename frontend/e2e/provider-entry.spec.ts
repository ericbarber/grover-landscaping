import { expect, test, type Page } from '@playwright/test';

async function mockProviderOwner(
  page: Page,
  includeReadiness = false,
  conflictingMembership = false,
) {
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
          memberships: [
            { id: 'membership_1', organization_id: 'org_1', organization_name: 'Desert Bloom', organization_type: 'yard_care_company', user_id: 'owner_1', display_name: 'Olivia — Organization Owner', role: 'OrganizationOwner', status: 'active', scope_type: 'organization', scope_id: 'org_1' },
            ...(conflictingMembership ? [{ id: 'membership_2', organization_id: 'org_2', organization_name: 'Second Company', organization_type: 'yard_care_company', user_id: 'owner_1', display_name: 'Olivia — Organization Owner', role: 'OrganizationOwner', status: 'active', scope_type: 'organization', scope_id: 'org_2' }] : []),
          ],
        }),
      });
    }
    if (includeReadiness && path === '/organizations/org_1') {
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ id: 'org_1', display_name: 'Desert Bloom Landscaping', organization_type: 'yard_care_company', contact_email: 'office@desertbloom.example', contact_phone: '', website_url: '', time_zone: 'America/Phoenix', service_area_label: 'Phoenix metro', default_daily_stop_capacity: 12, supported_service_categories: ['routine_maintenance', 'seasonal_cleanup'], supported_languages: ['en', 'es'], status: 'active', persisted: true }) });
    }
    if (includeReadiness && path === '/organizations/org_1/setup-progress') {
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ organization_id: 'org_1', organization_profile_complete: true, team_invitation_created: false, crew_configured: true, customer_property_created: false, first_route_published: false, first_service_completed: false, first_report_delivered: false, completed_steps: 2, total_steps: 6, persisted: true }) });
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
  await page.goto('/for-landscaping-companies?utm_source=search&utm_medium=cpc&utm_campaign=phoenix&token=secret');

  const companySetup = page.getByRole('link', { name: /Start company setup/ }).first();
  await expect(companySetup).toHaveAttribute(
    'href',
    '/providers/start?utm_source=search&utm_medium=cpc&utm_campaign=phoenix',
  );
  await companySetup.click();
  await expect(page.getByRole('link', { name: /Start company setup/ })).toHaveAttribute(
    'href',
    '/app?utm_source=search&utm_medium=cpc&utm_campaign=phoenix&provider-entry=company-owner',
  );
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
  await expect(readiness).toContainText('Service categories');
  await expect(readiness).toContainText('routine maintenance');
  await expect(readiness).toContainText('Customer communication languages');
  await expect(readiness).toContainText('English · Spanish');
  await expect(readiness.getByText('Needs information').first()).toBeVisible();
  await expect(readiness.getByText('Not collected')).toBeVisible();
  await expect(readiness.getByText('Not evaluated', { exact: true })).toBeVisible();
  await expect(readiness).toContainText('do not publish this provider');
});

test('company setup resumes at the first server-confirmed incomplete milestone', async ({ page }) => {
  await mockProviderOwner(page, true);
  await page.goto('/app?provider-entry=company-owner');

  const onboarding = page.getByText('First-user setup', { exact: true }).locator('xpath=ancestor::section[1]');
  await expect(onboarding.getByRole('heading', { name: 'First-value progress' })).toBeVisible();
  await expect(onboarding).toContainText('2 of 6 persisted milestones complete');
  await expect(onboarding).toContainText('Current prerequisite');
  await expect(onboarding).toContainText('Create the first customer and property');
  await onboarding.getByRole('button', { name: /Continue: Create the first customer and property/ }).click();
  await expect(page.getByText('Customer onboarding', { exact: true })).toBeVisible();

  await page.setViewportSize({ width: 320, height: 720 });
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  await expect.poll(
    () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    { message: 'first-value setup reflows at a 320px viewport with 200% text' },
  ).toBe(true);
});

test('company setup fails closed when more than one organization is active', async ({ page }) => {
  await mockProviderOwner(page, false, true);
  await page.goto('/app?provider-entry=company-owner');

  const onboarding = page.getByText('First-user setup', { exact: true }).locator('xpath=ancestor::section[1]');
  await expect(onboarding.getByRole('alert')).toContainText('explicit organization choice');
  await expect(onboarding.getByText('First-value progress')).not.toBeVisible();
  await expect(onboarding.getByRole('button', { name: /Create organization/ })).not.toBeVisible();
});
