import { expect, test } from '@playwright/test';

test('queues route progress during interruption and replays after recovery', async ({
  context,
  page,
  request,
}) => {
  await page.goto('/');
  const frontendUrl = new URL(page.url());
  const apiOrigin = `${frontendUrl.protocol}//${frontendUrl.hostname}:8080`;
  const dayPlanResponse = await request.get(`${apiOrigin}/crews/crew_1001/day-plan/today`);
  expect(dayPlanResponse.ok()).toBe(true);
  const dayPlan = await dayPlanResponse.json() as {
    id: string;
    stops: Array<{ id: string }>;
  };
  expect(dayPlan.stops.length).toBeGreaterThan(0);
  const resetResponse = await request.post(
    `${apiOrigin}/day-plans/${dayPlan.id}/stops/${dayPlan.stops[0].id}/status`,
    { data: { status: 'pending' } },
  );
  expect(resetResponse.ok()).toBe(true);
  await page.evaluate(async () => {
    localStorage.clear();
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase('grover-field-offline');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('offline database reset was blocked'));
    });
  });
  const accessReady = page.waitForResponse(
    (response) => response.url().endsWith('/me/access') && response.ok(),
  );
  await page.reload();
  await accessReady;

  await expect(page.getByText('Crew day plan', { exact: true })).toBeVisible();
  await expect(page.locator('#today-route').getByText('Source: local API')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const storageProbe = await page.evaluate(async () => {
    const queue = await import('/src/domain/offlineMutationQueue.ts');
    try {
      const mutation = await queue.enqueueStopProgressMutation({
        organizationId: 'org_demo_landscaping',
        actorId: 'local-development-user',
        dayPlanId: 'smoke-probe',
        stopId: 'smoke-probe',
        status: 'pending',
      });
      await queue.removeOfflineMutation(mutation.id);
      return null;
    } catch (error) {
      return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    }
  });
  expect(storageProbe).toBeNull();

  await context.setOffline(true);
  await expect(page.getByText(/You are offline/)).toBeVisible();
  const routeAction = page.getByRole('button', { name: /Start stop|Finish stop/ }).first();
  await expect(routeAction).toBeEnabled();
  await routeAction.click();

  await expect.poll(async () => page.evaluate(async () =>
    new Promise<number>((resolve, reject) => {
      const openRequest = indexedDB.open('grover-field-offline', 3);
      openRequest.onerror = () => reject(openRequest.error);
      openRequest.onsuccess = () => {
        const database = openRequest.result;
        const transaction = database.transaction('mutations', 'readonly');
        const countRequest = transaction.objectStore('mutations').count();
        countRequest.onerror = () => reject(countRequest.error);
        countRequest.onsuccess = () => {
          database.close();
          resolve(countRequest.result);
        };
      };
    })
  ), { timeout: 15_000 }).toBe(1);
  await expect(page.getByText('1 offline change waiting to sync')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/1 pending · 0 retry failed · 0 conflicted/)).toBeVisible();
  await page.locator('summary').filter({ hasText: 'Route changes' }).click();
  await page.getByRole('button', { name: 'Request unplanned stop' }).click();
  await expect(page.getByText('1 route request is queued offline.')).toBeVisible({
    timeout: 15_000,
  });

  await context.setOffline(false);
  await expect(page.getByText('1 offline change waiting to sync')).toBeHidden({ timeout: 30_000 });
  await expect(page.getByText('1 route request is queued offline.')).toBeHidden({
    timeout: 30_000,
  });
  await expect(page.getByText('Progress: synced')).toBeVisible();
  await expect.poll(async () => {
    const response = await request.get(`${apiOrigin}/day-plans/${dayPlan.id}/amendments`);
    if (!response.ok()) return false;
    const amendments = await response.json() as Array<{ note?: string }>;
    return amendments.some((amendment) =>
      amendment.note === 'North Route Crew requested an unplanned stop for manager review.'
    );
  }).toBe(true);
});

