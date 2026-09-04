import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from '../../frontend/node_modules/playwright/index.mjs';

const designRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const prototypePath = resolve(designRoot, 'prototypes/yard-owner-minimal-rollout/index.html');
const captureRoot = resolve(designRoot, 'high-fidelity/current');
const capture = process.argv.includes('--capture');
const expected = {
  u1: { nav: 1, title: 'Care visibility', visible: ['.u1-only'], hidden: ['.u2-only', '.u3-only', '.u4-only'] },
  u2: { nav: 2, title: 'Visit tracking', visible: ['.u2-only'], hidden: ['.u1-only', '.u3-only', '.u4-only'] },
  u3: { nav: 3, title: 'Delivered proof', visible: ['.u2-only', '.u3-only'], hidden: ['.u1-only', '.u4-only'] },
  u4: { nav: 3, title: 'Questions and decisions', visible: ['.u2-only', '.u3-only', '.u4-only'], hidden: ['.u1-only'] },
};
function check(condition, message) { if (!condition) throw new Error(message); }

const browser = await chromium.launch({ headless: true });
try {
  if (capture) await mkdir(captureRoot, { recursive: true });
  for (const viewport of [{ name: 'desktop', width: 1440, height: 1000 }, { name: 'mobile', width: 390, height: 844 }, { name: 'narrow', width: 320, height: 720 }]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`${pathToFileURL(prototypePath).href}#u1`, { waitUntil: 'load' });
    for (const [unit, contract] of Object.entries(expected)) {
      await page.selectOption('#unit-picker', unit);
      check(await page.locator('body').getAttribute('data-unit') === unit, `${viewport.name}/${unit}: body state did not update`);
      check(new URL(page.url()).hash === `#${unit}`, `${viewport.name}/${unit}: hash did not update`);
      check(await page.locator('#unit-title').textContent() === contract.title, `${viewport.name}/${unit}: wrong title`);
      check(await page.locator('#portal-tabs button').count() === contract.nav, `${viewport.name}/${unit}: wrong destination count`);
      check(await page.locator('h1:visible').count() === 1, `${viewport.name}/${unit}: expected one visible h1`);
      for (const selector of contract.visible) check(await page.locator(selector).isVisible(), `${viewport.name}/${unit}: ${selector} should be visible`);
      for (const selector of contract.hidden) check(!(await page.locator(selector).isVisible()), `${viewport.name}/${unit}: ${selector} should be absent`);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      check(overflow <= 1, `${viewport.name}/${unit}: horizontal overflow is ${overflow}px`);
    }
    await page.selectOption('#unit-picker', 'u1');
    check(await page.getByText('Ask a question').count() === 0 || !(await page.getByText('Ask a question').isVisible()), `${viewport.name}: U4 write leaked into minimum launch`);
    if (viewport.name === 'desktop') {
      check(await page.locator('.desktop-rail').isVisible(), 'desktop: rail hidden');
      check(!(await page.locator('.mobile-nav').isVisible()), 'desktop: mobile nav visible');
    } else {
      check(!(await page.locator('.desktop-rail').isVisible()), `${viewport.name}: desktop rail visible`);
      check(await page.locator('.mobile-nav').isVisible(), `${viewport.name}: mobile nav hidden`);
      const targets = await page.locator('.mobile-nav button').evaluateAll((buttons) => buttons.map((button) => button.getBoundingClientRect()).map(({ width, height }) => ({ width, height })));
      check(targets.every(({ width, height }) => width >= 44 && height >= 44), `${viewport.name}: mobile target below 44px`);
      const lastCard = page.locator('.enabled-summary');
      await lastCard.scrollIntoViewIfNeeded();
      const clearance = await page.evaluate(() => document.querySelector('.mobile-nav').getBoundingClientRect().top - document.querySelector('.enabled-summary').getBoundingClientRect().bottom);
      check(clearance >= 0, `${viewport.name}: final content is obscured by mobile navigation`);
    }
    check(errors.length === 0, `${viewport.name}: browser errors: ${errors.join('; ')}`);
    if (capture && viewport.name === 'desktop') {
      await page.selectOption('#unit-picker', 'u1');
      await page.screenshot({ path: resolve(captureRoot, 'yard-owner-minimal-rollout-desktop-v1.png'), fullPage: true });
    }
    if (capture && viewport.name === 'mobile') {
      await page.selectOption('#unit-picker', 'u4');
      await page.screenshot({ path: resolve(captureRoot, 'yard-owner-minimal-rollout-mobile-v1.png'), fullPage: true });
    }
    await page.close();
  }
  console.log(`Yard Owner minimal rollout validation passed${capture ? ' and captures refreshed' : ''}.`);
} finally { await browser.close(); }
