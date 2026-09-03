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

  await expect(page.getByRole('link', { name: 'Sign up your yard' })).toBeVisible();
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
  const companySignup = page
    .getByLabel('Primary next steps')
    .getByRole('link', { name: 'Sign up your company' });

  await expect(yardSignup).toBeVisible();
  await expect(yardSignup).toHaveAttribute('href', '/app/yard-owner');
  await expect(companySignup).toBeVisible();
  await expect(companySignup).toHaveAttribute('href', '/providers/start');
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
      headline: 'See the care behind your yard.',
      perspective: 'The service story—without the operations clutter.',
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
      perspective: 'Move from portfolio health to the property that needs you.',
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
      perspective: 'Keep office, field, customer, and revenue work aligned.',
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
    await expect(page.getByRole('heading', { level: 1, name: persona.headline })).toBeVisible();
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

test('the audience control switches the complete landing-page story and URL', async ({ page }) => {
  await page.goto('/for-landscaping-companies');
  await expect(page.getByRole('heading', { level: 1, name: 'Plan every visit. Care with confidence. Prove the work.' })).toBeVisible();
  expect(await page.evaluate(() => {
    const selector = document.querySelector('[role="tablist"][aria-label="Choose your perspective"]');
    const actions = document.querySelector('[aria-label="Primary next steps"]');
    return Boolean(selector && actions && selector.getBoundingClientRect().top < actions.getBoundingClientRect().top);
  })).toBe(true);
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

test('persona switching keeps the hero title section stable', async ({ page }) => {
  const personas = [
    { tab: 'Yard owner', headline: 'See the care behind your yard.' },
    { tab: 'Property manager', headline: 'Keep every property ready.' },
    { tab: 'Landscaping company', headline: 'Plan every visit. Care with confidence. Prove the work.' },
    { tab: 'Crew lead', headline: 'Know the next stop—and what done looks like.' },
  ];

  for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 720 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/for-landscaping-companies');
    await page.evaluate(async () => {
      await document.fonts.ready;
    });

    const heroCopy = page.getByTestId('hero-persona-copy');
    const audienceControl = page.getByRole('tablist', { name: 'Choose your perspective' });
    const baseline = await Promise.all([
      heroCopy.evaluate((element) => element.getBoundingClientRect().height),
      audienceControl.evaluate((element) => element.getBoundingClientRect().top),
    ]);

    for (const persona of personas) {
      await page.getByRole('tab', { name: persona.tab }).click();
      await expect(page.getByRole('heading', { level: 1, name: persona.headline })).toBeVisible();

      const current = await Promise.all([
        heroCopy.evaluate((element) => element.getBoundingClientRect().height),
        audienceControl.evaluate((element) => element.getBoundingClientRect().top),
      ]);
      expect(current).toEqual(baseline);
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    }
  }
});

test('the complete desktop hero stays within the first viewport', async ({ page }) => {
  const personas = [
    { tab: 'Yard owner', graphic: 'Your latest service is ready' },
    { tab: 'Property manager', graphic: '14 of 16 properties on track' },
    { tab: 'Landscaping company', graphic: 'Today’s operation' },
    { tab: 'Crew lead', graphic: 'Oak Street residence' },
  ];

  for (const viewport of [{ width: 1024, height: 720 }, { width: 1280, height: 720 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/for-landscaping-companies');
    await page.evaluate(async () => {
      await document.fonts.ready;
    });

    for (const persona of personas) {
      await page.getByRole('tab', { name: persona.tab }).click();
      await expect(page.getByText(persona.graphic, { exact: true }).first()).toBeVisible();

      const bounds = await page.evaluate((activeTab) => {
        const header = document.querySelector('header')?.getBoundingClientRect();
        const hero = document.querySelector('main > section')?.getBoundingClientRect();
        const graphic = document.querySelector('main > section > div:last-child')?.getBoundingClientRect();
        const visual = activeTab === 'Landscaping company'
          ? document.querySelector('[aria-labelledby="marketing-operations-planner-title"]')?.getBoundingClientRect()
          : document.querySelector('main > section > div:last-child article')?.getBoundingClientRect();
        const controls = document.querySelector('[role="tablist"][aria-label="Choose your perspective"]')?.getBoundingClientRect();
        const actions = document.querySelector('[aria-label="Primary next steps"]')?.getBoundingClientRect();
        const directSignup = document.querySelector('[aria-label="Direct signup options"]')?.getBoundingClientRect();

        return {
          headerBottom: header?.bottom,
          heroTop: hero?.top,
          heroBottom: hero?.bottom,
          graphicTop: graphic?.top,
          graphicBottom: graphic?.bottom,
          visualTop: visual?.top,
          visualBottom: visual?.bottom,
          controlsBottom: controls?.bottom,
          actionsBottom: actions?.bottom,
          directSignupBottom: directSignup?.bottom,
          viewportBottom: window.innerHeight,
        };
      }, persona.tab);

      const context = `${persona.tab} at ${viewport.width}×${viewport.height}`;
      expect(bounds.heroTop, `${context} hero top`).toBe(bounds.headerBottom);
      expect(bounds.heroBottom, `${context} hero bottom`).toBeLessThanOrEqual(bounds.viewportBottom + 1);
      expect(bounds.graphicTop, `${context} graphic top`).toBeGreaterThanOrEqual(bounds.heroTop! - 1);
      expect(bounds.graphicBottom, `${context} graphic bottom`).toBeLessThanOrEqual(bounds.viewportBottom + 1);
      expect(bounds.visualTop, `${context} visual top`).toBeGreaterThanOrEqual(bounds.graphicTop! - 1);
      expect(bounds.visualBottom, `${context} visual bottom`).toBeLessThanOrEqual(bounds.graphicBottom! + 1);
      expect(bounds.controlsBottom, `${context} persona controls`).toBeLessThanOrEqual(bounds.viewportBottom);
      expect(bounds.actionsBottom, `${context} primary actions`).toBeLessThanOrEqual(bounds.viewportBottom);
      expect(bounds.directSignupBottom, `${context} direct signup`).toBeLessThanOrEqual(bounds.viewportBottom);
    }
  }
});

test('the landscaping-company hero demonstrates route workload balancing', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/for-landscaping-companies');

  const planner = page.locator('section[aria-labelledby="marketing-operations-planner-title"]');
  await expect(planner.getByRole('heading', { name: 'Today’s operation' })).toBeVisible();
  await expect(planner.getByText('8 / 9', { exact: true })).toBeVisible();
  await expect(planner.getByText('46%', { exact: true })).toBeVisible();
  await expect(planner.getByText('1 stop needs assignment', { exact: true })).toBeVisible();
  await expect(planner.getByText('Illustrative planning only. Live counts are sample data; no route or schedule is saved.')).toBeVisible();

  const assignmentGroup = planner.getByRole('group', { name: 'Dispatch focus · Copper Ridge HOA · 90 min' });
  await assignmentGroup.getByText('North crew', { exact: true }).click();
  await expect(planner.getByRole('radio', { name: 'North crew' })).toBeChecked();
  await expect(planner.getByText('North crew is 10 minutes over capacity', { exact: true })).toBeVisible();
  await expect(planner.getByText('Over capacity', { exact: true })).toBeVisible();
  await expect(planner.getByText('5 stops · 430 planned minutes', { exact: true })).toBeVisible();
  await expect(planner.getByText('4', { exact: true })).toBeVisible();

  await planner.getByRole('button', { name: 'Use suggested balance' }).click();
  await expect(planner.getByRole('radio', { name: 'West crew' })).toBeChecked();
  await expect(planner.getByText('Balanced plan · all 8 stops assigned', { exact: true })).toBeVisible();
  await expect(planner.getByText('5 stops · 430 planned minutes', { exact: true })).not.toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.getByRole('tab', { name: 'Yard owner' }).click();
  await expect(page.locator('section[aria-labelledby="marketing-operations-planner-title"]')).not.toBeVisible();
  await expect(page.locator('section[aria-labelledby="marketing-tour-operations-planner-title"]')).not.toBeVisible();
  await expect(page.getByText('Your latest service is ready', { exact: true })).toBeVisible();
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
      title: 'Move from portfolio readiness to owner-ready reporting.',
      steps: [
        { tab: /01 · Prioritize/, preview: '14 of 16 properties ready' },
        { tab: /02 · Monitor/, preview: '12 properties complete' },
        { tab: /03 · Report/, preview: 'Owner-ready summary prepared' },
      ],
    },
    {
      id: 'company',
      path: '/for-landscaping-companies',
      title: 'Follow one workday from plan to completed revenue.',
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
