import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from '../../frontend/node_modules/playwright/index.mjs';

const designRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pageUrl = pathToFileURL(resolve(designRoot, 'prototypes/yard-owner-portal/index.html')).href;
const imageDirectory = resolve(designRoot, 'high-fidelity/customer');
const capture = process.argv.includes('--capture');

function check(condition, message) {
  if (!condition) throw new Error(message);
}

async function openPage(browser, viewport) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  const browserErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });
  page.on('pageerror', (error) => browserErrors.push(error.message));
  await page.goto(pageUrl, { waitUntil: 'load' });
  await page.waitForTimeout(350);
  return { page, browserErrors };
}

async function checkLayout(page, expectedWidth, label) {
  const layout = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    h1Count: document.querySelectorAll('h1').length,
    openDialogCount: document.querySelectorAll('dialog[open]').length,
  }));
  check(layout.clientWidth === expectedWidth, `${label}: unexpected viewport width`);
  check(layout.scrollWidth === layout.clientWidth, `${label}: horizontal overflow detected`);
  check(layout.h1Count === 1, `${label}: expected exactly one H1`);
  check(layout.openDialogCount === 0, `${label}: a dialog opened unexpectedly`);
}

async function checkMobileTargets(page) {
  const undersized = await page.locator('a[href], button, select').evaluateAll((elements) => (
    elements
      .filter((element) => {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.visibility !== 'hidden'
          && style.display !== 'none'
          && rect.width > 0
          && rect.height > 0
          && !element.closest('[hidden]')
          && !element.closest('dialog:not([open])');
      })
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          label: element.getAttribute('aria-label') || element.textContent?.trim() || element.tagName,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      })
      .filter(({ width, height }) => width < 44 || height < 44)
  ));
  check(undersized.length === 0, `Mobile: undersized interactive targets ${JSON.stringify(undersized)}`);
}

async function applyReviewState(page, state) {
  await page.locator('[data-open-review]').click();
  await page.locator(`input[name="review-state"][value="${state}"]`).check();
  await page.locator('[data-apply-review]').click();
}

const browser = await chromium.launch({ headless: true });

