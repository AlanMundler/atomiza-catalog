// ly4 — verificación de simetría de la grilla de combos de /layering/.
// Uso: node scripts/ly4-verify.mjs [--base=http://localhost:4321] [--axe=<path axe.min.js>]
// Genera mockups/ux/ly4-<ancho>.png + ly4-combos-<ancho>.png y reporta JSON.
import { chromium } from 'playwright';
import { join } from 'node:path';

const argv = process.argv.slice(2);
const getArg = (name, dflt) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=').slice(1).join('=') : dflt;
};
const BASE = getArg('base', 'http://localhost:4321');
const AXE_PATH = getArg('axe', join(process.env.TEMP || '.', 'opencode', 'axe.min.js'));
const OUT = 'mockups/ux';

const WIDTHS = [320, 360, 390, 414, 768, 1024, 1280, 1440, 1920];
const COMBO_SHOTS = [390, 768, 1024, 1440];
const AXE_SHOTS = [390, 1440];

const browser = await chromium.launch();
const report = { base: BASE, widths: [] };

async function openLayering(width) {
  const mobile = width < 640;
  const ctx = await browser.newContext({
    viewport: { width, height: mobile ? 844 : 900 },
    isMobile: mobile,
    hasTouch: mobile,
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    try { localStorage.setItem('atomiza-consent', 'reject'); } catch {}
  });
  await page.goto(`${BASE}/layering/`, { waitUntil: 'networkidle' });
  // Expandir todas las combos para medir la grilla completa.
  const more = page.locator('[data-show-more-btn]');
  if (await more.isVisible().catch(() => false)) {
    await more.click();
    // Sacar el puntero de encima de la grilla: el :hover de la card aplica
    // translateY(-2px) y contaminaría la medición de simetría.
    await page.mouse.move(1, 1);
    await page.waitForTimeout(400);
  }
  return { ctx, page };
}

/**
 * Mide, para las cards visibles, el top de cada bloque del esqueleto y agrupa
 * por fila de grilla (misma Y de la card). Devuelve deltas máximos por bloque.
 */
async function measureRows(page) {
  return page.evaluate(() => {
    const cards = [...document.querySelectorAll('.ly-combo:not([hidden])')];
    const SELS = [
      ['title', '.ly-combo-title'],
      ['badges', '.ly-combo-badges'],
      ['aff', '.ly-combo-aff'],
      ['meta', '.ly-combo-meta'],
      ['pair', '.ly-combo-pair'],
      ['nameA', '.ly-combo-pair figcaption:nth-of-type(1)'],
      ['nameB', '.ly-combo-pair .ly-bottle:last-of-type figcaption'],
      ['bottleImgBase', '.ly-combo-pair .ly-bottle:first-of-type img'],
      ['notes', '.ly-combo-notes'],
      ['why', '.ly-combo-why'],
      ['ratio', '.ly-combo-ratio'],
      ['foot', '.ly-combo-foot'],
      ['cta', '.ly-combo-foot button'],
    ];
    const data = cards.map((c) => {
      const r = c.getBoundingClientRect();
      const blocks = {};
      for (const [key, sel] of SELS) {
        const el = c.querySelector(sel);
        if (!el) { blocks[key] = null; continue; }
        const b = el.getBoundingClientRect();
        blocks[key] = { top: b.top + window.scrollY, h: b.height };
      }
      return { id: c.id, top: r.top + window.scrollY, height: r.height, blocks };
    });
    // Filas: cards cuyo top coincide (tolerancia 24 px).
    const rows = [];
    for (const c of data) {
      const row = rows.find((rr) => Math.abs(rr.anchor.top - c.top) < 24);
      if (row) row.cards.push(c);
      else rows.push({ anchor: c, cards: [c] });
    }
    // Truncamientos por clamp (scrollHeight > clientHeight) y su fallback title.
    const clamped = [...document.querySelectorAll('.ly-combo .ly-combo-title, .ly-combo .ly-combo-meta, .ly-combo .ly-combo-why, .ly-combo .ly-combo-ratio, .ly-combo figcaption a, .ly-combo .ly-note-chip')]
      .filter((el) => el.scrollHeight > el.clientHeight + 1)
      .map((el) => ({
        cls: el.className.split(' ')[0] || el.tagName,
        card: el.closest('.ly-combo')?.id ?? '',
        hasTitle: el.hasAttribute('title') || !!el.closest('[title]'),
      }));
    // Desbordes horizontales dentro de la card (sin clamp).
    const overflowers = [...document.querySelectorAll('.ly-combo *')]
      .filter((el) => {
        const cs = getComputedStyle(el);
        if (cs.overflow !== 'visible' && cs.overflowX !== 'visible') return false;
        return el.scrollWidth > el.clientWidth + 1;
      })
      .slice(0, 5)
      .map((el) => ({ cls: String(el.className).split(' ')[0] || el.tagName, card: el.closest('.ly-combo')?.id ?? '' }));
    return { rows: rows.map((r) => ({ tops: r.cards.map((c) => ({ id: c.id, top: Math.round(c.top * 10) / 10, height: Math.round(c.height * 10) / 10, blocks: Object.fromEntries(Object.entries(c.blocks).map(([k, v]) => [k, v ? Math.round(v.top * 10) / 10 : null])) })) })), docOverflow: { scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }, clamped, overflowers };
  });
}

