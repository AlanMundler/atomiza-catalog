import { test, expect } from '@playwright/test';

const HOME = '/atomiza-catalog/';
const CATALOG = '/atomiza-catalog/catalogo/';
const PRODUCT = '/atomiza-catalog/producto/baroque-rouge-540/';

test.describe('Catalog to Cart Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(HOME);
    await page.waitForLoadState('networkidle');
  });

  test('should navigate from home to catalog', async ({ page }) => {
    const headerBtn = page.locator('.header-catalogo-btn');
    if (await headerBtn.isVisible()) {
      await headerBtn.click();
    } else {
      await page.click('button[aria-label="Abrir menú"]');
      const mobileNav = page.getByRole('navigation', { name: 'Menú móvil' });
      await mobileNav.getByRole('link', { name: 'Catálogo' }).click();
    }
    await expect(page).toHaveURL(/\/catalogo/);
    await expect(page.locator('h1')).toContainText('Catálogo');
  });

  test('should filter catalog by gender', async ({ page }) => {
    await page.goto(CATALOG);
    await page.waitForLoadState('networkidle');

    await page.click('button[data-filter="masculino"]');
    await expect(page).toHaveURL(/filter=masculino/);

    const visibleCards = page.locator('.product-card:visible');
    await expect(visibleCards.first()).toBeVisible();
    const masculineOrUnisex = await visibleCards.evaluateAll((cards) =>
      cards.every((card) => {
        const g = card.getAttribute('data-gender');
        return g === 'masculino' || g === 'unisex';
      })
    );
    expect(masculineOrUnisex).toBe(true);

    await page.click('button[data-filter="unisex"]');
    const unisexOnly = await page.locator('.product-card:visible').evaluateAll((cards) =>
      cards.every((card) => card.getAttribute('data-gender') === 'unisex')
    );
    expect(unisexOnly).toBe(true);

    await page.click('button[data-filter="femenino"]');
    const femeninoOrUnisex = await page.locator('.product-card:visible').evaluateAll((cards) =>
      cards.every((card) => {
        const g = card.getAttribute('data-gender');
        return g === 'femenino' || g === 'unisex';
      })
    );
    expect(femeninoOrUnisex).toBe(true);
  });

  test('should search for perfumes', async ({ page }) => {
    await page.goto(CATALOG);
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="search"]', 'baroque');
    await page.waitForTimeout(500);

    await expect(page).toHaveURL(/search=baroque/);
    const visibleCards = page.locator('.product-card:visible');
    const allMatch = await visibleCards.evaluateAll((cards) =>
      cards.every((card) => (card.getAttribute('data-search') || '').includes('baroque'))
    );
    expect(allMatch).toBe(true);
  });

  test('should navigate to product detail from catalog', async ({ page }) => {
    await page.goto(CATALOG);
    await page.waitForLoadState('networkidle');

    await page.locator('.product-card').first().click();
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/producto\//);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should add product to cart', async ({ page }) => {
    await page.goto(PRODUCT);
    await page.waitForLoadState('networkidle');

    await page.click('[data-add-to-cart]');
    await page.waitForLoadState('networkidle');

    const cart = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('atomiza-cart') || '{"items":[]}')
    );
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].perfumeId).toBe('baroque-rouge-540');
    expect(cart.items[0].size.ml).toBe(5);
  });
});

test.describe('Product Detail Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PRODUCT);
    await page.waitForLoadState('networkidle');
  });

  test('should display product information', async ({ page }) => {
    await expect(page.locator('.product-detail-brand')).toContainText('Maison Alhambra');
    await expect(page.locator('.product-detail-name')).toContainText('Baroque Rouge 540');
  });

  test('should display image gallery', async ({ page }) => {
    await expect(page.locator('.image-gallery-main-image')).toBeVisible();
  });

  test('should select the 5ml size', async ({ page }) => {
    await page.click('label.size-option');
    await page.waitForTimeout(200);
    await expect(page.locator('input[value="5"]')).toBeChecked();
  });

  test('should show the price for the 5ml size', async ({ page }) => {
    await expect(page.locator('.size-option-price')).toContainText('$6.000');
  });
});
