import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from '../../frontend/node_modules/playwright/index.mjs';

const designRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pageUrl = pathToFileURL(resolve(designRoot, 'prototypes/yard-crew-acquisition/index.html')).href;
const imageDirectory = resolve(designRoot, 'high-fidelity/field');
const capture = process.argv.includes('--capture');

function check(condition, message) {
  if (!condition) throw new Error(message);
}

async function openPage(browser, viewport, stage = '') {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  const browserErrors = [];
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()); });
  page.on('pageerror', (error) => browserErrors.push(error.message));
  await page.goto(`${pageUrl}${stage ? `#${stage}` : ''}`, { waitUntil: 'load' });
  await page.waitForTimeout(120);
  return { page, browserErrors };
}

async function checkLayout(page, expectedWidth, label) {
  const layout = await page.evaluate(() => {
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0 && !element.closest('[hidden]');
    };
    return {
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      visibleH1: [...document.querySelectorAll('h1')].filter(visible).length,
      openDialogs: document.querySelectorAll('dialog[open]').length,
    };
  });
  check(layout.clientWidth === expectedWidth, `${label}: unexpected viewport width`);
  check(layout.scrollWidth === layout.clientWidth, `${label}: horizontal overflow detected (${layout.scrollWidth}/${layout.clientWidth})`);
  check(layout.visibleH1 === 1, `${label}: expected exactly one visible H1`);
  check(layout.openDialogs === 0, `${label}: dialog opened unexpectedly`);
}

async function checkAccessibleControls(page, label) {
  const issues = await page.locator('input, select, textarea, button, a[href]').evaluateAll((elements) => elements
    .filter((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none' && !element.closest('[hidden]') && !element.closest('dialog:not([open])');
    })
    .filter((element) => {
      if (element.matches('input, select, textarea')) return !element.labels?.length && !element.getAttribute('aria-label') && !element.getAttribute('aria-labelledby');
      return !element.textContent?.trim() && !element.getAttribute('aria-label') && !element.getAttribute('aria-labelledby');
    })
    .map((element) => element.outerHTML.slice(0, 180)));
  check(issues.length === 0, `${label}: controls without accessible names ${JSON.stringify(issues)}`);
}

async function checkMobileTargets(page, label) {
  const undersized = await page.locator('a[href], button, select, input:not([type="checkbox"]):not([type="radio"]), textarea').evaluateAll((elements) => elements
    .filter((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none' && !element.closest('[hidden]') && !element.closest('dialog:not([open])');
    })
    .map((element) => {
      const rect = element.getBoundingClientRect();
      return { label: element.getAttribute('aria-label') || element.textContent?.trim() || element.tagName, width: Math.round(rect.width), height: Math.round(rect.height) };
    })
    .filter(({ width, height }) => width < 44 || height < 44));
  check(undersized.length === 0, `${label}: undersized targets ${JSON.stringify(undersized)}`);
}

async function reviewOpportunityState(page, state) {
  await page.locator('[data-open-review]').click();
  await page.locator(`[data-review-dialog] [data-review-opportunities="${state}"]`).click();
  await page.waitForFunction((value) => document.body.dataset.opportunityState === value, state);
}

const browser = await chromium.launch({ headless: true });

