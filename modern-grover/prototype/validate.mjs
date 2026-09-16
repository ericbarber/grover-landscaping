import { chromium } from '../../frontend/node_modules/playwright/index.mjs';

const baseUrl = process.env.MODERN_GROVER_REVIEW_URL
  ?? 'http://127.0.0.1:5173/modern-grover/prototype/';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });

try {
  for (const width of [320, 390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 844 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const reviewResponse = await page.goto(new URL('../', baseUrl).toString(), { waitUntil: 'domcontentloaded' });
    if (reviewResponse?.status() !== 200) throw new Error(`${width}px review page returned ${reviewResponse?.status()}`);
    for (const linkName of ['Yard Owner proposal decision', 'Manager service prototype', 'Crew Lead field task', 'Manager field exception', 'Manager proof review', 'Yard Owner result', 'Property Manager portfolio', 'Company Owner risk']) {
      if (!await page.getByRole('link', { name: linkName }).count()) {
        throw new Error(`${width}px review page missing ${linkName}`);
      }
    }
    const reviewOverflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (reviewOverflow > 1) throw new Error(`${width}px review page overflow: ${reviewOverflow}px`);
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
    if (!await page.getByRole('link', { name: 'inspect the Crew Lead side' }).count()) {
      throw new Error(`${width}px missing the released plan's field study link`);
    }
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

    const fieldResponse = await page.goto(new URL('field.html', baseUrl).toString(), { waitUntil: 'domcontentloaded' });
    if (fieldResponse?.status() !== 200) throw new Error(`${width}px field page returned ${fieldResponse?.status()}`);
    await page.getByRole('heading', { name: 'Canyon View' }).waitFor();
    if (await page.getByText('$420').count()) throw new Error(`${width}px field view exposed customer price`);
    await page.getByRole('button', { name: 'Go offline' }).click();
    await page.getByRole('button', { name: 'Report access issue' }).click();
    if (await page.evaluate(() => document.activeElement?.id) !== 'issue-title') {
      throw new Error(`${width}px did not focus the field question`);
    }
    await page.getByLabel('Short field note').fill('Gate code <draft> does not work.');
    await page.getByRole('button', { name: 'Hold question in this tab' }).click();
    await page.getByText('Held in this tab · not sent').first().waitFor();
    await page.getByText('Gate code <draft> does not work.').waitFor();
    if (await page.locator('.field-note-preview draft').count()) {
      throw new Error(`${width}px rendered field note as markup`);
    }
    await page.getByRole('button', { name: 'Save walkway check' }).click();
    await page.getByText('2 held in tab').waitFor();
    await page.getByRole('button', { name: 'Failed read' }).click();
    await page.getByRole('heading', { name: 'The current route could not be loaded.' }).waitFor();
    if (await page.getByText('Gate code <draft> does not work.').count()) {
      throw new Error(`${width}px field read failure exposed the saved note`);
    }
    await page.getByRole('button', { name: 'Retry route read' }).click();
    await page.getByText('2 held in tab').waitFor();
    await page.getByRole('button', { name: 'Plan changed' }).click();
    await page.getByRole('heading', { name: 'Plan 9 was released while this tab held Plan 8 changes.' }).waitFor();
    if (await page.evaluate(() => document.activeElement?.id) !== 'field-conflict-title') {
      throw new Error(`${width}px did not focus the field conflict`);
    }
    if (await page.getByRole('button', { name: 'Load released Plan 9' }).count()) {
      throw new Error(`${width}px discarded device-held changes on version conflict`);
    }
    await page.getByText('2 held in tab').waitFor();

    await page.getByRole('button', { name: 'Reset' }).click();
    await page.getByRole('button', { name: 'Go offline' }).click();
    await page.getByRole('button', { name: 'Report access issue' }).click();
    await page.getByLabel('Short field note').fill('Gate code needs office check.');
    await page.getByRole('button', { name: 'Hold question in this tab' }).click();
    await page.getByRole('button', { name: 'Save walkway check' }).click();
    await page.getByRole('button', { name: 'Reconnect and sync' }).click();
    await page.getByText('Company Manager reviews the access question').waitFor();
    await page.getByText('No local changes').waitFor();
    if (!await page.getByRole('link', { name: 'inspect the manager exception review' }).count()) {
      throw new Error(`${width}px missing the manager exception study link`);
    }
    await page.getByRole('button', { name: 'Reset' }).click();
    await page.getByRole('button', { name: 'Plan changed' }).click();
    await page.getByRole('button', { name: 'Load released Plan 9' }).click();
    await page.getByText('Released Plan 9').first().waitFor();
    const fieldOverflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (fieldOverflow > 1) throw new Error(`${width}px field horizontal overflow: ${fieldOverflow}px`);

    const exceptionResponse = await page.goto(new URL('exception.html', baseUrl).toString(), { waitUntil: 'domcontentloaded' });
    if (exceptionResponse?.status() !== 200) throw new Error(`${width}px exception page returned ${exceptionResponse?.status()}`);
    await page.getByRole('heading', { name: 'Work waiting on the office' }).waitFor();
    const exceptionQueueOverflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (exceptionQueueOverflow > 1) throw new Error(`${width}px exception queue overflow: ${exceptionQueueOverflow}px`);
    await page.getByRole('button', { name: 'Open Canyon View field exception' }).click();
    await page.getByRole('heading', { name: 'Access question at Stop 1' }).waitFor();
    if (await page.getByRole('button', { name: 'Release revised Plan 9' }).count()) {
      throw new Error(`${width}px allowed release before access verification`);
    }
    await page.getByRole('button', { name: 'Review hold instruction' }).click();
    await page.getByRole('button', { name: 'Send hold instruction' }).click();
    await page.getByText('Company Manager verifies the access detail').waitFor();
    await page.getByRole('button', { name: 'Simulate verified access' }).click();
    await page.getByText('Plan 9 draft').first().waitFor();
    await page.getByRole('button', { name: 'Review revised Plan 9' }).click();
    await page.getByRole('heading', { name: 'Release revised Plan 9?' }).waitFor();
    await page.getByText('Proposal v3 · unchanged').waitFor();
    await page.getByRole('button', { name: 'Release revised Plan 9' }).click();
    await page.getByText('Crew Lead reviews released Plan 9').waitFor();
    if (!await page.getByRole('link', { name: 'inspect the Crew Lead side' }).count()) {
      throw new Error(`${width}px missing the revised field study link`);
    }
    if (!await page.getByRole('link', { name: 'jump to the later proof review moment' }).count()) {
      throw new Error(`${width}px missing the later proof study link`);
    }
    await page.getByRole('button', { name: 'Failed read' }).click();
    await page.getByRole('heading', { name: 'The current field request could not be loaded.' }).waitFor();
    if (await page.getByText('Proposal v3 · unchanged').count()) {
      throw new Error(`${width}px exposed exception details during failed read`);
    }
    await page.getByRole('button', { name: 'Retry exception read' }).click();
    await page.getByText('Crew Lead reviews released Plan 9').waitFor();
    const exceptionOverflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (exceptionOverflow > 1) throw new Error(`${width}px exception horizontal overflow: ${exceptionOverflow}px`);

    const proofResponse = await page.goto(new URL('proof.html', baseUrl).toString(), { waitUntil: 'domcontentloaded' });
    if (proofResponse?.status() !== 200) throw new Error(`${width}px proof page returned ${proofResponse?.status()}`);
    await page.getByRole('heading', { name: 'Work waiting for proof review' }).waitFor();
    const proofQueueOverflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (proofQueueOverflow > 1) throw new Error(`${width}px proof queue overflow: ${proofQueueOverflow}px`);
    await page.getByRole('button', { name: 'Open Canyon View proof package' }).click();
    await page.getByText('Rejected: the record does not show the completed pruning area.').waitFor();
    if (await page.getByRole('button', { name: /Deliver package/ }).count()) {
      throw new Error(`${width}px allowed delivery of rejected proof`);
    }
    await page.getByRole('button', { name: 'Review correction request' }).click();
    await page.getByRole('button', { name: 'Request correction' }).click();
    await page.getByText('Crew Lead supplies a clearer after photo').waitFor();
    await page.getByRole('button', { name: 'Corrected evidence' }).click();
    await page.getByRole('button', { name: 'Review package 2 delivery' }).click();
    await page.getByRole('heading', { name: 'Deliver the reviewed result?' }).waitFor();
    await page.getByRole('button', { name: 'Deliver package 2' }).click();
    await page.getByText('Yard Owner reviews the delivered result').waitFor();
    if (!await page.getByRole('link', { name: 'inspect the Yard Owner result' }).count()) {
      throw new Error(`${width}px missing the customer outcome study link`);
    }
    await page.getByRole('button', { name: 'Reset' }).click();
    await page.getByRole('button', { name: 'Corrected evidence' }).click();
    await page.getByRole('button', { name: 'Review package 2 delivery' }).click();
    await page.getByRole('button', { name: 'Newer package' }).click();
    await page.getByRole('heading', { name: 'Package 2 is no longer current.' }).waitFor();
    if (await page.getByRole('button', { name: 'Deliver package 2' }).count()) {
      throw new Error(`${width}px allowed stale proof delivery`);
    }
    await page.getByRole('button', { name: 'Load package 3' }).click();
    await page.getByRole('button', { name: 'Review package 3 delivery' }).waitFor();
    await page.getByRole('button', { name: 'Failed read' }).click();
    await page.getByRole('heading', { name: 'The current completion package could not be loaded.' }).waitFor();
    if (await page.locator('main').getByText('After-photo record').count()) {
      throw new Error(`${width}px exposed proof details during failed read`);
    }
    await page.getByRole('button', { name: 'Retry proof read' }).click();
    await page.getByRole('button', { name: 'Review package 3 delivery' }).waitFor();
    const proofOverflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (proofOverflow > 1) throw new Error(`${width}px proof horizontal overflow: ${proofOverflow}px`);

    const outcomeResponse = await page.goto(new URL('outcome.html', baseUrl).toString(), { waitUntil: 'domcontentloaded' });
    if (outcomeResponse?.status() !== 200) throw new Error(`${width}px outcome page returned ${outcomeResponse?.status()}`);
    await page.getByRole('heading', { name: 'Cleanup and pruning completed' }).waitFor();
    const customerText = await page.locator('main').innerText();
    if (/rejected|Crew Lead|Plan 8|Plan 9|invoice|payment/i.test(customerText)) {
      throw new Error(`${width}px customer outcome exposed private or gated detail`);
    }
    await page.getByRole('button', { name: 'Review proof details' }).click();
    await page.getByText('No actual photo is available here').waitFor();
    await page.getByRole('button', { name: 'Review next care idea' }).click();
    await page.getByRole('button', { name: 'Request proposal' }).click();
    await page.getByText('Provider prepares a separate proposal').waitFor();
    await page.getByRole('button', { name: 'Failed read' }).click();
    await page.getByRole('heading', { name: 'Your reviewed result could not be loaded.' }).waitFor();
    if (await page.getByText('Cleanup and pruning completed').count()) {
      throw new Error(`${width}px exposed customer result during failed read`);
    }
    await page.getByRole('button', { name: 'Retry result read' }).click();
    await page.getByText('Provider prepares a separate proposal').waitFor();
    const outcomeOverflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (outcomeOverflow > 1) throw new Error(`${width}px outcome horizontal overflow: ${outcomeOverflow}px`);

    const portfolioResponse = await page.goto(new URL('portfolio.html', baseUrl).toString(), { waitUntil: 'domcontentloaded' });
    if (portfolioResponse?.status() !== 200) throw new Error(`${width}px portfolio page returned ${portfolioResponse?.status()}`);
    await page.getByRole('heading', { name: 'Your properties today' }).waitFor();
    await page.locator('main').getByText('Sage Lane', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Open Canyon View access request' }).click();
    await page.getByRole('heading', { name: 'Confirm approved access guidance' }).waitFor();
    if (await page.evaluate(() => document.activeElement?.id) !== 'portfolio-title') throw new Error(`${width}px portfolio detail focus missing`);
    if (/Plan 8|Plan 9|\$420|Avery/i.test(await page.locator('main').innerText())) {
      throw new Error(`${width}px portfolio exposed private route information`);
    }
    await page.getByRole('button', { name: 'Confirm north entrance' }).click();
    await page.getByRole('heading', { name: 'Send approved north entrance guidance?' }).waitFor();
    await page.getByRole('button', { name: 'New request' }).click();
    await page.getByRole('heading', { name: 'Request 2 is no longer current.' }).waitFor();
    if (await page.getByRole('button', { name: 'Send property guidance' }).count()) throw new Error(`${width}px stale portfolio response remained actionable`);
    await page.getByRole('button', { name: 'Load current request 3' }).click();
    await page.getByRole('button', { name: 'Confirm north entrance' }).click();
    await page.getByRole('button', { name: 'Send property guidance' }).click();
    await page.getByText('Company Manager verifies and updates the crew').waitFor();
    await page.getByRole('button', { name: 'Reset' }).click();
    await page.getByRole('button', { name: 'Open Canyon View access request' }).click();
    await page.getByRole('button', { name: 'Cannot confirm entrance' }).click();
    await page.getByRole('heading', { name: 'Tell the office the entrance is unconfirmed?' }).waitFor();
    await page.getByRole('button', { name: 'Flag entrance unconfirmed' }).click();
    await page.getByText('Company Manager seeks verified access').waitFor();
    await page.getByRole('button', { name: 'Failed read' }).click();
    await page.getByRole('heading', { name: 'The current portfolio could not be loaded.' }).waitFor();
    if (await page.locator('main').getByText('Canyon View').count()) throw new Error(`${width}px failed portfolio read exposed property`);
    await page.getByRole('button', { name: 'Retry portfolio read' }).click();
    await page.getByText('Company Manager seeks verified access').waitFor();
    await page.getByRole('button', { name: 'Access ended' }).click();
    await page.getByRole('heading', { name: 'Your property access is no longer active.' }).waitFor();
    if (await page.locator('main').getByText('Canyon View').count() || await page.getByRole('button', { name: 'Confirm north entrance' }).count()) throw new Error(`${width}px ended access exposed portfolio`);
    const portfolioOverflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (portfolioOverflow > 1) throw new Error(`${width}px portfolio horizontal overflow: ${portfolioOverflow}px`);

    const ownerResponse = await page.goto(new URL('owner.html', baseUrl).toString(), { waitUntil: 'domcontentloaded' });
    if (ownerResponse?.status() !== 200) throw new Error(`${width}px company owner page returned ${ownerResponse?.status()}`);
    await page.getByRole('heading', { name: 'What needs an accountable operator' }).waitFor();
    await page.getByRole('button', { name: 'Open Canyon View company risk' }).click();
    await page.getByRole('heading', { name: 'Accepted work is waiting on access' }).waitFor();
    await page.getByRole('button', { name: 'Review assignment' }).click();
    await page.getByRole('heading', { name: 'Assign Avery to this risk?' }).waitFor();
    await page.getByRole('button', { name: 'Status changed' }).click();
    await page.getByRole('heading', { name: 'This risk already has an operator.' }).waitFor();
    if (await page.getByRole('button', { name: 'Assign Avery' }).count()) throw new Error(`${width}px stale owner assignment remained actionable`);
    await page.getByRole('button', { name: 'Load current assignment' }).click();
    await page.getByRole('heading', { name: 'Avery · Company Manager' }).waitFor();
    await page.getByRole('button', { name: 'Reset' }).click();
    await page.getByRole('button', { name: 'Open Canyon View company risk' }).click();
    await page.getByRole('button', { name: 'Review assignment' }).click();
    await page.getByRole('button', { name: 'Assign Avery', exact: true }).click();
    await page.getByText('No route was released or operator notified.').waitFor();
    await page.getByRole('button', { name: 'Failed read' }).click();
    await page.getByRole('heading', { name: 'The current company work could not be loaded.' }).waitFor();
    if (await page.locator('main').getByText('Canyon View').count()) throw new Error(`${width}px failed company read exposed service`);
    await page.getByRole('button', { name: 'Retry company read' }).click();
    await page.getByRole('heading', { name: 'Avery · Company Manager' }).waitFor();
    const ownerOverflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (ownerOverflow > 1) throw new Error(`${width}px company owner horizontal overflow: ${ownerOverflow}px`);
    if (errors.length) throw new Error(`${width}px browser errors: ${errors.join('; ')}`);
    console.log(`${width}px: service, field, proof, portfolio, and company tasks passed`);
    await page.close();
  }
} finally {
  await browser.close();
}
