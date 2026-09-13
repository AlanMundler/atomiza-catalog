import { assetUrl } from '@/site.config';
import {
  escapeHtml,
  formatPrice,
  resolveCartItems,
  type ResolvedCartItem,
} from '@/utils/formatters';
import {
  TRIDENT_COUNT,
  TRIDENT_DISCOUNT,
  descuentoTridente,
  tridentesCompletos,
} from '@/utils/trident';
import type { CartItem, Perfume } from '@/data/types';

/** Estado vacío del drawer, con salida al catálogo. */
export function cartEmptyHtml(): string {
  return `
    <div class="cart-empty">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" aria-hidden="true">
        <circle cx="9" cy="21" r="1"></circle>
        <circle cx="20" cy="21" r="1"></circle>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
      </svg>
      <p class="cart-empty-text">Tu carrito está vacío</p>
      <p class="cart-empty-subtext">Agrega decants desde el catálogo</p>
      <a href="${assetUrl('catalogo/')}" class="btn btn--primary btn--md empty-cta">Ver catálogo</a>
    </div>
  `;
}

/**
 * Contenido completo del drawer: items + nudge de tridente + resumen.
 * Precios y stock salen del catálogo vivo, nunca del snapshot del carrito.
 */
export function cartContentHtml(items: CartItem[], perfumesMap: Map<string, Perfume>): string {
  const resolved = resolveCartItems(items, perfumesMap);
  const unavailableCount = resolved.filter((r) => !r.available).length;
  // El subtotal SIEMPRE se calcula contra el catálogo vivo (igual que el
  // mensaje de pedido), nunca con el precio snapshot del carrito.
  const subtotal = resolved.reduce(
    (sum, r) => sum + (r.available ? r.size.price * r.quantity : 0),
    0
  );
  // Descuento automático: cada 3 decants comprables restan $2.000.
  const orderableCount = resolved
    .filter((r) => r.available)
    .reduce((sum, r) => sum + r.quantity, 0);
  const tridentes = tridentesCompletos(orderableCount);
  const discount = descuentoTridente(orderableCount);
  const total = subtotal - discount;
  // Con 1-2 decants conviene sumar: el nudge lleva al catálogo (acción),
  // no a otra página intermedia.
  const missing = TRIDENT_COUNT - orderableCount;
  // Tira fina de progreso (no caja): con 1-2 decants el próximo hito
  // siempre es el primer tridente (−$2.000).
  let dots = '';
  for (let i = 0; i < TRIDENT_COUNT; i++) {
    dots += `<i class="${i < orderableCount ? 'on' : ''}"></i>`;
  }
  const tridentNudge = orderableCount > 0 && missing > 0
    ? `<a class="trident-nudge" href="${assetUrl('catalogo/')}"><span class="trident-dots" aria-hidden="true">${dots}</span><span>Te falta${missing === 1 ? '' : 'n'} ${missing} para −${formatPrice(TRIDENT_DISCOUNT)}</span><span aria-hidden="true">→</span></a>`
    : tridentes > 0
      ? `<p class="trident-nudge trident-nudge--ready"><span aria-hidden="true">✓</span><span>${tridentes} ${tridentes === 1 ? 'tridente' : 'tridentes'}: −${formatPrice(discount)} en tu pedido</span></p>`
      : '';

  const totalsHtml = discount > 0
    ? `<div class="order-summary-line">
        <span class="order-summary-label">Subtotal</span>
        <span class="order-summary-value">${formatPrice(subtotal)}</span>
      </div>
      <div class="order-summary-line order-summary-line--discount">
        <span class="order-summary-label">Descuento tridente</span>
        <span class="order-summary-value">−${formatPrice(discount)}</span>
      </div>
      <div class="order-summary-line order-summary-line--total">
        <span class="order-summary-label">Total</span>
        <span class="order-summary-value" data-cart-total>${formatPrice(total)}</span>
      </div>`
    : `<div class="order-summary-line order-summary-line--total">
        <span class="order-summary-label">Total estimado</span>
        <span class="order-summary-value" data-cart-total>${formatPrice(total)}</span>
      </div>`;

  return `
    <ul class="cart-items" role="list" aria-label="Artículos en el carrito">
      ${resolved.map(itemHtml).join('')}
    </ul>
    ${tridentNudge}
    <div class="order-summary" role="region" aria-label="Resumen del pedido">
      ${totalsHtml}
      ${
        unavailableCount > 0
          ? `<p class="order-summary-note">${unavailableCount === 1 ? 'Un perfume quedó sin stock y no se incluye en el total' : `${unavailableCount} perfumes quedaron sin stock y no se incluyen en el total`}</p>`
          : ''
      }
      <p class="order-summary-note">El total final se confirma al coordinar el envío</p>
      <button type="button" class="btn btn--primary btn--lg order-summary-btn" data-finalize-order>
        Finalizar pedido
      </button>
    </div>
  `;
}

