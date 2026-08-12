import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from '../../frontend/node_modules/playwright/index.mjs';

const designRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pageUrl = pathToFileURL(resolve(designRoot, 'prototypes/yard-owner-acquisition/index.html')).href;
const imageDirectory = resolve(designRoot, 'high-fidelity/customer');
const capture = process.argv.includes('--capture');

function check(condition, message) {
  if (!condition) throw new Error(message);
}

async function openPage(browser, viewport, step = 'welcome') {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  const browserErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });
  page.on('pageerror', (error) => browserErrors.push(error.message));
  await page.goto(`${pageUrl}#${step}`, { waitUntil: 'load' });
  await page.waitForTimeout(150);
  return { page, browserErrors };
}

async function checkLayout(page, expectedWidth, label) {
  const layout = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    h1Count: document.querySelectorAll('h1').length,
    visiblePanels: [...document.querySelectorAll('[data-step-panel]')].filter((panel) => !panel.hidden).length,
    openDialogs: document.querySelectorAll('dialog[open]').length,
  }));
  check(layout.clientWidth === expectedWidth, `${label}: unexpected viewport width`);
  check(layout.scrollWidth === layout.clientWidth, `${label}: horizontal overflow detected`);
  check(layout.h1Count === 1, `${label}: expected exactly one H1`);
  check(layout.visiblePanels === 1, `${label}: expected exactly one visible journey panel`);
  check(layout.openDialogs === 0, `${label}: a dialog opened unexpectedly`);
}

async function checkMobileTargets(page, label) {
  const undersized = await page.locator('a[href], button, select, input:not([type="checkbox"]):not([type="radio"]), textarea').evaluateAll((elements) => (
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
          label: element.getAttribute('aria-label') || element.textContent?.trim() || element.getAttribute('name') || element.tagName,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      })
      .filter(({ width, height }) => width < 44 || height < 44)
  ));
  check(undersized.length === 0, `${label}: undersized interactive targets ${JSON.stringify(undersized)}`);
}

async function openReview(page) {
  await page.locator('[data-open-review]').click();
  await page.waitForFunction(() => document.querySelector('[data-review-dialog]')?.hasAttribute('open'));
}

async function jumpTo(page, step) {
  await openReview(page);
  await page.locator(`input[name="review-step"][value="${step}"]`).check();
  await page.locator('[data-apply-review]').click();
  await page.waitForFunction((value) => document.body.dataset.step === value, step);
}

const browser = await chromium.launch({ headless: true });

