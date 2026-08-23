import { expect, test } from '@playwright/test';

const deliveredReport = {
  report_status: 'delivered',
  checklist_progress: 100,
  before_photos: 1,
  after_photos: 1,
  issue_photos: 0,
  service: {
    customer_name: 'Oak Street Residence',
    property_address: '123 Oak Street',
    scheduled_date: '2026-08-22',
    checklist: [
      { label: 'Confirmed service arrival', completed: true },
      { label: 'Mowed and edged lawn', completed: true },
      { label: 'Cleared hard surfaces', completed: true },
      { label: 'Captured completion photos', completed: true },
    ],
  },
  photo_evidence: [
    {
      photo_type: 'before',
      file_name: 'front-yard-before.jpg',
      image_url: '/proof/before.jpg',
    },
    {
      photo_type: 'after',
      file_name: 'front-yard-after.jpg',
      image_url: '/proof/after.jpg',
    },
  ],
  completed_recommendations: [
    {
      service_name: 'Hedge trim',
      service_description: 'Shaped the front hedge and removed clippings.',
      quantity: 1,
    },
  ],
  captured_at_epoch_seconds: 1787392800,
};

const customerProposal = {
  id: 'bid_internal_identifier',
  status: 'sent',
  line_items: [
    {
      id: 'line_internal_identifier',
      service_id: 'service_internal_identifier',
      service_name: 'Irrigation repair',
      service_description: 'Replace two damaged sprinkler heads and test coverage.',
      quantity: 2,
      unit_price_cents: 8500,
      note: 'manager_note_internal',
    },
    {
      service_name: 'Soil conditioning',
      service_description: 'Apply soil conditioner to the affected turf area.',
      quantity: 1,
      unit_price_cents: 4500,
    },
  ],
  customer_message: 'We found this additional work during today’s service.',
  total_cents: 21500,
  sent_at: '2026-08-22T16:00:00Z',
  responded_at: null,
  expires_at: '2026-08-29T16:00:00Z',
};

test('shared completion proof presents a customer-safe responsive delivery record', async ({ page }) => {
  await page.route('**/reports/customer-safe', (route) => route.fulfill({
    contentType: 'application/json',
    json: deliveredReport,
  }));

  await page.goto('/report-view/customer-safe');

  await expect(page.getByText('Secure customer link')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Service completion report' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '123 Oak Street' })).toBeVisible();
  await expect(page.getByText('Delivered', { exact: true })).toBeVisible();
  await expect(page.getByText('front-yard-before.jpg')).toBeVisible();
  await expect(page.getByText('front-yard-after.jpg')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Approved recommendations delivered' })).toBeVisible();
  await expect(page.getByText('These customer-approved additions are complete and included in this service proof.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Customer-safe record' })).toBeVisible();
  await expect(page.getByText('org_internal_do_not_show')).toHaveCount(0);
  await expect(page.getByText('crew_internal_do_not_show')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('shared completion proof can retry a temporarily unavailable secure link', async ({ page }) => {
  let requestCount = 0;
  await page.route('**/reports/retry-report', (route) => {
    requestCount += 1;
    if (requestCount <= 2) {
      return route.fulfill({
        status: 503,
        contentType: 'application/json',
        json: {
          error: 'shared_report_unavailable',
          message: 'The persisted shared report could not be loaded.',
        },
      });
    }
    return route.fulfill({ contentType: 'application/json', json: deliveredReport });
  });

  await page.goto('/report-view/retry-report');
  await expect(page.getByRole('heading', { name: 'Unable to open this completion report' })).toBeVisible();
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('heading', { name: 'Service completion report' })).toBeVisible();
  expect(requestCount).toBe(3);
});

test('shared proposal records a confirmed customer decision without internal bid details', async ({ page }) => {
  await page.route('**/shared-bids/customer-proposal**', async (route) => {
    if (route.request().method() === 'POST') {
      const requestBody = route.request().postDataJSON() as { decision: string };
      expect(requestBody.decision).toBe('approve');
      return route.fulfill({
        contentType: 'application/json',
        json: {
          ...customerProposal,
          status: 'approved',
          responded_at: '2026-08-22T17:00:00Z',
        },
      });
    }
    return route.fulfill({ contentType: 'application/json', json: customerProposal });
  });

  await page.goto('/bid-review/customer-proposal');

  await expect(page.getByText('Secure customer link')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Project proposal' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Work and pricing' })).toBeVisible();
  await expect(page.getByText('Irrigation repair')).toBeVisible();
  await expect(page.getByText('$215.00')).toBeVisible();
  await expect(page.getByText('manager_note_internal')).toHaveCount(0);
  await expect(page.getByText('bid_internal_identifier')).toHaveCount(0);

  await page.getByRole('button', { name: 'Approve proposal' }).click();
  await expect(page.getByRole('heading', { name: 'Confirm your response' })).toBeVisible();
  await page.getByRole('button', { name: 'Confirm approval' }).click();

  await expect(page.getByRole('heading', { name: 'Response recorded' })).toBeVisible();
  await expect(page.getByText('This proposal was approved.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Customer-safe record' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('shared proposal explains a closed customer link without offering a decision', async ({ page }) => {
  await page.route('**/shared-bids/closed-proposal', (route) => route.fulfill({
    status: 404,
    contentType: 'application/json',
    json: {
      error: 'shared_bid_not_found',
      message: 'Shared bid link was not found.',
    },
  }));

  await page.goto('/bid-review/closed-proposal');

  await expect(page.getByRole('heading', { name: 'Unable to open this proposal' })).toBeVisible();
  await expect(page.getByText('This proposal link is invalid, expired, revoked, or no longer available.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Approve proposal' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Decline proposal' })).toHaveCount(0);
});
