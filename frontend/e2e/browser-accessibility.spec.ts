import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

const qualityBudgets = JSON.parse(
  readFileSync(new URL('../../quality-budgets.json', import.meta.url), 'utf8'),
) as {
  browserExperience: {
    publicPrimaryContentReadyMs: number;
    interactionResponseMs: number;
    maxLayoutShift: number;
    supportedPhoneWidthPx: number;
    textZoomPercent: number;
    maxHorizontalOverflowPx: number;
  };
};

test('the public route meets the versioned lab interaction, stability, and reflow budgets', async ({ page }) => {
  await page.addInitScript(() => {
    const qualityWindow = window as Window & { __groverLayoutShift?: number };
    qualityWindow.__groverLayoutShift = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as Array<PerformanceEntry & {
        hadRecentInput: boolean;
        value: number;
      }>) {
        if (!entry.hadRecentInput) {
          qualityWindow.__groverLayoutShift = (qualityWindow.__groverLayoutShift ?? 0) + entry.value;
        }
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
  await page.setViewportSize({ width: qualityBudgets.browserExperience.supportedPhoneWidthPx, height: 720 });
  await page.goto('/for-landscaping-companies');
  await expect(page.getByRole('heading', {
    level: 1,
    name: 'Plan the day. Guide the crew. Prove the work.',
  })).toBeVisible();

  const navigationReadyMs = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return navigation.domContentLoadedEventEnd - navigation.startTime;
  });
  expect(navigationReadyMs).toBeLessThanOrEqual(
    qualityBudgets.browserExperience.publicPrimaryContentReadyMs,
  );
  const layoutShift = await page.evaluate(
    () => (window as Window & { __groverLayoutShift?: number }).__groverLayoutShift ?? 0,
  );
  expect(layoutShift).toBeLessThanOrEqual(qualityBudgets.browserExperience.maxLayoutShift);

  const interactionResponseMs = await page.getByRole('tab', { name: 'Property manager' })
    .evaluate(async (element) => {
      const startedAt = performance.now();
      (element as HTMLButtonElement).click();
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      return performance.now() - startedAt;
    });
  await expect(page.getByRole('heading', { level: 1, name: 'Plan the day. Guide the crew. Prove the work.' })).toBeVisible();
  await expect(page.getByTestId('persona-review-panel').getByRole('heading', {
    name: 'Move from your portfolio to the exact service record.',
  })).toBeVisible();
  expect(interactionResponseMs).toBeLessThanOrEqual(
    qualityBudgets.browserExperience.interactionResponseMs,
  );

  await page.evaluate((zoomPercent) => {
    document.documentElement.style.zoom = String(zoomPercent / 100);
  }, qualityBudgets.browserExperience.textZoomPercent);
  const horizontalOverflowPx = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(horizontalOverflowPx).toBeLessThanOrEqual(
    qualityBudgets.browserExperience.maxHorizontalOverflowPx,
  );
});

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
    await expect
      .poll(
        () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        {
          message: `page reflows without horizontal overflow at ${viewport.width}px`,
          timeout: 5_000,
        },
      )
      .toBe(true);
  }

  await expect(page.getByRole('link', { name: 'Create my private yard' })).toBeVisible();
  await page.keyboard.press('Tab');
  const focused = page.locator(':focus-visible');
  await expect(focused).toBeVisible();
  expect(await focused.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe('none');
});

