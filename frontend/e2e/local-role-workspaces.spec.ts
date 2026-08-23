import { expect, test } from '@playwright/test';

const reviewers = [
  ['organization-owner', 'Olivia — Organization Owner', 'OrganizationOwner'],
  ['manager', 'Marcus — Manager', 'Manager'],
  ['crew-lead', 'Leah — Crew Lead', 'CrewLead'],
  ['crew-member', 'Carlos — Crew Member', 'CrewMember'],
  ['property-manager', 'Priya — Property Manager', 'PropertyManager'],
  ['property-owner', 'Jamie — Property Owner', 'PropertyOwner'],
  ['support-admin', 'Sam — Support Administrator', 'SupportAdmin'],
] as const;

const reviewCases = [
  { id: 'property-owner', customer: true, field: false, manager: false },
  { id: 'property-manager', customer: true, field: false, manager: true },
  { id: 'crew-lead', customer: false, field: true, manager: false },
  { id: 'crew-member', customer: false, field: true, manager: false },
  { id: 'manager', customer: false, field: true, manager: true },
  { id: 'organization-owner', customer: false, field: true, manager: true },
  { id: 'support-admin', customer: false, field: false, manager: true },
] as const;

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.route('http://localhost:8080/**', (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path === '/health/ready') {
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ status: 'ok' }) });
    }
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

test('workspace access verification fails closed and recovers without a reload', async ({ page }) => {
  let accessRequests = 0;
  await page.route('http://localhost:8080/me/access', (route) => {
    accessRequests += 1;
    if (accessRequests === 1) {
      return route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'principal_access_unavailable',
          message: 'Persisted organization access could not be loaded.',
        }),
      });
    }
    return route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        user_id: 'local-review-organization-owner',
        username: 'Olivia — Organization Owner',
        verified_email: 'organization-owner@example.test',
        claim_roles: ['OrganizationOwner'],
        memberships: [{
          id: 'membership-organization-owner',
          organization_id: 'org_demo_landscaping',
          organization_name: 'Grover Demo Landscaping',
          organization_type: 'yard_care_company',
          user_id: 'local-review-organization-owner',
          display_name: 'Olivia — Organization Owner',
          role: 'OrganizationOwner',
          status: 'active',
          scope_type: 'organization',
          scope_id: 'org_demo_landscaping',
        }],
      }),
    });
  });

  await page.goto('/app');
  await expect(page.getByRole('heading', { name: 'Unable to safely open your workspace' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Desktop workspace' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Retry access verification' }).click();

  await expect(page.getByLabel('Local reviewer account')).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Desktop workspace' })).toBeVisible();
  expect(accessRequests).toBeGreaterThanOrEqual(2);
});

test('an unscoped role claim receives Home only until membership is assigned', async ({ page }) => {
  await page.addInitScript(() => {
    window.sessionStorage.setItem('grover.local-reviewer-id', 'crew-member');
  });
  await page.route('http://localhost:8080/me/access', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({
      user_id: 'local-review-crew-member',
      username: 'Carlos — Crew Member',
      verified_email: 'crew-member@example.test',
      claim_roles: ['CrewMember'],
      memberships: [],
    }),
  }));

  await page.goto('/app');

  await expect(page.getByRole('alert').getByText('No active workspace role', { exact: true })).toBeVisible();
  const navigation = page.getByRole('navigation', { name: 'Desktop workspace' });
  await expect(navigation.getByRole('button', { name: 'Home', exact: true })).toBeVisible();
  await expect(navigation.getByRole('button', { name: 'Route', exact: true })).toHaveCount(0);
  await expect(navigation.getByRole('button', { name: 'Jobs', exact: true })).toHaveCount(0);
  await expect(navigation.getByRole('button', { name: /Manage|Support/ })).toHaveCount(0);
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

    const desktopNavigation = page.getByRole('navigation', { name: 'Desktop workspace' });
    await expect(desktopNavigation).toBeVisible();
    await expect(desktopNavigation.getByRole('button', { name: 'Home', exact: true }))
      .toHaveAttribute('aria-current', 'page');
    await expect(page.locator('#customer-workspace')).toBeHidden();
    await expect(page.locator('#today-route')).toBeHidden();
    await expect(page.locator('#assigned-jobs')).toBeHidden();
    await expect(page.locator('#job-detail')).toBeHidden();
    await expect(page.locator('#manager-tools')).toBeHidden();

    if (reviewCase.customer) {
      const customerLabel = reviewCase.id === 'property-owner' ? 'My yard' : 'Portfolio';
      await desktopNavigation.getByRole('button', { name: customerLabel, exact: true }).click();
      await expect(page.locator('#customer-workspace')).toBeVisible();
      await expect(page.locator('#today-route')).toBeHidden();
    } else {
      await expect(desktopNavigation.getByRole('button', { name: /My yard|Portfolio/ })).toHaveCount(0);
    }

    if (reviewCase.field) {
      await desktopNavigation.getByRole('button', { name: 'Route', exact: true }).click();
      await expect(page.locator('#today-route')).toBeVisible();
      await expect(page.locator('#assigned-jobs')).toBeHidden();
      await desktopNavigation.getByRole('button', { name: 'Jobs', exact: true }).click();
      await expect(page.locator('#today-route')).toBeHidden();
      await expect(page.locator('#assigned-jobs')).toBeVisible();
      await desktopNavigation.getByRole('button', { name: 'Job', exact: true }).click();
      await expect(page.locator('#assigned-jobs')).toBeHidden();
      await expect(page.locator('#job-detail')).toBeVisible();
    } else {
      await expect(desktopNavigation.getByRole('button', { name: 'Route', exact: true })).toHaveCount(0);
    }

    if (reviewCase.manager) {
      const managerLabel = reviewCase.id === 'support-admin' ? 'Support' : 'Manage';
      await desktopNavigation.getByRole('button', { name: managerLabel, exact: true }).click();
      await expect(page.locator('#manager-tools')).toBeVisible();
      await expect(page.locator('#assigned-jobs')).toBeHidden();
    } else {
      await expect(desktopNavigation.getByRole('button', { name: /Manage|Support/ })).toHaveCount(0);
    }
  }
});

