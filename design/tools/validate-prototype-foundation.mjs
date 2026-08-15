import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from '../../frontend/node_modules/playwright/index.mjs';

const designRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function check(condition, message) {
  if (!condition) throw new Error(message);
}

const prototypes = [
  { name: 'Public homepage', path: 'prototypes/public-homepage/index.html', hash: '', nav: '.site-header' },
  { name: 'Yard Crew acquisition', path: 'prototypes/yard-crew-acquisition/index.html', hash: '#proposal', nav: '.stage-nav' },
  { name: 'Yard Owner acquisition', path: 'prototypes/yard-owner-acquisition/index.html', hash: '#account', nav: '.journey-rail' },
  { name: 'Yard Owner portal', path: 'prototypes/yard-owner-portal/index.html', hash: '#home', nav: '.desktop-rail' },
];

const expectedTokens = {
  '--forest': '#0f2f28',
  '--evergreen': '#173f35',
  '--bone': '#f6f2e8',
  '--paper': '#fffdf8',
  '--ink': '#17342d',
  '--line': '#d8ddd7',
  '--sand': '#dec79d',
  '--clay': '#bd6848',
};

const browser = await chromium.launch({ headless: true });

try {
  for (const prototype of prototypes) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', (error) => errors.push(error.message));
    const url = `${pathToFileURL(resolve(designRoot, prototype.path)).href}${prototype.hash}`;
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForTimeout(120);

    const foundationHref = await page.locator('link[rel="stylesheet"]').last().getAttribute('href');
    check(foundationHref === '../shared/grover-foundation.css', `${prototype.name}: shared foundation is not the final stylesheet`);

    const tokens = await page.evaluate((names) => {
      const style = getComputedStyle(document.documentElement);
      return Object.fromEntries(names.map((name) => [name, style.getPropertyValue(name).trim().toLowerCase()]));
    }, Object.keys(expectedTokens));
    for (const [token, value] of Object.entries(expectedTokens)) {
      check(tokens[token] === value, `${prototype.name}: ${token} is ${tokens[token]} instead of ${value}`);
    }

    const brand = await page.locator('.brand:visible').first().evaluate((element) => {
      const style = getComputedStyle(element);
      const icon = element.querySelector('svg')?.getBoundingClientRect();
      return {
        family: style.fontFamily,
        transform: style.textTransform,
        spacing: style.letterSpacing,
        iconWidth: Math.round(icon?.width ?? 0),
      };
    });
    check(brand.transform === 'uppercase', `${prototype.name}: brand wordmark is not uppercase`);
    check(brand.family.includes('Segoe UI') || brand.family.includes('Arial'), `${prototype.name}: brand does not use the interface family`);
    check(brand.iconWidth === 32, `${prototype.name}: brand mark is not 32px`);

    const banner = await page.locator('.prototype-note, .review-bar').first().evaluate((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return { background: style.backgroundColor, height: Math.round(rect.height) };
    });
    check(banner.background === 'rgb(15, 47, 40)', `${prototype.name}: working-design banner is not Forest`);
    check(banner.height >= 48, `${prototype.name}: working-design banner is shorter than 48px`);

    const navBackground = await page.locator(prototype.nav).first().evaluate((element) => getComputedStyle(element).backgroundColor);
    if (prototype.nav === '.site-header') {
      check(navBackground === 'rgba(255, 253, 248, 0.95)', `${prototype.name}: public navigation does not use Paper`);
    } else {
      check(navBackground === 'rgb(15, 47, 40)', `${prototype.name}: application rail does not use Forest`);
    }

    const focusTarget = page.locator('button:visible, a[href]:visible').first();
    await focusTarget.focus();
    const outline = await focusTarget.evaluate((element) => getComputedStyle(element).outlineColor);
    check(outline === 'rgb(22, 133, 164)', `${prototype.name}: focus ring is not the shared accessible blue`);
    check(errors.length === 0, `${prototype.name}: browser errors: ${errors.join('; ')}`);
    await page.close();
  }

  console.log('Shared prototype foundation validation passed.');
} finally {
  await browser.close();
}
