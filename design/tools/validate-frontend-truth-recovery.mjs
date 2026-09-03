import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from '../../frontend/node_modules/playwright/index.mjs';

const designRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const prototypePath = resolve(designRoot, 'prototypes/frontend-truth-recovery/index.html');
const captureRoot = resolve(designRoot, 'high-fidelity/current');
const capture = process.argv.includes('--capture');

function check(condition, message) { if (!condition) throw new Error(message); }

const browser = await chromium.launch({ headless: true });
try {
  if (capture) await mkdir(captureRoot, { recursive: true });
  for (const viewport of [{ name: 'desktop', width: 1440, height: 1000 }, { name: 'mobile', width: 390, height: 844 }, { name: 'narrow', width: 320, height: 720 }]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`${pathToFileURL(prototypePath).href}#owner/unavailable`, { waitUntil: 'load' });

    for (const [state, title] of Object.entries({
      loading: 'Loading your yard details…',
      empty: 'Your yard is connected.',
      'access-ended': 'This yard is no longer available to this account.',
      inconsistent: 'We found a problem with this yard’s connection.',
      unavailable: 'Your visit details are temporarily unavailable.',
    })) {
      await page.selectOption('#state', state);
      check(await page.locator('.recovery-state h2').textContent() === title, `${viewport.name}/owner/${state}: wrong state message`);
      check(new URL(page.url()).hash === `#owner/${state}`, `${viewport.name}/owner/${state}: hash did not update`);
      check(await page.locator('h1:visible').count() === 1, `${viewport.name}/owner/${state}: expected one visible h1`);
    }

    await page.selectOption('#audience', 'crew');
    for (const [state, label] of Object.entries({ synced: 'Synced', syncing: 'Syncing', offline: 'Saved on device', attention: 'Needs attention', past: 'Read only' })) {
      await page.selectOption('#state', state);
      check(await page.locator('#route-state-pill').textContent() === label, `${viewport.name}/crew/${state}: wrong route state`);
      check(new URL(page.url()).hash === `#crew/${state}`, `${viewport.name}/crew/${state}: hash did not update`);
      check(await page.locator('h1:visible').count() === 1, `${viewport.name}/crew/${state}: expected one visible h1`);
    }
    await page.selectOption('#state', 'past');
    check(await page.locator('#route-context').textContent() === 'Past route', `${viewport.name}: historical route lacks past context`);
    check(await page.locator('#route-action').isDisabled(), `${viewport.name}: historical route action remains enabled`);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(overflow <= 1, `${viewport.name}: horizontal overflow is ${overflow}px`);
    if (viewport.name === 'desktop') {
      check(await page.locator('.app-rail').isVisible(), 'desktop: application rail is hidden');
      check(!(await page.locator('.mobile-nav').isVisible()), 'desktop: mobile navigation is visible');
    } else {
      check(!(await page.locator('.app-rail').isVisible()), `${viewport.name}: application rail is visible`);
      check(await page.locator('.mobile-nav').isVisible(), `${viewport.name}: mobile navigation is hidden`);
      await page.selectOption('#state', 'synced');
      const action = page.locator('#route-action');
      await action.scrollIntoViewIfNeeded();
      const clearance = await page.evaluate(() => {
        const actionBounds = document.querySelector('#route-action').getBoundingClientRect();
        const navBounds = document.querySelector('.mobile-nav').getBoundingClientRect();
        return navBounds.top - actionBounds.bottom;
      });
      check(clearance >= 0, `${viewport.name}: final route action is obscured by bottom navigation`);
      const targets = await page.locator('.mobile-nav button').evaluateAll((buttons) => buttons.map((button) => button.getBoundingClientRect()).map(({ width, height }) => ({ width, height })));
      check(targets.every(({ width, height }) => width >= 44 && height >= 44), `${viewport.name}: mobile navigation target below 44px`);
    }
    check(errors.length === 0, `${viewport.name}: browser errors: ${errors.join('; ')}`);

    if (capture && viewport.name === 'desktop') {
      await page.selectOption('#audience', 'owner'); await page.selectOption('#state', 'unavailable');
      await page.screenshot({ path: resolve(captureRoot, 'frontend-truth-recovery-desktop-v1.png'), fullPage: true });
    }
    if (capture && viewport.name === 'mobile') {
      await page.selectOption('#audience', 'crew'); await page.selectOption('#state', 'offline');
      await page.screenshot({ path: resolve(captureRoot, 'frontend-truth-recovery-mobile-v1.png'), fullPage: true });
    }
    await page.close();
  }
  console.log(`Frontend truth and recovery validation passed${capture ? ' and captures refreshed' : ''}.`);
} finally { await browser.close(); }
