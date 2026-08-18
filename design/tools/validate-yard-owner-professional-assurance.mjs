import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from '../../frontend/node_modules/playwright/index.mjs';

const designRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pageUrl = pathToFileURL(resolve(designRoot, 'prototypes/yard-owner-acquisition/index.html')).href;

function check(condition, message) {
  if (!condition) throw new Error(message);
}

async function openPage(browser, viewport, step = 'welcome') {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`${pageUrl}#${step}`, { waitUntil: 'load' });
  await page.waitForTimeout(100);
  return { page, errors };
}

async function assertLayout(page, width, label) {
  const result = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    visiblePanels: [...document.querySelectorAll('[data-step-panel]')].filter((panel) => !panel.hidden).length,
    h1Count: document.querySelectorAll('h1').length,
  }));
  check(result.clientWidth === width, `${label}: viewport width changed unexpectedly`);
  check(result.scrollWidth === result.clientWidth, `${label}: horizontal overflow ${result.scrollWidth}/${result.clientWidth}`);
  check(result.visiblePanels === 1, `${label}: expected one visible journey panel`);
  check(result.h1Count === 1, `${label}: expected one persistent H1`);
}

function channel(value) {
  const normalized = value / 255;
  return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const value = hex.replace('#', '');
  const [red, green, blue] = [0, 2, 4].map((offset) => channel(Number.parseInt(value.slice(offset, offset + 2), 16)));
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(foreground, background) {
  const foregroundLuminance = luminance(foreground);
  const backgroundLuminance = luminance(background);
  return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
}

const browser = await chromium.launch({ headless: true });

try {
  const workflow = await openPage(browser, { width: 1440, height: 1000 }, 'welcome');
  const page = workflow.page;

  await page.locator('[data-go-step="account"]').first().click();
  check(await page.locator('body').getAttribute('data-step') === 'account', 'History: owner entry did not open');
  await page.goBack();
  await page.waitForFunction(() => document.body.dataset.step === 'welcome');
  check(await page.locator('[data-page-title]').innerText() === 'Find care for my yard', 'History: Back did not restore the prior stage title');

  await page.goto(`${pageUrl}#access-receipt`, { waitUntil: 'load' });
  check((await page.locator('[data-receipt-approved]').innerText()) === 'Yard brief, Email', 'Deep link: completed receipt has no approved example categories');
  check((await page.locator('[data-receipt-withheld]').innerText()).includes('Exact address'), 'Deep link: completed receipt has no withheld categories');
  await page.reload({ waitUntil: 'load' });
  check(await page.locator('body').getAttribute('data-step') === 'access-receipt', 'Refresh: access receipt deep link was not preserved');

  await page.goto(`${pageUrl}#access-approval`, { waitUntil: 'load' });
  check(await page.locator('[data-access-form] input[name="approve-item"]:checked').count() === 0, 'Consent: known-provider category was preselected');
  check(await page.locator('input[name="approve-item"][value="Yard photos"]').isDisabled(), 'Consent: zero-photo disclosure category is enabled');
  await page.goto(`${pageUrl}#photos`, { waitUntil: 'load' });
  await page.locator('[data-toggle-photo="front"]').click();
  check(!(await page.locator('input[name="approve-item"][value="Yard photos"]').isDisabled()), 'Consent: photo category did not become available after adding a photo');

  await page.goto(`${pageUrl}#directory-share`, { waitUntil: 'load' });
  check(await page.locator('[data-directory-share-form] input[name="directory-item"]:checked').count() === 0, 'Consent: directory category was preselected');

  await page.goto(`${pageUrl}#provider`, { waitUntil: 'load' });
  await page.locator('[data-provider-question]').click();
  check(await page.locator('[data-provider-question-copy]').evaluate((element) => element === document.activeElement), 'Provider question: focus did not move to the composer');
  await page.locator('[data-send-provider-question]').click();
  check(await page.locator('[data-provider-question-copy]').getAttribute('aria-invalid') === 'true', 'Provider question: invalid state is not programmatic');
  check((await page.locator('[data-provider-question-copy]').getAttribute('aria-describedby')) === 'provider-question-error', 'Provider question: error is not associated');
  await page.locator('[data-provider-question-copy]').fill('Would a remote review be enough to decide on an on-site assessment?');
  await page.locator('[data-send-provider-question]').click();
  check((await page.locator('[data-provider-result]').innerText()).includes('No exact address'), 'Provider question: disclosure boundary feedback is missing');
  await page.locator('[data-provider-decline]').click();
  check((await page.locator('[data-provider-result]').innerText()).startsWith('Confirm'), 'Provider decline: explicit confirmation is missing');
  await page.locator('[data-provider-decline]').click();
  check(await page.locator('[data-provider-interest]').isDisabled(), 'Provider decline: closed request still allows interest');

  await page.goto(`${pageUrl}#session-expired`, { waitUntil: 'load' });
  check((await page.locator('[data-step-panel="session-expired"]').innerText()).includes('No provider received new information'), 'Session: protected no-submit consequence is missing');
  await page.locator('[data-restore-session]').click();
  check(await page.locator('body').getAttribute('data-step') === 'share', 'Session: successful sign-in recovery did not restore the private brief');

  const keyboardCheck = await openPage(browser, { width: 1440, height: 1000 }, 'brief');
  const keyboardPage = keyboardCheck.page;
  await keyboardPage.keyboard.press('Tab');
  check(await keyboardPage.locator('.skip-link').evaluate((element) => element === document.activeElement), 'Keyboard: skip link is not first');
  check(await keyboardPage.locator('.skip-link').evaluate((element) => element.getBoundingClientRect().top >= 0), 'Keyboard: focused skip link is not visible');
  let choiceFocusVisible = false;
  for (let index = 0; index < 30; index += 1) {
    await keyboardPage.keyboard.press('Tab');
    const state = await keyboardPage.evaluate(() => {
      const active = document.activeElement;
      const choiceLabel = active?.closest('.choice-grid label');
      return {
        area: active?.getAttribute('name') === 'area',
        outline: choiceLabel ? getComputedStyle(choiceLabel).outlineStyle : 'none',
      };
    });
    if (state.area) {
      choiceFocusVisible = state.outline !== 'none';
      break;
    }
  }
  check(choiceFocusVisible, 'Keyboard: visually hidden choice input has no visible group focus');
  check(keyboardCheck.errors.length === 0, `Keyboard: browser errors ${keyboardCheck.errors.join('; ')}`);
  await keyboardPage.close();

  const contrastPairs = [
    ['#14342d', '#fffdf8', 'primary text on paper'],
    ['#60746d', '#fffdf8', 'muted text on paper'],
    ['#296a57', '#fffdf8', 'action text on paper'],
    ['#ffffff', '#1c5144', 'primary button text'],
    ['#4d3c20', '#ead5a7', 'prototype banner text'],
    ['#843b28', '#f8e5dc', 'error text'],
  ];
  for (const [foreground, background, label] of contrastPairs) {
    check(contrast(foreground, background) >= 4.5, `Contrast: ${label} is below 4.5:1`);
  }

  await page.emulateMedia({ reducedMotion: 'reduce' });
  check(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior === 'auto'), 'Reduced motion: smooth scrolling remains active');
  check(await page.locator('.button').first().evaluate((element) => getComputedStyle(element).transitionProperty === 'none'), 'Reduced motion: control transition remains active');

  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'no-preference' });
  await page.goto(`${pageUrl}#connection-recovery`, { waitUntil: 'load' });
  const forcedColorState = await page.locator('[data-set-invitation-state="delivered"]').evaluate((element) => ({
    forced: matchMedia('(forced-colors: active)').matches,
    borderWidth: getComputedStyle(element).borderTopWidth,
  }));
  check(forcedColorState.forced, 'Forced colors: emulation did not activate');
  check(forcedColorState.borderWidth === '2px', 'Forced colors: selected lifecycle control has no non-color boundary');
  check(workflow.errors.length === 0, `Workflow browser errors: ${workflow.errors.join('; ')}`);
  await page.close();

  const viewportMatrix = [
    { width: 320, height: 720, label: '400% zoom equivalent reflow' },
    { width: 360, height: 800, label: 'small Android' },
    { width: 390, height: 844, label: 'mobile reference' },
    { width: 412, height: 915, label: 'large Android' },
    { width: 768, height: 1024, label: 'tablet portrait' },
    { width: 1024, height: 768, label: 'tablet landscape' },
    { width: 1366, height: 768, label: 'laptop' },
    { width: 1920, height: 1080, label: 'large desktop' },
  ];
  const highRiskStages = ['provider-entry', 'provider-claim', 'provider', 'access-approval', 'access-receipt', 'connection-recovery', 'session-expired'];
  for (const viewport of viewportMatrix) {
    const testPage = await openPage(browser, { width: viewport.width, height: viewport.height }, 'provider-entry');
    for (const stage of highRiskStages) {
      await testPage.page.goto(`${pageUrl}#${stage}`, { waitUntil: 'load' });
      if (stage === 'provider') await testPage.page.locator('[data-provider-question]').click();
      await assertLayout(testPage.page, viewport.width, `${viewport.label} ${stage}`);
    }
    check(testPage.errors.length === 0, `${viewport.label}: browser errors ${testPage.errors.join('; ')}`);
    await testPage.page.close();
  }

  const textResize = await openPage(browser, { width: 390, height: 844 }, 'provider');
  await textResize.page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  await textResize.page.locator('[data-provider-question]').click();
  await assertLayout(textResize.page, 390, '200% text provider question');
  check(textResize.errors.length === 0, `200% text: browser errors ${textResize.errors.join('; ')}`);
  await textResize.page.close();

  console.log('Yard Owner professional assurance validation passed.');
} finally {
  await browser.close();
}