try {
  const desktop = await openPage(browser, { width: 1440, height: 1000 });
  const page = desktop.page;
  await checkLayout(page, 1440, 'Desktop welcome');
  check(await page.locator('[data-step-panel="welcome"]').isVisible(), 'Welcome: default journey stage is missing');
  check((await page.locator('.welcome-copy h2').innerText()).includes('Choose who sees it'), 'Welcome: private-first promise is missing');
  check((await page.locator('.trust-list').innerText()).includes('Exact address stays private'), 'Welcome: exact-address boundary is missing');

  const howTrigger = page.locator('[data-open-how]');
  await howTrigger.click();
  check(await page.locator('[data-how-dialog]').getAttribute('open') !== null, 'Welcome: how-it-works dialog did not open');
  await page.keyboard.press('Escape');
  check(await howTrigger.evaluate((element) => element === document.activeElement), 'Welcome: how-it-works focus did not return');

  await page.locator('[data-go-step="account"]').first().click();
  const accountForm = page.locator('[data-account-form]');
  await accountForm.locator('input[name="owner-name"]').fill('');
  await accountForm.locator('input[name="owner-email"]').fill('not-an-email');
  await accountForm.locator('button[type="submit"]').click();
  check(await page.locator('[data-account-error]').isVisible(), 'Owner identity: validation summary is missing');
  check(await accountForm.locator('input[name="owner-email"]').getAttribute('aria-invalid') === 'true', 'Owner identity: invalid email is not exposed');
  await accountForm.locator('input[name="owner-name"]').fill('Morgan Reyes');
  await accountForm.locator('input[name="owner-email"]').fill('morgan@example.com');
  await accountForm.locator('button[type="submit"]').click();
  check(await page.locator('body').getAttribute('data-step') === 'property', 'Owner identity: valid submission did not continue');

  const propertyForm = page.locator('[data-property-form]');
  await propertyForm.locator('button[type="submit"]').click();
  check(await page.locator('[data-property-error]').isVisible(), 'Property: unconfirmed address error is missing');
  await page.locator('[data-verify-address]').click();
  check(await page.locator('[data-address-result]').isVisible(), 'Property: coarse location confirmation is missing');
  await propertyForm.locator('button[type="submit"]').click();
  check((await page.locator('[data-property-error-copy]').innerText()).includes('authorized'), 'Property: authority validation is missing');
  await propertyForm.locator('input[name="authority"]').check();
  await propertyForm.locator('button[type="submit"]').click();
  check(await page.locator('body').getAttribute('data-step') === 'brief', 'Property: valid property did not continue');

  await page.locator('label:has(input[name="area"][value="Lawn"])').click();
  await page.locator('[data-brief-form] button[type="submit"]').click();
  check(await page.locator('body').getAttribute('data-step') === 'photos', 'Yard brief: valid brief did not continue');
  await page.locator('[data-toggle-photo="front"]').click();
  await page.locator('[data-toggle-photo="back"]').click();
  await page.locator('[data-toggle-photo="plants"]').click();
  check((await page.locator('[data-photo-count]').innerText()) === '3', 'Photos: added count is incorrect');
  check((await page.locator('[data-upload-state]').innerText()).includes('metadata removed'), 'Photos: processing/privacy result is missing');
  await page.locator('[data-toggle-photo="front"]').click();
  check((await page.locator('[data-photo-count]').innerText()) === '2', 'Photos: removal did not update count');
  await page.locator('[data-toggle-photo="front"]').click();
  await page.getByRole('button', { name: 'Review my yard brief' }).click();
  check(await page.locator('body').getAttribute('data-step') === 'share', 'Photos: did not continue to review');
  check((await page.locator('[data-summary-photos]').innerText()).startsWith('3'), 'Share: photo summary is incorrect');
  check((await page.locator('.disclosure-card').innerText()).includes('No provider can see this yet'), 'Share: private boundary is missing');

  await page.locator('[data-go-step="invite"]').click();
  const inviteForm = page.locator('[data-invite-form]');
  await inviteForm.locator('button[type="submit"]').click();
  check(await page.locator('[data-invite-error]').isVisible(), 'Invitation: disclosure validation is missing');
  await inviteForm.locator('input[name="confirm-share"]').check();
  await openReview(page);
  await page.locator('[data-fail-invite]').check();
  await page.locator('[data-apply-review]').click();
  await inviteForm.locator('button[type="submit"]').click();
  check(await page.locator('[data-invite-error]').isVisible(), 'Invitation: simulated recoverable failure is missing');
  check((await inviteForm.locator('input[name="provider-email"]').inputValue()) === 'care@desertbloom.example', 'Invitation: failed send did not preserve provider');
  await inviteForm.locator('button[type="submit"]').click();
  check(await page.locator('body').getAttribute('data-step') === 'connection', 'Invitation: retry did not reach connection progress');
  check((await page.locator('.access-receipt').innerText()).includes('Exact street address'), 'Connection: staged access receipt is missing');

  await page.locator('[data-preview-provider]').click();
  check(await page.locator('body').getAttribute('data-persona') === 'provider', 'Provider: provider-side mode is not exposed');
  await page.locator('[data-provider-decline]').click();
  check((await page.locator('[data-provider-result]').innerText()).includes('declined'), 'Provider: safe decline state is missing');
  await page.locator('[data-provider-interest]').click();
  check(await page.locator('body').getAttribute('data-step') === 'access-approval', 'Provider: interest did not return to owner approval');
  const accessForm = page.locator('[data-access-form]');
  await accessForm.locator('button[type="submit"]').click();
  check(await page.locator('[data-access-error]').isVisible(), 'Access: explicit consent validation is missing');
  await accessForm.locator('input[name="approve-confirm"]').check();
  await accessForm.locator('button[type="submit"]').click();
  check(await page.locator('body').getAttribute('data-step') === 'assessment', 'Access: approved sharing did not continue');
  check((await page.locator('.assessment-boundary').innerText()).includes('No service is booked yet'), 'Assessment: no-service boundary is missing');
  await page.locator('[data-confirm-assessment]').click();
  check(await page.locator('body').getAttribute('data-step') === 'proposals', 'Assessment: confirmation did not open proposals');

  const proposalTrigger = page.locator('[data-open-proposal="desert"]');
  await proposalTrigger.click();
  check(await page.locator('[data-proposal-dialog]').getAttribute('open') !== null, 'Proposal: detail did not open');
  check((await page.locator('[data-proposal-dialog]').innerText()).includes('Acceptance means'), 'Proposal: decision consequence is missing');
  await page.locator('[data-ask-proposal]').click();
  check(await page.locator('[data-proposal-question]').isVisible(), 'Proposal: question/change request is missing');
  await page.locator('[data-send-question]').click();
  check(await page.locator('body').getAttribute('data-step') === 'proposals', 'Proposal: question silently changed journey state');
  check(await proposalTrigger.evaluate((element) => element === document.activeElement), 'Proposal: question close did not restore focus');

  await openReview(page);
  await page.locator('[data-fail-proposal]').check();
  await page.locator('[data-apply-review]').click();
  await proposalTrigger.click();
  await page.locator('[data-accept-proposal]').click();
  check((await page.locator('[data-accept-proposal]').innerText()).includes('Confirm'), 'Proposal: explicit acceptance confirmation is missing');
  await page.locator('[data-accept-proposal]').click();
  check(await page.locator('[data-proposal-error]').isVisible(), 'Proposal: recoverable decision failure is missing');
  await page.locator('[data-accept-proposal]').click();
  check(await page.locator('body').getAttribute('data-step') === 'activation', 'Proposal: retry did not reach provider setup');
  check((await page.locator('[data-activation-status]').innerText()) === 'In progress', 'Activation: accepted care silently became scheduled');
  await page.locator('[data-simulate-activation]').click();
  check(await page.locator('body').getAttribute('data-step') === 'ready', 'Activation: first visit confirmation did not complete');
  check((await page.locator('.ready-hero').innerText()).includes('Tuesday, August 18'), 'Ready: first visit expectation is missing');

  await page.getByRole('button', { name: 'Review relationship' }).click();
  await page.locator('[data-revoke-photos]').click();
  check((await page.locator('[data-photo-access] small').innerText()).includes('revoked'), 'Relationship: photo revocation is missing');
  await page.locator('[data-export-data]').click();
  check((await page.locator('[data-data-result]').innerText()).includes('export requested'), 'Relationship: export request state is missing');
  check(desktop.browserErrors.length === 0, `Desktop workflow browser errors: ${desktop.browserErrors.join('; ')}`);

  await jumpTo(page, 'directory');
  const firstProvider = page.locator('.select-provider input').nth(0);
  const secondProvider = page.locator('.select-provider input').nth(1);
  await firstProvider.check();
  await secondProvider.check();
  check((await page.locator('[data-selected-count]').innerText()) === '2', 'Directory: shortlist count is incorrect');
  const providerTrigger = page.locator('[data-view-provider="desert"]');
  await providerTrigger.click();
  check((await page.locator('[data-provider-dialog]').innerText()).includes('not a guarantee'), 'Directory: precise trust disclaimer is missing');
  await page.keyboard.press('Escape');
  check(await providerTrigger.evaluate((element) => element === document.activeElement), 'Directory: profile focus did not return');
  await page.locator('[data-review-requests]').click();
  check(await page.locator('body').getAttribute('data-step') === 'directory-share', 'Directory: shortlist did not reach disclosure review');
  check(await page.locator('[data-selected-provider-list] article').count() === 2, 'Directory: selected providers are missing from disclosure review');
  const directoryShare = page.locator('[data-directory-share-form]');
  await directoryShare.locator('button[type="submit"]').click();
  check(await page.locator('[data-directory-share-error]').isVisible(), 'Directory: disclosure confirmation validation is missing');
  await directoryShare.locator('input[name="directory-confirm"]').check();
  await directoryShare.locator('button[type="submit"]').click();
  check(await page.locator('body').getAttribute('data-step') === 'proposals', 'Directory: approved separate requests did not reach comparison');

  await jumpTo(page, 'unavailable');
  check((await page.locator('[data-step-panel="unavailable"]').innerText()).includes('Nothing was sent'), 'Unavailable: protected-data message is missing');
  await page.locator('[data-retry-load]').click();
  check(await page.locator('body').getAttribute('data-step') === 'share', 'Unavailable: retry did not recover the private brief');

  await jumpTo(page, 'welcome');
  await page.waitForTimeout(200);
  if (capture) {
    await mkdir(imageDirectory, { recursive: true });
    await page.screenshot({ path: resolve(imageDirectory, 'yard-owner-acquisition-desktop-v1.png'), fullPage: false });
  }
  await page.close();

  const tablet = await openPage(browser, { width: 768, height: 1024 }, 'directory');
  await checkLayout(tablet.page, 768, 'Tablet directory');
  check(tablet.browserErrors.length === 0, `Tablet browser errors: ${tablet.browserErrors.join('; ')}`);
  await tablet.page.close();

  const mobile = await openPage(browser, { width: 390, height: 844 });
  await checkLayout(mobile.page, 390, 'Mobile welcome');
  await checkMobileTargets(mobile.page, 'Mobile welcome');
  const mobileStages = ['property', 'photos', 'share', 'invite', 'directory', 'proposals', 'activation', 'relationship'];
  for (const step of mobileStages) {
    await jumpTo(mobile.page, step);
    await checkLayout(mobile.page, 390, `Mobile ${step}`);
    await checkMobileTargets(mobile.page, `Mobile ${step}`);
  }
  await jumpTo(mobile.page, 'welcome');
  await mobile.page.waitForTimeout(200);
  if (capture) {
    await mobile.page.screenshot({ path: resolve(imageDirectory, 'yard-owner-acquisition-mobile-v1.png'), fullPage: false });
  }
  await mobile.page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  await mobile.page.waitForTimeout(100);
  for (const step of ['welcome', 'property', 'directory', 'proposals', 'relationship']) {
    await jumpTo(mobile.page, step);
    await checkLayout(mobile.page, 390, `Mobile ${step} at 200% text`);
  }
  check(mobile.browserErrors.length === 0, `Mobile browser errors: ${mobile.browserErrors.join('; ')}`);
  await mobile.page.close();

  const compact = await openPage(browser, { width: 320, height: 720 }, 'invite');
  await checkLayout(compact.page, 320, 'Compact invitation');
  await checkMobileTargets(compact.page, 'Compact invitation');
  check(compact.browserErrors.length === 0, `Compact browser errors: ${compact.browserErrors.join('; ')}`);
  await compact.page.close();

  console.log(`Yard Owner acquisition validation passed${capture ? ' and review images were captured' : ''}.`);
} finally {
  await browser.close();
}
