import { expect, test } from '@playwright/test';
import { isAllowedStudyOrigin } from './study-runtime';

const studyBaseUrl = process.env.E2E_BASE_URL;
const checkpoint = process.env.YARDFOLIO_STUDY_CHECKPOINT;

test.beforeAll(() => {
  expect(
    isAllowedStudyOrigin(studyBaseUrl),
    'E2E_BASE_URL must be the isolated loopback or Tailscale port-5174 study origin',
  ).toBe(true);
  expect(
    checkpoint,
    'YARDFOLIO_STUDY_CHECKPOINT must name the prepared fixture checkpoint',
  ).toBe('open_customer_decision');
});

test('reaches the current Canyon proposal from the normal owner workspace entry', async ({ page }) => {
  await page.goto('/app');
  const reviewer = page.getByLabel('Local reviewer account');
  await reviewer.selectOption('property-owner-canyon');
  await expect(reviewer).toHaveValue('property-owner-canyon');

  const continueSetup = page.getByRole('link', { name: /Continue care setup/ });
  await expect(continueSetup).toHaveAttribute('href', '/app/yard-owner');
  await continueSetup.click();
  await expect(page).toHaveURL(/\/app\/yard-owner$/);

  await page.getByRole('button', { name: 'Build or review yard brief' }).click();
  await page.getByRole('button', { name: 'Connect care', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Compare the exact offer before deciding' }))
    .toBeVisible();

  const currentProposal = page.locator('li')
    .filter({ hasText: 'Canyon View one-time yard cleanup' })
    .filter({ hasText: 'Version 3' })
    .filter({ hasText: 'Ready for your decision' });
  await expect(currentProposal).toHaveCount(1);
  await expect(currentProposal.getByText('$420.00 fixed price')).toBeVisible();
  await expect(currentProposal.getByRole('button', { name: 'Review and accept' })).toBeVisible();
  await expect(page.getByText('Replaced by a newer version')).toHaveCount(2);
});
