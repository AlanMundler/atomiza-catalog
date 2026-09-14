import { site, assetUrl } from '@/site.config';
import type { Perfume } from '@/data/types';
import { getStockLabel, getStockStatus, isSizeAvailable, primarySize } from '@/utils/stock';
import { escapeHtml, formatPrice } from '@/utils/formatters';
import { getPerfumesMap } from '@/utils/perfumes-client';

/** Cuántas cards muestra la home en "Decants en stock". */
export const HOME_RANDOM_COUNT = 4;

/**
 * Sorteo Fisher-Yates parcial: devuelve hasta `n` elementos distintos del
 * pool, en orden aleatorio. `rand` se inyecta para testear (por defecto
 * `Math.random`; en el browser se usa `cryptoRand`).
 */
export function pickRandom<T>(items: readonly T[], n: number, rand: () => number = Math.random): T[] {
  if (n <= 0) return [];
  const pool = [...items];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}

/** Aleatorio criptográfico (sin sesgo de seed diaria): cada visita sortea. */
export function cryptoRand(): number {
  try {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] / 4294967296;
  } catch {
    return Math.random();
  }
}

/**
 * Marca de una card igual a `ProductCard.astro` (clases 1:1): wrapper
 * `div.product-card` + link estirado + botón quick-add hermano (nunca
 * un botón dentro del link). Los estilos de ProductCard/Chip son
 * globales (`is:global`) justamente para que estas cards inyectadas por
 * JS se vean igual que las del SSR.
 */
export function homeCardHtml(perfume: Perfume, eager = false): string {
  const mainImage = assetUrl(perfume.images[0]?.src);
  const mainAlt = perfume.images[0]?.alt || `${perfume.brand} ${perfume.name}`;
  const primary = primarySize(perfume);
  const stockStatus = primary ? getStockStatus(primary) : 'out-of-stock';
  const stockLabel = getStockLabel(stockStatus);
  const isOutOfStock = stockStatus === 'out-of-stock';
  const variantClass =
    stockStatus === 'in-stock' ? 'chip--in-stock' : stockStatus === 'low-stock' ? 'chip--low-stock' : 'chip--out-of-stock';
  const search = `${perfume.brand} ${perfume.name} ${perfume.olfactoryFamily}`.toLowerCase();

  return (
    `<div class="product-card"` +
    ` data-perfume-id="${escapeHtml(perfume.id)}" data-gender="${escapeHtml(perfume.gender)}" data-search="${escapeHtml(search)}">` +
    `<a href="${escapeHtml(site.basePath)}producto/${escapeHtml(perfume.slug)}/" class="product-card-link"` +
    ` aria-label="Ver ${escapeHtml(perfume.brand)} ${escapeHtml(perfume.name)}">` +
    `<div class="product-card-image-wrapper">` +
    `<img src="${escapeHtml(mainImage)}" alt="${escapeHtml(mainAlt)}" class="product-card-image"` +
    ` loading="${eager ? 'eager' : 'lazy'}"${eager ? ' fetchpriority="high"' : ''} width="400" height="400">` +
    (isOutOfStock ? `<div class="product-card-overlay" aria-hidden="true"></div>` : '') +
    `<span class="chip ${variantClass} product-card-stock">${escapeHtml(stockLabel)}</span></div>` +
    `<div class="product-card-info"><span class="product-card-brand">${escapeHtml(perfume.brand)}</span>` +
    `<h3 class="product-card-name" title="${escapeHtml(perfume.name)}">${escapeHtml(perfume.name)}</h3>` +
    `<span class="product-card-price">${primary ? escapeHtml(formatPrice(primary.price)) : '—'}</span></div></a>` +
    (primary && !isOutOfStock
      ? `<button type="button" class="product-card-quick" data-quick-add data-size-ml="${primary.ml}"` +
        ` aria-label="Agregar ${escapeHtml(perfume.brand)} ${escapeHtml(perfume.name)} al pedido">` +
        `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">` +
        `<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></button>`
      : '') +
    `</div>`
  );
}

function currentIds(slots: Element[]): Set<string> {
  const ids = new Set<string>();
  for (const slot of slots) {
    const id = slot.querySelector('[data-perfume-id]')?.getAttribute('data-perfume-id');
    if (id) ids.add(id);
  }
  return ids;
}

/**
 * Sorteo de la home: reemplaza las 4 cards del SSR por 4 al azar en cada
 * visita. El SSR queda como fallback (SEO/LCP y si el fetch falla, se ven
 * las 4 del build). Reusa los wrappers `.home-perfume-item` del SSR y la
 * delegación global del quick-add sigue funcionando sin re-bind.
 */
export async function initHomeRandom(
  gridId = 'home-perfume-grid',
  count: number = HOME_RANDOM_COUNT
): Promise<void> {
  if (typeof document === 'undefined') return;
  const grid = document.getElementById(gridId);
  if (!grid) return;
  const slots = Array.from(grid.querySelectorAll('.home-perfume-item'));
  if (slots.length === 0) return;

  let pool: Perfume[];
  try {
    const map = await getPerfumesMap();
    pool = [...map.values()].filter((p) => {
      const size = primarySize(p);
      return size ? isSizeAvailable(size) : false;
    });
  } catch {
    return;
  }
  if (pool.length <= slots.length) return;

  const before = currentIds(slots);
  let picks = pickRandom(pool, Math.min(count, slots.length), cryptoRand);
  // Best-effort: evita repetir el mismo set del SSR (con 37 perfumes el
  // choque igual es raro, pero el SSR es fijo por build y se notaría).
  for (let attempt = 0; attempt < 5; attempt++) {
    const ids = new Set(picks.map((p) => p.id));
    const same = ids.size === before.size && [...ids].every((id) => before.has(id));
    if (!same) break;
    picks = pickRandom(pool, Math.min(count, slots.length), cryptoRand);
  }

  slots.forEach((slot, i) => {
    const perfume = picks[i];
    if (perfume) slot.innerHTML = homeCardHtml(perfume, i === 0);
  });
}
