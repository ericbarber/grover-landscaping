import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from '../../frontend/node_modules/playwright/index.mjs';

const designRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const prototypePath = resolve(designRoot, 'prototypes/yard-owner-minimal-rollout/index.html');
const captureRoot = resolve(designRoot, 'high-fidelity/current');
const capture = process.argv.includes('--capture');

const contracts = {
  owner: { panel: '#owner-experience', nav: '#portal-tabs', plan: '../../review/yard-owner-minimal-rollout-plan.md', units: { u1: [1, 'Care visibility'], u2: [2, 'Visit tracking'], u3: [3, 'Delivered proof'], u4: [3, 'Questions and decisions'] } },
  'property-manager': { panel: '#generic-experience', nav: '#generic-tabs', units: { p1: [2, 'Portfolio readiness'], p2: [2, 'Property coverage and proof'], p3: [2, 'Approvals and questions'], p4: [3, 'Portfolio administration'] } },
  crew: { panel: '#crew-experience', nav: '#crew-tabs', plan: '../../review/crew-lead-minimal-rollout-plan.md', units: { c1: [2, 'Day plan visibility'], c2: [4, 'Stop execution'], c3: [4, 'Field proof'], c4: [4, 'Changes and recovery'] } },
  'crew-member': { panel: '#generic-experience', nav: '#generic-tabs', units: { cm1: [2, 'Assigned work'], cm2: [4, 'Job execution'], cm3: [4, 'Field evidence'], cm4: [4, 'Personal recovery'] } },
  'company-owner': { panel: '#generic-experience', nav: '#generic-tabs', units: { o1: [2, 'Company readiness'], o2: [5, 'Daily operations'], o3: [5, 'Customers and team'], o4: [5, 'Reports and recovery'] } },
  'company-manager': { panel: '#generic-experience', nav: '#generic-tabs', units: { m1: [2, 'Operating readiness'], m2: [5, 'Schedule and field coordination'], m3: [5, 'Customers and team'], m4: [5, 'Reports and operational recovery'] } },
  dispatcher: { panel: '#generic-experience', nav: '#generic-tabs', units: { d1: [2, 'Schedule visibility'], d2: [2, 'Dispatch publishing'], d3: [5, 'Field follow-through'], d4: [5, 'Schedule change recovery'] } },
  'billing-admin': { panel: '#generic-experience', nav: '#generic-tabs', units: { b1: [2, 'Account records'], b2: [3, 'Completion readiness'], b3: [3, 'Account exception handoff'] } },
  support: { panel: '#generic-experience', nav: '#generic-tabs', units: { s1: [2, 'Support triage'], s2: [2, 'Access and delivery support'], s3: [2, 'Evidence and exception recovery'], s4: [2, 'Privacy and erasure recovery'] } },
  general: { panel: '#generic-experience', nav: '#generic-tabs', units: { g1: [1, 'Access resolution'] } },
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
    await page.goto(`${pathToFileURL(prototypePath).href}#overview/map`, { waitUntil: 'load' });

    check(await page.locator('#overview-experience').isVisible(), `${viewport.name}/overview: rollout map hidden`);
    check(await page.locator('#persona-map button').count() === 10, `${viewport.name}/overview: expected ten persona contracts`);
    check(await page.locator('h1:visible').count() === 1, `${viewport.name}/overview: expected one visible h1`);

    for (const [persona, contract] of Object.entries(contracts)) {
      await page.selectOption('#persona-picker', persona);
      check(await page.locator(contract.panel).isVisible(), `${viewport.name}/${persona}: selected experience is hidden`);
      check(await page.locator('#overview-experience:visible, #owner-experience:visible, #crew-experience:visible, #generic-experience:visible').count() === 1, `${viewport.name}/${persona}: another persona experience leaked`);
      const units = Object.entries(contract.units);
      for (const [index, [unit, [navCount, title]]] of units.entries()) {
        await page.selectOption('#unit-picker', unit);
        check(await page.locator('body').getAttribute('data-persona') === persona, `${viewport.name}/${persona}/${unit}: wrong persona state`);
        check(await page.locator('body').getAttribute('data-unit') === unit, `${viewport.name}/${persona}/${unit}: wrong unit state`);
        check(new URL(page.url()).hash === `#${persona}/${unit}`, `${viewport.name}/${persona}/${unit}: hash did not update`);
        check((await page.locator(`${contract.panel} [data-unit-title]`).first().textContent()) === title, `${viewport.name}/${persona}/${unit}: wrong unit title`);
        check(await page.locator(`${contract.nav} button`).count() === navCount, `${viewport.name}/${persona}/${unit}: wrong destination count`);
        check(await page.locator('h1:visible').count() === 1, `${viewport.name}/${persona}/${unit}: expected one visible h1`);
        check(await page.locator(`${contract.panel} [data-capabilities] span`).count() >= 4, `${viewport.name}/${persona}/${unit}: incomplete capability summary`);
        if (contract.panel === '#generic-experience') {
          check((await page.locator('#generic-boundary').isVisible()) === (index === 0), `${viewport.name}/${persona}/${unit}: minimum boundary visibility is wrong`);
          check(await page.locator('#generic-cumulative article').count() === index, `${viewport.name}/${persona}/${unit}: cumulative card count is wrong`);
        }
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        check(overflow <= 1, `${viewport.name}/${persona}/${unit}: horizontal overflow is ${overflow}px`);
      }
      if (contract.plan) check(await page.locator('#rollout-plan-link').getAttribute('href') === contract.plan, `${viewport.name}/${persona}: dedicated plan link is wrong`);
      else check((await page.locator('#rollout-plan-link').getAttribute('href')).startsWith('../../review/all-persona-minimal-rollout-plan.md#'), `${viewport.name}/${persona}: shared plan link is wrong`);
    }

    await page.selectOption('#persona-picker', 'owner');
    await page.selectOption('#unit-picker', 'u1');
    check(!(await page.getByText('Ask a question').isVisible()), `${viewport.name}: owner write leaked into U1`);
    await page.selectOption('#persona-picker', 'crew');
    await page.selectOption('#unit-picker', 'c1');
    check(!(await page.getByText('Start stop').isVisible()), `${viewport.name}: crew execution leaked into C1`);
    await page.selectOption('#persona-picker', 'general');
    check((await page.locator('#generic-primary').textContent()).includes('No workspace data loaded'), `${viewport.name}: no-role fallback exposes the wrong promise`);

    if (viewport.name === 'desktop') {
      check(await page.locator('.desktop-rail').isVisible(), 'desktop: rail hidden');
      check(!(await page.locator('.mobile-nav').isVisible()), 'desktop: mobile nav visible');
    } else {
      check(!(await page.locator('.desktop-rail').isVisible()), `${viewport.name}: desktop rail visible`);
      check(await page.locator('.mobile-nav').isVisible(), `${viewport.name}: mobile nav hidden`);
      const targets = await page.locator('.mobile-nav button').evaluateAll((buttons) => buttons.map((button) => button.getBoundingClientRect()).map(({ width, height }) => ({ width, height })));
      check(targets.every(({ width, height }) => width >= 44 && height >= 44), `${viewport.name}: mobile target below 44px`);
      const lastCard = page.locator('#generic-experience .enabled-summary');
      await lastCard.scrollIntoViewIfNeeded();
      const clearance = await page.evaluate(() => document.querySelector('.mobile-nav').getBoundingClientRect().top - document.querySelector('#generic-experience .enabled-summary').getBoundingClientRect().bottom);
      check(clearance >= 0, `${viewport.name}: final content is obscured by mobile navigation`);
    }
    check(errors.length === 0, `${viewport.name}: browser errors: ${errors.join('; ')}`);

    if (capture && viewport.name === 'desktop') {
      await page.selectOption('#persona-picker', 'overview');
      await page.screenshot({ path: resolve(captureRoot, 'all-persona-minimal-rollout-desktop-v1.png'), fullPage: true });
      await page.selectOption('#persona-picker', 'owner'); await page.selectOption('#unit-picker', 'u1');
      await page.screenshot({ path: resolve(captureRoot, 'yard-owner-minimal-rollout-desktop-v1.png'), fullPage: true });
      await page.selectOption('#persona-picker', 'crew'); await page.selectOption('#unit-picker', 'c1');
      await page.screenshot({ path: resolve(captureRoot, 'crew-lead-minimal-rollout-desktop-v1.png'), fullPage: true });
    }
    if (capture && viewport.name === 'mobile') {
      await page.selectOption('#persona-picker', 'support'); await page.selectOption('#unit-picker', 's4');
      await page.screenshot({ path: resolve(captureRoot, 'all-persona-minimal-rollout-mobile-v1.png'), fullPage: true });
      await page.selectOption('#persona-picker', 'owner'); await page.selectOption('#unit-picker', 'u4');
      await page.screenshot({ path: resolve(captureRoot, 'yard-owner-minimal-rollout-mobile-v1.png'), fullPage: true });
      await page.selectOption('#persona-picker', 'crew'); await page.selectOption('#unit-picker', 'c4');
      await page.screenshot({ path: resolve(captureRoot, 'crew-lead-minimal-rollout-mobile-v1.png'), fullPage: true });
    }
    await page.close();
  }
  console.log(`All-persona minimal rollout validation passed across 36 functional units${capture ? ' and captures refreshed' : ''}.`);
} finally { await browser.close(); }