test('restores persisted manager report filters after a mobile reload', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.removeItem('grover.manager-completion-report-filters.v1'));
  await page.reload();

  await page.locator('summary').filter({ hasText: 'Manager and office tools' }).click();
  const reportQueue = page
    .getByRole('heading', { name: 'Completion review queue' })
    .locator('xpath=ancestor::section[1]');
  await expect(reportQueue).toBeVisible();
  await reportQueue.getByLabel('Customer').fill('Sample');
  await reportQueue.getByLabel('Readiness blocker').selectOption('route_stop');
  await reportQueue.getByRole('button', { name: 'Apply' }).click();
  await expect(reportQueue.getByText('2 persisted filters applied.')).toBeVisible();

  const restoredRequest = page.waitForRequest((request) => {
    const url = new URL(request.url());
    return url.pathname === '/completion-reports'
      && url.searchParams.get('customer') === 'Sample'
      && url.searchParams.get('readiness_blocker') === 'route_stop';
  });
  await page.reload();
  await restoredRequest;
  await page.locator('summary').filter({ hasText: 'Manager and office tools' }).click();

  await expect(reportQueue.getByLabel('Customer')).toHaveValue('Sample');
  await expect(reportQueue.getByLabel('Readiness blocker')).toHaveValue('route_stop');
  await expect(reportQueue.getByText('2 persisted filters applied.')).toBeVisible();
});

