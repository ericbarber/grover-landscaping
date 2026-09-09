import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from '../../frontend/node_modules/playwright/index.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..', '..');
const prototype = resolve(root, 'design', 'prototypes', 'simplified-service-thread', 'index.html');
const captureRoot = resolve(root, 'design', 'high-fidelity', 'current');
const capture = process.argv.includes('--capture');
const personas = {
  owner: { name: 'Yard Owner', nav: 3 },
  manager: { name: 'Company Manager', nav: 4 },
  lead: { name: 'Crew Lead', nav: 3 },
};
const moments = ['decision', 'release', 'field', 'proof'];

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
    await page.goto(`${pathToFileURL(prototype).href}#owner/decision`, { waitUntil: 'load' });

    check(await page.locator('#persona-picker option').count() === 3, `${viewport.name}: wrong perspective count`);
    check(await page.locator('#moment-picker option').count() === 4, `${viewport.name}: wrong service-moment count`);

    for (const [persona, contract] of Object.entries(personas)) {
      await page.selectOption('#persona-picker', persona);
      await page.selectOption('#moment-picker', 'decision');
      check(documentHash(await page.url()) === `${persona}/decision`, `${viewport.name}/${persona}: perspective and moment URL is unstable`);
      check(await page.locator('body').getAttribute('data-persona') === persona, `${viewport.name}/${persona}: wrong role filter`);
      for (const moment of moments) {
        await page.selectOption('#moment-picker', moment);
        check(documentHash(await page.url()) === `${persona}/${moment}`, `${viewport.name}/${persona}/${moment}: unstable URL`);
        check(await page.locator('body').getAttribute('data-moment') === moment, `${viewport.name}/${persona}/${moment}: wrong moment state`);
        check(await page.locator('h1:visible').count() === 1, `${viewport.name}/${persona}/${moment}: expected one visible h1`);
        check((await page.locator('#page-title').textContent()) === 'Mesa Court', `${viewport.name}/${persona}/${moment}: service identity changed`);
        check(await page.locator('#stage-list [aria-current="step"]').count() === 1, `${viewport.name}/${persona}/${moment}: current lifecycle stage missing`);
        check(await page.locator('#timeline-list li').count() >= 2, `${viewport.name}/${persona}/${moment}: service timeline is too thin`);
        check((await page.locator('#next-owner').textContent()).trim().length > 0, `${viewport.name}/${persona}/${moment}: next owner is missing`);
        check((await page.locator('#boundary-copy').textContent()).trim().length > 60, `${viewport.name}/${persona}/${moment}: role boundary is missing`);
        check(await page.locator('#desktop-nav .nav-button').count() === contract.nav, `${viewport.name}/${persona}/${moment}: wrong desktop navigation count`);
        check(contract.nav <= 4, `${viewport.name}/${persona}: navigation exceeds four intentions`);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        check(overflow <= 1, `${viewport.name}/${persona}/${moment}: horizontal overflow is ${overflow}px`);
      }
    }

    await page.goto(`${pathToFileURL(prototype).href}#owner/decision`, { waitUntil: 'load' });
    check(await page.getByText('Plan 8', { exact: false }).count() === 0, `${viewport.name}: provider plan leaked into owner decision`);
    await page.getByRole('button', { name: 'Review recommendation' }).click();
    check(await page.locator('#action-dialog').evaluate((dialog) => dialog.open), `${viewport.name}: owner decision did not open`);
    check(await page.locator('#choice-list input[type="radio"]').count() === 3, `${viewport.name}: owner decision choices are missing`);
    check(await page.locator('#confirm-action').isDisabled(), `${viewport.name}: owner can respond without a choice`);
    await page.locator('#choice-list input').first().check();
    await page.locator('#confirm-action').click();
    check(await page.locator('#completion-dialog').evaluate((dialog) => dialog.open), `${viewport.name}: prototype completion did not open`);
    check((await page.locator('#completion-dialog').textContent()).includes('No production data was changed'), `${viewport.name}: non-persistence boundary is missing`);
    await page.getByRole('button', { name: 'Return to service' }).click();

    await page.goto(`${pathToFileURL(prototype).href}#manager/release`, { waitUntil: 'load' });
    await page.getByRole('button', { name: 'Review service release' }).click();
    check(await page.locator('#choice-list input[type="checkbox"]').count() === 3, `${viewport.name}: release checks are missing`);
    check(await page.locator('#confirm-action').isDisabled(), `${viewport.name}: manager can release without checks`);
    await page.locator('#choice-list input').first().check();
    check(await page.locator('#confirm-action').isDisabled(), `${viewport.name}: manager can release after partial checks`);
    await page.getByRole('button', { name: 'Back' }).click();
    check(await page.getByRole('button', { name: 'Review service release' }).evaluate((button) => button === document.activeElement), `${viewport.name}: action focus did not return`);

    await page.goto(`${pathToFileURL(prototype).href}#lead/field`, { waitUntil: 'load' });
    check(await page.getByText('$145', { exact: false }).count() === 0, `${viewport.name}: customer pricing leaked into field view`);
    check((await page.locator('#boundary-copy').textContent()).includes('plan publication'), `${viewport.name}: Crew Lead plan authority boundary is missing`);
    await page.getByRole('button', { name: 'Send field request' }).click();
    check(await page.locator('#choice-list input[type="radio"]').count() === 3, `${viewport.name}: field recovery choices are missing`);
    await page.getByRole('button', { name: 'Back' }).click();
    await page.getByRole('button', { name: 'Follow handoff' }).click();
    check(documentHash(await page.url()) === 'manager/field', `${viewport.name}: field request did not retain the manager handoff`);
    check((await page.locator('#focus-title').textContent()) === 'The Crew Lead reported an access change', `${viewport.name}: manager did not receive exact field context`);
    check((await page.locator('#focus-copy').textContent()).includes('Plan 8'), `${viewport.name}: manager field recovery lost the exact plan`);

    if (viewport.name === 'desktop') {
      check(await page.locator('.desktop-rail').isVisible(), 'desktop: rail hidden');
      check(!(await page.locator('.mobile-nav').isVisible()), 'desktop: mobile nav visible');
    } else {
      check(!(await page.locator('.desktop-rail').isVisible()), `${viewport.name}: rail visible`);
      check(await page.locator('.mobile-nav').isVisible(), `${viewport.name}: mobile nav hidden`);
      const targets = await page.locator('.mobile-nav .nav-button').evaluateAll((buttons) => buttons.map((button) => {
        const { width, height } = button.getBoundingClientRect();
        return { width, height };
      }));
      check(targets.every(({ width, height }) => width >= 44 && height >= 44), `${viewport.name}: mobile nav target below 44px`);
      await page.goto(`${pathToFileURL(prototype).href}#lead/proof`, { waitUntil: 'load' });
      await page.getByRole('button', { name: 'Review completion submission' }).click();
      await page.locator('#action-dialog').evaluate((dialog) => { dialog.scrollTop = dialog.scrollHeight; });
      const actionBottom = await page.locator('#cancel-action').evaluate((button) => button.getBoundingClientRect().bottom);
      check(actionBottom <= viewport.height + 1, `${viewport.name}: dialog actions are outside the viewport (${actionBottom}px)`);
      await page.getByRole('button', { name: 'Back' }).click();
      await page.evaluate(() => {
        document.documentElement.style.scrollBehavior = 'auto';
        window.scrollTo(0, document.documentElement.scrollHeight);
      });
      const clearance = await page.evaluate(() => document.querySelector('.mobile-nav').getBoundingClientRect().top - document.querySelector('.boundary-card').getBoundingClientRect().bottom);
      check(clearance >= 0, `${viewport.name}: final content is obscured by mobile navigation (${clearance}px)`);
    }

    check(errors.length === 0, `${viewport.name}: browser errors: ${errors.join('; ')}`);

    if (capture && viewport.name === 'desktop') {
      await page.goto(`${pathToFileURL(prototype).href}#manager/field`, { waitUntil: 'load' });
      await page.getByRole('button', { name: 'Review field request' }).click();
      await page.screenshot({ path: resolve(captureRoot, 'simplified-service-thread-desktop-v1.png'), fullPage: true });
    }
    if (capture && viewport.name === 'mobile') {
      await page.goto(`${pathToFileURL(prototype).href}#owner/proof`, { waitUntil: 'load' });
      await page.screenshot({ path: resolve(captureRoot, 'simplified-service-thread-owner-mobile-v1.png'), fullPage: true });
      await page.goto(`${pathToFileURL(prototype).href}#lead/field`, { waitUntil: 'load' });
      await page.getByRole('button', { name: 'Send field request' }).click();
      await page.screenshot({ path: resolve(captureRoot, 'simplified-service-thread-field-mobile-v1.png'), fullPage: true });
    }
    await page.close();
  }
  console.log('Simplified service-thread validation passed for 3 perspectives, 4 service moments, and 3 viewports.');
} finally {
  await browser.close();
}

function documentHash(url) {
  return new URL(url).hash.slice(1);
}
