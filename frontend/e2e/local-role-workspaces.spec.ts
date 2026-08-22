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

test('authenticated home retains the shared shell materials and type roles', async ({ page }) => {
  await page.goto('/app');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('#manager-tools > summary')).toBeVisible();

  const shell = await page.evaluate(() => {
    const main = document.querySelector('main');
    const heading = document.querySelector('h1');
    const brandMark = document.querySelector('.grover-brand-mark');
    const managerSummary = document.querySelector('#manager-tools > summary');
    if (!main || !heading || !brandMark || !managerSummary) {
      throw new Error('Authenticated shell theme targets were not rendered.');
    }
    return {
      canvas: getComputedStyle(main).backgroundColor,
      displayFamily: getComputedStyle(heading).fontFamily,
      brandMark: getComputedStyle(brandMark).stroke,
      managerNavigation: getComputedStyle(managerSummary).backgroundColor,
    };
  });

  expect(shell).toEqual({
    canvas: 'rgb(246, 242, 232)',
    displayFamily: '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif',
    brandMark: 'rgb(222, 199, 157)',
    managerNavigation: 'rgb(15, 47, 40)',
  });
});

test('authenticated navigation moves from a phone bar to a tablet rail', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/app');

  const navigation = page.getByRole('navigation', { name: 'Mobile workspace' });
  await expect(navigation).toBeVisible();
  await expect(navigation.locator('svg')).toHaveCount(5);

  const phone = await navigation.evaluate((element) => {
    const box = element.getBoundingClientRect();
    return {
      bottom: Math.round(window.innerHeight - box.bottom),
      height: Math.round(box.height),
      left: Math.round(box.left),
      width: Math.round(box.width),
    };
  });
  expect(phone.left).toBe(0);
  expect(phone.width).toBe(390);
  expect(phone.bottom).toBe(0);
  expect(phone.height).toBeLessThan(120);

  await page.setViewportSize({ width: 820, height: 1180 });
  const tablet = await navigation.evaluate((element) => {
    const box = element.getBoundingClientRect();
    const main = document.querySelector('main');
    return {
      height: Math.round(box.height),
      left: Math.round(box.left),
      mainPaddingLeft: main ? Math.round(Number.parseFloat(getComputedStyle(main).paddingLeft)) : 0,
      overflow: document.documentElement.scrollWidth > window.innerWidth,
      top: Math.round(box.top),
      width: Math.round(box.width),
    };
  });
  expect(tablet).toEqual({
    height: 1180,
    left: 0,
    mainPaddingLeft: 96,
    overflow: false,
    top: 0,
    width: 96,
  });

  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(navigation).toBeHidden();
});
