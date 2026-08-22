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
