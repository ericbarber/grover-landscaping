import { mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from '../../frontend/node_modules/playwright/index.mjs';

const designRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pageUrl = pathToFileURL(resolve(designRoot, 'prototypes/property-manager-portfolio/index.html')).href;
const captureDirectory = resolve(designRoot, 'high-fidelity/customer');
const capture = process.argv.includes('--capture');

function check(condition, message) {
  if (!condition) throw new Error(message);
}

async function openPage(browser, viewport) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(pageUrl, { waitUntil: 'load' });
  return { page, errors };
}

async function checkLayout(page, width, label) {
  const layout = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    h1Count: document.querySelectorAll('h1').length,
  }));
  check(layout.clientWidth === width, `${label}: unexpected viewport width`);
  check(layout.scrollWidth === width, `${label}: horizontal overflow detected`);
  check(layout.h1Count === 1, `${label}: expected one H1`);
}

const browser = await chromium.launch({ headless: true });
try {
  const desktop = await openPage(browser, { width: 1440, height: 1000 });
  await checkLayout(desktop.page, 1440, 'Desktop');
  check(await desktop.page.locator('[data-view-panel="overview"]').isVisible(), 'Overview is not the default view');
  check((await desktop.page.locator('[data-exception-count]').innerText()) === '2', 'Exception hierarchy is missing');
  await desktop.page.locator('.primary-nav [data-nav="properties"]').click();
  check(await desktop.page.locator('[data-view-panel="properties"]').isVisible(), 'Properties navigation failed');
  check(await desktop.page.locator('.primary-nav [data-nav="properties"]').getAttribute('aria-current') === 'page', 'Active destination is not exposed');
  await desktop.page.locator('[data-property-search]').fill('Camelback');
  check(await desktop.page.locator('[data-property-row]:visible').count() === 1, 'Property search did not filter');
  await desktop.page.locator('.primary-nav [data-nav="proof"]').click();
  const recordButton = desktop.page.locator('[data-open-record]').first();
  await recordButton.click();
  check(await desktop.page.locator('[data-record-dialog]').getAttribute('open') !== null, 'Completion record did not open');
  await desktop.page.keyboard.press('Escape');
  check(await recordButton.evaluate((element) => element === document.activeElement), 'Dialog did not restore focus');
  await desktop.page.locator('[data-portfolio-select]').selectOption('retail');
  check(await desktop.page.locator('body').getAttribute('data-review-state') === 'clear', 'Portfolio context did not update readiness state');
  for (const state of ['loading', 'partial', 'unavailable', 'empty', 'default']) {
    await desktop.page.locator('select[data-review-state]').selectOption(state);
    check(await desktop.page.locator('body').getAttribute('data-review-state') === state, `Review state ${state} failed`);
  }
  check(desktop.errors.length === 0, `Desktop browser errors: ${desktop.errors.join('; ')}`);
  if (capture) {
    await mkdir(captureDirectory, { recursive: true });
    await desktop.page.locator('select[data-review-state]').selectOption('default');
    await desktop.page.locator('.primary-nav [data-nav="overview"]').click();
    await desktop.page.screenshot({ path: resolve(captureDirectory, 'property-manager-portfolio-desktop-v1.png'), fullPage: false });
  }
  await desktop.page.close();

  const mobile = await openPage(browser, { width: 390, height: 844 });
  await checkLayout(mobile.page, 390, 'Mobile');
  await mobile.page.locator('.mobile-nav [data-nav="approvals"]').click();
  check(await mobile.page.locator('[data-view-panel="approvals"]').isVisible(), 'Mobile approvals navigation failed');
  const undersized = await mobile.page.locator('button, a[href], select, input').evaluateAll((elements) => elements.filter((element) => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0 && !element.closest('[hidden]') && (rect.width < 44 || rect.height < 44);
  }).map((element) => element.getAttribute('aria-label') || element.textContent.trim() || element.tagName));
  check(undersized.length === 0, `Mobile: undersized targets ${JSON.stringify(undersized)}`);
  check(mobile.errors.length === 0, `Mobile browser errors: ${mobile.errors.join('; ')}`);
  if (capture) {
    await mobile.page.locator('.mobile-nav [data-nav="overview"]').click();
    await mobile.page.screenshot({ path: resolve(captureDirectory, 'property-manager-portfolio-mobile-v1.png'), fullPage: false });
  }
  await mobile.page.close();

  console.log('Property-manager portfolio prototype validation passed.');
} finally {
  await browser.close();
}