test('guards mobile dispatch hierarchy and exposes crew scope assignment', async ({
  page,
  request,
}) => {
  await page.goto('/');
  const frontendUrl = new URL(page.url());
  const apiOrigin = `${frontendUrl.protocol}//${frontendUrl.hostname}:8080`;
  await page.evaluate(() => {
    localStorage.removeItem(
      'grover.dispatch-hierarchy-filters.v1.org_demo_landscaping',
    );
  });
  await page.reload();
  const [crewsResponse, branchesResponse, territoriesResponse] = await Promise.all([
    request.get(`${apiOrigin}/organizations/org_demo_landscaping/crews`),
    request.get(`${apiOrigin}/organization-branches`),
    request.get(`${apiOrigin}/service-territories`),
  ]);
  expect(crewsResponse.ok()).toBe(true);
  expect(branchesResponse.ok()).toBe(true);
  expect(territoriesResponse.ok()).toBe(true);
  const crews = await crewsResponse.json() as Array<{
    id: string;
    branch_id: string;
    territory_id: string;
  }>;
  const branches = await branchesResponse.json() as Array<{ id: string; name: string }>;
  const territories = await territoriesResponse.json() as Array<{
    id: string;
    name: string;
    status: string;
  }>;
  const crew = crews.find((item) => item.id === 'crew_1001');
  expect(crew).toBeTruthy();
  const branch = branches.find((item) => item.id === crew?.branch_id);
  const territory = territories.find((item) => item.id === crew?.territory_id);
  expect(branch).toBeTruthy();
  expect(territory).toBeTruthy();

  await page.locator('summary').filter({ hasText: 'Manager and office tools' }).click();
  const crewAdministration = page
    .getByRole('heading', { name: 'Crew administration' })
    .locator('xpath=ancestor::div[1]');
  await expect(crewAdministration.getByLabel('Branch')).toHaveValue(crew!.branch_id);
  await expect(crewAdministration.getByLabel('Territory')).toHaveValue(crew!.territory_id);

  const hierarchy = page
    .getByRole('heading', { name: 'Branches and territories' })
    .locator('xpath=ancestor::section[1]');
  await expect(hierarchy.locator('p').filter({ hasText: branch!.name }).last()).toBeVisible();
  const territoryRow = hierarchy
    .locator('p')
    .filter({ hasText: territory!.name })
    .last()
    .locator('xpath=parent::div/parent::div');
  await territoryRow.getByRole('button', { name: 'Deactivate' }).click();
  await territoryRow.getByRole('button', { name: 'Confirm inactive' }).click();
  await expect(hierarchy.getByText('Move active crews out of this territory first.')).toBeVisible();

  const hierarchyConflict = await request.put(
    `${apiOrigin}/organizations/org_demo_landscaping/crews/crew_1001`,
    {
      data: {
        name: 'North Route Crew',
        status: 'active',
        branch_id: crew!.branch_id,
        territory_id: 'territory_outside_selected_branch',
      },
    },
  );
  expect(hierarchyConflict.status()).toBe(409);
  const territoryAfter = await request.get(`${apiOrigin}/service-territories`);
  const currentTerritories = await territoryAfter.json() as Array<{ id: string; status: string }>;
  expect(currentTerritories.find((item) => item.id === territory!.id)?.status).toBe('active');

  await hierarchy.getByLabel('Search hierarchy').fill(branch!.name);
  await hierarchy.getByLabel('Lifecycle status').selectOption('active');
  await expect(hierarchy.getByText(
    `Showing 1 of ${branches.length} branches and 1 of ${territories.length} territories.`,
  )).toBeVisible();
  await page.reload();
  await page.locator('summary').filter({ hasText: 'Manager and office tools' }).click();
  await expect(hierarchy.getByLabel('Search hierarchy')).toHaveValue(branch!.name);
  await expect(hierarchy.getByLabel('Lifecycle status')).toHaveValue('active');
  await hierarchy.getByRole('button', { name: 'Clear hierarchy filters' }).click();
  await expect(hierarchy.getByLabel('Search hierarchy')).toHaveValue('');
  await expect(hierarchy.getByLabel('Lifecycle status')).toHaveValue('all');
  await expect(hierarchy.getByRole('button', { name: 'Clear hierarchy filters' })).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('moves scheduled work with notification follow-up from mobile dispatch', async ({
  page,
  request,
}) => {
  await page.goto('/');
  const frontendUrl = new URL(page.url());
  const apiOrigin = `${frontendUrl.protocol}//${frontendUrl.hostname}:8080`;
  const baseline = {
    crew_id: 'crew_1001',
    scheduled_date: '2026-06-16',
    customer_notification_required: false,
  };
  const resetResponse = await request.put(
    `${apiOrigin}/jobs/job_1003/dispatch-assignment`,
    { data: baseline },
  );
  expect(resetResponse.ok()).toBe(true);

  try {
    await page.reload();
    await page.locator('summary').filter({ hasText: 'Manager and office tools' }).click();
    const dispatch = page
      .getByRole('heading', { name: 'Day workload' })
      .locator('xpath=ancestor::section[1]');
    const jobRow = dispatch.locator('div').filter({
      has: page.getByRole('button', { name: 'Route Planning Demo Customer' }),
    }).last();
    await jobRow.getByRole('button', { name: 'Move' }).click();
    await dispatch.getByLabel('Service date').last().fill('2026-06-17');
    await dispatch.getByLabel('Customer schedule notification').selectOption('required');
    await expect(dispatch.getByText(/Customer continuity:/)).toBeVisible();
    await dispatch.getByRole('button', { name: 'Save move' }).click();
    await expect(dispatch.getByText('Dispatch assignment saved and audited.')).toBeVisible();

    await expect.poll(async () => {
      const response = await request.get(`${apiOrigin}/jobs/job_1003`);
      if (!response.ok()) return false;
      const job = await response.json() as { scheduled_date: string };
      return job.scheduled_date === '2026-06-17';
    }).toBe(true);

    await page.reload();
    await page.locator('summary').filter({ hasText: 'Manager and office tools' }).click();
    await expect(page.getByText('Scheduled job moved').first()).toBeVisible();
    await expect(page.getByText(/Notify the customer about the changed service schedule/).first()).toBeVisible();
    await page.getByRole('button', { name: 'Mark customer notified' }).first().click();
    await expect(page.getByText('Dispatch customer notified').first()).toBeVisible();
    await expect(page.getByText(/Customer contacted by phone/).first()).toBeVisible();
  } finally {
    await request.put(
      `${apiOrigin}/jobs/job_1003/dispatch-assignment`,
      { data: baseline },
    );
  }
});