test('forced-colors mode retains a visible keyboard focus indicator', async ({ page }) => {
  await page.goto('/for-yard-owners');
  await expect(page.getByRole('link', { name: 'Create my private yard' })).toBeVisible();
  await page.keyboard.press('Tab');
  const focused = page.locator(':focus-visible');
  await expect(focused).toBeVisible();

  await page.emulateMedia({ forcedColors: 'active' });
  expect(await page.evaluate(() => matchMedia('(forced-colors: active)').matches)).toBe(true);
  await expect(focused).toBeVisible();
  expect(await focused.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe('none');
});

test('the homepage hero remains focused on one yard while the audience review changes below it', async ({ page }) => {
  await page.goto('/');

  const yardSignup = page
    .getByLabel('Hero next steps')
    .getByRole('link', { name: 'Create my private yard' });

  await expect(yardSignup).toBeVisible();
  await expect(yardSignup).toHaveAttribute('href', '/app/yard-owner');
  await page.getByRole('tab', { name: 'Landscaping company' }).click();
  const companySignup = page.getByTestId('persona-review-panel')
    .getByRole('link', { name: /Start company setup/ });
  await expect(companySignup).toBeVisible();
  await expect(companySignup).toHaveAttribute('href', '/providers/start');
  await expect(yardSignup).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
});

test('the production homepage retains the validated prototype foundation', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  const theme = await page.evaluate(() => {
    const main = document.querySelector('main');
    const heading = document.querySelector('h1');
    const primaryAction = Array.from(document.querySelectorAll('a'))
      .find((element) => element.textContent?.includes('Create my private yard'));
    const brandMark = document.querySelector('.grover-brand-mark');

    if (!main || !heading || !primaryAction || !brandMark) {
      throw new Error('The shared Grover theme targets were not rendered.');
    }

    return {
      canvas: getComputedStyle(main).backgroundColor,
      ink: getComputedStyle(heading).color,
      displayFamily: getComputedStyle(heading).fontFamily.replaceAll('"', ''),
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
    displayFamily: 'Iowan Old Style, Palatino Linotype, Palatino, Georgia, serif',
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
      headline: 'Know what happened—without chasing an update.',
      perspective: 'The service story—without the operations clutter.',
      trust: 'Confidence before and after care',
      proof: 'Yard care should never feel like a mystery.',
      product: 'From connecting your provider to understanding every visit.',
      invitation: 'Make the next care decision with more confidence.',
      actionRole: 'link' as const,
      action: 'Create my private yard',
    },
    {
      path: '/for-property-managers',
      title: 'Landscaping oversight for property managers | Grover',
      headline: 'Keep your entire property portfolio in view.',
      perspective: 'Move from your portfolio to the exact service record.',
      trust: 'Portfolio clarity within approved access',
      proof: 'Keep service records connected to the right address.',
      product: 'One focused view for the properties you can access.',
      invitation: 'Keep authorized property service easier to review.',
      actionRole: 'button' as const,
      action: 'Discuss my portfolio',
    },
    {
      path: '/for-landscaping-companies',
      title: 'Landscaping operations software | Grover',
      headline: 'Plan the day. Guide the crew. Prove the work.',
      perspective: 'Keep office, field, and customer work aligned.',
      trust: 'One shared view of the work',
      proof: 'Run the day without losing the service story.',
      product: 'A calmer system from morning plan to customer-ready proof.',
      invitation: 'Give every team one connected way to plan, care, and prove.',
      actionRole: 'link' as const,
      action: 'Start company setup',
    },
    {
      path: '/for-crew-leads',
      title: 'Field workflow for landscaping crews | Grover',
      headline: 'Know the next stop—and what done looks like.',
      perspective: 'Give crews the context to finish each stop well.',
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
    await expect(page.getByRole('heading', {
      level: 1,
      name: persona.headline,
    })).toBeVisible();
    await expect(page.getByRole('heading', { name: persona.perspective })).toBeVisible();
    await expect(page.getByRole('heading', { name: persona.trust })).toBeVisible();
    await expect(page.getByRole('heading', { name: persona.proof })).toBeVisible();
    await expect(page.getByRole('heading', { name: persona.product })).toBeVisible();
    await expect(page.getByRole('heading', { name: persona.invitation })).toBeVisible();
    await expect(page.getByRole(persona.actionRole, { name: persona.action, exact: true }).first()).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`${persona.path}$`));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});

test('the second-section audience review changes the supporting story without replacing the entry page', async ({ page }) => {
  await page.goto('/for-landscaping-companies');
  await expect(page.getByRole('heading', { level: 1, name: 'Plan the day. Guide the crew. Prove the work.' })).toBeVisible();
  expect(await page.evaluate(() => {
    const hero = document.querySelector('[data-testid="marketing-hero"]');
    const selector = document.querySelector('[role="tablist"][aria-label="Choose your perspective"]');
    return Boolean(hero && selector && hero.getBoundingClientRect().bottom <= selector.getBoundingClientRect().top);
  })).toBe(true);
  await page.getByRole('tab', { name: 'Property manager' }).click();

  await expect(page).toHaveURL(/\/for-landscaping-companies$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Plan the day. Guide the crew. Prove the work.' })).toBeVisible();
  await expect(page.getByTestId('persona-review-panel').getByRole('heading', { name: 'Move from your portfolio to the exact service record.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Keep service records connected to the right address.' })).toBeVisible();
  await expect(page.locator('#product').getByText('Built for authorized multi-property care', { exact: true })).toBeVisible();
  await expect(page.getByText('Designed around your operation', { exact: true })).not.toBeVisible();

  await page.getByRole('tab', { name: 'Crew lead' }).click();
  await expect(page).toHaveURL(/\/for-landscaping-companies$/);
  await expect(page.getByTestId('persona-review-panel').getByRole('heading', { name: 'Give crews the context to finish each stop well.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'The next stop should already make sense.' })).toBeVisible();
  await expect(page.locator('#proof').getByText('Field resilience', { exact: true })).toBeVisible();
  await expect(page.getByText('Portfolio readiness', { exact: true })).not.toBeVisible();
});

test('persona switching in the second section leaves the complete hero unchanged', async ({ page }) => {
  const personas = [
    { tab: 'Yard owner', review: 'The service story—without the operations clutter.' },
    { tab: 'Property manager', review: 'Move from your portfolio to the exact service record.' },
    { tab: 'Landscaping company', review: 'Keep office, field, and customer work aligned.' },
    { tab: 'Crew lead', review: 'Give crews the context to finish each stop well.' },
  ];

  for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 720 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/for-landscaping-companies');
    await page.evaluate(async () => {
      await document.fonts.ready;
    });

    const heroHeading = page.getByRole('heading', {
      level: 1,
      name: 'Plan the day. Guide the crew. Prove the work.',
    });
    const heroPreview = page.getByTestId('hero-entry-preview');
    const audienceControl = page.getByRole('tablist', { name: 'Choose your perspective' });
    const baseline = await Promise.all([
      heroHeading.evaluate((element) => Math.round(element.getBoundingClientRect().top + window.scrollY)),
      heroPreview.evaluate((element) => element.textContent),
      audienceControl.evaluate((element) => Math.round(element.getBoundingClientRect().top + window.scrollY)),
    ]);

    for (const persona of personas) {
      await page.getByRole('tab', { name: persona.tab }).click();
      await expect(heroHeading).toBeVisible();
      const panel = page.getByTestId('persona-review-panel');
      await expect(panel.getByRole('heading', { name: persona.review })).toBeVisible();

      const current = await Promise.all([
        heroHeading.evaluate((element) => Math.round(element.getBoundingClientRect().top + window.scrollY)),
        heroPreview.evaluate((element) => element.textContent),
        audienceControl.evaluate((element) => Math.round(element.getBoundingClientRect().top + window.scrollY)),
      ]);
      expect(current).toEqual(baseline);
      expect(await audienceControl.evaluate((control, panelId) => {
        const panel = document.getElementById(String(panelId));
        return Boolean(control.compareDocumentPosition(panel!) & Node.DOCUMENT_POSITION_FOLLOWING);
      }, 'persona-review-panel')).toBe(true);
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      await expect(page).toHaveURL(/\/for-landscaping-companies$/);
    }
  }
});

test('the audience tabs support arrow, Home, and End keyboard navigation', async ({ page }) => {
  await page.goto('/for-landscaping-companies');

  const companyTab = page.getByRole('tab', { name: 'Landscaping company' });
  await companyTab.focus();
  await companyTab.press('ArrowRight');
  const crewTab = page.getByRole('tab', { name: 'Crew lead' });
  await expect(crewTab).toBeFocused();
  await expect(crewTab).toHaveAttribute('aria-selected', 'true');
  await expect(page).toHaveURL(/\/for-landscaping-companies$/);

  await crewTab.press('End');
  const managerTab = page.getByRole('tab', { name: 'Property manager' });
  await expect(managerTab).toBeFocused();
  await expect(managerTab).toHaveAttribute('aria-selected', 'true');

  await managerTab.press('Home');
  await expect(companyTab).toBeFocused();
  await expect(companyTab).toHaveAttribute('aria-selected', 'true');
});

test('the complete desktop hero stays within the first viewport', async ({ page }, testInfo) => {
  test.skip(Boolean(testInfo.project.use.isMobile), 'Desktop hero geometry requires a desktop browser context.');

  const personas = [
    { path: '/for-yard-owners', graphic: 'Tuesday · 8:00–10:00 AM' },
    { path: '/for-property-managers', graphic: '16 properties available' },
    { path: '/for-landscaping-companies', graphic: '8 ordered stops' },
    { path: '/for-crew-leads', graphic: '8 ordered stops' },
  ];

  for (const viewport of [{ width: 1024, height: 720 }, { width: 1280, height: 720 }]) {
    await page.setViewportSize(viewport);
    for (const persona of personas) {
      await page.goto(persona.path);
      await page.evaluate(async () => {
        await document.fonts.ready;
      });
      await expect(page.getByText(persona.graphic, { exact: true }).first()).toBeVisible();

      const bounds = await page.evaluate(() => {
        const header = document.querySelector('header')?.getBoundingClientRect();
        const hero = document.querySelector('[data-testid="marketing-hero"]')?.getBoundingClientRect();
        const graphic = document.querySelector('[data-testid="hero-visual"]')?.getBoundingClientRect();
        const visual = document.querySelector('[data-testid="hero-visual"] article')?.getBoundingClientRect();

        return {
          headerBottom: header?.bottom,
          heroTop: hero?.top,
          heroBottom: hero?.bottom,
          graphicTop: graphic?.top,
          graphicBottom: graphic?.bottom,
          visualTop: visual?.top,
          visualBottom: visual?.bottom,
          viewportBottom: window.innerHeight,
        };
      });

      expect(bounds.heroTop).toBe(bounds.headerBottom);
      expect(bounds.heroBottom).toBeLessThanOrEqual(bounds.viewportBottom + 1);
      expect(bounds.graphicTop).toBeGreaterThanOrEqual(bounds.heroTop! - 1);
      expect(bounds.graphicBottom).toBeLessThanOrEqual(bounds.viewportBottom + 1);
      expect(bounds.visualTop).toBeGreaterThanOrEqual(bounds.graphicTop! - 1);
      expect(bounds.visualBottom).toBeLessThanOrEqual(bounds.graphicBottom! + 1);
    }
  }
});

test('the compact entry hero stays fixed while the second-section perspective changes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/for-landscaping-companies');

  const visual = page.getByTestId('hero-visual');
  await expect(visual.getByRole('heading', { name: '8 ordered stops' })).toBeVisible();
  await expect(visual.getByText('Sample landscaping company workspace', { exact: true })).toBeVisible();
  await visual.getByRole('button', { name: 'Care' }).click();
  await expect(visual.getByRole('heading', { name: '6 of 8 properties complete' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.getByRole('tab', { name: 'Yard owner' }).click();
  await expect(visual.getByRole('heading', { name: '6 of 8 properties complete' })).toBeVisible();
  await expect(visual.getByText('Sample landscaping company workspace', { exact: true })).toBeVisible();
  await expect(page.getByTestId('persona-review-panel').getByRole('heading', {
    name: 'The service story—without the operations clutter.',
  })).toBeVisible();
  await expect(page.getByTestId('product-tour-owner-plan-preview')).toContainText('Tuesday · 8:00–10:00 AM');
});

test('the product tour Plan step presents the landscaping operations dashboard', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/for-landscaping-companies#tour');

  const tour = page.locator('#tour');
  const dashboard = tour.locator('section[aria-labelledby="marketing-tour-operations-planner-title"]');
  await expect(tour.getByRole('tab', { name: /01 · Plan/ })).toHaveAttribute('aria-selected', 'true');
  await expect(dashboard.getByRole('heading', { name: 'Today’s operation' })).toBeVisible();
  await expect(dashboard.getByText('Crews active', { exact: true })).toBeVisible();
  await expect(dashboard.getByText('Route progress', { exact: true })).toBeVisible();
  await expect(dashboard.getByText('Dispatch focus · Copper Ridge HOA · 90 min')).toBeVisible();

  await dashboard.getByRole('button', { name: 'Use suggested balance' }).click();
  await expect(dashboard.getByRole('radio', { name: 'West crew' })).toBeChecked();
  await expect(dashboard.getByText('Balanced plan · all 8 stops assigned', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await tour.getByRole('tab', { name: /02 · Care/ }).click();
  await expect(dashboard).not.toBeVisible();
  await expect(tour.getByText('Desert Willow Commons', { exact: true })).toBeVisible();
});

test('every product-tour step stays within the selected persona', async ({ page }) => {
  const personas = [
    {
      id: 'owner',
      path: '/for-yard-owners',
      title: 'Follow your yard from upcoming care to completed proof.',
      steps: [
        { tab: /01 · Upcoming/, preview: 'Tuesday · 8:00–10:00 AM' },
        { tab: /02 · In progress/, preview: 'Care is underway' },
        { tab: /03 · Review/, preview: 'Your care summary is ready' },
      ],
    },
    {
      id: 'property-manager',
      path: '/for-property-managers',
      title: 'Move from an authorized portfolio to delivered proof.',
      steps: [
        { tab: /01 · Access/, preview: '16 properties available' },
        { tab: /02 · Review/, preview: 'Desert Willow Commons' },
        { tab: /03 · Proof/, preview: '14 reports available' },
      ],
    },
    {
      id: 'company',
      path: '/for-landscaping-companies',
      title: 'Follow one workday from plan to customer-ready proof.',
      steps: [
        { tab: /01 · Plan/, preview: 'Today’s operation' },
        { tab: /02 · Care/, preview: 'Desert Willow Commons' },
        { tab: /03 · Prove/, preview: 'Service story ready' },
      ],
    },
    {
      id: 'crew',
      path: '/for-crew-leads',
      title: 'Move from the first route stop to one clean handoff.',
      steps: [
        { tab: /01 · Route/, preview: '8 ordered stops' },
        { tab: /02 · Work/, preview: '4 of 6 tasks' },
        { tab: /03 · Handoff/, preview: '8 stops ready to hand off' },
      ],
    },
  ];

  await page.setViewportSize({ width: 390, height: 844 });
  for (const persona of personas) {
    await page.goto(`${persona.path}#tour`);
    const tour = page.locator('#tour');
    await expect(tour.getByRole('heading', { name: persona.title })).toBeVisible();

    for (const [index, step] of persona.steps.entries()) {
      await tour.getByRole('tab', { name: step.tab }).click();
      const preview = page.getByTestId(`product-tour-${persona.id}-${['plan', 'care', 'prove'][index]}-preview`);
      await expect(preview).toContainText(step.preview);
    }

    const companyPlanner = tour.locator('section[aria-labelledby="marketing-tour-operations-planner-title"]');
    if (persona.id === 'company') {
      await tour.getByRole('tab', { name: /01 · Plan/ }).click();
      await expect(companyPlanner).toBeVisible();
    } else {
      await expect(companyPlanner).toHaveCount(0);
      await expect(tour.getByText('Desert Willow Commons', { exact: true })).toHaveCount(0);
      await expect(tour.getByText('Service story ready', { exact: true })).toHaveCount(0);
    }
  }
});
