import { expect, test } from '@playwright/test';
import { isAllowedStudyOrigin } from './study-runtime';

const studyBaseUrl = process.env.E2E_BASE_URL;

test.beforeAll(() => {
  expect(
    isAllowedStudyOrigin(studyBaseUrl),
    'E2E_BASE_URL must be the isolated loopback or Tailscale port-5174 study origin',
  ).toBe(true);
});

test('opens normal entry through the isolated API proxy and selects a study owner', async ({ page }) => {
  const apiResponses: Array<{ path: string; status: number }> = [];
  const corsErrors: string[] = [];
  page.on('response', (response) => {
    const url = new URL(response.url());
    if (url.pathname.startsWith('/study-api/')) {
      apiResponses.push({ path: url.pathname, status: response.status() });
    }
  });
  page.on('console', (message) => {
    if (message.type() === 'error' && message.text().includes('CORS policy')) {
      corsErrors.push(message.text());
    }
  });

  await page.goto('/app');
  await expect(page.getByText('LOCAL REVIEW ONLY', { exact: true })).toBeVisible();

  const reviewer = page.getByLabel('Local reviewer account');
  await expect(reviewer.locator('option[value="property-owner-canyon"]')).toHaveText(
    'Canyon — Study Property Owner',
  );
  await expect(reviewer.locator('option[value="property-owner-sage"]')).toHaveText(
    'Sage — Study Property Owner',
  );
  await reviewer.selectOption('property-owner-canyon');
  await expect(reviewer).toHaveValue('property-owner-canyon');
  await expect(
    page.getByRole('complementary').locator('span.font-semibold').first(),
  ).toHaveText('Canyon — Study Property Owner');

  const readiness = await page.evaluate(async () => {
    const response = await fetch('/study-api/health/ready');
    return { status: response.status, body: await response.json() };
  });
  expect(readiness).toEqual({
    status: 200,
    body: {
      status: 'ok',
      service: 'yardfolio-api',
      persistence: 'postgres',
      database_name: 'yardfolio_study',
    },
  });
  expect(apiResponses).toContainEqual({ path: '/study-api/auth/config', status: 200 });
  expect(corsErrors).toEqual([]);
});
