import { test, expect } from './test';
import type { Page } from '@playwright/test';

async function openZoom(page: Page) {
  const dialog = page.locator('#image-zoom-modal dialog');
  await page.locator('[data-main-image]').click();
  // El handler del clic se bindea al inicializarse la página; si el clic cae
  // antes (race de carga), reintentamos: el segundo clic siempre abre.
  await expect(dialog).toHaveAttribute('open', '', { timeout: 3000 }).catch(async () => {
    await page.locator('[data-main-image]').click();
    await expect(dialog).toHaveAttribute('open', '', { timeout: 3000 });
  });
}

test.describe('Image zoom popout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('producto/hawas-ice/');
    await page.locator('[data-main-image]').waitFor();
    await page.waitForLoadState('networkidle');
  });

  test('abre el popout al hacer clic en la foto y cierra con la X', async ({ page }) => {
    const dialog = page.locator('#image-zoom-modal dialog');
    await expect(dialog).not.toHaveAttribute('open', '', { timeout: 5000 });

    await openZoom(page);

    await page.locator('#image-zoom-modal [data-modal-close]').click();
    await expect(dialog).not.toHaveAttribute('open', '');
  });

  test('vuelve a abrir tras cerrar con Escape', async ({ page }) => {
    const dialog = page.locator('#image-zoom-modal dialog');
    await openZoom(page);

    await page.keyboard.press('Escape');
    await expect(dialog).not.toHaveAttribute('open', '');

    await openZoom(page);
    await expect(dialog).toHaveAttribute('open', '');
  });

  test('muestra la imagen ampliada y no deja el scroll del body bloqueado al cerrar', async ({
    page,
  }) => {
    await openZoom(page);

    await expect
      .poll(() => page.evaluate(() => window.getComputedStyle(document.body).overflow))
      .toBe('hidden');

    await page.keyboard.press('Escape');
    await expect
      .poll(() => page.evaluate(() => window.getComputedStyle(document.body).overflow))
      .not.toBe('hidden');
  });
});