try {
  const desktop = await openPage(browser, { width: 1440, height: 1000 });
  const page = desktop.page;
  await checkLayout(page, 1440, 'Desktop marketing');
  await checkAccessibleControls(page, 'Desktop marketing');
  check((await page.locator('.hero h1').innerText()).includes('Find work that fits'), 'Marketing: operational promise is missing');
  check((await page.locator('.hero-note').innerText()).includes('does not promise leads'), 'Marketing: no-lead-promise boundary is missing');
  check((await page.locator('#fit').innerText()).includes('joining a company'), 'Marketing: invited-worker route is missing');
  check((await page.locator('#how').innerText()).includes('Interest is only the beginning'), 'Marketing: staged opportunity lifecycle is missing');
  check(await page.locator('[id]').evaluateAll((elements) => new Set(elements.map((element) => element.id)).size === elements.length), 'Document: duplicate IDs detected');
  if (capture) {
    await mkdir(imageDirectory, { recursive: true });
    await page.screenshot({ path: resolve(imageDirectory, 'yard-crew-acquisition-desktop-v1.png'), fullPage: false });
  }

  await page.getByRole('button', { name: 'Set up my provider profile' }).first().click();
  check(await page.locator('body').getAttribute('data-stage') === 'path', 'Path: marketing CTA did not open setup');
  check(await page.locator('input[name="providerPath"][value="solo"]').isChecked(), 'Path: owner-operator should be reviewable by default');
  await page.locator('[data-continue-path]').click();
  check(await page.locator('body').getAttribute('data-stage') === 'profile', 'Path: owner-operator did not continue');

  const profile = page.locator('#provider-profile-form');
  await profile.locator('input[name="providerName"]').fill('');
  await profile.locator('input[name="authority"]').uncheck();
  await profile.locator('button[type="submit"]').click();
  check(await page.locator('[role="alert"]').isVisible(), 'Profile: validation alert is missing');
  await profile.locator('input[name="providerName"]').fill('Desert & Pine Yard Care');
  await profile.locator('input[name="authority"]').check();
  await profile.locator('button[type="submit"]').click();
  check(await page.locator('body').getAttribute('data-stage') === 'readiness', 'Profile: valid provider did not continue');
  check((await page.locator('.readiness-list').innerText()).includes('Document supplied; independent check not simulated'), 'Readiness: precise trust wording is missing');
  await page.locator('[data-complete-readiness]').click();
  check(await page.locator('body').getAttribute('data-stage') === 'opportunities', 'Readiness: did not open opportunities');
  check((await page.locator('.opportunity-list').innerText()).includes('Recurring desert-yard upkeep'), 'Opportunities: suitable request is missing');
  check((await page.locator('.stage-note.private').innerText()).includes('Exact address'), 'Opportunities: preview privacy boundary is missing');

  await reviewOpportunityState(page, 'empty');
  check((await page.locator('.empty-state').innerText()).includes('will not broaden your service area'), 'Opportunities: honest no-result guidance is missing');
  await page.getByRole('button', { name: 'Clear tree-work filter' }).click();
  await page.locator('.opportunity-card [data-go-stage="request"]').first().click();
  check(await page.locator('body').getAttribute('data-disclosure-state') === 'limited', 'Request: disclosure should begin limited');
  check((await page.locator('.stage-note.private').innerText()).includes('Still private'), 'Request: hidden-data summary is missing');

  await page.locator('[data-open-review]').click();
  await page.locator('[data-fail-interest]').check();
  await page.locator('[data-close-review]').last().click();
  await page.locator('[data-interest]').click();
  check(await page.locator('[role="alert"]').isVisible(), 'Interest: recoverable failure is missing');
  await page.locator('[data-interest]').click();
  check(await page.locator('body').getAttribute('data-interest-state') === 'pending', 'Interest: retry did not reach owner-pending state');
  await page.locator('[data-owner-approve]').click();
  check(await page.locator('body').getAttribute('data-disclosure-state') === 'approved', 'Disclosure: owner approval did not load');
  check((await page.locator('.disclosure-table').innerText()).includes('Gate and pet details'), 'Disclosure: independent access facts are missing');
  await page.getByRole('button', { name: 'Start yard review' }).click();

  await page.locator('input[name="assessment"][value="onsite"]').check();
  await page.locator('[data-schedule-assessment]').click();
  check((await page.locator('.stage-note.private').innerText()).includes('assessment, not a service visit'), 'Assessment: no-service boundary is missing');
  await page.locator('[data-schedule-assessment]').click();
  check(await page.locator('body').getAttribute('data-stage') === 'proposal', 'Assessment: confirmed review did not open proposal');
  check((await page.locator('.scope-table').innerText()).toLowerCase().includes('not included'), 'Proposal: exclusions are missing');
  await page.locator('[data-send-proposal]').click();
  check((await page.locator('.stage-card').last().innerText()).includes('asked whether'), 'Proposal: owner question state is missing');
  await page.locator('[data-simulate-acceptance]').click();
  check(await page.locator('[data-confirm-dialog]').getAttribute('open') !== null, 'Proposal: acceptance confirmation did not open');
  await page.locator('[data-confirm-action="accept"]').click();
  check(await page.locator('body').getAttribute('data-proposal-state') === 'accepted', 'Proposal: accepted state did not load');
  check((await page.locator('.stage-note.private').innerText()).includes('immutable'), 'Proposal: accepted snapshot boundary is missing');
  await page.getByRole('button', { name: 'Begin provider setup' }).click();
  check((await page.locator('[data-stage-view]').innerText()).includes('Accepted does not mean assigned'), 'Setup: acceptance silently implied assignment');
  await page.locator('[data-confirm-first-visit]').click();
  check((await page.locator('[data-stage-view]').innerText()).includes('first visit is confirmed'), 'Setup: confirmed handoff is missing');
  check(desktop.browserErrors.length === 0, `Desktop workflow errors: ${desktop.browserErrors.join('; ')}`);
  await page.close();

  const tablet = await openPage(browser, { width: 768, height: 1024 }, 'readiness');
  await checkLayout(tablet.page, 768, 'Tablet readiness');
  await checkAccessibleControls(tablet.page, 'Tablet readiness');
  check(tablet.browserErrors.length === 0, `Tablet errors: ${tablet.browserErrors.join('; ')}`);
  await tablet.page.close();

  const mobile = await openPage(browser, { width: 390, height: 844 }, 'opportunities');
  await checkLayout(mobile.page, 390, 'Mobile opportunities');
  await checkMobileTargets(mobile.page, 'Mobile opportunities');
  await checkAccessibleControls(mobile.page, 'Mobile opportunities');
  if (capture) await mobile.page.screenshot({ path: resolve(imageDirectory, 'yard-crew-acquisition-mobile-v1.png'), fullPage: false });
  for (const stage of ['path', 'profile', 'readiness', 'request', 'assessment', 'proposal', 'setup', 'support', 'invited']) {
    await mobile.page.goto(`${pageUrl}#${stage}`, { waitUntil: 'load' });
    await mobile.page.waitForTimeout(80);
    await checkLayout(mobile.page, 390, `Mobile ${stage}`);
    await checkMobileTargets(mobile.page, `Mobile ${stage}`);
    await checkAccessibleControls(mobile.page, `Mobile ${stage}`);
  }
  await mobile.page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  for (const stage of ['opportunities', 'request', 'support']) {
    await mobile.page.goto(`${pageUrl}#${stage}`, { waitUntil: 'load' });
    await mobile.page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    await mobile.page.waitForTimeout(80);
    await checkLayout(mobile.page, 390, `Mobile ${stage} at 200% text`);
  }
  check(mobile.browserErrors.length === 0, `Mobile errors: ${mobile.browserErrors.join('; ')}`);
  await mobile.page.close();

  const compact = await openPage(browser, { width: 320, height: 720 }, 'invited');
  await checkLayout(compact.page, 320, 'Compact invitation');
  await checkMobileTargets(compact.page, 'Compact invitation');
  check(compact.browserErrors.length === 0, `Compact errors: ${compact.browserErrors.join('; ')}`);
  await compact.page.close();

  console.log(`Yard Crew acquisition validation passed${capture ? ' and review images were captured' : ''}.`);
} finally {
  await browser.close();
}
