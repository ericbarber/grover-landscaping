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
  await expect(page.getByText('Source: local API')).toBeVisible();
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
