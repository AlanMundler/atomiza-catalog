import { test, expect, type Page } from '@playwright/test';

const HOME = '.';

async function seedCart(page: Page, items: unknown[]) {
  await page.goto(HOME);
  await page.evaluate(({ items }) => {
    localStorage.setItem(
      'atomiza-cart',
      JSON.stringify({ items, updatedAt: Date.now() })
    );
  }, { items });
  await page.reload();
  await page.waitForLoadState('networkidle');
}

test.describe('Cart consistency', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(HOME);
    await page.evaluate(() => localStorage.clear());
    await page.waitForLoadState('networkidle');
  });

  test('drawer subtotal uses the live catalog price, not the stale snapshot', async ({ page }) => {
    await seedCart(page, [
      {
        perfumeId: 'luminous-sahara',
        size: { ml: 5, price: 5000, stock: 2 },
        quantity: 2
      }
    ]);

    await page.click('[data-cart-trigger]');
    await page.waitForTimeout(300);

    // Precio unitario y subtotal resueltos contra el catálogo (6000, no 5000)
    await expect(page.locator('.cart-item-price')).toHaveText('$6.000');
    await expect(page.locator('.cart-item-line-total')).toHaveText('$12.000');
    await expect(page.locator('.order-summary-line--total .order-summary-value')).toHaveText('$12.000');
  });

  test('out-of-stock items are shown but excluded from totals and order', async ({ page }) => {
    await seedCart(page, [
      {
        perfumeId: 'luminous-sahara',
        size: { ml: 5, price: 6000, stock: 10 },
        quantity: 1
      },
      {
        perfumeId: 'hawas-black',
        size: { ml: 5, price: 10000, stock: 0 },
        quantity: 1
      }
    ]);

    await page.click('[data-cart-trigger]');
    await page.waitForTimeout(300);

    // Ambos items visibles; el sin stock marcado y grisado
    await expect(page.locator('.cart-item')).toHaveCount(2);
    const outOfStockItem = page.locator('.cart-item--unavailable');
    await expect(outOfStockItem).toHaveCount(1);
    await expect(outOfStockItem).toContainText('SIN STOCK');

    // Subtotal solo con lo disponible (6000, no 16000)
    await expect(page.locator('.order-summary-line--total .order-summary-value')).toHaveText('$6.000');
    await expect(page.locator('.order-summary-note').first()).toContainText(
      'Un perfume quedó sin stock y no se incluye en el total'
    );

    // El pedido excluye el item sin stock y avisa
    await page.click('[data-finalize-order]');
    await page.waitForTimeout(300);
    const preview = page.locator('#order-preview');
    await expect(preview).toHaveValue(/Luminous Sahara/);
    await expect(preview).not.toHaveValue(/Hawas Black/);
    await expect(preview).toHaveValue(/TOTAL: \$6\.000/);
    await expect(preview).toHaveValue(/Un perfume quedó sin stock y no se incluyó\./);
  });
});

test.describe('Mobile menu aria state', () => {
  test.use({ viewport: { width: 800, height: 600 } });

  test('aria-expanded stays in sync after closing via backdrop, Escape and trigger', async ({ page }) => {
    await page.goto(HOME);
    await page.waitForLoadState('networkidle');

    const trigger = page.locator('[data-menu-trigger]');
    const drawer = page.locator('#mobile-drawer .drawer');

    // Abrir por trigger
    await trigger.click();
    await expect(drawer).toHaveClass(/drawer--open/);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    // Cerrar por backdrop: el trigger debe quedar en false
    await page.mouse.click(760, 300);
    await expect(drawer).not.toHaveClass(/drawer--open/);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    // El primer tap vuelve a abrir (era el bug del doble tap)
    await trigger.click();
    await expect(drawer).toHaveClass(/drawer--open/);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    // Cerrar con Escape
    await page.keyboard.press('Escape');
    await expect(drawer).not.toHaveClass(/drawer--open/);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    // Reabrir con un tap
    await trigger.click();
    await expect(drawer).toHaveClass(/drawer--open/);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    // Cerrar por el botón X
    await page.click('[data-drawer-close]');
    await expect(drawer).not.toHaveClass(/drawer--open/);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });
});
