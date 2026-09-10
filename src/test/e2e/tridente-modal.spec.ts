import { test, expect } from './test';

const HOME = '.';

test.describe('Tridente promo modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(HOME);
    await page.evaluate(() => localStorage.clear());
    await page.waitForLoadState('networkidle');
  });

  test('la tira Promociones abre el flotante con la regla y el progreso', async ({ page }) => {
    await page.locator('[data-open-tridente]').click();

    const dialog = page.locator('#tridente-modal dialog[open]');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('3 decants');
    await expect(dialog).toContainText('$2.000');
    // El progreso en vivo reemplaza el placeholder inicial.
    await expect(dialog.locator('[data-tridente-live]')).not.toHaveText('…');
    await expect(dialog.locator('[data-tridente-live]')).toContainText('Tu pedido está vacío');

    await page.keyboard.press('Escape');
    await expect(page.locator('#tridente-modal dialog[open]')).toHaveCount(0);
  });
});
