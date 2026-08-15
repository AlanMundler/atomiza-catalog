import type { CartItem, Perfume } from '@/data/types';
import { site } from '@/site.config';

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

export function generateOrderText(
  items: CartItem[],
  perfumesMap: Map<string, Perfume>,
  customerName: string,
  customerContact: string,
  channel: OrderChannel = 'whatsapp'
): string {
  const lines: string[] = [
    `📦 NUEVO PEDIDO - ${site.name}`,
    '',
    `👤 Cliente: ${customerName}`,
    `📱 Contacto: ${customerContact}`,
    '',
    '🛍️ DETALLE:'
  ];

  let total = 0;

  for (const item of items) {
    const perfume = perfumesMap.get(item.perfumeId);
    if (!perfume) continue;

    // El precio/stock SIEMPRE se toma del catálogo vivo, no del snapshot
    // guardado en el carrito (que podría estar desactualizado o alterado).
    const size = perfume.sizes.find((s) => s.ml === item.size.ml) || item.size;
    const lineTotal = size.price * item.quantity;
    total += lineTotal;

    lines.push(
      `• ${perfume.brand} - ${perfume.name} (${size.ml}ml) x${item.quantity} — ${formatPrice(lineTotal)}`
    );
  }

  lines.push(
    '',
    `💰 TOTAL: ${formatPrice(total)}`,
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
