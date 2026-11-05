// Verificación del rediseño de chips del modal de pedido (entrega + pago).
// Uso: node scripts/chips-entrega-pago-verify.mjs [--base=http://localhost:4321] [--axe=<path axe.min.js>]
// Genera mockups/ux/chips-entrega-pago-{320,390,768,1440}.png y un JSON por
// consola: simetría de chips por viewport, default al abrir, los 4 combos del
// mensaje y axe sobre el modal abierto.
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const getArg = (name, dflt) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=').slice(1).join('=') : dflt;
};
const BASE = getArg('base', 'http://localhost:4321');
const AXE_PATH = getArg('axe', join(process.env.TEMP || __dirname, 'opencode', 'axe.min.js'));
const OUT = 'mockups/ux';

const PRODUCT = `${BASE}/producto/luminous-sahara/`;
const DELIVERY_LINES = {
  retiro: '🚚 Entrega: Retiro en mano (Córdoba)',
  uber: '🚚 Entrega: Envío por Uber',
};
const PAYMENT_LINES = {
  efectivo: '💳 Pago: Efectivo',
  transferencia: '💳 Pago: Transferencia',
};

const browser = await chromium.launch();
const report = { base: BASE, viewports: [] };

async function openOrderModal(width, height, mobile) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    isMobile: mobile,
    hasTouch: mobile,
  });
  const page = await ctx.newPage();
  // Banner de cookies y scripts de terceros fuera del camino.
  await page.addInitScript(() => {
    try { localStorage.setItem('atomiza-consent', 'reject'); } catch {}
  });
  for (const host of ['**secureprivacy.ai/**', '**googletagmanager.com/**', '**connect.facebook.net/**', '**analytics.tiktok.com/**']) {
    await ctx.route(host, (route) => route.abort());
  }
  await page.goto(PRODUCT, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.click('[data-add-to-cart]');
  await page.waitForTimeout(400);
  await page.keyboard.press('Escape'); // cierra el drawer si se abrió solo
  await page.waitForTimeout(300);
  await page.click('[data-cart-trigger]');
  await page.waitForTimeout(300);
  await page.click('[data-finalize-order]');
  await page.waitForTimeout(400);
  await page.waitForSelector('#order-modal dialog[open]', { state: 'visible' });
  return { ctx, page };
}

async function measureChips(page) {
  return page.evaluate(() => {
    const groups = [...document.querySelectorAll('#order-modal .option-chips')];
    return groups.map((g) => ({
      labelledBy: g.getAttribute('aria-labelledby'),
      role: g.getAttribute('role'),
      chips: [...g.querySelectorAll('.option-chip-text')].map((el) => {
        const b = el.getBoundingClientRect();
        // Líneas de TEXTO reales: rects del Range sobre el contenido (un
        // wrap produce rects en distintas alturas). min-height 44 ensucia
        // cualquier cuenta basada en height/lineHeight del chip.
        const range = document.createRange();
        range.selectNodeContents(el);
        const rects = [...range.getClientRects()].filter((r) => r.width > 1 && r.height > 1);
        const textLines = new Set(rects.map((r) => Math.round(r.top))).size;
        return {
          text: el.textContent.trim(),
          width: +b.width.toFixed(2),
          height: +b.height.toFixed(2),
          lines: textLines,
          overflowX: el.scrollWidth - el.clientWidth,
          clipped: el.scrollHeight > Math.ceil(b.height) + 1,
        };
      }),
    }));
  });
}

