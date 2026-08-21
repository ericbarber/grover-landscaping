import { expect, test } from '@playwright/test';

const reviewers = [
  ['organization-owner', 'Olivia — Organization Owner', 'OrganizationOwner'],
  ['manager', 'Marcus — Manager', 'Manager'],
  ['crew-lead', 'Leah — Crew Lead', 'CrewLead'],
  ['property-manager', 'Priya — Property Manager', 'PropertyManager'],
  ['property-owner', 'Jamie — Property Owner', 'PropertyOwner'],
  ['support-admin', 'Sam — Support Administrator', 'SupportAdmin'],
] as const;

const reviewCases = [
  { id: 'property-owner', customer: true, field: false, manager: false },
  { id: 'property-manager', customer: true, field: false, manager: true },
  { id: 'crew-lead', customer: false, field: true, manager: false },
  { id: 'manager', customer: false, field: true, manager: true },
  { id: 'organization-owner', customer: false, field: true, manager: true },
  { id: 'support-admin', customer: false, field: false, manager: true },
] as const;

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.route('http://localhost:8080/**', (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path === '/auth/config') {
      return route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          mode: 'local_review',
          issuer_url: null,
          client_id: null,
          login_domain: null,
          local_reviewers: reviewers.map(([reviewerId, displayName, role]) => ({
            reviewer_id: reviewerId,
            user_id: `local-review-${reviewerId}`,
            display_name: displayName,
            verified_email: `${reviewerId}@example.test`,
            roles: [role],
          })),
        }),
      });
    }
    if (path === '/me/access') {
      const reviewerId = request.headers()['x-grover-local-reviewer'] ?? reviewers[0][0];
      const reviewer = reviewers.find(([id]) => id === reviewerId) ?? reviewers[0];
      const [, displayName, role] = reviewer;
      return route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          user_id: `local-review-${reviewerId}`,
          username: displayName,
          verified_email: `${reviewerId}@example.test`,
          claim_roles: [role],
          memberships: [{
            id: `membership-${reviewerId}`,
            organization_id: 'org_demo_landscaping',
            organization_name: 'Grover Demo Landscaping',
            organization_type: 'yard_care_company',
            user_id: `local-review-${reviewerId}`,
            display_name: displayName,
            role,
            status: 'active',
            scope_type: 'organization',
            scope_id: 'org_demo_landscaping',
          }],
        }),
      });
    }
    if (path === '/jobs') {
      return route.fulfill({ contentType: 'application/json', body: '[]' });
    }
    return route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ error: { code: 'storage_unavailable', message: 'Test fallback' } }),
    });
  });
});

test('desktop local review changes the rendered workspace, not only its title', async ({ page }) => {
  await page.goto('/app');
  await expect(page.getByLabel('Local reviewer account')).toBeVisible();

  for (const reviewCase of reviewCases) {
    if (await page.getByLabel('Local reviewer account').inputValue() !== reviewCase.id) {
      await Promise.all([
        page.waitForEvent('domcontentloaded'),
        page.getByLabel('Local reviewer account').selectOption(reviewCase.id),
      ]);
      await expect(page.getByLabel('Local reviewer account')).toHaveValue(reviewCase.id);
    }

    await expect(page.locator('#customer-workspace')).toBeVisible({ visible: reviewCase.customer });
    await expect(page.locator('#today-route')).toBeVisible({ visible: reviewCase.field });
    await expect(page.locator('#assigned-jobs')).toBeVisible({ visible: reviewCase.field });
    await expect(page.locator('#job-detail')).toBeVisible({ visible: reviewCase.field });
    await expect(page.locator('#manager-tools')).toBeVisible({ visible: reviewCase.manager });
  }
});

test('desktop management categories are filtered for portfolio and support roles', async ({ page }) => {
  await page.addInitScript(() => {
    if (!window.sessionStorage.getItem('grover.local-reviewer-id')) {
      window.sessionStorage.setItem('grover.local-reviewer-id', 'property-manager');
    }
  });
  await page.goto('/app');

  await expect(page.locator('#manager-tools > summary')).toContainText('Portfolio management tools');
  await page.locator('#manager-tools > summary').click();
  await expect(page.getByRole('button', { name: /Customers/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Schedule/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Recovery/ })).toHaveCount(0);

  await Promise.all([
    page.waitForEvent('domcontentloaded'),
    page.getByLabel('Local reviewer account').selectOption('support-admin'),
  ]);
  await expect(page.getByLabel('Local reviewer account')).toHaveValue('support-admin');
  await expect(page.locator('#manager-tools > summary')).toContainText('Support and recovery tools');
  await page.locator('#manager-tools > summary').click();
  await expect(page.getByRole('button', { name: /Team/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Reports/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Recovery/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Schedule/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Customers/ })).toHaveCount(0);
});