export function itemHtml(item: ResolvedCartItem): string {
  const perfume = item.perfume || ({} as Perfume);
  const brand = perfume.brand || item.perfumeId;
  const name = perfume.name || item.perfumeId;
  const image = assetUrl(perfume.images?.[0]?.src);
  const size = item.size;
  const available = item.available;
  const displayQuantity = available ? item.quantity : item.requestedQuantity;
  const lineTotal = available ? size.price * item.quantity : 0;
  const isVector = (perfume.images?.[0]?.src || '').toLowerCase().endsWith('.svg');
  const es = escapeHtml;

  return `
    <li class="cart-item${available ? '' : ' cart-item--unavailable'}" data-perfume-id="${es(item.perfumeId)}" data-size-ml="${es(size.ml)}">
      <div class="cart-item-image${isVector ? ' cart-item-image--square' : ''}">
        <img src="${es(image)}" alt="${es(brand)} ${es(name)}" loading="lazy" width="64" height="64" />
      </div>
      <div class="cart-item-info">
        <div class="cart-item-brand">${es(brand)}</div>
        <div class="cart-item-name">${es(name)}</div>
        <div class="cart-item-meta">
          <span class="cart-item-size">${es(size.ml)}ml</span>
          <span class="cart-item-price">${formatPrice(size.price)}</span>
          ${!available ? '<span class="cart-item-status">SIN STOCK</span>' : ''}
        </div>
      </div>
      <div class="cart-item-controls">
        <div class="cart-item-quantity">
          <button type="button" class="quantity-btn quantity-btn--decrease" data-action="decrease" aria-label="Disminuir cantidad" ${!available || displayQuantity <= 1 ? 'disabled' : ''}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          <span class="quantity-value" aria-live="polite">${es(displayQuantity)}</span>
          <button type="button" class="quantity-btn quantity-btn--increase" data-action="increase" aria-label="Aumentar cantidad" ${!available || displayQuantity >= size.stock ? 'disabled' : ''}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>
        <div class="cart-item-total">
          <span class="cart-item-line-total">${available ? formatPrice(lineTotal) : '—'}</span>
          <button type="button" class="cart-item-remove" data-action="remove" aria-label="Eliminar del carrito">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
    </li>
  `;
}

export function showToast(message: string, type: 'error' | 'success' = 'error'): void {
  const existing = document.querySelector('.cart-toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'cart-toast';
  toast.setAttribute('role', 'status');
  toast.textContent = message;
  toast.style.cssText = `
    position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
    padding:10px 20px;border-radius:8px;font-size:14px;z-index:2147483647;
    color:#fff;font-family:var(--font-family);
    background:${type === 'error' ? '#c62828' : '#2e7d32'};
    box-shadow:0 4px 12px rgba(0,0,0,.3);
    animation:toast-in .3s ease;
  `;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity .3s'; }, 2500);
  setTimeout(() => toast.remove(), 3000);
}
