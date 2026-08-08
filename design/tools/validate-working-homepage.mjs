import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from '../../frontend/node_modules/playwright/index.mjs';

const designRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pageUrl = pathToFileURL(resolve(designRoot, 'prototypes/public-homepage/index.html')).href;
const capture = process.argv.includes('--capture');
const imageDirectory = resolve(designRoot, 'high-fidelity/public');

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
  return { page, browserErrors };
}

async function checkLayout(page, expectedWidth, label) {
  const layout = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    h1Count: document.querySelectorAll('h1').length,
  }));
  check(layout.clientWidth === expectedWidth, `${label}: unexpected viewport width`);
  check(layout.scrollWidth === layout.clientWidth, `${label}: horizontal overflow detected`);
  check(layout.h1Count === 1, `${label}: expected exactly one H1`);
}

async function checkMinimumTargets(page) {
  const undersized = await page.locator('a[href], button, select, input[type="checkbox"]').evaluateAll((elements) => (
    elements
      .filter((element) => {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
      })
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          label: element.getAttribute('aria-label') || element.textContent?.trim() || element.getAttribute('name'),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      })
      .filter(({ width, height }) => width < 44 || height < 44)
  ));
  check(undersized.length === 0, `Mobile: undersized interactive targets ${JSON.stringify(undersized)}`);
}

const browser = await chromium.launch({ headless: true });

try {
  const desktop = await openPage(browser, { width: 1440, height: 1100 });
  await checkLayout(desktop.page, 1440, 'Desktop');
  check((await desktop.page.locator('h1').innerText()).includes('Plan every visit'), 'Desktop: default company message missing');

  await desktop.page.getByRole('tab', { name: 'Property manager' }).click();
  check((await desktop.page.locator('h1').innerText()) === 'Keep every property ready.', 'Persona: hero did not update');
  check((await desktop.page.locator('[data-preview-title]').innerText()).includes('14 of 16'), 'Persona: proof preview did not update');
  check((await desktop.page.locator('[data-cta-label]').first().innerText()) === 'Discuss my portfolio', 'Persona: CTA did not update');

  await desktop.page.getByRole('tab', { name: 'Property manager' }).focus();
  await desktop.page.keyboard.press('ArrowRight');
  check(await desktop.page.getByRole('tab', { name: 'Landscaping company' }).getAttribute('aria-selected') === 'true', 'Persona: arrow-key selection failed');

  await desktop.page.locator('[data-workflow="plan"]').focus();
  await desktop.page.keyboard.press('ArrowRight');
  check(await desktop.page.locator('[data-workflow="care"]').getAttribute('aria-selected') === 'true', 'Workflow: arrow-key selection failed');
  check((await desktop.page.locator('[data-workflow-title]').innerText()) === 'Keep the current stop clear.', 'Workflow: panel did not update');

  const dialogTrigger = desktop.page.locator('[data-open-dialog]').first();
  await dialogTrigger.click();
  check(await desktop.page.locator('[data-dialog]').getAttribute('open') !== null, 'Dialog: failed to open');
  await desktop.page.keyboard.press('Escape');
  check(await dialogTrigger.evaluate((element) => element === document.activeElement), 'Dialog: focus was not restored after Escape');

  await dialogTrigger.click();
  await desktop.page.locator('[data-submit-button]').click();
  check((await desktop.page.locator('[data-error-for="name"]').innerText()).length > 0, 'Form: name validation missing');
  check((await desktop.page.locator('[data-error-for="email"]').innerText()).length > 0, 'Form: email validation missing');
  await desktop.page.locator('input[name="name"]').fill('Morgan Reyes');
  await desktop.page.locator('input[name="email"]').fill('morgan@example.com');
  await desktop.page.locator('input[name="consent"]').check();
  await desktop.page.locator('.review-controls').evaluate((element) => { element.open = true; });
  await desktop.page.locator('input[name="simulate-error"]').check();
  await desktop.page.locator('[data-submit-button]').click();
  await desktop.page.locator('[data-form-error]').waitFor({ state: 'visible' });
  check(await desktop.page.locator('[data-form-error]').isVisible(), 'Form: recoverable error state missing');
  check((await desktop.page.locator('input[name="name"]').inputValue()) === 'Morgan Reyes', 'Form: recovery did not preserve entries');
  await desktop.page.locator('input[name="simulate-error"]').uncheck();
  await desktop.page.locator('[data-submit-button]').click();
  await desktop.page.locator('[data-success-state]').waitFor({ state: 'visible' });
  check(await desktop.page.locator('[data-success-state]').isVisible(), 'Form: success state missing');
  check((await desktop.page.locator('[data-success-name]').innerText()) === 'Morgan', 'Form: success context missing');
  await desktop.page.getByRole('button', { name: 'Return to Grover' }).click();
  check(desktop.browserErrors.length === 0, `Desktop browser errors: ${desktop.browserErrors.join('; ')}`);

  await desktop.page.reload({ waitUntil: 'load' });
  if (capture) {
    await mkdir(imageDirectory, { recursive: true });
    await desktop.page.screenshot({
      path: resolve(imageDirectory, 'homepage-desktop-v2.png'),
      fullPage: true,
    });
  }
  await desktop.page.close();

  const mobile = await openPage(browser, { width: 390, height: 844 });
  await checkLayout(mobile.page, 390, 'Mobile');
  await checkMinimumTargets(mobile.page);
  const menuButton = mobile.page.locator('[data-menu-button]');
  await menuButton.click();
  check(await menuButton.getAttribute('aria-expanded') === 'true', 'Mobile navigation: failed to open');
  check(await mobile.page.locator('[data-navigation]').isVisible(), 'Mobile navigation: links are not visible');
  await mobile.page.getByRole('link', { name: 'How it works' }).click();
  check(await menuButton.getAttribute('aria-expanded') === 'false', 'Mobile navigation: failed to close after selection');
  check(mobile.browserErrors.length === 0, `Mobile browser errors: ${mobile.browserErrors.join('; ')}`);

  if (capture) {
    await mobile.page.goto(pageUrl, { waitUntil: 'load' });
    await mobile.page.screenshot({
      path: resolve(imageDirectory, 'homepage-mobile-v2.png'),
      fullPage: true,
    });
  }
  await mobile.page.close();

  console.log(`Working homepage validation passed${capture ? ' and review images were captured' : ''}.`);
} finally {
  await browser.close();
}
