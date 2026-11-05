import type { CartItem, Perfume, PerfumeSize } from '@/data/types';
import { site } from '@/site.config';
import { descuentoTridente, tridentesCompletos } from '@/utils/trident';
import { isDecantSize } from '@/utils/stock';

export function formatPrice(price: number): string {
  if (!Number.isFinite(price)) return '$—';
  if (price === 0) return '$0';
  return '$' + price.toLocaleString('es-AR');
}

/** Escapa texto para interpolarlo seguro dentro de HTML. */
export function escapeHtml(value: string | number | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export type OrderChannel = 'whatsapp' | 'instagram';

/** Clave de entrega elegida en el modal (ver `site.delivery` en site.config). */
export type DeliveryKey = keyof typeof site.delivery;
/** Clave de pago elegida en el modal (ver `site.payment` en site.config). */
export type PaymentKey = keyof typeof site.payment;

/** Defaults preseleccionados en el modal; también el fallback si la clave
 * que llega (storage manipulado) no existe en la config. */
export const DEFAULT_DELIVERY: DeliveryKey = 'retiro';
export const DEFAULT_PAYMENT: PaymentKey = 'efectivo';

/** Mensaje de una opción (`site.delivery` / `site.payment`) con lookup
 * defensivo: clave inexistente o ausente → mensaje del default. Nunca
 * imprime `undefined` en el pedido. */
function optionMessage<K extends string>(
  options: Record<string, { message: string }>,
  key: K | undefined,
  fallback: K
): string {
  const chosen =
    key !== undefined && Object.prototype.hasOwnProperty.call(options, key) ? key : fallback;
  return options[chosen].message;
}

export interface ResolvedCartItem {
  perfumeId: string;
  perfume: Perfume | null;
  size: PerfumeSize;
  requestedQuantity: number;
  quantity: number;
  available: boolean;
}

export interface CartTotals {
  orderableCount: number;
  subtotal: number;
  discount: number;
  total: number;
  tridentes: number;
}

/**
 * Totales del carrito contra items ya resueltos: subtotal a precio de
 * catálogo vivo, descuento tridente automático y total neto. Una sola
 * cuenta para el drawer (cart-ui), el pedido (generateOrderText) y
 * analytics: antes cada uno la reimplementaba y podían divergir.
 */
export function cartTotals(resolved: ResolvedCartItem[]): CartTotals {
  let orderableCount = 0;
  let subtotal = 0;
  for (const r of resolved) {
    if (!r.available) continue;
    // El tridente cuenta decants (5ml); los frascos suman al subtotal
    // pero no completan tridentes.
    if (isDecantSize(r.size)) orderableCount += r.quantity;
    subtotal += r.size.price * r.quantity;
  }
  const discount = descuentoTridente(orderableCount);
  return {
    orderableCount,
    subtotal,
    discount,
    total: subtotal - discount,
    tridentes: tridentesCompletos(orderableCount),
  };
}

/**
 * Resuelve cada item del carrito contra el catálogo vivo: precio y stock
 * SIEMPRE salen del catálogo, no del snapshot del carrito (que puede estar
 * desactualizado o alterado). La cantidad se recorta al stock disponible y
 * los items sin stock (o con un perfume que ya no existe) quedan marcados
 * como no disponibles para que no se envíen ni se cobren.
 */
export function resolveCartItems(
  items: CartItem[],
  perfumesMap: Map<string, Perfume>
): ResolvedCartItem[] {
  const resolved: ResolvedCartItem[] = [];
  for (const item of items) {
    const perfume = perfumesMap.get(item.perfumeId) || null;
    let size: PerfumeSize | undefined;
    if (perfume) {
      size = perfume.sizes.find((s) => s.ml === item.size.ml);
      // Talle pedido que ya no existe en el catálogo (dato viejo o storage
      // tocado): NO se remapea a otro talle en silencio — facturar el precio
      // de 5ml por algo que no se pidió está mal. Queda no disponible (se
      // excluye del pedido y el drawer lo muestra eliminable).
      if (!size) {
        const requestedQuantity = Number.isInteger(item.quantity) && item.quantity > 0 ? item.quantity : 1;
        resolved.push({
          perfumeId: item.perfumeId,
          perfume,
          size: item.size,
          requestedQuantity,
          quantity: 0,
          available: false,
        });
        continue;
      }
    } else {
      size = item.size;
    }
    const requestedQuantity = Number.isInteger(item.quantity) && item.quantity > 0 ? item.quantity : 1;
    const quantity = Math.min(requestedQuantity, Math.max(size.stock, 0));
    resolved.push({
      perfumeId: item.perfumeId,
      perfume,
      size,
      requestedQuantity,
      quantity,
      available: perfume !== null && size.stock > 0 && quantity > 0,
    });
  }
  return resolved;
}

/** Una línea de texto plano: sin saltos (evita falsificar líneas del pedido
 * con `\n`) y con largo acotado. */
function oneLine(value: string, max: number): string {
  return value.replace(/[\r\n]+/g, ' ').trim().slice(0, max);
}

export interface OrderTextOptions {
  items: CartItem[];
  perfumes: Map<string, Perfume>;
  customerName?: string;
  contact?: string;
  channel?: OrderChannel;
  /**
   * Entrega elegida en el modal (default `retiro`). Siempre viaja en la
   * línea `🚚 Entrega:` del pedido.
   */
  delivery?: DeliveryKey;
  /**
   * Medio de pago elegido en el modal (default `efectivo`). Siempre viaja
   * en la línea `💳 Pago:` del pedido.
   */
  payment?: PaymentKey;
}

export function generateOrderText(options: OrderTextOptions): string {
  const { items, perfumes } = options;
  const channel: OrderChannel = options.channel ?? 'whatsapp';
  const customerName = oneLine(options.customerName ?? '', 80);
  const customerContact = oneLine(options.contact ?? '', 120);
  const deliveryMessage = optionMessage(site.delivery, options.delivery, DEFAULT_DELIVERY);
  const paymentMessage = optionMessage(site.payment, options.payment, DEFAULT_PAYMENT);
  const resolved = resolveCartItems(items, perfumes);
  const orderable = resolved.filter((r) => r.available);
  const excludedCount = resolved.length - orderable.length;
  // Descuento automático por tridente sobre decants comprables.
  const { discount, subtotal, total, tridentes } = cartTotals(resolved);

  const lines: string[] = [
    `📦 NUEVO PEDIDO - ${site.name}`,
    '',
    `👤 Cliente: ${customerName}`,
    `📱 Contacto: ${customerContact}`,
    '',
    '🛍️ DETALLE:'
  ];

  for (const item of orderable) {
    const lineTotal = item.size.price * item.quantity;
    lines.push(
      `• ${item.perfume!.brand} - ${item.perfume!.name} (${item.size.ml}ml) x${item.quantity} — ${formatPrice(lineTotal)}`
    );
  }

  if (excludedCount > 0) {
    lines.push(
      '',
      `⚠️ ${excludedCount === 1 ? 'Un perfume quedó sin stock y no se incluyó' : `${excludedCount} perfumes quedaron sin stock y no se incluyeron`}.`
    );
  }

  if (discount > 0) {
    lines.push(
      '',
      `💰 SUBTOTAL: ${formatPrice(subtotal)}`,
      `🎁 DESCUENTO TRIDENTE (${tridentes} ${tridentes === 1 ? 'tridente' : 'tridentes'}): -${formatPrice(discount)}`,
      '',
      `💰 TOTAL: ${formatPrice(total)}`,
    );
  } else {
    lines.push(
      '',
      `💰 TOTAL: ${formatPrice(total)}`,
    );
  }
  lines.push('');
  // Entrega y pago elegidos en el modal: siempre van las dos líneas, ya no
  // existe el placeholder "[A coordinar]".
  lines.push(
    `🚚 Entrega: ${deliveryMessage}`,
    `💳 Pago: ${paymentMessage}`,
    '',
    '—',
    channel === 'instagram'
      ? `Enviar a @${site.instagramHandle} por Instagram DM`
      : `Enviar por WhatsApp a ${site.name} (${site.phoneDisplay})`
  );

  return lines.join('\n');
}

export function buildWhatsAppLink(phone: string, text: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}
