import { expect, test } from '@playwright/test';

test('the Yard Owner entry preserves reflow, reduced motion, and keyboard focus', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/for-yard-owners');
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);

  for (const viewport of [
    { width: 320, height: 720 },
    { width: 768, height: 1024 },
    { width: 1366, height: 768 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }

  await page.keyboard.press('Tab');
  const focused = page.locator(':focus-visible');
  await expect(focused).toBeVisible();
  expect(await focused.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe('none');
});

test('forced-colors mode retains a visible keyboard focus indicator', async ({ page }) => {
  await page.goto('/for-yard-owners');
  await expect(page.getByRole('link', { name: 'Sign up your yard' })).toBeVisible();
  await page.keyboard.press('Tab');
  const focused = page.locator(':focus-visible');
  await expect(focused).toBeVisible();

  await page.emulateMedia({ forcedColors: 'active' });
  expect(await page.evaluate(() => matchMedia('(forced-colors: active)').matches)).toBe(true);
  await expect(focused).toBeVisible();
  expect(await focused.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe('none');
});

test('the hero offers direct yard and company signup paths', async ({ page }) => {
  await page.goto('/');

  const yardSignup = page.getByRole('link', { name: 'Sign up your yard' });
  const companySignup = page.getByRole('link', { name: 'Sign up your company' });

  await expect(yardSignup).toBeVisible();
  await expect(yardSignup).toHaveAttribute('href', '/app/yard-owner');
  await expect(companySignup).toBeVisible();
  await expect(companySignup).toHaveAttribute('href', '/app');
});
