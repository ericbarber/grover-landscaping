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

test('each audience route presents a complete persona-specific landing view', async ({ page }) => {
  const personas = [
    {
      path: '/for-yard-owners',
      title: 'Clearer yard care for homeowners | Grover',
      headline: 'See the care behind your yard.',
      trust: 'Confidence before and after care',
      proof: 'Yard care should never feel like a mystery.',
      product: 'From finding care to understanding every visit.',
      invitation: 'Make the next care decision with more confidence.',
      actionRole: 'link' as const,
      action: 'Sign up your yard',
    },
    {
      path: '/for-property-managers',
      title: 'Landscaping oversight for property managers | Grover',
      headline: 'Keep every property ready.',
      trust: 'Portfolio clarity without the chase',
      proof: 'Every address gets a clear next step.',
      product: 'One operating view for every property you represent.',
      invitation: 'Spend less time assembling status—and more time acting on it.',
      actionRole: 'button' as const,
      action: 'Discuss my portfolio',
    },
    {
      path: '/for-landscaping-companies',
      title: 'Landscaping operations software | Grover',
      headline: 'Plan every visit. Care with confidence. Prove the work.',
      trust: 'One shared view of the work',
      proof: 'Run the day without losing the service story.',
      product: 'A calmer system from morning plan to completed revenue.',
      invitation: 'Give every team one connected way to plan, care, and prove.',
      actionRole: 'link' as const,
      action: 'Sign up your company',
    },
    {
      path: '/for-crew-leads',
      title: 'Field workflow for landscaping crews | Grover',
      headline: 'Know the next stop—and what done looks like.',
      trust: 'Everything the field needs to move',
      proof: 'The next stop should already make sense.',
      product: 'Less office back-and-forth. More time caring for properties.',
      invitation: 'Give crews the plan before they reach the property.',
      actionRole: 'button' as const,
      action: 'Request a demo',
    },
  ];

  await page.setViewportSize({ width: 390, height: 844 });
  for (const persona of personas) {
    await page.goto(persona.path);
    await expect(page).toHaveTitle(persona.title);
    await expect(page.getByRole('heading', { level: 1, name: persona.headline })).toBeVisible();
    await expect(page.getByRole('heading', { name: persona.trust })).toBeVisible();
    await expect(page.getByRole('heading', { name: persona.proof })).toBeVisible();
    await expect(page.getByRole('heading', { name: persona.product })).toBeVisible();
    await expect(page.getByRole('heading', { name: persona.invitation })).toBeVisible();
    await expect(page.getByRole(persona.actionRole, { name: persona.action, exact: true }).first()).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`${persona.path}$`));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});

test('the audience control switches the complete landing-page story and URL', async ({ page }) => {
  await page.goto('/for-landscaping-companies');
  await page.getByRole('tab', { name: 'Property manager' }).click();

  await expect(page).toHaveURL(/\/for-property-managers$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Keep every property ready.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Every address gets a clear next step.' })).toBeVisible();
  await expect(page.locator('#product').getByText('Portfolio readiness', { exact: true })).toBeVisible();
  await expect(page.getByText('Revenue readiness', { exact: true })).not.toBeVisible();

  await page.getByRole('tab', { name: 'Crew lead' }).click();
  await expect(page).toHaveURL(/\/for-crew-leads$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Know the next stop—and what done looks like.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'The next stop should already make sense.' })).toBeVisible();
  await expect(page.locator('#proof').getByText('Field resilience', { exact: true })).toBeVisible();
  await expect(page.getByText('Portfolio readiness', { exact: true })).not.toBeVisible();
});
