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
  check((await page.locator('.hero h1').innerText()).includes('Find work that fits'), 'Marketing: approachable operational promise is missing');
  check((await page.locator('.hero-note').innerText()).includes('does not guarantee work'), 'Marketing: no-guarantee boundary is missing');
  check((await page.locator('#fit').innerText()).includes('joining a provider team'), 'Marketing: invited-worker route is missing');
  check((await page.locator('#how').innerText()).includes('Move forward one clear step at a time'), 'Marketing: staged lifecycle is missing');
  check((await page.locator('#how').innerText()).includes('scope of work') && (await page.locator('#how').innerText()).includes('work order'), 'Marketing: industry lifecycle terminology is incomplete');
  check(await page.locator('[id]').evaluateAll((elements) => new Set(elements.map((element) => element.id)).size === elements.length), 'Document: duplicate IDs detected');
  if (capture) {
    await mkdir(imageDirectory, { recursive: true });
    await page.screenshot({ path: resolve(imageDirectory, 'yard-crew-acquisition-desktop-v1.png'), fullPage: false });
  }

  await page.getByRole('button', { name: 'Create a provider profile' }).first().click();
  check(await page.locator('body').getAttribute('data-stage') === 'path', 'Path: marketing CTA did not open setup');
  check((await page.locator('.stage-group-label').allInnerTexts()).join(' · ').toLowerCase() === 'get started · find the right work · start service', 'Navigation: lifecycle groups are missing or out of order');
  check(!(await page.locator('.stage-nav').innerText()).includes('Provider support'), 'Navigation: support should not be a numbered acquisition step');
  check(await page.locator('input[name="providerPath"][value="solo"]').isChecked(), 'Path: owner-operator should be reviewable by default');
  await page.locator('[data-continue-path]').click();
  check(await page.locator('body').getAttribute('data-stage') === 'profile', 'Path: owner-operator did not continue');

  const profile = page.locator('#provider-profile-form');
  await profile.locator('input[name="providerName"]').fill('');
  await profile.locator('input[name="authority"]').uncheck();
  await profile.locator('button[type="submit"]').click();
  check(await page.locator('[role="alert"]:visible').isVisible(), 'Profile: validation alert is missing');
  await profile.locator('input[name="providerName"]').fill('Desert & Pine Landscape Services');
  await profile.locator('input[name="authority"]').check();
  await profile.locator('button[type="submit"]').click();
  check(await page.locator('body').getAttribute('data-stage') === 'readiness', 'Profile: valid provider did not continue');
  check((await page.locator('.readiness-list').innerText()).includes('Document supplied; independent validation not simulated'), 'Qualification: precise credential wording is missing');
  check((await page.locator('[data-stage-view]').innerText()).includes('Certificate of insurance'), 'Qualification: professional credential terminology is missing');
  check((await page.locator('.readiness-summary').innerText()).toLowerCase().includes('ready with limits'), 'Readiness: allowed and restricted opportunity state is missing');
  check((await page.locator('[data-stage-view]').innerText()).includes('Openings for recurring properties'), 'Readiness: provider capacity preference is missing');
  await page.locator('[data-complete-readiness]').click();
  check(await page.locator('body').getAttribute('data-stage') === 'opportunities', 'Readiness: did not open opportunities');
  check((await page.locator('.opportunity-list').innerText()).includes('Recurring desert landscape maintenance'), 'Opportunities: suitable service request is missing');
  check((await page.locator('.stage-heading').innerText()).toLowerCase().includes('service opportunities'), 'Opportunities: industry workspace terminology is missing');
  check((await page.locator('[data-stage-view] .stage-note.private').innerText()).toLowerCase().includes('exact address'), 'Opportunities: preview privacy boundary is missing');
  check((await page.locator('.capacity-strip').innerText()).includes('2 recurring openings'), 'Opportunities: current capacity summary is missing');
  check((await page.locator('.opportunity-card').first().innerText()).toLowerCase().includes('owner-supplied size'), 'Opportunities: privacy-safe property size is missing');
  check((await page.locator('.opportunity-card').first().innerText()).includes('12 minutes'), 'Opportunities: route-impact evidence is missing');

  await reviewOpportunityState(page, 'empty');
  check((await page.locator('.empty-state').innerText()).includes('will not expand your service area'), 'Opportunities: honest no-result guidance is missing');
  await page.locator('[data-save-search]').click();
  check(await page.locator('[data-alert-dialog]').getAttribute('open') !== null, 'Alerts: saved-search preferences did not open');
  check((await page.locator('[data-alert-dialog]').innerText()).includes('Quiet hours'), 'Alerts: quiet-hour preference is missing');
  check((await page.locator('[data-alert-dialog]').innerText()).includes('Suppress when intake is paused'), 'Alerts: capacity-aware suppression is missing');
  check((await page.locator('[data-alert-dialog] .stage-note.private').innerText()).includes('does not reserve an opportunity'), 'Alerts: no-reservation boundary is missing');
  await page.locator('[data-fail-alert-save]').check();
  await page.getByRole('button', { name: 'Save opportunity alert' }).click();
  check(await page.locator('[data-alert-error]').isVisible(), 'Alerts: recoverable save failure is missing');
  check(await page.getByRole('radio', { name: /Daily digest/ }).isChecked(), 'Alerts: frequency was not preserved after failure');
  await page.getByRole('button', { name: 'Save opportunity alert' }).click();
  check(await page.locator('body').getAttribute('data-alert-state') === 'saved', 'Alerts: valid preferences did not save');
  check((await page.locator('.alert-summary').innerText()).toLowerCase().includes('active'), 'Alerts: active saved-search receipt is missing');
  if (capture) {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: resolve(imageDirectory, 'yard-crew-opportunity-alerts-desktop-v3.png'), fullPage: false });
  }
  await page.locator('[data-toggle-alert]').click();
  check((await page.locator('.alert-summary').innerText()).toLowerCase().includes('paused'), 'Alerts: pause control did not suppress the alert');
  check((await page.locator('.alert-summary').innerText()).includes('do not reserve, rank, or guarantee work'), 'Alerts: honest saved-alert claim is missing');
  await page.locator('[data-toggle-alert]').click();
  await page.getByRole('button', { name: 'Remove tree-work filter' }).click();
  await page.locator('.opportunity-card [data-go-stage="request"]').first().click();
  check(await page.locator('body').getAttribute('data-disclosure-state') === 'limited', 'Request: disclosure should begin limited');
  check((await page.locator('[data-stage-view] .stage-note.private').innerText()).includes('Site details remain private'), 'Request: hidden-data summary is missing');

  await page.locator('[data-open-review]').click();
  await page.locator('[data-fail-interest]').check();
  await page.locator('[data-close-review]').last().click();
  await page.locator('[data-interest]').click();
  check(await page.locator('[role="alert"]:visible').isVisible(), 'Interest: recoverable failure is missing');
  await page.locator('[data-interest]').click();
  check(await page.locator('body').getAttribute('data-interest-state') === 'pending', 'Interest: retry did not reach owner-pending state');
  check((await page.locator('.request-timeline').innerText()).includes('Owner reviewing'), 'Interest: owner-response tracker is missing');
  check((await page.locator('[data-stage-view]').innerText()).toLowerCase().includes('expires aug 18'), 'Interest: response expiry is missing');
  await page.locator('[data-owner-approve]').click();
  check(await page.locator('body').getAttribute('data-disclosure-state') === 'approved', 'Disclosure: owner approval did not load');
  check((await page.locator('.disclosure-table').innerText()).includes('Gate and pet details'), 'Disclosure: independent access facts are missing');
  await page.getByRole('button', { name: 'Begin site assessment' }).click();
  check((await page.locator('.assessment-checklist').innerText()).includes('Debris volume and disposal'), 'Assessment: structured operating checklist is missing');
  check((await page.locator('.visibility-grid').innerText()).toLowerCase().includes('your business only'), 'Assessment: owner/private information boundary is missing');

  await page.locator('input[name="assessment"][value="onsite"]').check();
  await page.locator('[data-schedule-assessment]').click();
  check((await page.locator('[data-stage-view] .stage-note.private').innerText()).includes('assessment only; no service or work order has been scheduled'), 'Assessment: no-service boundary is missing');
  await page.locator('[data-schedule-assessment]').click();
  check(await page.locator('body').getAttribute('data-stage') === 'proposal', 'Assessment: confirmed review did not open proposal');
  check((await page.locator('.scope-table').innerText()).toLowerCase().includes('exclusions'), 'Proposal: exclusions are missing');
  check((await page.locator('.stage-heading').innerText()).toLowerCase().includes('service estimate and proposal'), 'Proposal: estimating terminology is missing');
  check((await page.locator('.private-estimate').innerText()).includes('3 crew-hours'), 'Proposal: provider-private production basis is missing');
  check((await page.locator('.private-estimate').innerText()).includes('never included in the owner proposal'), 'Proposal: private estimate visibility boundary is missing');
  if (capture) {
    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = 'auto';
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(80);
    await page.screenshot({ path: resolve(imageDirectory, 'yard-crew-acquisition-estimate-desktop-v2.png'), fullPage: false });
  }
  await page.locator('[data-send-proposal]').click();
  check((await page.locator('.stage-card').last().innerText()).includes('asked whether'), 'Proposal: owner question state is missing');
  await page.locator('[data-simulate-acceptance]').click();
  check(await page.locator('[data-confirm-dialog]').getAttribute('open') !== null, 'Proposal: acceptance confirmation did not open');
  await page.locator('[data-confirm-action="accept"]').click();
  check(await page.locator('body').getAttribute('data-proposal-state') === 'accepted', 'Proposal: accepted state did not load');
  check((await page.locator('[data-stage-view] .stage-note.private').innerText()).includes('stays on record'), 'Proposal: accepted snapshot boundary is missing');
  await page.getByRole('button', { name: 'Prepare the service' }).click();
  check((await page.locator('[data-stage-view]').innerText()).includes('proposal is approved—now prepare the work'), 'Setup: proposal approval silently implied assignment');
  check((await page.locator('.readiness-list').innerText()).includes('Preview required before anything is sent'), 'Setup: owner update preview requirement is missing');
  await page.locator('[data-preview-first-visit]').click();
  check(await page.locator('body').getAttribute('data-owner-notification-state') === 'preview', 'Setup: owner update preview did not load');
  check((await page.locator('.owner-notification').innerText()).includes('Sends only after work-order confirmation'), 'Setup: send timing is not explicit');
  check((await page.locator('.owner-notification').innerText()).includes('Not shown to the owner'), 'Setup: business-only message boundary is missing');
  check((await page.locator('.owner-notification').innerText()).includes('weather or field delays'), 'Setup: owner delay expectation is missing');
  if (capture) {
    await page.evaluate(() => {
      const notification = document.querySelector('.owner-notification');
      window.scrollTo(0, Math.max(0, notification.getBoundingClientRect().top + window.scrollY - 180));
    });
    await page.screenshot({ path: resolve(imageDirectory, 'yard-crew-first-service-notification-desktop-v3.png'), fullPage: false });
  }
  await page.locator('[data-open-review]').click();
  await page.locator('[data-fail-owner-notification]').check();
  await page.locator('[data-close-review]').last().click();
  await page.locator('[data-confirm-first-visit]').click();
  check(await page.locator('body').getAttribute('data-owner-notification-state') === 'error', 'Setup: recoverable owner-update failure is missing');
  check((await page.locator('[role="alert"]:visible').innerText()).includes('still here'), 'Setup: failure does not explain preserved work');
  await page.locator('[data-confirm-first-visit]').click();
  check((await page.locator('[data-stage-view]').innerText()).includes('first service is ready'), 'Setup: confirmed work-order handoff is missing');
  check(await page.locator('body').getAttribute('data-owner-notification-state') === 'sent', 'Setup: owner update did not reach delivered state');
  check((await page.locator('.owner-notification.sent').innerText()).includes('First-service update v1'), 'Setup: delivery receipt is incomplete');

  await page.evaluate(() => { location.hash = '#team'; });
  await page.waitForFunction(() => document.body.dataset.stage === 'team');
  check((await page.locator('.authority-matrix').innerText()).toLowerCase().includes('opportunity manager'), 'Team: opportunity-management authority is missing');
  check((await page.locator('.authority-matrix').innerText()).toLowerCase().includes('set price and send proposal'), 'Team: proposal authority is missing');
  check((await page.locator('.authority-matrix').innerText()).toLowerCase().includes('assign crew and release work'), 'Team: work-release authority is missing');
  if (capture) {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: resolve(imageDirectory, 'yard-crew-team-authority-desktop-v3.png'), fullPage: false });
  }
  await page.locator('[data-team-role]').selectOption('estimator');
  check((await page.locator('.role-preview').innerText()).includes('Assessor and estimator'), 'Team: role preview did not update');
  await page.locator('[data-submit-team-invite]').click();
  check(await page.locator('body').getAttribute('data-invitation-state') === 'approval', 'Team: invitation did not enter approval');
  check((await page.locator('[data-stage-view]').innerText()).toLowerCase().includes('no access granted'), 'Team: pre-approval access boundary is missing');
  await page.locator('[data-approve-team-invite]').click();
  check(await page.locator('body').getAttribute('data-invitation-state') === 'sent', 'Team: approved invitation did not send');
  check((await page.locator('.request-timeline').innerText()).includes('No company access until acceptance'), 'Team: pre-acceptance access boundary is missing');
  await page.getByRole('button', { name: 'Preview recipient experience' }).click();
  check((await page.locator('[data-stage-view]').innerText()).includes('Assessor and estimator'), 'Invitation: approved role did not carry into the recipient preview');
  check((await page.locator('[data-stage-view]').innerText()).includes('Drafting an estimate does not grant authority to issue the proposal'), 'Invitation: estimator proposal boundary is missing');
  await page.locator('.role-boundary summary').click();
  check((await page.locator('.role-comparison').innerText()).includes('Crew member'), 'Invitation: full role comparison is missing');
  await page.locator('[data-accept-invite]').click();
  check(await page.locator('body').getAttribute('data-invitation-state') === 'accepted', 'Invitation: acceptance state did not load');
  check((await page.locator('[data-stage-view]').innerText()).includes('Acceptance receipt'), 'Invitation: acceptance audit receipt is missing');

  await page.locator('[data-open-review]').click();
  await page.locator('[data-review-invite="expired"]').click();
  check((await page.locator('[data-stage-view]').innerText()).toLowerCase().includes('invitation expired'), 'Invitation: expiry recovery state is missing');
  check(await page.locator('[data-accept-invite]').count() === 0, 'Invitation: expired invitation can still be accepted');
  await page.locator('[data-open-review]').click();
  await page.locator('[data-review-invite="revoked"]').click();
  check((await page.locator('[data-stage-view]').innerText()).toLowerCase().includes('invitation revoked'), 'Invitation: revocation state is missing');

  await page.evaluate(() => { location.hash = '#governance'; });
  await page.waitForFunction(() => document.body.dataset.stage === 'governance');
  check((await page.locator('.governance-gates').innerText()).includes('Provider eligibility by region and service'), 'Governance: eligibility gate is missing');
  check((await page.locator('.governance-gates').innerText()).includes('No rank, lead-volume, earnings, exclusivity, or demand-health claim'), 'Governance: unsupported marketplace-claim boundary is missing');
  await page.locator('[data-review-pilot="limited"]').click();
  check(await page.locator('body').getAttribute('data-pilot-state') === 'limited', 'Governance: limited pilot state did not load');
  check((await page.locator('.pilot-readiness').innerText()).toLowerCase().includes('known-owner connection only'), 'Governance: limited pilot boundary is missing');
  check((await page.locator('.visibility-grid').innerText()).toLowerCase().includes('keep product-gated'), 'Governance: marketplace scope is not kept gated');
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
  check((await mobile.page.locator('[data-mobile-progress]').innerText()) === 'Step 4 of 8', 'Mobile: acquisition progress should exclude Support');
  if (capture) await mobile.page.screenshot({ path: resolve(imageDirectory, 'yard-crew-acquisition-mobile-v1.png'), fullPage: false });
  for (const stage of ['path', 'profile', 'readiness', 'request', 'assessment', 'proposal', 'setup', 'team', 'governance', 'support', 'invited']) {
    await mobile.page.goto(`${pageUrl}#${stage}`, { waitUntil: 'load' });
    await mobile.page.waitForTimeout(80);
    await checkLayout(mobile.page, 390, `Mobile ${stage}`);
    await checkMobileTargets(mobile.page, `Mobile ${stage}`);
    await checkAccessibleControls(mobile.page, `Mobile ${stage}`);
  }
  await mobile.page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  for (const stage of ['opportunities', 'request', 'setup', 'team', 'governance', 'support']) {
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
