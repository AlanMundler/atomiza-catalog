import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear cart before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.waitForLoadState('networkidle');
  });

  test('should add multiple items and finalize order', async ({ page }) => {
    // Add first product
    await page.goto('/producto/tobacco-vanille');
    await page.waitForLoadState('networkidle');
    await page.click('[data-add-to-cart]');
    await page.waitForTimeout(500);
    
    // Add second product
    await page.goto('/producto/baccarat-rouge-540');
    await page.waitForLoadState('networkidle');
    await page.click('[data-add-to-cart]');
    await page.waitForTimeout(500);
    
    // Open cart drawer
    await page.click('[data-cart-trigger]');
    await page.waitForTimeout(300);
    
    // Check cart has 2 items
    await expect(page.locator('.cart-item')).toHaveCount(2);
    
    // Click finalize order
    await page.click('[data-finalize-order]');
    await page.waitForTimeout(300);
    
    // Instagram modal should open
    const modal = page.locator('#instagram-modal dialog[open]');
    await expect(modal).toBeVisible();
    
    // Fill customer info
    await page.fill('#customer-name', 'Juan Pérez');
    await page.fill('#customer-contact', '+54 9 11 1234-5678');
    
    // Check preview updates
    const preview = page.locator('#order-preview');
    await expect(preview).toContainText('Juan Pérez');
    await expect(preview).toContainText('+54 9 11 1234-5678');
    await expect(preview).toContainText('Tom Ford - Tobacco Vanille');
    await expect(preview).toContainText('Maison Francis Kurkdjian - Baccarat Rouge 540');
    
    // Test copy button
    await page.click('[data-copy-order]');
    await expect(page.locator('[data-copy-order]')).toContainText('¡Copiado!');
  });

  test('should update cart quantities', async ({ page }) => {
    await page.goto('/producto/tobacco-vanille');
    await page.waitForLoadState('networkidle');
    await page.click('[data-add-to-cart]');
    await page.waitForTimeout(500);
    
    // Open cart
    await page.click('[data-cart-trigger]');
    await page.waitForTimeout(300);
    
    // Increase quantity
    await page.click('.quantity-btn--increase');
    await page.waitForTimeout(200);
    
    // Check quantity updated
    await expect(page.locator('.quantity-value')).toContainText('2');
    
    // Check line total updated
    await expect(page.locator('.cart-item-line-total')).toContainText('64.000');
  });

  test('should remove item from cart', async ({ page }) => {
    await page.goto('/producto/tobacco-vanille');
    await page.waitForLoadState('networkidle');
    await page.click('[data-add-to-cart]');
    await page.waitForTimeout(500);
    
    await page.goto('/producto/baccarat-rouge-540');
    await page.waitForLoadState('networkidle');
    await page.click('[data-add-to-cart]');
    await page.waitForTimeout(500);
    
    await page.click('[data-cart-trigger]');
    await page.waitForTimeout(300);
    
    // Remove first item
    await page.locator('.cart-item-remove').first().click();
    await page.waitForTimeout(300);
    
    // Should have 1 item left
    await expect(page.locator('.cart-item')).toHaveCount(1);
  });

  test('should clear cart', async ({ page }) => {
    await page.goto('/producto/tobacco-vanille');
    await page.waitForLoadState('networkidle');
    await page.click('[data-add-to-cart]');
    await page.waitForTimeout(500);
    
    await page.click('[data-cart-trigger]');
    await page.waitForTimeout(300);
    
    // Click clear cart
    await page.click('[data-clear-cart]');
    await page.waitForTimeout(300);
    
    // Confirm dialog - Playwright auto-accepts
    // Cart should be empty
    await expect(page.locator('.cart-empty')).toBeVisible();
  });

  test('should persist cart across navigation', async ({ page }) => {
    await page.goto('/producto/tobacco-vanille');
    await page.waitForLoadState('networkidle');
    await page.click('[data-add-to-cart]');
    await page.waitForTimeout(500);
    
    // Navigate away
    await page.goto('/catalogo');
    await page.waitForLoadState('networkidle');
    
    // Cart count should still show 1
    await expect(page.locator('.cart-count')).toContainText('1');
    
    // Open cart
    await page.click('[data-cart-trigger]');
    await page.waitForTimeout(300);
    
    // Item should still be there
    await expect(page.locator('.cart-item')).toHaveCount(1);
  });
});

test.describe('Accessibility', () => {
  test('should have proper focus states', async ({ page }) => {
    await page.goto('/catalogo');
    await page.waitForLoadState('networkidle');
    
    // Tab to first focusable element
    await page.keyboard.press('Tab');
    
    // Check focus visible
    const focused = page.locator(':focus-visible');
    await expect(focused).toBeVisible();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/producto/tobacco-vanille');
    await page.waitForLoadState('networkidle');
    
    // Check image gallery has aria-label
    await expect(page.locator('.image-gallery')).toHaveAttribute('role', 'region');
    await expect(page.locator('.image-gallery')).toHaveAttribute('aria-label', 'Galería de imágenes');
    
    // Check size selector has radiogroup role
    await expect(page.locator('.size-selector')).toHaveAttribute('role', 'radiogroup');
  });

  test('should have proper color contrast', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check hero text contrast (gold on black)
    const heroTitle = page.locator('.hero-title');
    const color = await heroTitle.evaluate(el => window.getComputedStyle(el).color);
    const bgColor = await heroTitle.evaluate(el => window.getComputedStyle(el).backgroundColor);
    
    // Gold color should be present
    expect(color).toContain('233, 193, 118'); // RGB for #e9c176
  });
});