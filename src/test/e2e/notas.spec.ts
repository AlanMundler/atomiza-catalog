import { test, expect } from './test';

test.describe('Notas olfativas', () => {
  test('el hub lista las 8 notas y navega a una con productos', async ({ page }) => {
    await page.goto('notas/');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1')).toContainText('nota');
    const cards = page.locator('.notahub-card');
    await expect(cards).toHaveCount(8);

    await cards.first().click();
    await expect(page).toHaveURL(/\/notas\/.+\//);
    await expect(page.locator('.product-card').first()).toBeVisible();
  });

  test('decants enlaza al hub de notas y ya no mezcla familias', async ({ page }) => {
    await page.goto('decants/');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.hub-fam')).toHaveCount(0);
    const link = page.locator('a[href$="notas/"]').first();
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/\/notas\/$/);
  });
});
