import { test, expect } from './test';

const HOME = '.';

test.describe('Sliders por click (mobile)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(HOME);
    await page.waitForLoadState('networkidle');
  });

  test('las reseñas avanzan con la flecha y los dots lo reflejan', async ({ page }) => {
    const slider = page.locator('.social-proof [data-slider]');
    await slider.scrollIntoViewIfNeeded();

    const dots = slider.locator('.slider-dot');
    await expect(dots).toHaveCount(4);
    await expect(dots.nth(0)).toHaveClass(/active/);

    await slider.locator('[data-slider-next]').click();
    await expect(dots.nth(1)).toHaveClass(/active/);
    await expect(dots.nth(0)).not.toHaveClass(/active/);
    await expect(slider.locator('.review-card').nth(1)).toBeInViewport();
  });

  test('en PC no hay controles visibles (grids completas)', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.goto(HOME);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.social-proof .slider-nav')).toBeHidden();
  });
});
