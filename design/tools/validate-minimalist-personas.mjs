import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from '../../frontend/node_modules/playwright/index.mjs';

const designRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const prototypePath = resolve(designRoot, 'prototypes/minimalist-personas/index.html');
const captureRoot = resolve(designRoot, 'high-fidelity/current');
const capture = process.argv.includes('--capture');

const contracts = {
  owner: { family: 'customer', title: 'Know what happens next.', views: ['today', 'visits', 'proof'] },
  'property-manager': { family: 'customer', title: 'Start with the property that needs you.', views: ['overview', 'properties', 'proof', 'approvals'] },
  crew: { family: 'field', title: 'Start with the current stop.', views: ['route', 'jobs', 'recovery'] },
  'crew-member': { family: 'field', title: 'Focus on your assigned work.', views: ['work', 'route', 'saved'] },
  'company-owner': { family: 'operations', title: 'Know whether the business is ready.', views: ['home', 'operations', 'customers', 'team'] },
  'company-manager': { family: 'operations', title: 'Resolve what threatens today’s service.', views: ['today', 'schedule', 'customers', 'recovery'] },
  dispatcher: { family: 'operations', title: 'Make the day publishable.', views: ['plan', 'crews', 'changes'] },
  'billing-admin': { family: 'admin', title: 'Start with incomplete billing evidence.', views: ['readiness', 'accounts', 'handoffs'] },
  support: { family: 'admin', title: 'Own the incident before opening tools.', views: ['incidents', 'activity', 'access'] },
  general: { family: 'access', title: 'Finish access before work appears.', views: ['home'] },
};
const scenarios = ['attention', 'ready', 'empty'];

function check(condition, message) {
  if (!condition) throw new Error(message);
}

