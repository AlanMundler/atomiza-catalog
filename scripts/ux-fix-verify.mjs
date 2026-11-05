// Verificación de los 3 fixes UX (promos overlap, FAB vs título/CTA, buscador táctil).
// Uso: node scripts/ux-fix-verify.mjs [--base=http://localhost:4322] [--shots=0]
// Genera mockups/ux/fix-*.png y un JSON por consola.
import { chromium } from 'playwright';

const argv = process.argv.slice(2);
const getArg = (name, dflt) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=').slice(1).join('=') : dflt;
};
const BASE = getArg('base', 'http://localhost:4322');
const SHOTS = getArg('shots', '1') !== '0';
const OUT = 'mockups/ux';

const browser = await chromium.launch();
const report = { base: BASE };

async function newPage(width, height, mobile) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    isMobile: mobile,
    hasTouch: mobile,
  });
  const page = await ctx.newPage();
  // Evitar que el banner de cookies pise las mediciones.
  await page.addInitScript(() => {
    try { localStorage.setItem('atomiza-consent', 'reject'); } catch {}
  });
  return { ctx, page };
}

const intersect = (a, b) => {
  if (!a || !b) return null;
  const x = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
  const y = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  return x * y;
};

// ---------- 1) Tira de promos: nunca dos frases encimadas ----------
{
  const { ctx, page } = await newPage(390, 844, true);
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  let maxVisible = 0;
  let overlapSamples = 0;
  let bothInFlightSamples = 0;
  const frames = [];
  const t0 = Date.now();
  let shotTaken = false;
  while (Date.now() - t0 < 5000) {
    const s = await page.evaluate(() => {
      const items = [...document.querySelectorAll('[data-promo-item]')];
      const ops = items.map((el) => ({
        opacity: Number(getComputedStyle(el).opacity),
        visible: getComputedStyle(el).visibility !== 'hidden',
      }));
      return {
        opacities: ops.map((o) => o.opacity),
      };
    });
    const visible = s.opacities.filter((o) => o > 0.15).length;
    maxVisible = Math.max(maxVisible, visible);
    if (visible > 1) {
      overlapSamples++;
      if (SHOTS && !shotTaken && overlapSamples === 1) {
        await page.screenshot({ path: `${OUT}/fix-01-promo-transition.png` });
        shotTaken = true;
      }
    }
    frames.push(s.opacities);
    await page.waitForTimeout(50);
  }
  report.promoStrip = {
    sampledMs: 5000,
    samples: frames.length,
    maxVisibleAtOnce: maxVisible,
    overlapSamples,
    pass: overlapSamples === 0,
  };
  if (SHOTS && !shotTaken) await page.screenshot({ path: `${OUT}/fix-01-promo-transition.png` });
  await ctx.close();
}

// ---------- 2) FAB vs h1 / precio / CTA ----------
{
  const products = [
    { slug: 'ameer-al-oudh', label: 'nombre largo' },
    { slug: 'glacier-bella', label: 'con frasco' },
    { slug: 'hercules', label: 'sin frasco' },
  ];
  const widths = [
    { w: 320, h: 700, mobile: true },
    { w: 390, h: 844, mobile: true },
    { w: 1440, h: 900, mobile: false },
  ];
  report.fab = [];
  for (const p of products) {
    for (const vp of widths) {
      const { ctx, page } = await newPage(vp.w, vp.h, vp.mobile);
      await page.goto(`${BASE}/producto/${p.slug}/`, { waitUntil: 'networkidle' });
      const rects = await page.evaluate(() => {
        const r = (sel) => {
          const els = [...document.querySelectorAll(sel)];
          return els.map((el) => {
            const b = el.getBoundingClientRect();
            return {
              tag: el.tagName.toLowerCase(),
              cls: el.className && typeof el.className === 'string' ? el.className : '',
              rect: { top: b.top, left: b.left, bottom: b.bottom, right: b.right, width: b.width, height: b.height },
            };
          });
        };
        const fab = document.querySelector('.whatsapp-fab');
        const fb = fab ? fab.getBoundingClientRect() : null;
        return {
          fab: fb ? { top: fb.top, left: fb.left, bottom: fb.bottom, right: fb.right, width: fb.width, height: fb.height } : null,
          h1: r('article h1'),
          price: r('.product-detail-price'),
          addCart: r('[data-add-to-cart]'),
        };
      });
      const checks = [];
      if (rects.fab) {
        for (const group of ['h1', 'price', 'addCart']) {
          for (const el of rects[group]) {
            checks.push({
              group,
              el: `${el.tag}.${el.cls.split(' ')[0]}`,
              overlapArea: intersect(el.rect, rects.fab),
              elRect: el.rect,
            });
          }
        }
      }
      const intersections = checks.filter((c) => c.overlapArea > 0.01);
      if (SHOTS && (intersections.length > 0 || vp.w === 390)) {
        await page.screenshot({ path: `${OUT}/fix-02-fab-${p.slug}-${vp.w}.png` });
      }
      report.fab.push({
        page: `/producto/${p.slug}/ (${p.label})`,
        viewport: `${vp.w}x${vp.h}`,
        fabRect: rects.fab,
        priceElementsFound: rects.price.length,
        targets: checks.map((c) => ({ el: c.el, overlapArea: +c.overlapArea.toFixed(1), rect: c.elRect })),
        intersections: intersections.length,
        pass: intersections.length === 0 && !!rects.fab,
      });
      await ctx.close();
    }
  }
}

// ---------- 3) Buscador táctil: ≥44px alto, ≥16px fuente ----------
{
  const pages = ['/catalogo/decants/', '/decants/'];
  const widths = [
    { w: 390, h: 844, mobile: true },
    { w: 1440, h: 900, mobile: false },
  ];
  report.search = [];
  for (const path of pages) {
    for (const vp of widths) {
      const { ctx, page } = await newPage(vp.w, vp.h, vp.mobile);
      await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
      const m = await page.evaluate(() => {
        const el = document.querySelector('input[type="search"]');
        if (!el) return null;
        const b = el.getBoundingClientRect();
        return { height: b.height, fontSize: getComputedStyle(el).fontSize };
      });
      const fsPx = m ? parseFloat(m.fontSize) : NaN;
      report.search.push({
        page: path,
        viewport: `${vp.w}x${vp.h}`,
        height: m ? +m.height.toFixed(1) : null,
        fontSize: m ? m.fontSize : null,
        pass: !!m && m.height >= 44 && fsPx >= 16,
      });
      if (SHOTS) await page.screenshot({ path: `${OUT}/fix-03-search-${path.replaceAll('/', '-')}${vp.w}.png` });
      await ctx.close();
    }
  }
}

report.overallPass =
  report.promoStrip.pass &&
  report.fab.every((f) => f.pass) &&
  report.search.every((s) => s.pass);

console.log(JSON.stringify(report, null, 2));
await browser.close();
process.exit(report.overallPass ? 0 : 1);