test('desktop management categories are filtered for portfolio and support roles', async ({ page }) => {
  await page.addInitScript(() => {
    if (!window.sessionStorage.getItem('grover.local-reviewer-id')) {
      window.sessionStorage.setItem('grover.local-reviewer-id', 'property-manager');
    }
  });
  await page.goto('/app');

  await page.getByRole('navigation', { name: 'Desktop workspace' })
    .getByRole('button', { name: 'Manage', exact: true }).click();
  await expect(page.locator('#manager-tools > summary')).toContainText('Portfolio management tools');
  await expect(page.getByRole('button', { name: /Customers/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Schedule/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Recovery/ })).toHaveCount(0);

  await Promise.all([
    page.waitForEvent('domcontentloaded'),
    page.getByLabel('Local reviewer account').selectOption('support-admin'),
  ]);
  await expect(page.getByLabel('Local reviewer account')).toHaveValue('support-admin');
  await page.getByRole('navigation', { name: 'Desktop workspace' })
    .getByRole('button', { name: 'Support', exact: true }).click();
  await expect(page.locator('#manager-tools > summary')).toContainText('Support and recovery tools');
  await expect(page.getByRole('button', { name: /Team/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Reports/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Recovery/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Schedule/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Customers/ })).toHaveCount(0);
});

test('property manager enters the connected portfolio command center on phone and desktop', async ({ page }) => {
  await page.addInitScript(() => {
    window.sessionStorage.setItem('grover.local-reviewer-id', 'property-manager');
  });

  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/app');

    const workspaceNavigation = page.getByRole('navigation', {
      name: viewport.width >= 768 ? 'Desktop workspace' : 'Mobile workspace',
    });
    await workspaceNavigation.getByRole('button', { name: 'Portfolio', exact: true }).click();

    const portfolio = page.locator('[data-property-manager-portfolio]');
    await expect(portfolio).toBeVisible();
    await expect(portfolio.getByText('Local review data boundary', { exact: true })).toBeVisible();
    await expect(portfolio.getByRole('navigation', { name: 'Property portfolio' })).toBeVisible();
    await expect(portfolio.getByRole('heading', { name: 'Start with what needs attention.' })).toBeVisible();
    await expect(portfolio.getByText('Provider routes, crew notes, cost basis, margins', { exact: false })).toBeVisible();
    await expect(portfolio.getByRole('heading', { name: /Welcome back/ })).toHaveCount(0);

    await portfolio.getByRole('button', { name: 'Properties', exact: true }).click();
    await expect(portfolio.getByRole('heading', { name: 'Every property, one accountable view.' })).toBeVisible();
    await portfolio.getByLabel('Search portfolio properties').fill('Backyard');
    await expect(portfolio.getByRole('heading', { name: 'Backyard Renovation Area' })).toBeVisible();
    await expect(portfolio.getByRole('heading', { name: 'Sample Customer Home' })).toHaveCount(0);

    await portfolio.getByRole('button', { name: 'Proof', exact: true }).click();
    await expect(portfolio.getByRole('heading', { name: 'Proof ready for review.' })).toBeVisible();
    await portfolio.getByRole('button', { name: 'Approvals', exact: true }).click();
    await expect(portfolio.getByRole('heading', { name: 'Recommendations and recorded decisions.' })).toBeVisible();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  }
});

