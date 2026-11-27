import { test, expect } from './test';

/**
 * Cobertura e2e del hub de decants tras extraer el controlador compartido:
 * búsqueda + empty state y chip de casa + contador. Los dos flujos los maneja
 * ahora `createListController`, así que estos casos vigilan que el cableado
 * extraído siga funcionando contra el DOM real.
 */

test.describe('Hub de decants', () => {
  test('la búsqueda filtra cards y muestra el empty state con basura', async ({ page }) => {
    await page.goto('decants/');
    await page.waitForLoadState('networkidle');

    const input = page.locator('input[type=search]');
    const empty = page.locator('.hub-empty');

    await input.fill('aventus');
    await expect(page.locator('[data-hub-count]')).toHaveText(/^\d+ aromas?$/);
    await expect(page).toHaveURL(/[?&]search=aventus/);
    const visible = page.locator('.hub-card:visible');
    expect(await visible.count()).toBeGreaterThan(0);
    await expect
      .poll(async () =>
        visible.evaluateAll((els) =>
          els.every((el) => (el.getAttribute('data-search') || '').includes('aventus'))
        )
      )
      .toBe(true);

    await input.fill('zzzzzz');
    await expect(empty).toBeVisible();
    await expect(page.locator('.hub-grid')).toBeHidden();
    await expect(page.locator('[data-hub-count]')).toHaveText('0 aromas');
  });

  test('el chip de casa filtra y actualiza el contador', async ({ page }) => {
    await page.goto('decants/');
    await page.waitForLoadState('networkidle');

    const creed = page.locator('[data-casa-chip][data-casa-slug="creed"]');
    await expect(creed).toHaveCount(1);
    await creed.click();

    await expect(page).toHaveURL(/[?&]casa=creed/);
    await expect(creed).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-casa-chip][data-casa-slug="all"]')).toHaveAttribute(
      'aria-pressed',
      'false'
    );

    const count = page.locator('[data-hub-count]');
    await expect(count).toHaveText(/^\d+ aromas? de Creed$/);
    const total = Number((await count.textContent())?.match(/^(\d+)/)?.[1] || 0);
    expect(total).toBeGreaterThan(0);

    const visible = page.locator('.hub-card:visible');
    expect(await visible.count()).toBe(total);
    await expect
      .poll(async () =>
        visible.evaluateAll((els) => els.every((el) => el.getAttribute('data-casa') === 'Creed'))
      )
      .toBe(true);
  });
});