for (const w of WIDTHS) {
  const { ctx, page } = await openLayering(w);
  const m = await measureRows(page);

  // Delta de tops por bloque dentro de cada fila con >1 card.
  const rowDeltas = m.rows.map((row) => {
    if (row.tops.length < 2) return null;
    const keys = Object.keys(row.tops[0].blocks);
    const per = {};
    let maxDelta = 0;
    for (const k of keys) {
      const vals = row.tops.map((t) => t.blocks[k]).filter((v) => v !== null);
      if (vals.length < 2) continue;
      const d = Math.max(...vals) - Math.min(...vals);
      per[k] = Math.round(d * 10) / 10;
      maxDelta = Math.max(maxDelta, d);
    }
    const hs = row.tops.map((t) => t.height);
    const dH = Math.max(...hs) - Math.min(...hs);
    return { cards: row.tops.map((t) => t.id), blockDeltas: per, maxBlockDelta: Math.round(maxDelta * 10) / 10, heightDelta: Math.round(dH * 10) / 10 };
  }).filter(Boolean);

  await page.screenshot({ path: `${OUT}/ly4-${w}.png`, fullPage: true });

  report.widths.push({
    viewport: w,
    horizontalOverflow: m.docOverflow.scrollWidth > m.docOverflow.clientWidth + 1,
    scrollWidth: m.docOverflow.scrollWidth,
    rows: rowDeltas,
    maxBlockDelta: rowDeltas.length ? Math.max(...rowDeltas.map((r) => r.maxBlockDelta)) : 0,
    maxHeightDelta: rowDeltas.length ? Math.max(...rowDeltas.map((r) => r.heightDelta)) : 0,
    clampedText: m.clamped,
    overflowers: m.overflowers,
  });
  await ctx.close();
}

// Detalle de la sección de combos (solo la sección, no la página entera).
for (const w of COMBO_SHOTS) {
  const { ctx, page } = await openLayering(w);
  const sec = page.locator('#combos');
  await sec.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  await sec.screenshot({ path: `${OUT}/ly4-combos-${w}.png` });
  await ctx.close();
}

// axe sobre la página completa (390 y 1440).
report.axe = [];
for (const w of AXE_SHOTS) {
  const { ctx, page } = await openLayering(w);
  await page.addScriptTag({ path: AXE_PATH });
  const results = await page.evaluate(async () => {
    const out = await window.axe.run(document.documentElement, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] },
    });
    return {
      violations: out.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.length,
        samples: v.nodes.slice(0, 2).map((n) => n.html.slice(0, 160)),
      })),
      incomplete: out.incomplete.map((v) => ({ id: v.id, nodes: v.nodes.length })),
    };
  });
  report.axe.push({ viewport: w, ...results, pass: results.violations.length === 0 });
  await ctx.close();
}

report.symmetryPass = report.widths.every(
  (x) => !x.horizontalOverflow && x.maxBlockDelta <= 2 && x.maxHeightDelta <= 1 && x.overflowers.length === 0
);
report.clampedAllTitled = report.widths.every((x) => x.clampedText.every((c) => c.hasTitle));
report.axePass = report.axe.every((a) => a.pass);
report.overallPass = report.symmetryPass && report.clampedAllTitled && report.axePass;

console.log(JSON.stringify(report, null, 2));
await browser.close();
process.exit(report.overallPass ? 0 : 1);
