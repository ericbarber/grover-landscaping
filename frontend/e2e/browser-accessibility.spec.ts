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

test('the production homepage retains the validated prototype foundation', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  const theme = await page.evaluate(() => {
    const main = document.querySelector('main');
    const heading = document.querySelector('h1');
    const primaryAction = Array.from(document.querySelectorAll('a'))
      .find((element) => element.textContent?.includes('Sign up your company'));
    const brandMark = document.querySelector('.grover-brand-mark');

    if (!main || !heading || !primaryAction || !brandMark) {
      throw new Error('The shared Grover theme targets were not rendered.');
    }

    return {
      canvas: getComputedStyle(main).backgroundColor,
      ink: getComputedStyle(heading).color,
      displayFamily: getComputedStyle(heading).fontFamily,
      primaryAction: getComputedStyle(primaryAction).backgroundColor,
      brandMark: getComputedStyle(brandMark).stroke,
      focusToken: getComputedStyle(document.documentElement)
        .getPropertyValue('--grover-focus')
        .trim(),
    };
  });

  expect(theme).toEqual({
    canvas: 'rgb(246, 242, 232)',
    ink: 'rgb(23, 52, 45)',
    displayFamily: '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif',
    primaryAction: 'rgb(23, 63, 53)',
    brandMark: 'rgb(23, 63, 53)',
    focusToken: '#1685a4',
  });
});
