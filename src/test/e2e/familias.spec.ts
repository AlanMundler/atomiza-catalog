import { test, expect } from './test';

test.describe('Familias olfativas', () => {
  test('el hub lista familias y navega a una familia con productos', async ({ page }) => {
    await page.goto('familias/');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1')).toContainText('familia olfativa');
    const first = page.locator('.famhub-card').first();
    await expect(first).toBeVisible();
    const name = await first.locator('.famhub-card-title').textContent();

    await first.click();
    await expect(page).toHaveURL(/\/familias\/.+\//);
    await expect(page.locator('.product-card').first()).toBeVisible();
    expect(name?.trim().length).toBeGreaterThan(0);
  });

  test('decants ya no mezcla familias y enlaza al hub', async ({ page }) => {
    await page.goto('decants/');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.hub-fam')).toHaveCount(0);
    const link = page.locator('a[href$="familias/"]').first();
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/\/familias\/$/);
  });
});
