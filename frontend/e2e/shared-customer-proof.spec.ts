import { expect, test } from '@playwright/test';

const deliveredReport = {
  report_id: 'report_customer_safe',
  job_id: 'job_customer_safe',
  report_status: 'delivered',
  persisted: true,
  ready_for_customer: true,
  readiness_blockers: [],
  checklist_progress: 100,
  before_photos: 1,
  after_photos: 1,
  issue_photos: 0,
  pending_add_ons: 0,
  route_stop: null,
  share_url: '/report-view/customer-safe',
  job: {
    id: 'job_customer_safe',
    organization_id: 'org_internal_do_not_show',
    assigned_crew_id: 'crew_internal_do_not_show',
    customer_name: 'Oak Street Residence',
    property_address: '123 Oak Street',
    status: 'completed',
    scheduled_date: '2026-08-22',
    before_photos: 1,
    after_photos: 1,
    checklist_items: 4,
    completed_checklist_items: 4,
    checklist: [
      { id: 'arrival', label: 'Confirmed service arrival', completed: true },
      { id: 'mow', label: 'Mowed and edged lawn', completed: true },
      { id: 'cleanup', label: 'Cleared hard surfaces', completed: true },
      { id: 'proof', label: 'Captured completion photos', completed: true },
    ],
  },
  account: {
    job_id: 'job_customer_safe',
    account_id: 'account_internal_do_not_show',
    customer_name: 'Oak Street Residence',
    billing_model: 'per_job',
    payment_status: 'paid',
    service_approval_status: 'approved',
    contracted_services_per_period: 1,
    completed_services_this_period: 1,
    billing_notes: 'Internal billing note that must not appear in shared proof.',
  },
  photo_evidence: [
    {
      id: 'photo_before',
      job_id: 'job_customer_safe',
      photo_type: 'before',
      file_name: 'front-yard-before.jpg',
      content_type: 'image/jpeg',
      object_key: 'internal/before.jpg',
      status: 'uploaded',
      upload_mode: 'presigned',
      display_url: '/proof/before.jpg',
      thumbnail_url: null,
    },
    {
      id: 'photo_after',
      job_id: 'job_customer_safe',
      photo_type: 'after',
      file_name: 'front-yard-after.jpg',
      content_type: 'image/jpeg',
      object_key: 'internal/after.jpg',
      status: 'uploaded',
      upload_mode: 'presigned',
      display_url: '/proof/after.jpg',
      thumbnail_url: null,
    },
  ],
  completed_add_ons: [
    {
      id: 'addon_trim',
      job_id: 'job_customer_safe',
      service_name: 'Hedge trim',
      service_description: 'Shaped the front hedge and removed clippings.',
      quantity: 1,
      unit_price_cents: 4500,
      note: 'Internal field note that must not appear in shared proof.',
      status: 'completed',
    },
  ],
  snapshot_metadata: {
    snapshot_version: 1,
    report_id: 'report_customer_safe',
    job_id: 'job_customer_safe',
    captured_at_epoch_seconds: 1787392800,
    evidence: {
      before_photos: 1,
      after_photos: 1,
      issue_photos: 0,
      total_photo_evidence: 2,
      completed_add_ons: 1,
    },
  },
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
  await expect(page.getByRole('heading', { name: 'Completed add-on work' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Customer-safe record' })).toBeVisible();
  await expect(page.getByText('Internal billing note that must not appear in shared proof.')).toHaveCount(0);
  await expect(page.getByText('Internal field note that must not appear in shared proof.')).toHaveCount(0);
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
