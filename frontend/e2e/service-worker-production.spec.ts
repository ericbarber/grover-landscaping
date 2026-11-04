import { expect, test } from '@playwright/test';

test('production worker controls the app and restores the shell offline', async ({
  context,
  page,
}) => {
  await page.goto('/for-yard-owners');
  await expect(page.getByRole('heading', {
    name: 'Know what happened—without chasing an update.',
  })).toBeVisible();

  await expect.poll(() => page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    return Boolean(registration.active && navigator.serviceWorker.controller);
  })).toBe(true);

  // The initial document loads before registration. Revisit once under worker
  // control so the hashed production assets are available for offline recovery.
  await page.reload();
  await expect(page.getByRole('heading', {
    name: 'Know what happened—without chasing an update.',
  })).toBeVisible();

  await expect.poll(() => page.evaluate(async () => {
    const cacheNames = await caches.keys();
    const shellCacheName = cacheNames.find((name) => name.includes('-field-shell-'));
    if (!shellCacheName) return false;

    const requests = await (await caches.open(shellCacheName)).keys();
    const paths = requests.map((request) => new URL(request.url).pathname);
    return paths.includes('/')
      && paths.includes('/manifest.webmanifest')
      && paths.some((path) => path.startsWith('/assets/') && path.endsWith('.js'));
  })).toBe(true);

  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('heading', {
    name: 'Know what happened—without chasing an update.',
  })).toBeVisible();
  await expect(page.getByTestId('marketing-hero')
    .getByRole('link', { name: 'Create my private yard' })).toBeVisible();
});