// ---------- 1) Simetría + default + capturas por viewport ----------
for (const vp of [
  { w: 320, h: 700, mobile: true },
  { w: 390, h: 844, mobile: true },
  { w: 768, h: 1024, mobile: false },
  { w: 1440, h: 900, mobile: false },
]) {
  const { ctx, page } = await openOrderModal(vp.w, vp.h, vp.mobile);
  const groups = await measureChips(page);
  const docOverflow = await page.evaluate(() => {
    const b = document.documentElement;
    return b.scrollWidth - b.clientWidth; // >0 => overflow horizontal
  });
  const checked = await page.evaluate(() => ({
    delivery: document.querySelector('#order-modal [name="order-delivery"]:checked')?.value,
    payment: document.querySelector('#order-modal [name="order-payment"]:checked')?.value,
  }));
  const preview = await page.locator('#order-preview').inputValue();

  const symmetry = groups.map((g) => {
    const [a, b] = g.chips;
    return {
      group: g.labelledBy,
      widths: [a.width, b.width],
      widthDiff: +Math.abs(a.width - b.width).toFixed(2),
      heights: [a.height, b.height],
      heightDiff: +Math.abs(a.height - b.height).toFixed(2),
      minHeight: Math.min(a.height, b.height),
      allSingleLine: g.chips.every((c) => c.lines === 1),
      anyOverflow: g.chips.some((c) => c.overflowX > 0),
      anyClipped: g.chips.some((c) => c.clipped),
    };
  });

  await page.screenshot({ path: `${OUT}/chips-entrega-pago-${vp.w}.png` });
  report.viewports.push({
    viewport: `${vp.w}x${vp.h}`,
    groups,
    symmetry,
    horizontalOverflowPx: docOverflow,
    defaultChecked: checked,
    previewHasDefaultLines:
      preview.includes(DELIVERY_LINES.retiro) && preview.includes(PAYMENT_LINES.efectivo),
    previewHasNoCoordinar: !preview.includes('A coordinar') && !preview.includes('📍 Envío:'),
    pass:
      groups.length === 2 &&
      symmetry.every(
        (s) =>
          s.widthDiff <= 1 &&
          s.heightDiff <= 1 &&
          s.minHeight >= 44 &&
          s.allSingleLine &&
          !s.anyOverflow &&
          !s.anyClipped
      ) &&
      docOverflow <= 0 &&
      checked.delivery === 'retiro' &&
      checked.payment === 'efectivo' &&
      preview.includes(DELIVERY_LINES.retiro) &&
      preview.includes(PAYMENT_LINES.efectivo) &&
      !preview.includes('undefined'),
  });
  await ctx.close();
}

// ---------- 2) Los 4 combos (390 y 1440) ----------
report.combos = [];
for (const vp of [{ w: 390, h: 844, mobile: true }, { w: 1440, h: 900, mobile: false }]) {
  const { ctx, page } = await openOrderModal(vp.w, vp.h, vp.mobile);
  const combos = [
    ['Retiro en mano', 'Efectivo'],
    ['Retiro en mano', 'Transferencia'],
    ['Envío por Uber', 'Efectivo'],
    ['Envío por Uber', 'Transferencia'],
  ];
  for (const [dText, pText] of combos) {
    await page.locator('.option-chip').filter({ hasText: dText }).click();
    await page.locator('.option-chip').filter({ hasText: pText }).click();
    await page.waitForTimeout(250);
    const preview = await page.locator('#order-preview').inputValue();
    const deliveryKey = dText === 'Envío por Uber' ? 'uber' : 'retiro';
    const paymentKey = pText === 'Transferencia' ? 'transferencia' : 'efectivo';
    const otherDelivery = deliveryKey === 'uber' ? DELIVERY_LINES.retiro : DELIVERY_LINES.uber;
    const otherPayment = paymentKey === 'transferencia' ? PAYMENT_LINES.efectivo : PAYMENT_LINES.transferencia;
    report.combos.push({
      viewport: vp.w,
      combo: `${deliveryKey}+${paymentKey}`,
      hasDeliveryLine: preview.split('\n').includes(DELIVERY_LINES[deliveryKey]),
      hasPaymentLine: preview.split('\n').includes(PAYMENT_LINES[paymentKey]),
      noOtherDeliveryLine: !preview.includes(otherDelivery),
      noOtherPaymentLine: !preview.includes(otherPayment),
      pass:
        preview.split('\n').includes(DELIVERY_LINES[deliveryKey]) &&
        preview.split('\n').includes(PAYMENT_LINES[paymentKey]) &&
        !preview.includes(otherDelivery) &&
        !preview.includes(otherPayment) &&
        !preview.includes('undefined') &&
        !preview.includes('A coordinar'),
    });
  }
  await ctx.close();
}

// ---------- 3) axe sobre el modal abierto (390 y 1440) ----------
report.axe = [];
for (const vp of [{ w: 390, h: 844, mobile: true }, { w: 1440, h: 900, mobile: false }]) {
  const { ctx, page } = await openOrderModal(vp.w, vp.h, vp.mobile);
  await page.addScriptTag({ path: AXE_PATH });
  const results = await page.evaluate(async () => {
    const dialog = document.querySelector('#order-modal dialog[open]');
    const out = await window.axe.run(dialog, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] },
    });
    return {
      violations: out.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.length,
        samples: v.nodes.slice(0, 2).map((n) => n.html.slice(0, 140)),
      })),
      incomplete: out.incomplete.map((v) => ({ id: v.id, nodes: v.nodes.length })),
      passes: out.passes.length,
    };
  });
  report.axe.push({
    viewport: vp.w,
    ...results,
    pass: results.violations.length === 0,
  });
  await ctx.close();
}

report.combosPass = report.combos.every((c) => c.pass);
report.viewportsPass = report.viewports.every((v) => v.pass);
report.axePass = report.axe.every((a) => a.pass);
report.overallPass = report.viewportsPass && report.combosPass && report.axePass;

console.log(JSON.stringify(report, null, 2));
await browser.close();
process.exit(report.overallPass ? 0 : 1);