try {
  const desktop = await openPage(browser, { width: 1440, height: 1000 });
  await checkLayout(desktop.page, 1440, 'Desktop');
  check(await desktop.page.locator('[data-view-panel="home"]').isVisible(), 'Desktop: Home is not the default view');
  check((await desktop.page.locator('[data-next-service]').first().innerText()) === 'Weekly yard care', 'Desktop: next service hierarchy is missing');
  check(await desktop.page.locator('.pending-action').isVisible(), 'Desktop: contextual decision is missing');
  check(await desktop.page.locator('.default-proof').first().isVisible(), 'Desktop: latest proof is missing');

  await desktop.page.locator('.primary-nav [data-nav="visits"]').click();
  check(await desktop.page.locator('body').getAttribute('data-active-view') === 'visits', 'Navigation: Visits did not open');
  check(await desktop.page.locator('.primary-nav [data-nav="visits"]').getAttribute('aria-current') === 'page', 'Navigation: active destination is not exposed');
  await desktop.page.locator('.primary-nav [data-nav="proof"]').focus();
  await desktop.page.keyboard.press('Enter');
  check(await desktop.page.locator('[data-view-panel="proof"]').isVisible(), 'Navigation: keyboard activation failed');

  await desktop.page.locator('[data-property-select]').selectOption('garden');
  check(await desktop.page.locator('body').getAttribute('data-property') === 'garden', 'Property: context did not update');
  check((await desktop.page.locator('[data-next-service]').first().innerText()) === 'Seasonal garden refresh', 'Property: next visit did not update');
  await desktop.page.locator('.primary-nav [data-nav="home"]').click();
  check(await desktop.page.locator('.no-action-card').isVisible(), 'Property: decision context did not update');
  check((await desktop.page.locator('[data-property-short]').first().innerText()) === 'Backyard Garden', 'Property: customer-facing property name did not update');

  await desktop.page.locator('[data-property-select]').selectOption('home');
  const serviceStates = {
    'en-route': ['En route', 'Arriving 8:35–8:55 AM'],
    arrived: ['Care in progress', 'Started 8:42 AM'],
    'weather-delay': ['Weather delay', 'Next update by 10:30 AM'],
    rescheduled: ['Rescheduled', 'Thursday, August 13'],
    'proof-pending': ['Visit complete', 'Completed 9:06 AM'],
  };
  for (const [state, [status, detail]] of Object.entries(serviceStates)) {
    await applyReviewState(desktop.page, state);
    check((await desktop.page.locator('[data-service-status]').first().innerText()) === status, `Service day: ${state} status is missing`);
    const serviceContent = await desktop.page.locator('.next-visit-card').innerText();
    check(serviceContent.includes(detail), `Service day: ${state} explanation is missing`);
  }
  await applyReviewState(desktop.page, 'default');
  const visitTrigger = desktop.page.locator('[data-open-visit]').first();
  await visitTrigger.click();
  check(await desktop.page.locator('[data-visit-dialog]').getAttribute('open') !== null, 'Visit: details did not open');
  await desktop.page.keyboard.press('Escape');
  check(await visitTrigger.evaluate((element) => element === document.activeElement), 'Visit: focus was not restored after Escape');

  await desktop.page.locator('[data-open-review]').click();
  await desktop.page.locator('[data-simulate-message-error]').check();
  await desktop.page.locator('[data-apply-review]').click();
  const questionTrigger = desktop.page.locator('[data-view-panel="home"] [data-open-question]');
  await questionTrigger.click();
  await desktop.page.locator('[data-conversation-submit]').click();
  check((await desktop.page.locator('[data-conversation-error]').innerText()).length > 0, 'Question: inline validation is missing');
  const questionMessage = 'Will the team need the driveway clear before arrival?';
  await desktop.page.locator('textarea[name="conversation-message"]').fill(questionMessage);
  await desktop.page.locator('[data-conversation-submit]').click();
  check(await desktop.page.locator('[data-conversation-submit-error]').isVisible(), 'Question: recoverable send error is missing');
  check((await desktop.page.locator('textarea[name="conversation-message"]').inputValue()) === questionMessage, 'Question: failed send did not preserve the message');
  await desktop.page.locator('[data-conversation-submit]').click();
  check(await desktop.page.locator('[data-conversation-success]').isVisible(), 'Question: retry did not reach success');
  await desktop.page.locator('[data-finish-conversation]').click();
  check(await questionTrigger.evaluate((element) => element === document.activeElement), 'Question: focus did not return to the originating visit action');

  const comparison = desktop.page.locator('[data-comparison-range]');
  await comparison.evaluate((element) => { element.value = '50'; });
  const comparisonStart = Number(await comparison.inputValue());
  await comparison.press('ArrowRight');
  await desktop.page.waitForTimeout(50);
  const comparisonEnd = Number(await comparison.inputValue());
  check(
    comparisonEnd !== comparisonStart,
    `Proof: keyboard comparison control did not update (${comparisonStart} to ${comparisonEnd})`,
  );
  await desktop.page.locator('.primary-nav [data-nav="proof"]').click();
  const concernReportTrigger = desktop.page.locator('.proof-hero [data-open-report]');
  await concernReportTrigger.click();
  await desktop.page.locator('[data-open-conversation="concern"]').click();
  await desktop.page.waitForFunction(() => document.querySelector('[data-conversation-dialog]')?.hasAttribute('open'));
  await desktop.page.locator('textarea[name="conversation-message"]').fill('The west lawn edge appears to have been missed after service.');
  await desktop.page.locator('[data-conversation-submit]').click();
  await desktop.page.locator('[data-finish-conversation]').click();
  check(await desktop.page.locator('[data-concern-card]').isVisible(), 'Concern: received recovery status is missing');
  await applyReviewState(desktop.page, 'concern-follow-up');
  check((await desktop.page.locator('[data-concern-status]').innerText()) === 'Follow-up planned', 'Concern: follow-up state is missing');
  await applyReviewState(desktop.page, 'concern-resolved');
  check((await desktop.page.locator('[data-concern-status]').innerText()) === 'Resolved', 'Concern: resolved state is missing');
  await applyReviewState(desktop.page, 'default');

  const reportTrigger = desktop.page.locator('[data-open-report]').first();
  await reportTrigger.click();
  check(await desktop.page.locator('[data-report-dialog]').getAttribute('open') !== null, 'Proof: report did not open');
  await desktop.page.locator('[data-report-to-bid]').click();
  check(await desktop.page.locator('[data-bid-dialog]').getAttribute('open') !== null, 'Proof: related recommendation did not open');
  await desktop.page.locator('[data-bid-dialog] [data-close-dialog]').click();
  check(await reportTrigger.evaluate((element) => element === document.activeElement), 'Proof-to-bid: focus did not return to the original report trigger');

  await desktop.page.locator('[data-open-review]').click();
  await desktop.page.locator('[data-simulate-bid-error]').check();
  await desktop.page.locator('[data-apply-review]').click();
  const bidTrigger = desktop.page.locator('[data-open-bid]').first();
  await bidTrigger.click();
  await desktop.page.locator('[data-bid-choice="approve"]').click();
  await desktop.page.locator('[data-confirm-bid]').click();
  check(await desktop.page.locator('[data-bid-error]').isVisible(), 'Bid: recoverable persistence error is missing');
  check(await desktop.page.locator('[data-bid-stage="confirm"]').isVisible(), 'Bid: context was not preserved after failure');
  await desktop.page.locator('[data-confirm-bid]').click();
  check(await desktop.page.locator('[data-bid-stage="success"]').isVisible(), 'Bid: retry did not reach success');
  await desktop.page.locator('[data-finish-bid]').click();
  check(await desktop.page.locator('.answered-action').isVisible(), 'Bid: completed decision did not update Home');

  await applyReviewState(desktop.page, 'default');
  await desktop.page.locator('[data-open-bid]').first().click();
  await desktop.page.locator('[data-open-conversation="scope-change"]').click();
  await desktop.page.waitForFunction(() => document.querySelector('[data-conversation-dialog]')?.hasAttribute('open'));
  await desktop.page.locator('textarea[name="conversation-message"]').fill('Please remove the haul and cleanup line item before I decide.');
  await desktop.page.locator('[data-conversation-submit]').click();
  await desktop.page.locator('[data-finish-conversation]').click();
  check(await desktop.page.locator('body').getAttribute('data-review-state') === 'bid-revision-requested', 'Bid: scope change silently lost its independent state');
  check((await desktop.page.locator('[data-home-bid-status]').innerText()) === 'Change requested', 'Bid: revision status is missing from Home');
  for (const state of ['bid-expired', 'bid-scheduled', 'bid-rejected']) {
    await applyReviewState(desktop.page, state);
    check(await desktop.page.locator('.answered-action').isVisible(), `Bid: ${state} Home history is missing`);
  }

  await applyReviewState(desktop.page, 'empty-schedule');
  check(await desktop.page.locator('.empty-next-visit').first().isVisible(), 'State: empty schedule is missing');
  await applyReviewState(desktop.page, 'no-proof');
  check(await desktop.page.locator('.no-proof-state').first().isVisible(), 'State: no-proof explanation is missing');
  await applyReviewState(desktop.page, 'loading');
  check(await desktop.page.locator('.global-loading').isVisible(), 'State: loading hierarchy is missing');
  await applyReviewState(desktop.page, 'unavailable');
  check(await desktop.page.locator('.global-unavailable').isVisible(), 'State: unavailable recovery is missing');
  await desktop.page.locator('[data-retry]').click();
  await desktop.page.waitForTimeout(750);
  check(await desktop.page.locator('[data-view-panel="home"]').isVisible(), 'State: retry did not restore portal');
  await applyReviewState(desktop.page, 'expired-report');
  await desktop.page.waitForFunction(() => document.querySelector('[data-report-dialog]')?.hasAttribute('open'));
  check(await desktop.page.locator('[data-report-dialog]').getAttribute('open') !== null, 'State: expired report did not open');
  check(await desktop.page.locator('.report-expired').isVisible(), 'State: expired report explanation is missing');
  const proofReturnTarget = desktop.page.locator('[data-view-panel="proof"] [data-open-report]').first();
  await desktop.page.getByRole('button', { name: 'Close service proof' }).click();
  await desktop.page.waitForFunction(() => document.activeElement?.matches('[data-view-panel="proof"] [data-open-report]'));
  check(await proofReturnTarget.evaluate((element) => element === document.activeElement), 'State: expired report focus did not return to Proof');

  await applyReviewState(desktop.page, 'default');
  await desktop.page.locator('.primary-nav [data-nav="account"]').click();
  const accessInstructions = desktop.page.locator('textarea[name="access-instructions"]');
  await accessInstructions.fill('Please close the west side gate securely after service.');
  check(await desktop.page.locator('[data-preferences-unsaved]').isVisible(), 'Preferences: unsaved state is missing');
  await desktop.page.locator('[data-open-review]').click();
  await desktop.page.locator('[data-simulate-preferences-error]').check();
  await desktop.page.locator('[data-apply-review]').click();
  await desktop.page.locator('.primary-nav [data-nav="account"]').click();
  await desktop.page.locator('[data-save-preferences]').click();
  check(await desktop.page.locator('[data-preferences-error]').isVisible(), 'Preferences: recoverable save error is missing');
  check((await accessInstructions.inputValue()).includes('west side gate'), 'Preferences: failed save did not preserve access instructions');
  await desktop.page.locator('[data-save-preferences]').click();
  check(await desktop.page.locator('[data-preferences-success]').isVisible(), 'Preferences: retry did not reach saved state');
  await applyReviewState(desktop.page, 'preferences-changed');
  check(await desktop.page.locator('[data-preferences-changed]').isVisible(), 'Preferences: external-change warning is missing');
  check(await desktop.page.locator('[data-save-preferences]').isDisabled(), 'Preferences: stale values can still be saved');
  await desktop.page.locator('[data-refresh-preferences]').click();
  check(await desktop.page.locator('[data-preferences-changed]').isHidden(), 'Preferences: external-change warning did not clear');
  check((await desktop.page.locator('input[name="preferred-channel"]:checked').getAttribute('value')) === 'email', 'Preferences: latest saved values did not load');
  check(await desktop.page.locator('[data-save-preferences]').isEnabled(), 'Preferences: save did not recover after refresh');

  check(desktop.browserErrors.length === 0, `Desktop browser errors: ${desktop.browserErrors.join('; ')}`);
  await applyReviewState(desktop.page, 'default');
  await desktop.page.waitForTimeout(350);
  if (capture) {
    await mkdir(imageDirectory, { recursive: true });
    await desktop.page.evaluate(() => window.scrollTo(0, 0));
    await desktop.page.screenshot({ path: resolve(imageDirectory, 'yard-owner-portal-desktop-v2.png'), fullPage: false });
  }
  await desktop.page.close();

  const tablet = await openPage(browser, { width: 768, height: 1024 });
  await checkLayout(tablet.page, 768, 'Tablet');
  check(tablet.browserErrors.length === 0, `Tablet browser errors: ${tablet.browserErrors.join('; ')}`);
  await tablet.page.close();

  const mobile = await openPage(browser, { width: 390, height: 844 });
  await checkLayout(mobile.page, 390, 'Mobile');
  await checkMobileTargets(mobile.page);
  const mobileProofNav = mobile.page.locator('.mobile-nav [data-nav="proof"]');
  await mobileProofNav.click();
  check(await mobileProofNav.getAttribute('aria-current') === 'page', 'Mobile: Proof destination did not become active');
  await mobile.page.locator('.proof-hero [data-open-report]').click();
  check(await mobile.page.locator('[data-report-dialog]').getAttribute('open') !== null, 'Mobile: full-height proof did not open');
  await mobile.page.keyboard.press('Escape');
  check(await mobile.page.locator('.proof-hero [data-open-report]').evaluate((element) => element === document.activeElement), 'Mobile: report focus was not restored');
  await mobile.page.locator('.mobile-nav [data-nav="account"]').click();
  await checkMobileTargets(mobile.page);
  await applyReviewState(mobile.page, 'preferences-changed');
  await checkLayout(mobile.page, 390, 'Mobile preference conflict');
  await checkMobileTargets(mobile.page);
  await mobile.page.locator('[data-refresh-preferences]').click();
  check(mobile.browserErrors.length === 0, `Mobile browser errors: ${mobile.browserErrors.join('; ')}`);

  await applyReviewState(mobile.page, 'default');
  await mobile.page.waitForTimeout(350);
  if (capture) {
    await mobile.page.evaluate(() => window.scrollTo(0, 0));
    await mobile.page.screenshot({ path: resolve(imageDirectory, 'yard-owner-portal-mobile-v2.png'), fullPage: false });
  }
  await mobile.page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  await mobile.page.waitForTimeout(100);
  for (const view of ['home', 'visits', 'proof', 'account']) {
    await mobile.page.locator(`.mobile-nav [data-nav="${view}"]`).click();
    await checkLayout(mobile.page, 390, `Mobile ${view} at 200% text`);
  }
  await mobile.page.close();

  const compact = await openPage(browser, { width: 320, height: 720 });
  await checkLayout(compact.page, 320, 'Compact mobile');
  check(compact.browserErrors.length === 0, `Compact mobile browser errors: ${compact.browserErrors.join('; ')}`);
  await compact.page.close();

  console.log(`Yard Owner portal validation passed${capture ? ' and review images were captured' : ''}.`);
} finally {
  await browser.close();
}
