import { test, expect } from '@playwright/test';

test.describe('Catalog to Cart Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should navigate from home to catalog', async ({ page }) => {
    await page.click('a[href="/catalogo"]');
    await expect(page).toHaveURL(/\/catalogo/);
    await expect(page.locator('h1')).toContainText('Catálogo');
  });

  test('should filter catalog by gender', async ({ page }) => {
    await page.goto('/catalogo');
    await page.waitForLoadState('networkidle');
    
    // Click masculino filter
    await page.click('button[data-filter="masculino"]');
    await page.waitForLoadState('networkidle');
    
    // Check URL updated
    await expect(page).toHaveURL(/filter=masculino/);
    
    // Check products shown are masculino
    const productCards = page.locator('.product-card');
    await expect(productCards.first()).toBeVisible();
  });

  test('should search for perfumes', async ({ page }) => {
    await page.goto('/catalogo');
    await page.waitForLoadState('networkidle');
    
    // Type in search
    await page.fill('input[type="search"]', 'tobacco');
    await page.waitForTimeout(500); // debounce
    
    // Check URL updated
    await expect(page).toHaveURL(/search=tobacco/);
  });

  test('should navigate to product detail from catalog', async ({ page }) => {
    await page.goto('/catalogo');
    await page.waitForLoadState('networkidle');
    
    // Click first product card
    await page.locator('.product-card').first().click();
    await page.waitForLoadState('networkidle');
    
    // Should be on product detail page
    await expect(page).toHaveURL(/\/producto\//);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should add product to cart', async ({ page }) => {
    await page.goto('/producto/tobacco-vanille');
    await page.waitForLoadState('networkidle');
    
    // Click add to cart
    await page.click('[data-add-to-cart]');
    await page.waitForTimeout(500);
    
    // Cart drawer should open
    const cartDrawer = page.locator('#cart-drawer .drawer--open');
    await expect(cartDrawer).toBeVisible();
    
    // Cart should have 1 item
    await expect(page.locator('.cart-item')).toHaveCount(1);
  });
});

test.describe('Product Detail Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/producto/tobacco-vanille');
    await page.waitForLoadState('networkidle');
  });

  test('should display product information', async ({ page }) => {
    await expect(page.locator('.product-detail-brand')).toContainText('Tom Ford');
    await expect(page.locator('.product-detail-name')).toContainText('Tobacco Vanille');
    await expect(page.locator('.product-detail-family')).toContainText('Amaderada Especiada');
  });

  test('should display image gallery', async ({ page }) => {
    await expect(page.locator('.image-gallery-main-image')).toBeVisible();
    await expect(page.locator('.image-gallery-thumb')).toHaveCount(2);
  });

  test('should switch images on thumbnail click', async ({ page }) => {
    const mainImage = page.locator('.image-gallery-main-image');
    const initialSrc = await mainImage.getAttribute('src');
    
    // Click second thumbnail
    await page.locator('.image-gallery-thumb').nth(1).click();
    await page.waitForTimeout(200);
    
    const newSrc = await mainImage.getAttribute('src');
    expect(newSrc).not.toBe(initialSrc);
  });

  test('should select different sizes', async ({ page }) => {
    // Click 10ml size
    await page.click('input[value="10"]');
    await page.waitForTimeout(200);
    
    // Check selected state
    await expect(page.locator('input[value="10"]')).toBeChecked();
  });

  test('should show out of stock for unavailable sizes', async ({ page }) => {
    // 10ml is out of stock for tobacco-vanille
    const size10ml = page.locator('input[value="10"]');
    await expect(size10ml).toBeDisabled();
    
    // Check stock badge shows AGOTADO
    await expect(page.locator('.size-option:has(input[value="10"]) .chip--out-of-stock')).toBeVisible();
  });
});