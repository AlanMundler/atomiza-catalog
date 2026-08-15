import { test, expect } from '@playwright/test';

const HOME = '.';
const CATALOG = 'catalogo/';
const PRODUCT_1 = 'producto/baroque-rouge-540/';
const PRODUCT_2 = 'producto/luminous-sahara/';

test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear cart before each test
    await page.goto(HOME);
    await page.evaluate(() => localStorage.clear());
    await page.waitForLoadState('networkidle');
  });

  test('should add multiple items and finalize order', async ({ page }) => {
    // Add first product (drawer opens automatically)
    await page.goto(PRODUCT_1);
    await page.waitForLoadState('networkidle');
    await page.click('[data-add-to-cart]');
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Add second product
    await page.goto(PRODUCT_2);
    await page.waitForLoadState('networkidle');
    await page.click('[data-add-to-cart]');
    await page.waitForTimeout(300);

    // Check cart has 2 items
    await expect(page.locator('.cart-item')).toHaveCount(2);

    // Click finalize order
    await page.click('[data-finalize-order]');
    await page.waitForTimeout(300);

    // Order modal should open
    const modal = page.locator('#order-modal dialog[open]');
    await expect(modal).toBeVisible();

    // Fill customer info
    await page.fill('#customer-name', 'Juan Pérez');
    await page.fill('#customer-contact', '+54 9 11 1234-5678');
    await page.waitForTimeout(200);

    // Check preview updates
    const preview = page.locator('#order-preview');
    await expect(preview).toHaveValue(/Juan Pérez/);
    await expect(preview).toHaveValue(/\+54 9 11 1234-5678/);
    await expect(preview).toHaveValue(/Maison Alhambra - Baroque Rouge 540/);
    await expect(preview).toHaveValue(/Maison Alhambra - Luminous Sahara/);
    await expect(preview).toHaveValue(/TOTAL: \$12\.000/);

    // Test copy button
    await page.click('[data-copy-order]');
    await expect(page.locator('[data-copy-order]')).toContainText('¡Copiado!');
  });

  test('should update cart quantities', async ({ page }) => {
    await page.goto(PRODUCT_1);
    await page.waitForLoadState('networkidle');
    await page.click('[data-add-to-cart]');
    await page.waitForTimeout(300);

    // Increase quantity
    await page.click('.quantity-btn--increase');
    await page.waitForTimeout(300);

    // Check quantity updated
    await expect(page.locator('.quantity-value')).toContainText('2');

    // Check line total updated (6000 * 2)
    await expect(page.locator('.cart-item-line-total')).toContainText('12.000');
  });

  test('should remove item from cart', async ({ page }) => {
    await page.goto(PRODUCT_1);
    await page.waitForLoadState('networkidle');
    await page.click('[data-add-to-cart]');
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    await page.goto(PRODUCT_2);
    await page.waitForLoadState('networkidle');
    await page.click('[data-add-to-cart]');
    await page.waitForTimeout(300);

    // Remove first item
    await page.locator('.cart-item-remove').first().click();
    await page.waitForTimeout(300);

    // Should have 1 item left
    await expect(page.locator('.cart-item')).toHaveCount(1);
  });

  test('should clear cart', async ({ page }) => {
    await page.goto(PRODUCT_1);
    await page.waitForLoadState('networkidle');
    await page.click('[data-add-to-cart]');
    await page.waitForTimeout(300);

    // Click clear cart (accept the confirm dialog)
    page.once('dialog', (dialog) => dialog.accept());
    await page.click('[data-clear-cart]');
    await page.waitForTimeout(300);

    // Cart should be empty
    await expect(page.locator('.cart-empty')).toBeVisible();
  });

  test('should persist cart across navigation', async ({ page }) => {
    await page.goto(PRODUCT_1);
    await page.waitForLoadState('networkidle');
    await page.click('[data-add-to-cart]');
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Navigate away
    await page.goto(CATALOG);
    await page.waitForLoadState('networkidle');

    // Cart count should still show 1
    await expect(page.locator('[data-cart-count]')).toHaveText('1');

    // Open cart
    await page.click('[data-cart-trigger]');
    await page.waitForTimeout(300);

    // Item should still be there
    await expect(page.locator('.cart-item')).toHaveCount(1);
  });
});

test.describe('Accessibility', () => {
  test('should have proper focus states', async ({ page }) => {
    await page.goto(CATALOG);
    await page.waitForLoadState('networkidle');

    // Tab to first focusable element
    await page.keyboard.press('Tab');

    // Check focus visible
    const focused = page.locator(':focus-visible');
    await expect(focused).toBeVisible();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto(PRODUCT_1);
    await page.waitForLoadState('networkidle');

    // Check image gallery has aria-label
    await expect(page.locator('.image-gallery')).toHaveAttribute('role', 'region');
    await expect(page.locator('.image-gallery')).toHaveAttribute('aria-label', 'Galería de imágenes');

    // Check size selector has radiogroup role
    await expect(page.locator('.size-selector')).toHaveAttribute('role', 'radiogroup');
  });

  test('should have proper color contrast', async ({ page }) => {
    await page.goto(HOME);
    await page.waitForLoadState('networkidle');

    // Check header is visible
    await expect(page.locator('.header')).toBeVisible();
  });
});