test('organization owner Team opens the responsive team and access command center', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    window.sessionStorage.setItem('grover.local-reviewer-id', 'organization-owner');
  });
  await page.route('http://localhost:8080/organizations/org_demo_landscaping/memberships', (route) => (
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'membership_owner',
          organization_id: 'org_demo_landscaping',
          organization_name: 'Grover Demo Landscaping',
          organization_type: 'yard_care_company',
          user_id: 'local-review-organization-owner',
          display_name: 'Olivia — Organization Owner',
          role: 'OrganizationOwner',
          status: 'active',
          scope_type: 'organization',
          scope_id: 'org_demo_landscaping',
        },
        {
          id: 'membership_lead',
          organization_id: 'org_demo_landscaping',
          organization_name: 'Grover Demo Landscaping',
          organization_type: 'yard_care_company',
          user_id: 'crew-lead',
          display_name: 'Leah — Crew Lead',
          role: 'CrewLead',
          status: 'active',
          scope_type: 'organization',
          scope_id: 'org_demo_landscaping',
        },
      ]),
    })
  ));
  await page.route('http://localhost:8080/organizations/org_demo_landscaping/invitations', (route) => (
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'invitation_pending',
          organization_id: 'org_demo_landscaping',
          invitee_email: 'new.lead@example.test',
          role: 'crew_lead',
          status: 'pending',
          scope_type: 'organization',
          scope_id: 'org_demo_landscaping',
          membership_id: 'membership_pending',
          expires_at: '2026-08-29T12:00:00Z',
          delivery_status: 'sent',
          delivery_attempt_count: 1,
          persisted: true,
        },
      ]),
    })
  ));
  await page.route('http://localhost:8080/organizations/org_demo_landscaping/crews', (route) => (
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'crew_north',
          name: 'North crew',
          organization_id: 'org_demo_landscaping',
          branch_id: 'branch_main',
          territory_id: 'territory_north',
          status: 'active',
          daily_stop_capacity: 8,
          lead_membership_id: 'membership_lead',
          persisted: true,
        },
        {
          id: 'crew_south',
          name: 'South crew',
          organization_id: 'org_demo_landscaping',
          branch_id: 'branch_main',
          territory_id: 'territory_south',
          status: 'active',
          daily_stop_capacity: 8,
          lead_membership_id: null,
          persisted: true,
        },
      ]),
    })
  ));
  await page.route('http://localhost:8080/service-territories', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify([
      {
        id: 'territory_north',
        organization_id: 'org_demo_landscaping',
        branch_id: 'branch_main',
        name: 'North territory',
        status: 'active',
      },
      {
        id: 'territory_south',
        organization_id: 'org_demo_landscaping',
        branch_id: 'branch_main',
        name: 'South territory',
        status: 'active',
      },
      {
        id: 'territory_east',
        organization_id: 'org_demo_landscaping',
        branch_id: 'branch_main',
        name: 'East territory',
        status: 'active',
      },
    ]),
  }));

  await page.goto('/app');
  await page.getByRole('navigation', { name: 'Mobile workspace' })
    .getByRole('button', { name: 'Manage', exact: true }).click();
  await page.getByRole('button', { name: /Team Members, invitations, and access/ }).click();

  const overview = page.locator('#team-organization-overview');
  await expect(overview.getByRole('heading', { name: 'Team and access' })).toBeVisible();
  await expect(overview.getByLabel('Active team summary')).toContainText('2');
  await expect(overview.getByLabel('Invited team summary')).toContainText('1');
  await expect(overview.getByLabel('Crews team summary')).toContainText('2');
  await expect(overview.getByLabel('Unstaffed team summary')).toContainText('1');
  await expect(overview.getByText('Staffing needs attention.')).toBeVisible();
  await expect(overview.getByRole('button', { name: 'Assign crew leads' })).toBeVisible();
  await expect(overview.getByRole('button', { name: 'Review unstaffed territories' })).toBeVisible();
  await expect(overview.getByRole('button', { name: 'Open member directory' })).toBeVisible();
  await expect(overview.getByRole('button', { name: 'Open invitations' })).toBeVisible();
  await expect(overview.getByRole('button', { name: 'Open crew administration' })).toBeVisible();
  await expect(overview.getByRole('button', { name: 'Open team activity' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  const territoryRecovery = overview.getByRole('button', { name: 'Review unstaffed territories' });
  await territoryRecovery.focus();
  await territoryRecovery.press('Enter');
  await expect(page.getByRole('heading', { name: 'Branches and territories' })).toBeVisible();
  await expect(page.locator('#dispatch-hierarchy-administration')).toBeFocused();
});

test('team overview preserves available counts during a partial API outage', async ({ page }) => {
  await page.addInitScript(() => {
    window.sessionStorage.setItem('grover.local-reviewer-id', 'organization-owner');
  });
  await page.route('http://localhost:8080/organizations/org_demo_landscaping/memberships', (route) => (
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'membership_owner',
          organization_id: 'org_demo_landscaping',
          organization_name: 'Grover Demo Landscaping',
          organization_type: 'yard_care_company',
          user_id: 'local-review-organization-owner',
          display_name: 'Olivia — Organization Owner',
          role: 'OrganizationOwner',
          status: 'active',
          scope_type: 'organization',
          scope_id: 'org_demo_landscaping',
        },
      ]),
    })
  ));

  await page.goto('/app');
  const workspaceNavigation = page.getByRole('navigation', {
    name: page.viewportSize()?.width && page.viewportSize()!.width >= 1024
      ? 'Desktop workspace'
      : 'Mobile workspace',
  });
  await workspaceNavigation.getByRole('button', { name: 'Manage', exact: true }).click();
  await page.getByRole('button', { name: /Team Members, invitations, and access/ }).click();

  const overview = page.locator('#team-organization-overview');
  await expect(overview.getByLabel('Active team summary')).toContainText('1');
  await expect(overview.getByLabel('Invited team summary')).toContainText('—');
  await expect(overview.getByText('Part of the team overview could not be refreshed.')).toBeVisible();
  await expect(overview.getByText(/invitation history, crew roster, territory structure/)).toBeVisible();
});

test('member directory warns before changing the signed-in owner access', async ({ page }) => {
  await page.addInitScript(() => {
    window.sessionStorage.setItem('grover.local-reviewer-id', 'organization-owner');
  });
  const member = (id: string, userId: string, displayName: string) => ({
    id,
    organization_id: 'org_demo_landscaping',
    organization_name: 'Grover Demo Landscaping',
    organization_type: 'yard_care_company',
    user_id: userId,
    display_name: displayName,
    role: 'OrganizationOwner',
    status: 'active',
    scope_type: 'organization',
    scope_id: 'org_demo_landscaping',
  });
  await page.route('http://localhost:8080/organizations/org_demo_landscaping/memberships', (route) => (
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify([
        member(
          'membership_current_owner',
          'local-review-organization-owner',
          'Olivia — Organization Owner',
        ),
        member('membership_backup_owner', 'backup-owner', 'Morgan — Backup Owner'),
      ]),
    })
  ));

  await page.goto('/app');
  const workspaceNavigation = page.getByRole('navigation', {
    name: page.viewportSize()?.width && page.viewportSize()!.width >= 1024
      ? 'Desktop workspace'
      : 'Mobile workspace',
  });
  await workspaceNavigation.getByRole('button', { name: 'Manage', exact: true }).click();
  await page.getByRole('button', { name: /Team Members, invitations, and access/ }).click();
  await page.getByRole('button', { name: 'Open member directory' }).click();

  const currentMember = page.locator('li[aria-current="true"]');
  await expect(currentMember.getByText('You', { exact: true })).toBeVisible();
  await currentMember.getByLabel('Role').selectOption('Manager');
  await currentMember.getByRole('button', { name: 'Review role change' }).click();
  await expect(currentMember.getByRole('alert')).toContainText('changing your own role');

  await currentMember.getByLabel('Role').selectOption('OrganizationOwner');
  await currentMember.getByRole('button', { name: 'Suspend membership' }).click();
  await expect(currentMember.getByRole('alert')).toContainText('suspending your own membership');
});

