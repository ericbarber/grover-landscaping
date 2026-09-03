import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from '../../frontend/node_modules/playwright/index.mjs';

const designRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const prototypePath = resolve(designRoot, 'prototypes/current-frontend-review/index.html');
const captureRoot = resolve(designRoot, 'high-fidelity/current');
const capture = process.argv.includes('--capture');

const surfaces = [
  'public', 'company-home', 'company-manage', 'crew-home',
  'crew-route', 'owner-home', 'owner-yard', 'portfolio',
];

function check(condition, message) {
  if (!condition) throw new Error(message);
}

async function visibleCount(page, selector) {
  return page.locator(selector).evaluateAll((elements) => elements.filter((element) => {
    const style = getComputedStyle(element);
    const bounds = element.getBoundingClientRect();
    return style.visibility !== 'hidden' && style.display !== 'none' && bounds.width > 0 && bounds.height > 0;
  }).length);
}

const browser = await chromium.launch({ headless: true });

try {
  if (capture) await mkdir(captureRoot, { recursive: true });

  for (const viewport of [{ name: 'desktop', width: 1440, height: 1000 }, { name: 'mobile', width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto(`${pathToFileURL(prototypePath).href}#company-home`, { waitUntil: 'load' });
    await page.waitForTimeout(100);

    for (const surface of surfaces) {
      await page.selectOption('#surface-picker', surface);
      await page.waitForTimeout(40);
      check(await page.locator('body').getAttribute('data-surface') === surface, `${viewport.name}/${surface}: body state did not change`);
      check((await page.locator('#surface-picker').inputValue()) === surface, `${viewport.name}/${surface}: selector state did not persist`);
      check(new URL(page.url()).hash === `#${surface}`, `${viewport.name}/${surface}: shareable hash was not updated`);
      check(await visibleCount(page, 'h1') === 1, `${viewport.name}/${surface}: expected exactly one visible h1`);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      check(overflow <= 1, `${viewport.name}/${surface}: horizontal overflow is ${overflow}px`);

      if (surface === 'public') {
        check(await page.locator('.public-mirror').isVisible(), `${viewport.name}: public mirror is hidden`);
        check(!(await page.locator('.workspace-mirror').isVisible()), `${viewport.name}: app shell leaked into public mirror`);
        const headlineHeights = [];
        const expectedHeadlines = {
          owner: 'See the care behind your yard.',
          'property-manager': 'Keep every property ready.',
          company: 'Plan every visit. Care with confidence. Prove the work.',
          crew: 'Know the next stop—and what done looks like.',
        };
        for (const [persona, headline] of Object.entries(expectedHeadlines)) {
          await page.locator(`[data-public-persona="${persona}"]`).click();
          check(await page.locator('#public-headline').textContent() === headline, `${viewport.name}/${persona}: public persona content did not change`);
          check(await page.locator(`[data-public-persona="${persona}"]`).getAttribute('aria-pressed') === 'true', `${viewport.name}/${persona}: public persona state is not announced`);
          headlineHeights.push(await page.locator('#public-headline').evaluate((element) => element.getBoundingClientRect().height));
        }
        check(Math.max(...headlineHeights) - Math.min(...headlineHeights) <= 1, `${viewport.name}: public title region changes height across personas`);
      } else {
        check(await page.locator(`[data-panel="${surface}"]`).isVisible(), `${viewport.name}/${surface}: selected panel is hidden`);
        check(!(await page.locator('.public-mirror').isVisible()), `${viewport.name}/${surface}: public mirror leaked into app shell`);
        if (viewport.name === 'desktop') {
          check(await page.locator('.workspace-rail').isVisible(), `${surface}: desktop rail is hidden`);
          check(!(await page.locator('.mobile-nav').isVisible()), `${surface}: mobile navigation is visible on desktop`);
        } else {
          check(!(await page.locator('.workspace-rail').isVisible()), `${surface}: desktop rail is visible on mobile`);
          check(await page.locator('.mobile-nav').isVisible(), `${surface}: mobile navigation is hidden`);
          const mobileTargets = await page.locator('.mobile-nav button').evaluateAll((buttons) => buttons.map((button) => {
            const bounds = button.getBoundingClientRect();
            return { width: bounds.width, height: bounds.height };
          }));
          check(mobileTargets.every(({ width, height }) => width >= 44 && height >= 44), `${surface}: mobile navigation has a touch target below 44px`);
        }
      }
    }

    await page.selectOption('#surface-picker', 'owner-yard');
    check(await page.getByText('Your visit details are temporarily unavailable.').isVisible(), `${viewport.name}: Yard Owner unavailable state is missing`);
    await page.selectOption('#surface-picker', 'crew-route');
    check(await page.getByText('2026-06-18').isVisible(), `${viewport.name}: reviewed route date is missing`);
    check(await page.getByText('saved locally').isVisible(), `${viewport.name}: reviewed route persistence label is missing`);

    await page.locator('#surface-picker').focus();
    const focusOutline = await page.locator('#surface-picker').evaluate((element) => getComputedStyle(element).outlineColor);
    check(focusOutline === 'rgb(22, 133, 164)', `${viewport.name}: shared focus color is not applied`);
    check(errors.length === 0, `${viewport.name}: browser errors: ${errors.join('; ')}`);

    if (capture) {
      const target = viewport.name === 'desktop' ? 'company-home' : 'crew-route';
      await page.selectOption('#surface-picker', target);
      await page.screenshot({ path: resolve(captureRoot, `current-frontend-${viewport.name}-v1.png`), fullPage: true });
    }
    await page.close();
  }

  console.log(`Current frontend review validation passed${capture ? ' and captures refreshed' : ''}.`);
} finally {
  await browser.close();
}
