import { test, expect } from './test';

const BASE = process.env.BASE_PATH || '/';

test.describe('SEO', () => {
  test('product og:image apunta a un jpg bajo el base path', async ({ page }) => {
    await page.goto('producto/baroque-rouge-540/');
    await page.waitForLoadState('networkidle');

    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(ogImage).toMatch(/\.jpg$/);
    expect(ogImage).toContain(`${BASE}og/`);
  });

  test('robots.txt existe y referencia el sitemap', async ({ page }) => {
    const response = await page.goto('robots.txt');
    expect(response?.ok()).toBeTruthy();
    const body = await response?.text();
    expect(body).toContain('Sitemap:');
    expect(body).toContain('sitemap-index.xml');
  });
});