test('member directory distinguishes unavailable persistence from an empty team', async ({ page }) => {
  await page.addInitScript(() => {
    window.sessionStorage.setItem('grover.local-reviewer-id', 'organization-owner');
  });
  await page.route('http://localhost:8080/organizations/org_demo_landscaping/memberships', (route) => (
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({
        error: 'organization_memberships_unavailable',
        message: 'Persisted memberships are unavailable.',
      }),
    })
  ));
  await page.goto('/app');
  const workspaceNavigation = page.getByRole('navigation', {
    name: page.viewportSize()?.width && page.viewportSize()!.width >= 1024
      ? 'Desktop workspace'
      : 'Mobile workspace',
  });
  await workspaceNavigation.getByRole('button', { name: 'Manage', exact: true }).click();
  await page.getByRole('button', { name: /Team Members, invitations, and access/ }).click();
  await page.getByRole('button', { name: 'Open member directory' }).click();

  await expect(page.getByRole('alert').filter({
    hasText: 'no empty or seeded membership list',
  })).toBeVisible();
  await expect(page.getByText('No active or suspended memberships found.')).toHaveCount(0);
});

test('authenticated home retains the shared shell materials and type roles', async ({ page }) => {
  await page.goto('/app');
  await expect(page.getByRole('navigation', { name: 'Desktop workspace' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('#manager-tools > summary')).toBeHidden();

  const shell = await page.evaluate(() => {
    const main = document.querySelector('main');
    const heading = document.querySelector('h1');
    const brandMark = document.querySelector('.grover-brand-mark');
    if (!main || !heading || !brandMark) {
      throw new Error('Authenticated shell theme targets were not rendered.');
    }
    return {
      canvas: getComputedStyle(main).backgroundColor,
      displayFamily: getComputedStyle(heading).fontFamily,
      brandMark: getComputedStyle(brandMark).stroke,
    };
  });

  expect(shell).toEqual({
    canvas: 'rgb(246, 242, 232)',
    displayFamily: '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif',
    brandMark: 'rgb(222, 199, 157)',
  });

  await page.getByRole('navigation', { name: 'Desktop workspace' })
    .getByRole('button', { name: 'Manage', exact: true }).click();
  await expect(page.locator('#manager-tools > summary')).toBeVisible();
  expect(await page.locator('#manager-tools > summary').evaluate((element) => (
    getComputedStyle(element).backgroundColor
  ))).toBe('rgb(15, 47, 40)');
});

test('authenticated navigation moves from a phone bar to a tablet rail', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/app');

  const navigation = page.getByRole('navigation', { name: 'Mobile workspace' });
  await expect(navigation).toBeVisible();
  await expect(navigation.locator('svg')).toHaveCount(5);
  const homeStatus = page.getByRole('status').filter({ hasText: 'You’re clear for now' });
  await expect(homeStatus).toBeVisible();
  await expect(homeStatus.locator('svg')).toHaveCount(1);

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
  const desktopNavigation = page.getByRole('navigation', { name: 'Desktop workspace' });
  await expect(desktopNavigation).toBeVisible();
  const desktop = await desktopNavigation.evaluate((element) => {
    const box = element.parentElement?.getBoundingClientRect();
    const main = document.querySelector('main');
    const hero = document.querySelector('#workspace-home-hero');
    return {
      heroHeight: hero ? Math.round(hero.getBoundingClientRect().height) : 0,
      left: box ? Math.round(box.left) : -1,
      mainPaddingLeft: main ? Math.round(Number.parseFloat(getComputedStyle(main).paddingLeft)) : 0,
      overflow: document.documentElement.scrollWidth > window.innerWidth,
      width: box ? Math.round(box.width) : 0,
    };
  });
  expect(desktop.left).toBe(0);
  expect(desktop.mainPaddingLeft).toBe(240);
  expect(desktop.overflow).toBe(false);
  expect(desktop.width).toBe(240);
  expect(desktop.heroHeight).toBeGreaterThanOrEqual(320);
  expect(desktop.heroHeight).toBeLessThanOrEqual(340);
});

test('field Route prioritizes progress, current stop, and up-next work', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    window.sessionStorage.setItem('grover.local-reviewer-id', 'crew-lead');
  });
  await page.route('http://localhost:8080/crews/crew_1001/day-plan/today', (route) => (
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'day_plan_field_review',
        crew_id: 'crew_1001',
        crew_name: 'North Route Crew',
        organization_id: 'org_demo_landscaping',
        service_date: '2026-08-22',
        status: 'published',
        route_status: 'manual',
        stops: [
          {
            id: 'stop_oak',
            job_id: 'job_oak',
            customer_name: 'Oak Street Residence',
            property_address: '123 Oak Street',
            stop_order: 1,
            job_status: 'in_progress',
            stop_status: 'in_progress',
            estimated_drive_minutes: 12,
            estimated_service_minutes: 42,
          },
          {
            id: 'stop_mesa',
            job_id: 'job_mesa',
            customer_name: 'Mesa HOA entrance',
            property_address: '456 Mesa Drive',
            stop_order: 2,
            job_status: 'scheduled',
            stop_status: 'pending',
            estimated_drive_minutes: 10,
            estimated_service_minutes: 55,
          },
          {
            id: 'stop_citrus',
            job_id: 'job_citrus',
            customer_name: 'Citrus Grove',
            property_address: '789 Citrus Way',
            stop_order: 3,
            job_status: 'scheduled',
            stop_status: 'pending',
            estimated_drive_minutes: 8,
            estimated_service_minutes: 35,
          },
        ],
      }),
    })
  ));

  await page.goto('/app');
  await page.getByRole('navigation', { name: 'Mobile workspace' })
    .getByRole('button', { name: 'Route', exact: true }).click();

  const route = page.locator('#today-route');
  await expect(route.getByText('Today’s route', { exact: true })).toBeVisible();
  await expect(route.getByText('0 of 3', { exact: false })).toBeVisible();
  await expect(route.getByRole('progressbar', { name: '0% of route complete' }))
    .toHaveAttribute('aria-valuenow', '0');
  await expect(route.getByRole('heading', { name: 'Current stop' })).toBeVisible();
  await expect(route.getByText('Oak Street Residence', { exact: true })).toBeVisible();
  await expect(route.getByRole('heading', { name: 'Up next' })).toBeVisible();
  await expect(route.getByText('Mesa HOA entrance', { exact: true })).toBeVisible();
  await expect(route.getByText('Citrus Grove', { exact: true })).toHaveCount(0);

  const hierarchy = await route.evaluate((element) => {
    const current = Array.from(element.querySelectorAll('h3'))
      .find((heading) => heading.textContent === 'Current stop');
    const changes = Array.from(element.querySelectorAll('summary'))
      .find((summary) => summary.textContent?.includes('Route changes'));
    return {
      currentTop: current?.getBoundingClientRect().top ?? 0,
      changesTop: changes?.getBoundingClientRect().top ?? 0,
    };
  });
  expect(hierarchy.currentTop).toBeLessThan(hierarchy.changesTop);

  await route.getByRole('button', { name: 'Finish stop' }).click();
  await expect(route.getByText('1 of 3', { exact: false })).toBeVisible();
  await expect(route.getByRole('progressbar', { name: '33% of route complete' }))
    .toHaveAttribute('aria-valuenow', '33');
  const currentStop = route.getByRole('heading', { name: 'Current stop' }).locator('..');
  const upNextStop = route.getByRole('heading', { name: 'Up next' }).locator('..');
  await expect(currentStop.getByText('Mesa HOA entrance', { exact: true })).toBeVisible();
  await expect(upNextStop.getByText('Citrus Grove', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('field Jobs supports compact status and customer filtering', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    window.sessionStorage.setItem('grover.local-reviewer-id', 'crew-lead');
  });
  await page.route('http://localhost:8080/jobs', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify([
      {
        id: 'job_oak',
        organization_id: 'org_demo_landscaping',
        assigned_crew_id: 'crew_1001',
        customer_name: 'Oak Street Residence',
        property_address: '123 Oak Street',
        status: 'in_progress',
        scheduled_date: '2026-08-22',
        before_photos: 1,
        after_photos: 0,
        checklist_items: 6,
        completed_checklist_items: 4,
      },
      {
        id: 'job_mesa',
        organization_id: 'org_demo_landscaping',
        assigned_crew_id: 'crew_1001',
        customer_name: 'Mesa HOA entrance',
        property_address: '42 Gate Way',
        status: 'scheduled',
        scheduled_date: '2026-08-22',
        before_photos: 0,
        after_photos: 0,
        checklist_items: 4,
        completed_checklist_items: 0,
      },
      {
        id: 'job_citrus',
        organization_id: 'org_demo_landscaping',
        assigned_crew_id: 'crew_1001',
        customer_name: 'Citrus Grove',
        property_address: '789 Citrus Way',
        status: 'completed',
        scheduled_date: '2026-08-22',
        before_photos: 2,
        after_photos: 2,
        checklist_items: 5,
        completed_checklist_items: 5,
      },
    ]),
  }));

  await page.goto('/app');
  await page.getByRole('navigation', { name: 'Mobile workspace' })
    .getByRole('button', { name: 'Jobs', exact: true }).click();

  const jobs = page.locator('#assigned-jobs').locator('..');
  await expect(jobs.getByText('3 shown', { exact: true })).toBeVisible();
  await expect(jobs.getByText('Oak Street Residence', { exact: true })).toBeVisible();
  await expect(jobs.getByText('4/6 checklist · 1 before · 0 after', { exact: true })).toBeVisible();

  await jobs.getByLabel('Filter assigned jobs by status').selectOption('in_progress');
  await expect(jobs.getByText('1 shown', { exact: true })).toBeVisible();
  await expect(jobs.getByText('Oak Street Residence', { exact: true })).toBeVisible();
  await expect(jobs.getByText('Mesa HOA entrance', { exact: true })).toHaveCount(0);

  await jobs.getByLabel('Filter assigned jobs by status').selectOption('all');
  await jobs.getByLabel('Search assigned jobs').fill('Citrus Way');
  await expect(jobs.getByText('1 shown', { exact: true })).toBeVisible();
  await expect(jobs.getByText('Citrus Grove', { exact: true })).toBeVisible();
  await expect(jobs.getByText('Oak Street Residence', { exact: true })).toHaveCount(0);

  await jobs.getByLabel('Search assigned jobs').fill('no matching property');
  await expect(jobs.getByText('No assigned jobs match these filters.')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('field Job keeps context and primary actions while opening one workflow panel', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    window.sessionStorage.setItem('grover.local-reviewer-id', 'crew-lead');
  });
  const job = {
    id: 'job_oak',
    organization_id: 'org_demo_landscaping',
    assigned_crew_id: 'crew_1001',
    customer_name: 'Oak Street Residence',
    property_address: '123 Oak Street',
    status: 'in_progress',
    scheduled_date: '2026-08-22',
    before_photos: 0,
    after_photos: 0,
    checklist_items: 4,
    completed_checklist_items: 2,
  };
  await page.route('http://localhost:8080/jobs', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify([job]),
  }));
  await page.route('http://localhost:8080/jobs/job_oak', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({
      ...job,
      checklist: [
        { id: 'arrival', label: 'Confirm arrival', completed: true },
        { id: 'before', label: 'Capture before photos', completed: true },
        { id: 'service', label: 'Complete contracted service', completed: false },
        { id: 'notes', label: 'Record completion notes', completed: false },
      ],
    }),
  }));
  await page.route('http://localhost:8080/jobs/job_oak/add-ons', (route) => route.fulfill({
    contentType: 'application/json',
    body: '[]',
  }));
  await page.route('http://localhost:8080/jobs/job_oak/photos', (route) => route.fulfill({
    contentType: 'application/json',
    body: '[]',
  }));

  await page.goto('/app');
  await page.getByRole('navigation', { name: 'Mobile workspace' })
    .getByRole('button', { name: 'Jobs', exact: true }).click();
  await page.getByRole('button', { name: 'Open Job', exact: true }).click();

  const detail = page.locator('#job-detail');
  await expect(detail.getByText('Current service target', { exact: true })).toBeVisible();
  await expect(detail.getByRole('heading', { name: 'Oak Street Residence' })).toBeVisible();
  await expect(detail.getByRole('button', { name: 'Complete Job' })).toBeDisabled();
  await expect(detail.getByText('2 evidence gaps', { exact: true })).toBeVisible();
  await expect(detail.getByRole('tabpanel', { name: /Overview/ })).toBeVisible();
  await expect(detail.getByRole('tabpanel', { name: /Checklist/ })).toBeHidden();

  await detail.getByRole('tab', { name: /Checklist/ }).click();
  await expect(detail.getByRole('button', { name: 'Complete Job' })).toBeVisible();
  await expect(detail.getByRole('tabpanel', { name: /Overview/ })).toBeHidden();
  await expect(detail.getByRole('tabpanel', { name: /Checklist/ })).toBeVisible();
  await expect(detail.getByText('Confirm arrival', { exact: true })).toBeVisible();

  const photosTab = detail.getByRole('tab', { name: /Photos/ });
  await photosTab.click();
  await expect(detail.getByRole('tabpanel', { name: /Checklist/ })).toBeHidden();
  await expect(detail.getByRole('tabpanel', { name: /Photos/ })).toBeVisible();
  await expect(detail.getByText('Photo evidence', { exact: true })).toBeVisible();
  await photosTab.press('End');
  await expect(detail.getByRole('tabpanel', { name: /Photos/ })).toBeHidden();
  await expect(detail.getByRole('tabpanel', { name: /Report/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('manager Schedule opens a responsive route board and planning inspector', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.addInitScript(() => {
    window.sessionStorage.setItem('grover.local-reviewer-id', 'manager');
  });
  await page.route('http://localhost:8080/crews', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify([
      {
        id: 'crew_north',
        name: 'North crew',
        organization_id: 'org_demo_landscaping',
        status: 'active',
        daily_stop_capacity: 8,
        lead_membership_id: 'membership_lead',
        persisted: true,
      },
      {
        id: 'crew_south',
        name: 'South crew',
        organization_id: 'org_demo_landscaping',
        status: 'active',
        daily_stop_capacity: 8,
        lead_membership_id: null,
        persisted: true,
      },
    ]),
  }));
  await page.route('http://localhost:8080/jobs', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify([
      {
        id: 'job_oak',
        organization_id: 'org_demo_landscaping',
        assigned_crew_id: 'crew_north',
        customer_name: 'Oak Street Residence',
        property_address: '123 Oak Street',
        status: 'scheduled',
        scheduled_date: '2026-08-22',
        before_photos: 0,
        after_photos: 0,
        checklist_items: 4,
        completed_checklist_items: 0,
      },
      {
        id: 'job_mesa',
        organization_id: 'org_demo_landscaping',
        assigned_crew_id: null,
        customer_name: 'Mesa HOA entrance',
        property_address: '42 Gate Way',
        status: 'scheduled',
        scheduled_date: '2026-08-22',
        before_photos: 0,
        after_photos: 0,
        checklist_items: 4,
        completed_checklist_items: 0,
      },
    ]),
  }));
  await page.route('http://localhost:8080/day-plans', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    const input = route.request().postDataJSON() as { crew_id: string; service_date: string };
    return route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'day_plan_north',
        crew_id: input.crew_id,
        service_date: input.service_date,
        status: 'draft',
        route_status: 'manual',
        time_zone: 'America/Phoenix',
        service_area_label: 'North Phoenix',
        stop_capacity: 8,
        persisted: true,
      }),
    });
  });

  await page.goto('/app');
  await page.getByRole('navigation', { name: 'Desktop workspace' })
    .getByRole('button', { name: 'Manage', exact: true }).click();
  await page.getByRole('button', { name: /Schedule/ }).click();
  await page.getByRole('button', { name: /Day plans/ }).click();

  const schedule = page.locator('#first-owner-day-plan');
  await schedule.getByLabel('Service date').fill('2026-08-22');
  await expect(schedule.getByRole('heading', { name: 'Today’s operation' })).toBeVisible();
  const summary = schedule.getByRole('region', { name: 'Operation summary' });
  await expect(summary.getByText('2 / 2', { exact: true })).toBeVisible();
  await expect(summary.locator('article').filter({ hasText: 'Unassigned' }).getByText('1', { exact: true })).toBeVisible();
  await expect(summary.locator('article').filter({ hasText: 'Crew risks' }).getByText('1', { exact: true })).toBeVisible();
  await expect(schedule.getByText('No route is selected.', { exact: true })).toBeVisible();

  await schedule.getByRole('button', { name: 'Create draft day plan' }).click();
  const board = schedule.getByRole('heading', { name: 'Route board' });
  const inspector = schedule.getByRole('heading', { name: 'Planning inspector' });
  await expect(board).toBeVisible();
  await expect(inspector).toBeVisible();
  const desktopPositions = await Promise.all([
    board.boundingBox(),
    inspector.boundingBox(),
  ]);
  expect(desktopPositions[0]?.x).toBeLessThan(desktopPositions[1]?.x ?? 0);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(board).toBeVisible();
  await expect(inspector).toBeVisible();
  const mobilePositions = await Promise.all([
    board.boundingBox(),
    inspector.boundingBox(),
  ]);
  expect(mobilePositions[0]?.y).toBeLessThan(mobilePositions[1]?.y ?? 0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('manager Recovery inspects an exception and returns to affected work', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const today = new Date().toISOString().slice(0, 10);
  await page.addInitScript(() => {
    window.sessionStorage.setItem('grover.local-reviewer-id', 'manager');
  });
  await page.route(/http:\/\/localhost:8080\/operational-exceptions(?:\?.*)?$/, (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify([
      {
        id: 'exception_route',
        organization_id: 'org_demo_landscaping',
        category: 'weather',
        priority: 'critical',
        status: 'open',
        title: 'Lightning delay on North route',
        description: 'Crew is holding at a safe location pending manager review.',
        affected_resource_type: 'route',
        affected_resource_id: 'day_plan_north',
        assigned_user_id: 'local-review-manager',
        reported_by_user_id: 'crew_lead_1',
        resolved_by_user_id: null,
        resolution_note: null,
        resolved_at: null,
        created_at: '2026-08-22T15:00:00Z',
        updated_at: '2026-08-22T15:05:00Z',
      },
      {
        id: 'exception_access',
        organization_id: 'org_demo_landscaping',
        category: 'access',
        priority: 'medium',
        status: 'resolved',
        title: 'Gate code confirmed',
        description: null,
        affected_resource_type: 'property',
        affected_resource_id: 'property_1001',
        assigned_user_id: 'local-review-manager',
        reported_by_user_id: 'manager_2',
        resolved_by_user_id: 'manager_2',
        resolution_note: 'Customer confirmed updated code.',
        resolved_at: `${today}T16:00:00Z`,
        created_at: '2026-08-22T14:00:00Z',
        updated_at: '2026-08-22T16:00:00Z',
      },
    ]),
  }));

  await page.goto('/app');
  await page.getByRole('navigation', { name: 'Desktop workspace' })
    .getByRole('button', { name: 'Manage', exact: true }).click();
  await page.getByRole('button', { name: /Recovery/ }).click();
  await page.getByRole('button', { name: /Operational exceptions/ }).click();

  const recovery = page.getByRole('heading', { name: 'Recovery and exceptions' }).locator('xpath=ancestor::div[1]');
  await expect(recovery.getByRole('region', { name: 'Recovery summary' }).getByText('1', { exact: true })).toHaveCount(4);
  await expect(recovery.getByRole('heading', { name: 'Work needing recovery' })).toBeVisible();
  await expect(recovery.getByRole('heading', { name: 'Lightning delay on North route' })).toBeVisible();
  await expect(recovery.getByText('Route · day_plan_north', { exact: true })).toBeVisible();

  const queueHeading = recovery.getByRole('heading', { name: 'Work needing recovery' });
  const detailHeading = recovery.getByRole('heading', { name: 'Lightning delay on North route' });
  const desktopPositions = await Promise.all([queueHeading.boundingBox(), detailHeading.boundingBox()]);
  expect(desktopPositions[0]?.x).toBeLessThan(desktopPositions[1]?.x ?? 0);

  await page.setViewportSize({ width: 390, height: 844 });
  const mobilePositions = await Promise.all([queueHeading.boundingBox(), detailHeading.boundingBox()]);
  expect(mobilePositions[0]?.y).toBeLessThan(mobilePositions[1]?.y ?? 0);
  await recovery.getByRole('button', { name: 'Open affected work' }).click();
  await expect(page.locator('#first-owner-day-plan')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Day plans' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('manager completion review opens the selected Job report workflow', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.addInitScript(() => {
    window.sessionStorage.setItem('grover.local-reviewer-id', 'manager');
  });
  const job = {
    id: 'job_report',
    organization_id: 'org_demo_landscaping',
    assigned_crew_id: 'crew_north',
    customer_name: 'Oak Street Residence',
    property_address: '123 Oak Street',
    status: 'completed',
    scheduled_date: '2026-08-22',
    before_photos: 1,
    after_photos: 1,
    checklist_items: 4,
    completed_checklist_items: 4,
  };
  const report = {
    report_id: 'report_job_report',
    job_id: 'job_report',
    report_status: 'submitted',
    persisted: true,
    ready_for_customer: true,
    readiness_blockers: [],
    checklist_progress: 100,
    before_photos: 1,
    after_photos: 1,
    issue_photos: 0,
    pending_add_ons: 0,
    route_stop: null,
    share_url: null,
    job: {
      ...job,
      checklist: [
        { id: 'arrival', label: 'Confirm arrival', completed: true },
        { id: 'before', label: 'Capture before photos', completed: true },
        { id: 'service', label: 'Complete contracted service', completed: true },
        { id: 'notes', label: 'Record completion notes', completed: true },
      ],
    },
    account: {
      job_id: 'job_report',
      account_id: 'account_oak',
      customer_name: 'Oak Street Residence',
      billing_model: 'per_job',
      payment_status: 'paid',
      service_approval_status: 'approved',
      contracted_services_per_period: 1,
      completed_services_this_period: 1,
      billing_notes: 'Ready for manager review.',
    },
    photo_evidence: [],
    completed_add_ons: [],
  };
  await page.route('http://localhost:8080/jobs', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify([job]),
  }));
  await page.route('http://localhost:8080/completion-reports', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify([report]),
  }));
  await page.route('http://localhost:8080/jobs/job_report', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify(report.job),
  }));
  await page.route('http://localhost:8080/jobs/job_report/add-ons', (route) => route.fulfill({
    contentType: 'application/json',
    body: '[]',
  }));
  await page.route('http://localhost:8080/jobs/job_report/photos', (route) => route.fulfill({
    contentType: 'application/json',
    body: '[]',
  }));
  await page.route('http://localhost:8080/jobs/job_report/report', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify(report),
  }));

  await page.goto('/app');
  await page.getByRole('navigation', { name: 'Desktop workspace' })
    .getByRole('button', { name: 'Manage', exact: true }).click();
  await page.getByRole('button', { name: /Reports/ }).click();
  await page.getByRole('button', { name: /Completion reports/ }).click();

  const review = page.getByRole('heading', { name: 'Reports and communication' }).locator('xpath=ancestor::div[1]');
  await expect(review.getByRole('heading', { name: 'Completion review queue' })).toBeVisible();
  await expect(review.getByText('Oak Street Residence', { exact: true })).toBeVisible();
  await review.getByRole('button', { name: 'Open report' }).click();

  const jobDetail = page.locator('#job-detail');
  await expect(jobDetail).toBeVisible();
  await expect(jobDetail.getByRole('tabpanel', { name: /Report/ })).toBeVisible();
  await expect(jobDetail.getByRole('tabpanel', { name: /Overview/ })).toBeHidden();
  await expect(jobDetail.getByText('Completion report', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('yard owner portal keeps property context across Home, Visits, Proof, and Account', async ({ page }) => {
  await page.addInitScript(() => {
    window.sessionStorage.setItem('grover.local-reviewer-id', 'property-owner');
  });
  await page.route('http://localhost:8080/properties/property_1001/completion-reports', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify([{
      report_id: 'report_property_1001',
      job_id: 'job_property_1001',
      property_id: 'property_1001',
      organization_id: 'org_demo_landscaping',
      customer_name: 'Sample Customer',
      property_address: '123 Oak Street',
      delivered_at: '2026-08-22T17:00:00Z',
      share_url: '/report-view/property-proof',
    }]),
  }));
  await page.route('http://localhost:8080/properties/property_1002/completion-reports', (route) => route.fulfill({
    contentType: 'application/json',
    body: '[]',
  }));
  await page.route('http://localhost:8080/accounts/customer_1001/bids', (route) => route.fulfill({
    contentType: 'application/json',
    body: '[]',
  }));

  await page.goto('/app');
  await page.getByRole('navigation', { name: 'Desktop workspace' })
    .getByRole('button', { name: 'My yard', exact: true }).click();

  const portal = page.locator('#customer-workspace');
  await expect(portal.getByRole('navigation', { name: 'Yard Owner portal' })).toBeVisible();
  await expect(portal.getByRole('heading', { name: 'Welcome back, Sample Customer' })).toBeVisible();
  await expect(portal.getByText('Next confirmed visit')).toBeVisible();
  await expect(portal.getByText('Mow and edge the lawn')).toBeVisible();

  await portal.getByRole('button', { name: 'Visits', exact: true }).click();
  await expect(portal.getByRole('heading', { name: 'Visits' })).toBeVisible();
  await expect(portal.getByText('8:00–10:00 AM · Weekly yard care')).toBeVisible();

  await portal.getByRole('button', { name: 'Proof', exact: true }).click();
  await expect(portal.getByRole('heading', { name: 'Proof' })).toBeVisible();
  await expect(portal.getByRole('link', { name: /Care completed/ })).toHaveAttribute('href', /\/report-view\/property-proof$/);

  await portal.getByRole('button', { name: 'Account', exact: true }).click();
  await expect(portal.getByRole('heading', { name: 'Account' })).toBeVisible();
  await portal.getByRole('button', { name: /Backyard Renovation Area/ }).click();
  await expect(portal.getByRole('heading', { name: 'Welcome back, Sample Customer' })).toBeVisible();
  await expect(portal.getByText('Seasonal tree care')).toBeVisible();
  await expect(portal.getByLabel('Choose portal property')).toHaveValue('property_1002');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
