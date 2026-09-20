import { expect, type Locator, type Page } from '@playwright/test';

export async function expectActionAboveMobileWorkspaceNavigation(
  page: Page,
  action: Locator,
): Promise<void> {
  const navigation = page.locator('[data-mobile-workspace-navigation]');
  await expect(navigation).toBeVisible();
  await action.scrollIntoViewIfNeeded();
  await page.evaluate(() => new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()));
  }));

  const [actionBox, navigationBox] = await Promise.all([
    action.boundingBox(),
    navigation.boundingBox(),
  ]);
  expect(actionBox, 'The final action must have a rendered box.').not.toBeNull();
  expect(navigationBox, 'The mobile workspace navigation must have a rendered box.').not.toBeNull();
  expect(actionBox!.y + actionBox!.height).toBeLessThanOrEqual(navigationBox!.y);
}
