import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
await page.goto('http://localhost:4321/atomiza-catalog/', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);

const r = await page.evaluate(() => {
  const css = (el) => {
    if (!el) return null;
    const c = getComputedStyle(el);
    return { font: c.fontSize, family: c.fontFamily.slice(0, 30), color: c.color, bg: c.backgroundColor, width: c.width, maxW: c.maxWidth, display: c.display, vis: c.visibility };
  };
  const sheets = [...document.styleSheets].map((s) => {
    let rules = 0;
    try { rules = s.cssRules.length; } catch { rules = -1; }
    return { href: (s.href || 'inline').split('/').pop(), rules };
  });
  return {
    sheets,
    heroTitle: css(document.querySelector('.hero-title')),
    heroSubtitle: css(document.querySelector('.hero-subtitle')),
    sectionTitle: css(document.querySelector('.section-title')),
    container: css(document.querySelector('.container')),
    productCard: css(document.querySelector('.product-card')),
    cardStock: css(document.querySelector('.product-card-stock')),
    bodyBg: css(document.body)
  };
});
console.log('STYLES:', JSON.stringify(r, null, 1));
console.log('ERRORS:', JSON.stringify(errors, null, 1));
await browser.close();
