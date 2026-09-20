import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from '../../frontend/node_modules/playwright/index.mjs';

const designRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const prototypePath = resolve(designRoot, 'prototypes/yard-owner-minimal-rollout/index.html');
const captureRoot = resolve(designRoot, 'high-fidelity/current');
const capture = process.argv.includes('--capture');
const contracts = {
  owner: {
    panel: '#owner-experience', nav: '#portal-tabs', units: {
      u1: { nav: 1, title: 'Care visibility', visible: ['.u1-only'], hidden: ['.u2-only', '.u3-only', '.u4-only'] },
      u2: { nav: 2, title: 'Visit tracking', visible: ['.u2-only'], hidden: ['.u1-only', '.u3-only', '.u4-only'] },
      u3: { nav: 3, title: 'Delivered proof', visible: ['.u2-only', '.u3-only'], hidden: ['.u1-only', '.u4-only'] },
      u4: { nav: 3, title: 'Questions and decisions', visible: ['.u2-only', '.u3-only', '.u4-only'], hidden: ['.u1-only'] },
    },
  },
  crew: {
    panel: '#crew-experience', nav: '#crew-tabs', units: {
      c1: { nav: 2, title: 'Day plan visibility', visible: ['.c1-only'], hidden: ['.c2-only', '.c3-only', '.c4-only'] },
      c2: { nav: 4, title: 'Stop execution', visible: ['.c2-only'], hidden: ['.c1-only', '.c3-only', '.c4-only'] },
      c3: { nav: 4, title: 'Field proof', visible: ['.c2-only', '.c3-only'], hidden: ['.c1-only', '.c4-only'] },
      c4: { nav: 4, title: 'Changes and recovery', visible: ['.c2-only', '.c3-only', '.c4-only'], hidden: ['.c1-only'] },
    },
  },
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
    await page.goto(`${pathToFileURL(prototypePath).href}#owner/u1`, { waitUntil: 'load' });

    for (const [persona, contract] of Object.entries(contracts)) {
      await page.selectOption('#persona-picker', persona);
      check(await page.locator(contract.panel).isVisible(), `${viewport.name}/${persona}: selected experience is hidden`);
      const otherPanel = persona === 'owner' ? '#crew-experience' : '#owner-experience';
      check(!(await page.locator(otherPanel).isVisible()), `${viewport.name}/${persona}: other persona experience leaked`);
      const personaName = persona === 'owner' ? 'Yard Owner' : 'Crew Lead';
      const homeHash = persona === 'owner' ? '#owner/u1' : '#crew/c1';
      check(await page.locator('#mobile-nav').getAttribute('aria-label') === `${personaName} mobile navigation`, `${viewport.name}/${persona}: mobile navigation label leaked`);
      check(await page.locator('#brand-home').getAttribute('href') === homeHash, `${viewport.name}/${persona}: brand home link leaked`);
      for (const [unit, unitContract] of Object.entries(contract.units)) {
        await page.selectOption('#unit-picker', unit);
        check(await page.locator('body').getAttribute('data-persona') === persona, `${viewport.name}/${persona}/${unit}: wrong persona state`);
        check(await page.locator('body').getAttribute('data-unit') === unit, `${viewport.name}/${persona}/${unit}: wrong unit state`);
        check(new URL(page.url()).hash === `#${persona}/${unit}`, `${viewport.name}/${persona}/${unit}: hash did not update`);
        check(await page.locator(`${contract.panel} [data-unit-title]`).textContent() === unitContract.title, `${viewport.name}/${persona}/${unit}: wrong title`);
        check(await page.locator(`${contract.nav} button`).count() === unitContract.nav, `${viewport.name}/${persona}/${unit}: wrong destination count`);
        check(await page.locator('h1:visible').count() === 1, `${viewport.name}/${persona}/${unit}: expected one visible h1`);
        for (const selector of unitContract.visible) check(await page.locator(`${contract.panel} ${selector}:visible`).count() > 0, `${viewport.name}/${persona}/${unit}: ${selector} should be visible`);
        for (const selector of unitContract.hidden) check(await page.locator(`${contract.panel} ${selector}:visible`).count() === 0, `${viewport.name}/${persona}/${unit}: ${selector} should be absent`);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        check(overflow <= 1, `${viewport.name}/${persona}/${unit}: horizontal overflow is ${overflow}px`);
      }
    }

    await page.selectOption('#persona-picker', 'owner');
    await page.selectOption('#unit-picker', 'u1');
    check(!(await page.getByText('Ask a question').isVisible()), `${viewport.name}: owner write leaked into U1`);
    await page.selectOption('#persona-picker', 'crew');
    await page.selectOption('#unit-picker', 'c1');
    check(!(await page.getByText('Start stop').isVisible()), `${viewport.name}: crew execution leaked into C1`);
    check(await page.locator('#rollout-plan-link').getAttribute('href') === '../../review/crew-lead-minimal-rollout-plan.md', `${viewport.name}: crew plan link did not follow persona`);

    if (viewport.name === 'desktop') {
      check(await page.locator('.desktop-rail').isVisible(), 'desktop: rail hidden');
      check(!(await page.locator('.mobile-nav').isVisible()), 'desktop: mobile nav visible');
    } else {
      check(!(await page.locator('.desktop-rail').isVisible()), `${viewport.name}: desktop rail visible`);
      check(await page.locator('.mobile-nav').isVisible(), `${viewport.name}: mobile nav hidden`);
      const targets = await page.locator('.mobile-nav button').evaluateAll((buttons) => buttons.map((button) => button.getBoundingClientRect()).map(({ width, height }) => ({ width, height })));
      check(targets.every(({ width, height }) => width >= 44 && height >= 44), `${viewport.name}: mobile target below 44px`);
      const lastCard = page.locator('#crew-experience .enabled-summary');
      await lastCard.scrollIntoViewIfNeeded();
      const clearance = await page.evaluate(() => document.querySelector('.mobile-nav').getBoundingClientRect().top - document.querySelector('#crew-experience .enabled-summary').getBoundingClientRect().bottom);
      check(clearance >= 0, `${viewport.name}: final crew content is obscured by mobile navigation`);
    }
    check(errors.length === 0, `${viewport.name}: browser errors: ${errors.join('; ')}`);

    if (capture && viewport.name === 'desktop') {
      await page.selectOption('#persona-picker', 'owner'); await page.selectOption('#unit-picker', 'u1');
      await page.screenshot({ path: resolve(captureRoot, 'yard-owner-minimal-rollout-desktop-v1.png'), fullPage: true });
      await page.selectOption('#persona-picker', 'crew'); await page.selectOption('#unit-picker', 'c1');
      await page.screenshot({ path: resolve(captureRoot, 'crew-lead-minimal-rollout-desktop-v1.png'), fullPage: true });
    }
    if (capture && viewport.name === 'mobile') {
      await page.selectOption('#persona-picker', 'owner'); await page.selectOption('#unit-picker', 'u4');
      await page.screenshot({ path: resolve(captureRoot, 'yard-owner-minimal-rollout-mobile-v1.png'), fullPage: true });
      await page.selectOption('#persona-picker', 'crew'); await page.selectOption('#unit-picker', 'c4');
      await page.screenshot({ path: resolve(captureRoot, 'crew-lead-minimal-rollout-mobile-v1.png'), fullPage: true });
    }
    await page.close();
  }
  console.log(`Owner and Crew Lead minimal rollout validation passed${capture ? ' and captures refreshed' : ''}.`);
} finally { await browser.close(); }