const browser = await chromium.launch({ headless: true });
try {
  if (capture) await mkdir(captureRoot, { recursive: true });
  for (const viewport of [{ name: 'desktop', width: 1440, height: 1000 }, { name: 'mobile', width: 390, height: 844 }, { name: 'narrow', width: 320, height: 720 }]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`${pathToFileURL(prototypePath).href}#owner/attention/today`, { waitUntil: 'load' });

    check(await page.locator('#persona-picker option').count() === 10, `${viewport.name}: expected ten personas`);
    check(await page.locator('#scenario-picker option').count() === 3, `${viewport.name}: expected three scenarios`);

    for (const [persona, contract] of Object.entries(contracts)) {
      await page.selectOption('#persona-picker', persona);
      check(await page.locator('body').getAttribute('data-persona') === persona, `${viewport.name}/${persona}: wrong persona`);
      check(await page.locator('body').getAttribute('data-family') === contract.family, `${viewport.name}/${persona}: wrong family`);
      check((await page.locator('#page-title').textContent()) === contract.title, `${viewport.name}/${persona}: wrong priority title`);
      check(await page.locator('#desktop-nav button').count() === contract.views.length, `${viewport.name}/${persona}: wrong desktop navigation count`);
      check(contract.views.length <= 4, `${viewport.name}/${persona}: minimalist navigation exceeds four destinations`);

      for (const scenario of scenarios) {
        await page.selectOption('#scenario-picker', scenario);
        check(await page.locator('body').getAttribute('data-scenario') === scenario, `${viewport.name}/${persona}/${scenario}: wrong scenario`);
        const factCount = await page.locator('#focus-facts span').count();
        check(factCount >= 1 && factCount <= 3, `${viewport.name}/${persona}/${scenario}: essential facts must stay between one and three`);
        check(await page.locator('#task-list button').count() >= 1, `${viewport.name}/${persona}/${scenario}: missing short queue`);
        check(await page.locator('h1:visible').count() === 1, `${viewport.name}/${persona}/${scenario}: expected one visible h1`);
        check((await page.locator('#boundary-copy').textContent()).trim().length > 40, `${viewport.name}/${persona}/${scenario}: missing scope boundary`);

        for (const view of contract.views) {
          const nav = viewport.name === 'desktop' ? '#desktop-nav' : '#mobile-nav';
          await page.locator(`${nav} [data-view="${view}"]`).click();
          check(new URL(page.url()).hash === `#${persona}/${scenario}/${view}`, `${viewport.name}/${persona}/${scenario}/${view}: unstable hash`);
          check(await page.locator(`${nav} [aria-current="page"]`).getAttribute('data-view') === view, `${viewport.name}/${persona}/${scenario}/${view}: active destination missing`);
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
          check(overflow <= 1, `${viewport.name}/${persona}/${scenario}/${view}: horizontal overflow is ${overflow}px`);
        }
      }
    }

    await page.selectOption('#persona-picker', 'owner');
    await page.selectOption('#scenario-picker', 'attention');
    await page.getByRole('button', { name: 'Review preparation' }).click();
    check(await page.locator('#task-detail').isVisible(), `${viewport.name}: primary task detail did not open`);
    check(await page.locator('#close-detail').evaluate((element) => element === document.activeElement), `${viewport.name}: detail focus did not move`);
    await page.locator('#close-detail').click();
    check(!(await page.locator('#task-detail').isVisible()), `${viewport.name}: primary task detail did not close`);
    check(await page.getByRole('button', { name: 'Review preparation' }).evaluate((element) => element === document.activeElement), `${viewport.name}: detail focus did not return`);
    await page.getByRole('button', { name: 'Why this comes first' }).click();
    check(await page.locator('#why-panel').isVisible(), `${viewport.name}: rationale disclosure did not open`);
    await page.getByRole('button', { name: 'Review preparation' }).click();
    check(await page.locator('#detail-option-list input').count() === 2, `${viewport.name}: owner preparation choices are missing`);
    check(await page.locator('#complete-action').isDisabled(), `${viewport.name}: incomplete preparation can be confirmed`);
    await page.locator('#detail-option-list input').first().check();
    check(await page.locator('#complete-action').isDisabled(), `${viewport.name}: partial preparation can be confirmed`);
    await page.locator('#detail-option-list input').last().check();
    await page.locator('#complete-action').click();
    check(await page.locator('#completion').isVisible(), `${viewport.name}: prototype confirmation did not appear`);
    check((await page.locator('#completion-copy').textContent()).includes('No production data was changed'), `${viewport.name}: prototype boundary is missing from confirmation`);
    await page.locator('#reset-action').click();
    check(new URL(page.url()).hash === '#owner/attention/visits', `${viewport.name}: owner journey did not continue to Visits`);
    check((await page.locator('#focus-title').textContent()) === 'Two visits tell the whole story', `${viewport.name}: owner Visits reused generic content`);
    const customerNav = viewport.name === 'desktop' ? '#desktop-nav' : '#mobile-nav';
    await page.locator(`${customerNav} [data-view="proof"]`).click();
    check((await page.locator('#focus-title').textContent()) === 'August 25 care is ready to review', `${viewport.name}: owner Proof reused generic content`);
    await page.getByRole('button', { name: 'Review delivered proof' }).click();
    check(await page.locator('#detail-option-list input[type="radio"]').count() === 2, `${viewport.name}: owner proof response choices are missing`);
    await page.locator('#detail-option-list input').first().check();
    await page.locator('#complete-action').click();
    check(await page.locator('#completion').isVisible(), `${viewport.name}: owner proof response was not confirmed`);
    await page.locator('#reset-action').click();

    await page.selectOption('#persona-picker', 'property-manager');
    await page.selectOption('#scenario-picker', 'attention');
    await page.getByRole('button', { name: 'Resolve access' }).click();
    check(await page.locator('#detail-option-list input[type="radio"]').count() === 3, `${viewport.name}: property access choices are missing`);
    check(await page.locator('#complete-action').isDisabled(), `${viewport.name}: property access response can be confirmed without a choice`);
    await page.locator('#detail-option-list input').first().check();
    await page.locator('#complete-action').click();
    await page.locator('#reset-action').click();
    check(new URL(page.url()).hash === '#property-manager/attention/properties', `${viewport.name}: property journey did not continue to Properties`);
    check((await page.locator('#focus-title').textContent()) === 'Mesa Court is blocked by access', `${viewport.name}: Properties reused generic content`);
    await page.locator(`${customerNav} [data-view="approvals"]`).click();
    check((await page.locator('#focus-title').textContent()) === 'Mesa Court recommendation needs a response', `${viewport.name}: Approvals reused generic content`);

    await page.selectOption('#persona-picker', 'crew');
    await page.selectOption('#scenario-picker', 'attention');
    await page.getByRole('button', { name: 'Start stop' }).click();
    check(await page.locator('#detail-option-list input[type="checkbox"]').count() === 2, `${viewport.name}: Crew Lead readiness checks are missing`);
    check(await page.locator('#complete-action').isDisabled(), `${viewport.name}: Crew Lead can start without readiness`);
    for (const input of await page.locator('#detail-option-list input').all()) await input.check();
    await page.locator('#complete-action').click();
    await page.locator('#reset-action').click();
    check(new URL(page.url()).hash === '#crew/attention/jobs', `${viewport.name}: Crew Lead journey did not continue to Jobs`);
    check((await page.locator('#focus-title').textContent()) === 'Four stops, one route decision', `${viewport.name}: Crew Lead Jobs reused generic content`);
    const fieldNav = viewport.name === 'desktop' ? '#desktop-nav' : '#mobile-nav';
    await page.locator(`${fieldNav} [data-view="recovery"]`).click();
    check((await page.locator('#focus-title').textContent()) === 'Cactus Way access changed', `${viewport.name}: Crew Lead Recovery reused generic content`);
    await page.getByRole('button', { name: 'Review route options' }).click();
    check(await page.locator('#detail-option-list input[type="radio"]').count() === 3, `${viewport.name}: Crew Lead route-request choices are missing`);
    await page.locator('#close-detail').click();

    await page.selectOption('#persona-picker', 'crew-member');
    await page.selectOption('#scenario-picker', 'attention');
    await page.getByRole('button', { name: 'Start task' }).click();
    check(await page.locator('#detail-option-list input[type="checkbox"]').count() === 2, `${viewport.name}: Crew Member readiness checks are missing`);
    for (const input of await page.locator('#detail-option-list input').all()) await input.check();
    await page.locator('#complete-action').click();
    await page.locator('#reset-action').click();
    check(new URL(page.url()).hash === '#crew-member/attention/saved', `${viewport.name}: Crew Member journey did not continue to Saved`);
    check((await page.locator('#focus-title').textContent()) === 'One photo is waiting to upload', `${viewport.name}: Crew Member Saved reused generic content`);
    await page.getByRole('button', { name: 'Choose recovery' }).click();
    check(await page.locator('#detail-option-list input[type="radio"]').count() === 2, `${viewport.name}: Crew Member recovery choices are missing`);
    if (viewport.name !== 'desktop') {
      await page.evaluate(() => {
        document.documentElement.style.scrollBehavior = 'auto';
        window.scrollTo(0, document.documentElement.scrollHeight);
      });
      const actionClearance = await page.evaluate(() => document.querySelector('.mobile-nav').getBoundingClientRect().top - document.querySelector('#cancel-action').getBoundingClientRect().bottom);
      check(actionClearance >= 0, `${viewport.name}: recovery actions are obscured by navigation (${actionClearance}px clearance)`);
    }
    await page.locator('#close-detail').click();
    await page.locator(`${fieldNav} [data-view="route"]`).click();
    check((await page.locator('#focus-title').textContent()) === 'You are at stop 1 of 4', `${viewport.name}: Crew Member Route reused generic content`);
    check(await page.getByText('Route publishing', { exact: false }).count() === 1, `${viewport.name}: Crew Member authority boundary is missing`);

    if (viewport.name === 'desktop') {
      check(await page.locator('.desktop-rail').isVisible(), 'desktop: rail hidden');
      check(!(await page.locator('.mobile-nav').isVisible()), 'desktop: mobile navigation visible');
    } else {
      check(!(await page.locator('.desktop-rail').isVisible()), `${viewport.name}: desktop rail visible`);
      check(await page.locator('.mobile-nav').isVisible(), `${viewport.name}: mobile navigation hidden`);
      const targets = await page.locator('.mobile-nav button').evaluateAll((buttons) => buttons.map((button) => {
        const { width, height } = button.getBoundingClientRect();
        return { width, height };
      }));
      check(targets.every(({ width, height }) => width >= 44 && height >= 44), `${viewport.name}: mobile target below 44px`);
      await page.evaluate(() => {
        document.documentElement.style.scrollBehavior = 'auto';
        window.scrollTo(0, document.documentElement.scrollHeight);
      });
      const clearance = await page.evaluate(() => document.querySelector('.mobile-nav').getBoundingClientRect().top - document.querySelector('.boundary-card').getBoundingClientRect().bottom);
      check(clearance >= 0, `${viewport.name}: final workspace content is obscured by navigation (${clearance}px clearance)`);
    }
    check(errors.length === 0, `${viewport.name}: browser errors: ${errors.join('; ')}`);

    if (capture && viewport.name === 'desktop') {
      await page.goto(`${pathToFileURL(prototypePath).href}#owner/attention/today`, { waitUntil: 'load' });
      await page.screenshot({ path: resolve(captureRoot, 'minimalist-personas-customer-desktop-v1.png'), fullPage: true });
      await page.goto(`${pathToFileURL(prototypePath).href}#company-manager/attention/today`, { waitUntil: 'load' });
      await page.screenshot({ path: resolve(captureRoot, 'minimalist-personas-operations-desktop-v1.png'), fullPage: true });
      await page.goto(`${pathToFileURL(prototypePath).href}#owner/attention/proof`, { waitUntil: 'load' });
      await page.getByRole('button', { name: 'Review delivered proof' }).click();
      await page.screenshot({ path: resolve(captureRoot, 'minimalist-customer-journey-desktop-v2.png'), fullPage: true });
      await page.goto(`${pathToFileURL(prototypePath).href}#crew/attention/recovery`, { waitUntil: 'load' });
      await page.getByRole('button', { name: 'Review route options' }).click();
      await page.screenshot({ path: resolve(captureRoot, 'minimalist-field-journey-desktop-v2.png'), fullPage: true });
    }
    if (capture && viewport.name === 'mobile') {
      await page.goto(`${pathToFileURL(prototypePath).href}#crew-member/attention/work`, { waitUntil: 'load' });
      await page.screenshot({ path: resolve(captureRoot, 'minimalist-personas-field-mobile-v1.png'), fullPage: true });
      await page.goto(`${pathToFileURL(prototypePath).href}#support/attention/incidents`, { waitUntil: 'load' });
      await page.screenshot({ path: resolve(captureRoot, 'minimalist-personas-admin-mobile-v1.png'), fullPage: true });
      await page.goto(`${pathToFileURL(prototypePath).href}#property-manager/attention/approvals`, { waitUntil: 'load' });
      await page.getByRole('button', { name: 'Review recommendation' }).click();
      await page.screenshot({ path: resolve(captureRoot, 'minimalist-customer-journey-mobile-v2.png'), fullPage: true });
      await page.goto(`${pathToFileURL(prototypePath).href}#crew-member/attention/saved`, { waitUntil: 'load' });
      await page.getByRole('button', { name: 'Choose recovery' }).click();
      await page.screenshot({ path: resolve(captureRoot, 'minimalist-field-journey-mobile-v2.png'), fullPage: true });
    }
    await page.close();
  }
  console.log('Minimalist persona validation passed for 10 personas, 3 scenarios, all destinations, and 3 viewports.');
} finally {
  await browser.close();
}
