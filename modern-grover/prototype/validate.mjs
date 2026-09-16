import { chromium } from '../../frontend/node_modules/playwright/index.mjs';

const baseUrl = process.env.MODERN_GROVER_REVIEW_URL
  ?? 'http://127.0.0.1:5173/modern-grover/prototype/';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });

try {
  for (const width of [320, 390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 844 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const response = await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    if (response?.status() !== 200) throw new Error(`${width}px page returned ${response?.status()}`);

    const queueTitle = page.getByRole('heading', { name: 'Work that needs your decision' });
    await queueTitle.waitFor();
    await page.getByRole('button', { name: 'Open Canyon View service decision' }).click();
    await page.getByRole('heading', { name: 'Draft Plan 8' }).waitFor();
    if (await page.evaluate(() => document.activeElement?.id) !== 'service-title') {
      throw new Error(`${width}px did not focus the opened service`);
    }
    if (!await page.getByText('version 3').count() || !await page.getByText('$420').count()) {
      throw new Error(`${width}px missing accepted scope`);
    }
    if (await page.getByRole('button', { name: 'Review and release Plan 8' }).count()) {
      throw new Error(`${width}px allowed release before fit check`);
    }
    await page.getByRole('button', { name: 'Resolve crew fit' }).click();
    await page.getByRole('button', { name: 'Request correction' }).click();
    await page.getByText('Dispatch owns the correction').waitFor();
    await page.getByRole('button', { name: 'All decisions' }).click();
    await page.getByText('1 correction waiting').waitFor();
    await page.getByRole('button', { name: 'Open Canyon View service decision' }).click();
    await page.getByRole('button', { name: 'Simulate revised Plan 9' }).click();
    await page.getByRole('heading', { name: 'Draft Plan 9' }).waitFor();

    await page.getByRole('button', { name: 'Reset' }).click();
    await page.getByRole('button', { name: 'Open Canyon View service decision' }).click();
    await page.getByRole('button', { name: 'Resolve crew fit' }).click();
    await page.getByRole('button', { name: 'Confirm crew fit' }).click();
    await page.getByRole('button', { name: 'Review and release Plan 8' }).click();
    await page.getByRole('heading', { name: 'Release the exact accepted service?' }).waitFor();
    await page.getByRole('button', { name: 'Release Plan 8', exact: true }).click();
    await page.getByText('Crew Lead owns field execution').waitFor();
    await page.getByRole('button', { name: 'All decisions' }).click();
    await page.getByText('No decisions waiting').waitFor();

    await page.getByRole('button', { name: 'Reset' }).click();
    await page.getByRole('button', { name: 'Open Canyon View service decision' }).click();
    await page.getByRole('button', { name: 'Resolve crew fit' }).click();
    await page.getByRole('button', { name: 'Confirm crew fit' }).click();
    await page.getByRole('button', { name: 'Review and release Plan 8' }).click();
    await page.getByRole('button', { name: 'Stale version' }).click();
    await page.getByRole('heading', { name: 'Plan 8 is no longer current.' }).waitFor();
    if (await page.evaluate(() => document.activeElement?.id) !== 'stale-title') {
      throw new Error(`${width}px did not focus the version conflict`);
    }
    if (await page.getByRole('button', { name: 'Release Plan 8', exact: true }).count()) {
      throw new Error(`${width}px allowed release of stale Plan 8`);
    }
    await page.getByRole('button', { name: 'Load current Plan 9' }).click();
    await page.getByRole('heading', { name: 'Draft Plan 9' }).waitFor();
    await page.getByRole('button', { name: 'Resolve crew fit' }).click();
    await page.getByRole('button', { name: 'Confirm crew fit' }).click();
    await page.getByRole('button', { name: 'Review and release Plan 9' }).waitFor();

    await page.getByRole('button', { name: 'Failed read' }).click();
    await page.getByRole('heading', { name: 'The current service could not be loaded.' }).waitFor();
    if (await page.evaluate(() => document.activeElement?.id) !== 'read-title') {
      throw new Error(`${width}px did not focus the unavailable state`);
    }
    if (await page.getByText('Accepted scope').count() || await page.getByRole('button', { name: /Release Plan/ }).count()) {
      throw new Error(`${width}px exposed service actions during failed read`);
    }
    await page.getByRole('button', { name: 'Retry service read' }).click();
    await page.getByRole('heading', { name: 'Draft Plan 9' }).waitFor();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (overflow > 1) throw new Error(`${width}px horizontal overflow: ${overflow}px`);
    const customerResponse = await page.goto(new URL('customer.html', baseUrl).toString(), { waitUntil: 'domcontentloaded' });
    if (customerResponse?.status() !== 200) throw new Error(`${width}px customer page returned ${customerResponse?.status()}`);
    await page.getByRole('heading', { name: 'One-time cleanup and pruning' }).waitFor();
    if (await page.getByText('Draft Plan 8').count() || await page.getByText('Crew fit and access').count()) {
      throw new Error(`${width}px customer view exposed provider plan details`);
    }
    await page.getByRole('button', { name: 'Ask for a revision' }).click();
    await page.getByText('Provider proposal owner revises the offer').waitFor();
    await page.getByRole('button', { name: 'Reset' }).click();
    await page.getByRole('button', { name: 'Review acceptance of v3' }).click();
    await page.getByRole('heading', { name: 'Accept proposal v3 for $420?' }).waitFor();
    await page.getByRole('button', { name: 'Stale proposal' }).click();
    await page.getByRole('heading', { name: 'Proposal v2 is no longer current.' }).waitFor();
    if (await page.getByRole('button', { name: 'Accept proposal v2' }).count()) {
      throw new Error(`${width}px allowed stale customer acceptance`);
    }
    await page.getByRole('button', { name: 'Load current proposal v3' }).click();
    await page.getByRole('button', { name: 'Review acceptance of v3' }).click();
    await page.getByRole('button', { name: 'Accept proposal v3', exact: true }).click();
    await page.getByText('Company Manager plans the service').waitFor();
    await page.getByText('No date or payment was confirmed.', { exact: false }).waitFor();
    await page.getByRole('button', { name: 'Reset' }).click();
    await page.getByRole('button', { name: 'Failed read' }).click();
    await page.getByRole('heading', { name: 'The current proposal could not be loaded.' }).waitFor();
    if (await page.getByText('$420').count() || await page.getByRole('button', { name: /Accept proposal/ }).count()) {
      throw new Error(`${width}px customer read failure exposed decision details`);
    }
    await page.getByRole('button', { name: 'Retry proposal read' }).click();
    await page.getByRole('button', { name: 'Review acceptance of v3' }).waitFor();
    const customerOverflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (customerOverflow > 1) throw new Error(`${width}px customer horizontal overflow: ${customerOverflow}px`);
    if (errors.length) throw new Error(`${width}px browser errors: ${errors.join('; ')}`);
    console.log(`${width}px: customer and manager decisions, correction, stale versions, failed reads, and layout passed`);
    await page.close();
  }
} finally {
  await browser.close();
}
