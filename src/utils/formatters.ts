import type { CartItem, Perfume, PerfumeSize } from '@/data/types';
import { site } from '@/site.config';
import { descuentoTridente, tridentesCompletos } from '@/utils/trident';
// Nota de ciclo: trident.ts importa formatPrice de acá, pero solo lo usa en
// tiempo de ejecución (nunca al evaluar el módulo), así que el ciclo es seguro.

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

export interface ResolvedCartItem {
  perfumeId: string;
  perfume: Perfume | null;
  size: PerfumeSize;
  requestedQuantity: number;
  quantity: number;
  available: boolean;
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
      size =
        perfume.sizes.find((s) => s.ml === item.size.ml) ||
        perfume.sizes.find((s) => s.ml === 5) ||
        perfume.sizes[0];
    } else {
      size = item.size;
    }
    if (!size) continue;
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

export function generateOrderText(
  items: CartItem[],
  perfumesMap: Map<string, Perfume>,
  customerName: string,
  customerContact: string,
  channel: OrderChannel = 'whatsapp'
): string {
  customerName = oneLine(customerName, 80);
  customerContact = oneLine(customerContact, 120);
  const resolved = resolveCartItems(items, perfumesMap);
  const orderable = resolved.filter((r) => r.available);
  const excludedCount = resolved.length - orderable.length;
  // Descuento automático por tridente sobre decants comprables.
  const orderableCount = orderable.reduce((sum, r) => sum + r.quantity, 0);
  const tridentes = tridentesCompletos(orderableCount);
  const discount = descuentoTridente(orderableCount);

  const lines: string[] = [
    `📦 NUEVO PEDIDO - ${site.name}`,
    '',
    `👤 Cliente: ${customerName}`,
    `📱 Contacto: ${customerContact}`,
    '',
    '🛍️ DETALLE:'
  ];

  let total = 0;

  for (const item of orderable) {
    const lineTotal = item.size.price * item.quantity;
    total += lineTotal;

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
      `💰 SUBTOTAL: ${formatPrice(total)}`,
      `🎁 DESCUENTO TRIDENTE (${tridentes} ${tridentes === 1 ? 'tridente' : 'tridentes'}): -${formatPrice(discount)}`,
      '',
      `💰 TOTAL: ${formatPrice(total - discount)}`,
    );
  } else {
    lines.push(
      '',
      `💰 TOTAL: ${formatPrice(total)}`,
    );
  }
  lines.push(
    '',
    '📍 Envío: [A coordinar]',
    '💳 Pago: [Transferencia / Efectivo / A coordinar]',
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
